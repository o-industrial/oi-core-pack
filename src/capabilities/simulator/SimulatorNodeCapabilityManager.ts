// deno-lint-ignore-file no-explicit-any
import { NodePreset, Position } from '../../.deps.ts';
import { EaCAzureDockerSimulatorDetails } from '../../.deps.ts';
import { EaCFlowNodeMetadata } from '../../.deps.ts';
import { EaCSimulatorAsCode } from '../../.deps.ts';
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
import { SimulatorInspector } from './SimulatorInspector.tsx';
import SimulatorNodeRenderer from './SimulatorNodeRenderer.tsx';

/**
 * Capability manager for workspace-scoped Simulators.
 * Responsible for projecting simulator nodes, simulates edges,
 * and binding connections via SimulatorLookup.
 */
export class SimulatorNodeCapabilityManager
  extends EaCNodeCapabilityManager<EaCAzureDockerSimulatorDetails> {
  protected static renderer: ComponentType = memo(
    SimulatorNodeRenderer as FunctionComponent,
  );

  public override Type = 'simulator';

  protected override buildAsCode(
    node: FlowGraphNode,
    ctx: EaCNodeCapabilityContext,
  ): EaCNodeCapabilityAsCode<EaCAzureDockerSimulatorDetails> | null {
    const sim = ctx.GetEaC().Simulators?.[node.ID];
    if (!sim) return null;

    return {
      Metadata: sim.Metadata,
      Details: sim.Details as EaCAzureDockerSimulatorDetails,
    };
  }

  protected override buildConnectionPatch(
    source: FlowGraphNode,
    target: FlowGraphNode,
    ctx: EaCNodeCapabilityContext,
  ): Partial<EverythingAsCodeOIWorkspace> | null {
    if (source.Type !== 'simulator' || target.Type !== 'connection') {
      return null;
    }

    const eac = ctx.GetEaC() as EverythingAsCodeOIWorkspace;
    const existing = eac.DataConnections?.[target.ID]?.SimulatorLookup;

    if (existing === source.ID) return null;

    return {
      DataConnections: {
        [target.ID]: {
          ...eac.DataConnections?.[target.ID],
          SimulatorLookup: source.ID,
        },
      },
    };
  }

  protected override buildDeletePatch(
    node: FlowGraphNode,
  ): NullableArrayOrObject<EverythingAsCodeOIWorkspace> {
    return this.wrapDeletePatch('Simulators', node.ID);
  }

  protected override buildDisconnectionPatch(
    source: FlowGraphNode,
    target: FlowGraphNode,
    ctx: EaCNodeCapabilityContext,
  ): Partial<EverythingAsCodeOIWorkspace> | null {
    if (source.Type !== 'simulator' || target.Type !== 'connection') {
      return null;
    }

    const eac = ctx.GetEaC() as EverythingAsCodeOIWorkspace;
    const conn = eac.DataConnections?.[target.ID];

    if (!conn || conn.SimulatorLookup !== source.ID) return null;

    return {
      DataConnections: {
        [target.ID]: {
          ...conn,
          SimulatorLookup: undefined,
        },
      },
    };
  }

  protected override buildEdgesForNode(
    node: FlowGraphNode,
    ctx: EaCNodeCapabilityContext,
  ): FlowGraphEdge[] {
    const eac = ctx.GetEaC() as EverythingAsCodeOIWorkspace;

    const edges: FlowGraphEdge[] = [];

    for (const [connKey, conn] of Object.entries(eac.DataConnections ?? {})) {
      if (conn.SimulatorLookup === node.ID) {
        edges.push({
          ID: `${node.ID}->${connKey}`,
          Source: node.ID,
          Target: connKey,
          Label: 'simulates',
        });
      }
    }

    return edges;
  }

  protected override buildNode(
    id: string,
    ctx: EaCNodeCapabilityContext,
  ): FlowGraphNode | null {
    const sim = ctx.GetEaC().Simulators?.[id];
    if (!sim) return null;

    return {
      ID: id,
      Type: this.Type,
      Label: sim.Details?.Name ?? id,
      Metadata: sim.Metadata,
      Details: sim.Details,
    };
  }

  protected override buildPresetPatch(
    id: string,
    position: Position,
    _context: EaCNodeCapabilityContext,
  ): Partial<EverythingAsCodeOIWorkspace> {
    const metadata: EaCFlowNodeMetadata = {
      Position: position,
      Enabled: true,
    };

    const details = { Name: id };

    return {
      Simulators: {
        [id]: {
          Metadata: metadata,
          Details: {
            ...details,
            Type: 'AzureDocker',
          } as EaCAzureDockerSimulatorDetails,
        } as EaCSimulatorAsCode,
      },
    };
  }

  protected override buildUpdatePatch(
    node: FlowGraphNode,
    update: EaCNodeCapabilityPatch<EaCAzureDockerSimulatorDetails>,
  ): Partial<EverythingAsCodeOIWorkspace> {
    return {
      Simulators: {
        [node.ID]: update,
      },
    };
  }

  protected override getInspector(): ComponentType<any> {
    return SimulatorInspector;
  }

  protected override getPreset(): NodePreset {
    return {
      Type: this.Type,
      Label: 'Simulator',
      IconKey: 'simulator',
    };
  }

  protected override getRenderer(): ComponentType<any> {
    return SimulatorNodeCapabilityManager.renderer;
  }
}
