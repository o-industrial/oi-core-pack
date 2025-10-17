// deno-lint-ignore-file no-explicit-any
import { NodePreset, Position } from '../../.deps.ts';
import {
  EaCInterfaceAsCode,
  EaCInterfaceDetails,
  EaCInterfaceGeneratedDataSlice,
  SurfaceInterfaceSettings,
} from '../../.deps.ts';
import { EverythingAsCodeOIWorkspace } from '../../.deps.ts';
import {
  CapabilityValidationResult,
  EaCNodeCapabilityAsCode,
  EaCNodeCapabilityContext,
  EaCNodeCapabilityManager,
  EaCNodeCapabilityPatch,
  FlowGraphEdge,
  FlowGraphNode,
} from '../../.deps.ts';
import { ComponentType, FunctionComponent, memo, NullableArrayOrObject } from '../../.deps.ts';
import SurfaceInterfaceNodeRenderer from './SurfaceInterfaceNodeRenderer.tsx';
import { SurfaceInterfaceInspector } from './SurfaceInterfaceInspector.tsx';
import { SurfaceInterfaceNodeDetails } from './SurfaceInterfaceNodeData.ts';
import { createDefaultInterfaceDetails, ensureInterfaceDetails } from './interfaceDefaults.ts';

const INTERFACE_PRESET_THEME = 'oi-default';

