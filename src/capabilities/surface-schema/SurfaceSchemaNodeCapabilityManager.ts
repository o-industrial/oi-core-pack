// deno-lint-ignore-file no-explicit-any
import { Position } from '../../.deps.ts';
import { EaCCompositeSchemaDetails } from '../../.deps.ts';
import { EaCFlowNodeMetadata } from '../../.deps.ts';
import { EaCRootSchemaDetails } from '../../.deps.ts';
import { EaCSchemaAsCode } from '../../.deps.ts';
import { EaCSchemaDetails } from '../../.deps.ts';
import { SurfaceSchemaSettings } from '../../.deps.ts';
import { EverythingAsCodeOIWorkspace } from '../../.deps.ts';
import {
  EaCNodeCapabilityAsCode,
  EaCNodeCapabilityContext,
  EaCNodeCapabilityManager,
  EaCNodeCapabilityPatch,
  FlowGraphEdge,
  FlowGraphNode,
} from '../../.deps.ts';
import { ComponentType, FunctionComponent, memo, NullableArrayOrObject } from '../../.deps.ts';
import { SurfaceRootSchemaInspector } from './SurfaceRootSchemaInspector.tsx';
import SurfaceSchemaNodeRenderer from './SurfaceSchemaNodeRenderer.tsx';

type SurfaceSchemaNodeDetails = EaCSchemaDetails & SurfaceSchemaSettings;

