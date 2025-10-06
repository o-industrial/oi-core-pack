// deno-lint-ignore-file no-explicit-any
import { NodePreset, Position } from '../../.deps.ts';
import {
  EaCInterfaceAsCode,
  EaCInterfaceDetails,
  InterfaceSpec,
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

const INTERFACE_PRESET_THEME = 'oi-default';

function ensureInterfaceSpecValue(
  spec: InterfaceSpec | undefined,
  fallbackId: string,
): InterfaceSpec {
  if (!spec) {
    return createDefaultInterfaceSpec(fallbackId);
  }

  const meta = spec.Meta ?? { Name: 'Untitled Interface', Version: 1 };

  return {
    ...spec,
    Meta: {
      ...meta,
      Name: meta.Name ?? 'Untitled Interface',
      Version: meta.Version ?? 1,
      Theme: meta.Theme ?? 'default',
    },
    Data: spec.Data ?? { Providers: [], Bindings: {} },
    Layout: spec.Layout ?? [],
    Actions: spec.Actions ?? [],
  };
}

function createDefaultInterfaceSpec(id: string): InterfaceSpec {
  return {
    Meta: {
      Name: `New Interface ${id}`,
      Version: 1,
      Theme: INTERFACE_PRESET_THEME,
    },
    Imports: {
      Components: ['Container', 'Text'],
    },
    Data: {
      Providers: [],
      Bindings: {},
    },
    Layout: [
      {
        ID: 'root',
        Type: 'Container',
        IsContainer: true,
        Props: {
          className:
            'flex min-h-[320px] flex-col gap-4 bg-slate-950/80 p-6 rounded-xl border border-slate-800',
        },
        Children: [
          {
            ID: 'headline',
            Type: 'Text',
            Props: {
              value: 'Interface title',
              className: 'text-2xl font-semibold text-slate-100',
            },
          },
          {
            ID: 'subtitle',
            Type: 'Text',
            Props: {
              value: 'Describe the purpose of this HMI page',
              className: 'text-sm text-slate-400',
            },
          },
        ],
      },
    ],
    Actions: [],
    Theme: {
      Colors: {
        primary: '#22d3ee',
        surface: '#0f172a',
      },
    },
  };
}

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

    const interfaceDetails = interfaceEntry.Details ?? {
      Name: node.ID,
      Version: 1,
      Spec: createDefaultInterfaceSpec(node.ID),
    };

    const safeSpec = ensureInterfaceSpecValue(interfaceDetails.Spec, node.ID);

    const mergedMetadata = {
      ...(interfaceEntry.Metadata ?? {}),
      ...(settings?.Metadata ?? {}),
    };

    const mergedDetails: SurfaceInterfaceNodeDetails = {
      ...interfaceDetails,
      ...(settings ?? {}),
      Spec: safeSpec,
      SurfaceLookup: surfaceLookup,
    };

    return {
      Details: mergedDetails,
      ...(Object.keys(mergedMetadata).length > 0 ? { Metadata: mergedMetadata } : {}),
    };
  }

  protected override buildPresetPatch(
    id: string,
    position: Position,
    context: EaCNodeCapabilityContext,
  ): Partial<EverythingAsCodeOIWorkspace> {
    const surfaceLookup = this.ensureSurfaceLookup(context);

    const initialSpec = createDefaultInterfaceSpec(id);

    const interfaceDetails: EaCInterfaceDetails = {
      Name: `${id}`,
      Description: 'Auto-generated interface stub',
      Version: 1,
      Spec: ensureInterfaceSpecValue(initialSpec, id),
    };

    return {
      Interfaces: {
        [id]: {
          Details: interfaceDetails,
          Metadata: { Enabled: true },
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
      'Description',
      'WebPath',
      'ComponentTag',
      'EmbedOptions',
      'Spec',
      'Assets',
      'DraftState',
      'Thumbnails',
      'Version',
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
      interfaceUpdate.Details = interfacePatch as EaCInterfaceDetails;
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

    const metadata = {
      ...(interfaceEntry.Metadata ?? {}),
      ...(settings?.Metadata ?? {}),
    };

    return {
      ID: id,
      Type: this.Type,
      Label: interfaceEntry.Details?.Name ?? id,
      Metadata: metadata,
      Details: interfaceEntry.Details,
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
    const name = interfaceEntry.Details.Name?.trim();

    if (!name) {
      errors.push({
        field: 'Details.Name',
        message: 'Name is required for an interface.',
      });
    }

    if (!interfaceEntry.Details.Spec?.Layout?.length) {
      errors.push({
        field: 'Details.Spec.Layout',
        message: 'Interface layout must contain at least one node.',
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