export class SurfaceInterfaceNodeCapabilityManager
  extends EaCNodeCapabilityManager<SurfaceInterfaceNodeDetails> {
  protected static renderer: ComponentType = memo(
    SurfaceInterfaceNodeRenderer as FunctionComponent,
  );

  public override Type = 'interface';

  protected override buildAsCode(
    node: FlowGraphNode,
    context: EaCNodeCapabilityContext,
  ): EaCNodeCapabilityAsCode<SurfaceInterfaceNodeDetails> | null {
    const eac = context.GetEaC() as EverythingAsCodeOIWorkspace;
    const interfaceEntry = eac.Interfaces?.[node.ID];
    if (!interfaceEntry) return null;

    const { surfaceLookup, settings } = this.resolveSurfaceSettings(
      node.ID,
      context,
    );

    const interfaceDetails = ensureInterfaceDetails(
      interfaceEntry.Details as EaCInterfaceDetails | undefined,
      node.ID,
    );

    const mergedDetails: SurfaceInterfaceNodeDetails = {
      ...interfaceDetails,
      ...(settings ?? {}),
      SurfaceLookup: surfaceLookup,
    };

    const metadata = settings?.Metadata;

    return metadata ? { Details: mergedDetails, Metadata: metadata } : { Details: mergedDetails };
  }

  protected override buildPresetPatch(
    id: string,
    position: Position,
    context: EaCNodeCapabilityContext,
  ): Partial<EverythingAsCodeOIWorkspace> {
    const surfaceLookup = this.ensureSurfaceLookup(context);

    const interfaceDetails = createDefaultInterfaceDetails(id);

    return {
      Interfaces: {
        [id]: {
          Details: interfaceDetails,
        } as EaCInterfaceAsCode,
      },
      Surfaces: {
        [surfaceLookup]: {
          Interfaces: {
            [id]: {
              Metadata: {
                Position: position,
                Enabled: true,
              },
              Theme: INTERFACE_PRESET_THEME,
            } satisfies SurfaceInterfaceSettings,
          },
        },
      },
    };
  }

  protected override buildDeletePatch(
    node: FlowGraphNode,
    context: EaCNodeCapabilityContext,
  ): NullableArrayOrObject<EverythingAsCodeOIWorkspace> {
    const { surfaceLookup } = this.resolveSurfaceSettings(node.ID, context);

    const patch: NullableArrayOrObject<EverythingAsCodeOIWorkspace> = {
      Interfaces: {
        [node.ID]: null,
      },
      ...(surfaceLookup
        ? {
          Surfaces: {
            [surfaceLookup]: {
              Interfaces: {
                [node.ID]: null,
              },
            },
          },
        }
        : {}),
    } as unknown as NullableArrayOrObject<EverythingAsCodeOIWorkspace>;

    return patch;
  }

  protected override buildUpdatePatch(
    node: FlowGraphNode,
    update: EaCNodeCapabilityPatch<SurfaceInterfaceNodeDetails>,
    context: EaCNodeCapabilityContext,
  ): Partial<EverythingAsCodeOIWorkspace> | null {
    const { surfaceLookup } = this.resolveSurfaceSettings(node.ID, context);

    const interfaceKeys: Array<keyof EaCInterfaceDetails> = [
      'Name',
      'WebPath',
      'Description',
      'Imports',
      'PageDataType',
      'PageHandler',
      'Page',
    ];

    const surfaceKeys: Array<keyof SurfaceInterfaceSettings> = [
      'SchemaLookups',
      'WarmQueryLookups',
      'DataConnectionLookups',
      'ChildInterfaceLookups',
      'Theme',
      'RefreshMs',
    ];

    const interfacePatch: Partial<EaCInterfaceDetails> = {};
    const surfacePatch: Partial<SurfaceInterfaceSettings> = {};

    if (update.Details) {
      for (const [key, value] of Object.entries(update.Details)) {
        if (interfaceKeys.includes(key as keyof EaCInterfaceDetails)) {
          (interfacePatch as Record<string, unknown>)[key] = value;
        }
        if (surfaceKeys.includes(key as keyof SurfaceInterfaceSettings)) {
          (surfacePatch as Record<string, unknown>)[key] = value;
        }
      }
    }

    const result: Partial<EverythingAsCodeOIWorkspace> = {};

    const interfaceUpdate: Partial<EaCInterfaceAsCode> = {};
    if (Object.keys(interfacePatch).length > 0) {
      interfaceUpdate.Details = interfacePatch as unknown as
        | EaCInterfaceDetails
        | undefined;
    }

    if (Object.keys(interfaceUpdate).length > 0) {
      result.Interfaces = { [node.ID]: interfaceUpdate as EaCInterfaceAsCode };
    }

    if (
      surfaceLookup &&
      (Object.keys(surfacePatch).length > 0 || update.Metadata)
    ) {
      const surfaceUpdate: Partial<SurfaceInterfaceSettings> & {
        Metadata?: SurfaceInterfaceSettings['Metadata'];
      } = {
        ...(Object.keys(surfacePatch).length > 0 ? surfacePatch : {}),
      };

      if (update.Metadata) {
        surfaceUpdate.Metadata = update.Metadata;
      }

      result.Surfaces = {
        [surfaceLookup]: {
          Interfaces: {
            [node.ID]: surfaceUpdate,
          },
        },
      };
    }

    return Object.keys(result).length > 0 ? result : null;
  }

  protected override buildConnectionPatch(
    source: FlowGraphNode,
    target: FlowGraphNode,
    context: EaCNodeCapabilityContext,
  ): Partial<EverythingAsCodeOIWorkspace> | null {
    if (!target.Type.includes(this.Type)) return null;

    const { surfaceLookup, settings } = this.resolveSurfaceSettings(
      target.ID,
      context,
    );
    if (!surfaceLookup) return null;

    const next: SurfaceInterfaceSettings = {
      ...(settings ?? {}),
    };

    if (source.Type.includes('warmquery')) {
      next.WarmQueryLookups = this.addLookup(next.WarmQueryLookups, source.ID);
    } else if (source.Type.includes('connection')) {
      next.DataConnectionLookups = this.addLookup(
        next.DataConnectionLookups,
        source.ID,
      );
    } else if (source.Type.includes('schema')) {
      next.SchemaLookups = this.addLookup(next.SchemaLookups, source.ID);
    } else if (source.Type.includes(this.Type)) {
      if (source.ID === target.ID) {
        return null;
      }

      next.ChildInterfaceLookups = this.addLookup(
        next.ChildInterfaceLookups,
        source.ID,
      );
    } else {
      return null;
    }

    return {
      Surfaces: {
        [surfaceLookup]: {
          Interfaces: {
            [target.ID]: next,
          },
        },
      },
    };
  }

  protected override buildDisconnectionPatch(
    source: FlowGraphNode,
    target: FlowGraphNode,
    context: EaCNodeCapabilityContext,
  ): Partial<EverythingAsCodeOIWorkspace> | null {
    if (!target.Type.includes(this.Type)) return null;

    const { surfaceLookup, settings } = this.resolveSurfaceSettings(
      target.ID,
      context,
    );
    if (!surfaceLookup || !settings) return null;

    const next: SurfaceInterfaceSettings = { ...settings };

    if (source.Type.includes('warmquery')) {
      next.WarmQueryLookups = this.removeLookup(
        next.WarmQueryLookups,
        source.ID,
      );
    } else if (source.Type.includes('connection')) {
      next.DataConnectionLookups = this.removeLookup(
        next.DataConnectionLookups,
        source.ID,
      );
    } else if (source.Type.includes('schema')) {
      next.SchemaLookups = this.removeLookup(next.SchemaLookups, source.ID);
    } else if (source.Type.includes(this.Type)) {
      if (source.ID === target.ID) {
        return null;
      }

      next.ChildInterfaceLookups = this.removeLookup(
        next.ChildInterfaceLookups,
        source.ID,
      );
    } else {
      return null;
    }

    return {
      Surfaces: {
        [surfaceLookup]: {
          Interfaces: {
            [target.ID]: next,
          },
        },
      },
    };
  }

  protected override buildEdgesForNode(
    node: FlowGraphNode,
    context: EaCNodeCapabilityContext,
  ): FlowGraphEdge[] {
    const { settings } = this.resolveSurfaceSettings(node.ID, context);

    if (!settings) return [];

    const edges: FlowGraphEdge[] = [];

    for (const schemaLookup of settings.SchemaLookups ?? []) {
      edges.push({
        ID: `${schemaLookup}->${node.ID}`,
        Source: schemaLookup,
        Target: node.ID,
        Label: 'schema',
      });
    }

    for (const warmQueryLookup of settings.WarmQueryLookups ?? []) {
      edges.push({
        ID: `${warmQueryLookup}->${node.ID}`,
        Source: warmQueryLookup,
        Target: node.ID,
        Label: 'data',
      });
    }

    for (const connectionLookup of settings.DataConnectionLookups ?? []) {
      edges.push({
        ID: `${connectionLookup}->${node.ID}`,
        Source: connectionLookup,
        Target: node.ID,
        Label: 'connection',
      });
    }

    for (const childLookup of settings.ChildInterfaceLookups ?? []) {
      edges.push({
        ID: `${childLookup}->${node.ID}`,
        Source: childLookup,
        Target: node.ID,
        Label: 'child',
      });
    }

    return edges;
  }

  protected override buildNode(
    id: string,
    context: EaCNodeCapabilityContext,
  ): FlowGraphNode | null {
    const eac = context.GetEaC() as EverythingAsCodeOIWorkspace;
    const interfaceEntry = eac.Interfaces?.[id];
    if (!interfaceEntry) return null;

    const { surfaceLookup, settings } = this.resolveSurfaceSettings(
      id,
      context,
    );

    if (context.SurfaceLookup && surfaceLookup !== context.SurfaceLookup) {
      return null;
    }

    if (context.SurfaceLookup && !settings) {
      return null;
    }

    const metadata = settings?.Metadata;

    return {
      ID: id,
      Type: this.Type,
      Label: interfaceEntry.Details?.Name ?? id,
      ...(metadata ? { Metadata: metadata } : {}),
      Details: ensureInterfaceDetails(
        interfaceEntry.Details as EaCInterfaceDetails | undefined,
        id,
      ),
    };
  }

  protected override getInspector(): ComponentType<any> {
    return SurfaceInterfaceInspector;
  }

  protected override getPreset(): NodePreset {
    return { Type: this.Type, Label: 'Interface', IconKey: 'interface' };
  }

  protected override getRenderer(): ComponentType<any> {
    return SurfaceInterfaceNodeCapabilityManager.renderer;
  }

  public override Validate(
    node: FlowGraphNode,
    context: EaCNodeCapabilityContext,
  ): CapabilityValidationResult {
    const eac = context.GetEaC() as EverythingAsCodeOIWorkspace;
    const interfaceEntry = eac.Interfaces?.[node.ID];

    if (!interfaceEntry?.Details) {
      return {
        valid: false,
        errors: [
          {
            field: `Interfaces.${node.ID}`,
            message: 'Interface details not found in workspace EaC.',
          },
        ],
      };
    }

    const errors: CapabilityValidationResult['errors'] = [];
    const details = ensureInterfaceDetails(
      interfaceEntry.Details as EaCInterfaceDetails | undefined,
      node.ID,
    );
    const name = details.Name?.trim();

    if (!name) {
      errors.push({
        field: 'Details.Name',
        message: 'Name is required for an interface.',
      });
    }

    const pageDataSchema = details.PageDataType;
    const generatedSlices: EaCInterfaceGeneratedDataSlice[] = pageDataSchema?.Generated
      ? Object.values(pageDataSchema.Generated)
      : [];
    const hasEnabledSlice = generatedSlices.some(
      (slice) => slice.Enabled !== false,
    );

    if (!pageDataSchema || !hasEnabledSlice) {
      errors.push({
        field: 'Details.PageDataType',
        message:
          'Define the page data schema slices or provide a custom schema for AI-assisted authoring.',
      });
    }

    const webPath = details.WebPath?.trim();
    if (!webPath) {
      errors.push({
        field: 'Details.WebPath',
        message: 'Provide a web path so the interface can be routed.',
      });
    } else if (!webPath.startsWith('/')) {
      errors.push({
        field: 'Details.WebPath',
        message: 'Web path must start with a leading slash (e.g., /docs/overview).',
      });
    }

    const page = details.Page;
    const hasPageContent = page &&
      (page.Code?.trim()?.length ||
        (page.Messages && page.Messages.length > 0) ||
        (page.MessageGroups && page.MessageGroups.length > 0));

    if (!hasPageContent) {
      errors.push({
        field: 'Details.Page',
        message: 'Provide page code or guidance so the interface can be generated.',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private addLookup(list: string[] | undefined, value: string) {
    const next = new Set(list ?? []);
    next.add(value);
    return Array.from(next);
  }

  private removeLookup(list: string[] | undefined, value: string) {
    if (!list) return list;
    const next = list.filter((entry) => entry !== value);
    return next.length > 0 ? next : undefined;
  }

  private resolveSurfaceSettings(
    interfaceLookup: string,
    context: EaCNodeCapabilityContext,
  ): {
    surfaceLookup?: string;
    settings?: SurfaceInterfaceSettings;
  } {
    const eac = context.GetEaC() as EverythingAsCodeOIWorkspace;

    if (context.SurfaceLookup) {
      const surfaceSettings = eac.Surfaces?.[context.SurfaceLookup]?.Interfaces?.[interfaceLookup];
      return {
        surfaceLookup: surfaceSettings ? context.SurfaceLookup : undefined,
        settings: surfaceSettings,
      };
    }

    for (const [lookup, surface] of Object.entries(eac.Surfaces ?? {})) {
      const settings = surface.Interfaces?.[interfaceLookup];
      if (settings) {
        return { surfaceLookup: lookup, settings };
      }
    }

    return {};
  }

  private ensureSurfaceLookup(context: EaCNodeCapabilityContext): string {
    if (context.SurfaceLookup) return context.SurfaceLookup;

    throw new Error(
      'Surface lookup is required to create an Interface node preset.',
    );
  }
}