export class SurfaceSchemaNodeCapabilityManager
  extends EaCNodeCapabilityManager<SurfaceSchemaNodeDetails> {
  protected static renderer: ComponentType = memo(
    SurfaceSchemaNodeRenderer as FunctionComponent,
  );

  public override Type = 'schema';

  protected override buildAsCode(
    node: FlowGraphNode,
    context: EaCNodeCapabilityContext,
  ): EaCNodeCapabilityAsCode<SurfaceSchemaNodeDetails> | null {
    const schemaId = node.ID;

    const eac = context.GetEaC();

    const schemaAsCode = eac.Schemas?.[schemaId];
    const surfaceSettings = eac.Surfaces?.[context.SurfaceLookup!]?.Schemas?.[schemaId];

    if (!schemaAsCode || !surfaceSettings) return null;

    const { Metadata, ...surfaceOverrides } = surfaceSettings;

    return {
      Metadata,
      Details: {
        ...schemaAsCode.Details,
        ...surfaceOverrides,
      } as SurfaceSchemaNodeDetails,
    };
  }

  protected override buildConnectionPatch(
    source: FlowGraphNode,
    target: FlowGraphNode,
    context: EaCNodeCapabilityContext,
  ): Partial<EverythingAsCodeOIWorkspace> | null {
    const eac = context.GetEaC();

    // Case: schema → composite-schema
    if (source.Type.includes('schema') && target.Type.includes('composite-schema')) {
      const comp = eac.Schemas?.[target.ID];
      if (!comp) return null;

      const compDetails = comp.Details as EaCCompositeSchemaDetails;

      return {
        Schemas: {
          [target.ID]: {
            ...comp,
            Details: {
              ...compDetails,
              SchemaJoins: {
                ...(compDetails.SchemaJoins ?? {}),
                [source.ID]: source.ID,
              },
            },
          },
        },
      };
    } else if (source.Type.includes('connection') && target.Type.includes('schema')) {
      const [_surfaceId, connId] = this.extractCompoundIDs(source);
      const schema = context.GetEaC().Schemas?.[target.ID];
      if (!schema) return null;

      return {
        Schemas: {
          [target.ID]: {
            ...schema,
            DataConnection: { Lookup: connId },
          },
        },
      };
    }

    return null;
  }

  protected override buildDeletePatch(
    node: FlowGraphNode,
    context: EaCNodeCapabilityContext,
  ): NullableArrayOrObject<EverythingAsCodeOIWorkspace> {
    const surfaceId = context.SurfaceLookup!;
    const schemaId = node.ID;

    return {
      Surfaces: {
        [surfaceId]: {
          Schemas: {
            [schemaId]: null,
          },
        },
      },
    } as unknown as NullableArrayOrObject<EverythingAsCodeOIWorkspace>;
  }

  protected override buildDisconnectionPatch(
    source: FlowGraphNode,
    target: FlowGraphNode,
    context: EaCNodeCapabilityContext,
  ): Partial<EverythingAsCodeOIWorkspace> | null {
    const eac = context.GetEaC() as EverythingAsCodeOIWorkspace;

    // Case: schema → composite-schema
    if (source.Type.includes('schema') && target.Type.includes('composite-schema')) {
      const comp = eac.Schemas?.[target.ID];
      if (!comp) return null;

      const compDetails = comp.Details as EaCCompositeSchemaDetails;
      if (!compDetails.SchemaJoins?.[source.ID]) return null;

      const updated = { ...compDetails.SchemaJoins };
      delete updated[source.ID];

      return {
        Schemas: {
          [target.ID]: {
            ...comp,
            Details: {
              ...compDetails,
              SchemaJoins: updated,
            },
          },
        },
      };
    } else if (source.Type.includes('connection') && target.Type.includes('schema')) {
      const [_, connId] = this.extractCompoundIDs(source);

      if (!target.Type.includes('schema')) return null;

      const schema = eac.Schemas?.[target.ID];
      if (!schema || schema.DataConnection?.Lookup !== connId) return null;

      const { _DataConnection, ...rest } = schema;

      return {
        Schemas: {
          [target.ID]: rest,
        },
      };
    }

    return null;
  }

  protected override buildEdgesForNode(
    node: FlowGraphNode,
    context: EaCNodeCapabilityContext,
  ): FlowGraphEdge[] {
    const eac = context.GetEaC() as EverythingAsCodeOIWorkspace;
    const schemaId = node.ID;
    const surfaceId = context.SurfaceLookup!;

    const edges: FlowGraphEdge[] = [];

    // Edge: DataConnection feeds schema
    const dc = eac.Schemas?.[schemaId]?.DataConnection?.Lookup;
    if (dc) {
      edges.push({
        ID: `${dc}->${schemaId}`,
        Source: `${surfaceId}->${dc}`,
        Target: schemaId,
        Label: 'feeds',
      });
    }

    // Edge: Schema joined into Composite(s)
    for (const [compKey, compSchema] of Object.entries(eac.Schemas ?? {})) {
      if (
        compSchema?.Details?.Type !== 'Composite' &&
        compSchema?.Details?.Type !== 'Reference'
      ) {
        continue;
      }

      const compJoins = (compSchema.Details as EaCCompositeSchemaDetails).SchemaJoins ?? {};

      if (Object.values(compJoins).includes(schemaId)) {
        edges.push({
          ID: `${schemaId}->${compKey}`,
          Source: schemaId,
          Target: compKey,
          Label: 'joins',
        });
      }
    }

    return edges;
  }

  protected override buildNode(
    id: string,
    context: EaCNodeCapabilityContext,
  ): FlowGraphNode | null {
    const eac = context.GetEaC();
    const surfaceId = context.SurfaceLookup!;
    const schemaId = id;

    const surface = eac.Surfaces?.[surfaceId];
    const surfaceSettings = surface?.Schemas?.[schemaId];
    const schema = eac.Schemas?.[schemaId];

    if (
      !schema ||
      !surfaceSettings ||
      surfaceSettings.Metadata?.Enabled === false
    ) {
      return null;
    }

    const { Metadata, ...settings } = surfaceSettings;
    const type = schema.Details?.Type;

    let nodeType: FlowGraphNode['Type'] = 'schema';
    if (type === 'Composite') nodeType = 'composite-schema';
    else if (type === 'Reference') nodeType = 'reference-schema';

    return {
      ID: schemaId,
      Type: nodeType,
      Label: schema.Details?.Name ?? schemaId,
      Metadata: Metadata,
      Details: {
        ...schema.Details,
        ...settings,
      },
    };
  }

  protected override buildPresetPatch(
    id: string,
    position: Position,
    context: EaCNodeCapabilityContext,
  ): Partial<EverythingAsCodeOIWorkspace> {
    const metadata: EaCFlowNodeMetadata = {
      Position: position,
      Enabled: true,
    };

    const details = { Name: id };

    return {
      Schemas: {
        [id]: {
          Metadata: metadata,
          Details: { ...details, Type: 'Root' } as EaCRootSchemaDetails,
        } as EaCSchemaAsCode,
      },
      ...(context.SurfaceLookup
        ? {
          Surfaces: {
            [context.SurfaceLookup]: {
              Schemas: {
                [id]: {
                  DisplayMode: 'table',
                  Metadata: metadata,
                },
              },
            },
          },
        }
        : {}),
    };
  }

  protected override buildUpdatePatch(
    node: FlowGraphNode,
    update: EaCNodeCapabilityPatch<SurfaceSchemaNodeDetails>,
    context: EaCNodeCapabilityContext,
  ): Partial<EverythingAsCodeOIWorkspace> {
    const schemaId = node.ID;

    const settings: SurfaceSchemaSettings = {
      ...(update.Metadata ? { Metadata: update.Metadata } : {}),
    };

    if (update.Details?.DisplayMode) {
      settings.DisplayMode = update.Details.DisplayMode;
    }

    const { DisplayMode: _, ...rest } = update.Details ?? {};
    const schemaDetails: Partial<EaCSchemaDetails> = rest;

    const patch: Partial<EverythingAsCodeOIWorkspace> = {};

    if (Object.keys(settings).length > 0) {
      patch.Surfaces = {
        [context.SurfaceLookup!]: {
          Schemas: {
            [schemaId]: settings,
          },
        },
      };
    }

    if (Object.keys(schemaDetails).length > 0) {
      patch.Schemas = {
        [schemaId]: {
          Details: schemaDetails as EaCSchemaDetails,
        },
      };
    }

    return patch;
  }

  protected override getInspector(): ComponentType<any> {
    return SurfaceRootSchemaInspector;
  }

  // protected override getPreset(): NodePreset {
  //   return { Type: this.Type, Label: 'Schema', IconKey: 'schema' };
  // }

  protected override getRenderer(): ComponentType<any> {
    return SurfaceSchemaNodeCapabilityManager.renderer;
  }
}
