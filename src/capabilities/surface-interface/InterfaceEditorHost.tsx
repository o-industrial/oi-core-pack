import { IntentTypes } from '../../.deps.ts';
import { Action, ActionStyleTypes, Input } from '../../.deps.ts';
import { JSX, useEffect, useMemo, useState } from '../../.deps.ts';
import type { InterfaceSpec } from '../../.deps.ts';
import { VisualBuilderCanvas } from './VisualBuilderCanvas.tsx';

export type InterfaceEditorHostProps = {
  spec: InterfaceSpec;
  draftSpec?: InterfaceSpec;
  onSpecChange?: (next: InterfaceSpec) => void;
};

function countLayoutNodes(nodes: InterfaceSpec['Layout']): number {
  const walk = (list: InterfaceSpec['Layout']): number => {
    return list.reduce((acc, node) => {
      const children = Array.isArray(node.Children) ? walk(node.Children) : 0;
      return acc + 1 + children;
    }, 0);
  };

  return walk(nodes ?? []);
}

function ensureInterfaceSpec(spec?: InterfaceSpec): InterfaceSpec {
  if (!spec) {
    return {
      Meta: { Name: 'Untitled Interface', Version: 1, Theme: 'default' },
      Layout: [],
      Data: { Providers: [], Bindings: {} },
      Actions: [],
    };
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

export function InterfaceEditorHost({
  spec,
  draftSpec,
  onSpecChange,
}: InterfaceEditorHostProps): JSX.Element {
  const [editorValue, setEditorValue] = useState<string>('');
  const [lastError, setLastError] = useState<string>('');
  const [currentSpec, setCurrentSpec] = useState<InterfaceSpec>(
    ensureInterfaceSpec(draftSpec ?? spec)
  );

  useEffect(() => {
    setCurrentSpec(ensureInterfaceSpec(draftSpec ?? spec));
  }, [draftSpec, spec]);

  const meta = currentSpec.Meta ?? {
    Name: 'Untitled Interface',
    Version: 1,
    Theme: 'default',
  };

  const themeName = meta.Theme ?? 'default';

  const handleEditorChange = (value: string) => {
    setEditorValue(value);
    try {
      const parsed = JSON.parse(value) as InterfaceSpec;
      setLastError('');
      const sanitized = ensureInterfaceSpec(parsed);
      setCurrentSpec(sanitized);
      onSpecChange?.(sanitized);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div class="flex h-full flex-col gap-4">
      <section class="flex-1 overflow-hidden rounded-md p-1">
        <VisualBuilderCanvas
          spec={currentSpec}
          onSpecChange={(next) => {
            const sanitizedNext = ensureInterfaceSpec(next);
            setCurrentSpec(sanitizedNext);
            onSpecChange?.(sanitizedNext);
          }}
        />
      </section>
    </div>
  );
}
