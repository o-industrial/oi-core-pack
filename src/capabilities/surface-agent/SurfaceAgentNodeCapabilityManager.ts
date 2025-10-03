// deno-lint-ignore-file no-explicit-any
import { Position } from '../../.deps.ts';
import { EaCAgentDetails } from '../../.deps.ts';
import { EaCFlowNodeMetadata } from '../../.deps.ts';
import { SurfaceAgentSettings } from '../../.deps.ts';
import {
  EaCNodeCapabilityAsCode,
  EaCNodeCapabilityContext,
  EaCNodeCapabilityManager,
  EaCNodeCapabilityPatch,
  FlowGraphEdge,
  FlowGraphNode,
} from '../../.deps.ts';
import { EverythingAsCodeOIWorkspace } from '../../.deps.ts';
import { ComponentType, FunctionComponent, memo, NullableArrayOrObject } from '../../.deps.ts';
import { SurfaceAgentInspector } from './SurfaceAgentInspector.tsx';
import SurfaceAgentNodeRenderer from './SurfaceAgentNodeRenderer.tsx';

// ✅ Compound node detail type
type SurfaceAgentNodeDetails = EaCAgentDetails & SurfaceAgentSettings;

export class SurfaceAgentNodeCapabilityManager
  extends EaCNodeCapabilityManager<SurfaceAgentNodeDetails> {
  protected static renderer: ComponentType = memo(
    SurfaceAgentNodeRenderer as FunctionComponent,
  );

  public override Type = 'agent';

  protected override buildAsCode(
    node: FlowGraphNode,
    context: EaCNodeCapabilityContext,
  ): EaCNodeCapabilityAsCode<SurfaceAgentNodeDetails> | null {
    const agentId = node.ID;

    const eac = context.GetEaC();

    const agentAsCode = eac.Agents?.[agentId];
    const surfaceSettings = eac.Surfaces?.[context.SurfaceLookup!]?.Agents?.[agentId];

    if (!agentAsCode || !surfaceSettings) return null;

    const { Metadata, ...surfaceOverrides } = surfaceSettings;

    return {
      Metadata,
      Details: {
        ...agentAsCode.Details,
        ...surfaceOverrides,
      } as SurfaceAgentNodeDetails,
    };
  }

  protected override buildConnectionPatch(
    source: FlowGraphNode,
    target: FlowGraphNode,
    context: EaCNodeCapabilityContext,
  ): Partial<EverythingAsCodeOIWorkspace> | null {
    if (source.Type === 'agent' && target.Type?.includes('schema')) {
      const eac = context.GetEaC();
      const agent = eac.Agents?.[target.ID];
      if (!agent) return null;

      return {
        Agents: {
          [target.ID]: {
            ...agent,
            Schema: {
              SchemaLookup: source.ID,
            },
          },
        },
      };
    } else if (source.Type.includes('warmquery') && target.Type.includes('agent')) {
      const eac = context.GetEaC();
      const agent = eac.Agents?.[target.ID];

      return {
        Agents: {
          [target.ID]: {
            ...agent,
            WarmQueryLookups: [
              ...(agent?.WarmQueryLookups as string[] ?? []),
              source.ID,
            ],
          },
        },
      };
    }

    return null;
  }

  protected override buildDisconnectionPatch(
    source: FlowGraphNode,
    target: FlowGraphNode,
    context: EaCNodeCapabilityContext,
  ): Partial<EverythingAsCodeOIWorkspace> | null {
    if (source.Type !== 'agent' || !target.Type?.includes('schema')) {
      return null;
    }

    const eac = context.GetEaC();
    const agent = eac.Agents?.[target.ID];

    if (!agent) return null;

    if (source.Type.includes('schema') && target.Type.includes('agent')) {
      const { Schema: _, ...rest } = agent;

      return {
        Agents: {
          [target.ID]: rest,
        },
      };
    } else if (source.Type.includes('warmquery') && target.Type.includes('agent')) {
      if (
        !agent.WarmQueryLookups || agent.WarmQueryLookups.length === 0 ||
        !agent.WarmQueryLookups.includes(source.ID)
      ) return null;

      const filtered = (agent.WarmQueryLookups as string[]).filter(
        (item) => item !== source.ID,
      );

      return {
        Agents: {
          [target.ID]: {
            ...agent,
            WarmQueryLookups: filtered,
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
    const agentId = node.ID;

    return {
      Surfaces: {
        [surfaceId]: {
          Agents: {
            [agentId]: null,
          },
        },
      },
    } as unknown as NullableArrayOrObject<EverythingAsCodeOIWorkspace>;
  }

  protected override buildEdgesForNode(
    node: FlowGraphNode,
    context: EaCNodeCapabilityContext,
  ): FlowGraphEdge[] {
    const eac = context.GetEaC();
    const agentId = node.ID;
    const agent = eac.Agents?.[agentId];

    const edges: FlowGraphEdge[] = [];

    if (!agent) {
      return edges;
    }

    const targetSchema = agent?.Schema?.SchemaLookup;

    if (targetSchema) {
      edges.push({
        ID: `${targetSchema}->${agentId}`,
        Source: targetSchema,
        Target: agentId,
        Label: 'targets',
      });
    }

    const wqs = agent.WarmQueryLookups;

    if (wqs) {
      wqs.forEach((wq: string) => {
        edges.push({
          ID: `${wq}->${agentId}`,
          Source: wq,
          Target: agentId,
          Label: 'informs',
        });
      });
    }

    return edges;
  }

  protected override buildNode(
    id: string,
    context: EaCNodeCapabilityContext,
  ): FlowGraphNode | null {
    const surfaceId = context.SurfaceLookup!;
    const agentId = id;

    const eac = context.GetEaC();
    const surface = eac.Surfaces?.[surfaceId];
    const settings = surface?.Agents?.[agentId];
    const agent = eac.Agents?.[agentId];

    if (!agent || !settings || settings.Metadata?.Enabled === false) {
      return null;
    }

    const { Metadata, ...rest } = settings;

    return {
      ID: agentId,
      Type: this.Type,
      Label: agent.Details?.Name ?? agentId,
      Metadata: {
        ...(agent.Metadata ?? {}),
        ...Metadata,
      },
      Details: {
        ...agent.Details,
        ...rest,
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
      Agents: {
        [id]: {
          Metadata: metadata,
          Details: details,
        },
      },
      ...(context.SurfaceLookup
        ? {
          Surfaces: {
            [context.SurfaceLookup]: {
              Agents: {
                [id]: {
                  ShowHistory: false,
                  Metadata: metadata,
                  WarmQueryLookups: [] as string[],
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
    update: EaCNodeCapabilityPatch<SurfaceAgentNodeDetails>,
    context: EaCNodeCapabilityContext,
  ): Partial<EverythingAsCodeOIWorkspace> {
    const agentId = node.ID;

    const settings: SurfaceAgentSettings = {
      ...(update.Metadata ? { Metadata: update.Metadata } : {}),
    };

    const { ShowHistory: _, ...rest } = update.Details ?? {};
    const agentDetails: Partial<EaCAgentDetails> = rest;

    const patch: Partial<EverythingAsCodeOIWorkspace> = {};

    if (Object.keys(settings).length > 0) {
      patch.Surfaces = {
        [context.SurfaceLookup!]: {
          Agents: {
            [agentId]: settings,
          },
        },
      };
    }

    if (Object.keys(agentDetails).length > 0) {
      patch.Agents = {
        [agentId]: {
          Details: agentDetails as EaCAgentDetails,
        },
      };
    }

    return patch;
  }

  protected override getInspector(): ComponentType<any> {
    return SurfaceAgentInspector;
  }

  // protected override getPreset(): NodePreset {
  //   return { Type: this.Type, Label: 'Agent', IconKey: 'agent' };
  // }

  protected override getRenderer(): ComponentType<any> {
    return SurfaceAgentNodeCapabilityManager.renderer;
  }
}
