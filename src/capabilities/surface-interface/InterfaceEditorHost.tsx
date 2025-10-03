import { IntentTypes } from '../../.deps.ts';
import { Action, ActionStyleTypes, Input } from '../../.deps.ts';
import { JSX, useEffect, useMemo, useState } from '../../.deps.ts';
import type { InterfaceSpec } from '../../.deps.ts';
import { VisualBuilderCanvas } from './VisualBuilderCanvas.tsx';

export type InterfaceEditorMode = 'overview' | 'visual' | 'code' | 'preview';

export type InterfaceEditorHostProps = {
  spec: InterfaceSpec;
  draftSpec?: InterfaceSpec;
  onSpecChange?: (next: InterfaceSpec) => void;
  defaultMode?: InterfaceEditorMode;
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
  defaultMode = 'overview',
}: InterfaceEditorHostProps): JSX.Element {
  const [mode, setMode] = useState<InterfaceEditorMode>(defaultMode);
  const [editorValue, setEditorValue] = useState<string>('');
  const [lastError, setLastError] = useState<string>('');
  const [currentSpec, setCurrentSpec] = useState<InterfaceSpec>(
    ensureInterfaceSpec(draftSpec ?? spec),
  );

  useEffect(() => {
    setCurrentSpec(ensureInterfaceSpec(draftSpec ?? spec));
  }, [draftSpec, spec]);

  useEffect(() => {
    if (mode === 'code') {
      setEditorValue(JSON.stringify(currentSpec, null, 2));
    }
  }, [mode, currentSpec]);

  const summary = useMemo(() => {
    const providers = currentSpec.Data?.Providers?.length ?? 0;
    const bindings = Object.keys(currentSpec.Data?.Bindings ?? {}).length;
    const actions = currentSpec.Actions?.length ?? 0;
    const nodes = countLayoutNodes(currentSpec.Layout ?? []);

    return {
      providers,
      bindings,
      actions,
      nodes,
    };
  }, [currentSpec]);

  const meta = currentSpec.Meta ?? {
    Name: 'Untitled Interface',
    Version: 1,
    Theme: 'default',
  };
  const themeName = meta.Theme ?? 'default';

  const modes: Array<{ key: InterfaceEditorMode; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'visual', label: 'Visual' },
    { key: 'code', label: 'Code' },
    { key: 'preview', label: 'Preview' },
  ];

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
    <div class='flex h-full flex-col gap-4 text-slate-100'>
      <nav class='flex gap-2 rounded-md border border-slate-700 bg-slate-900/60 p-2'>
        {modes.map((item) => {
          const isActive = mode === item.key;
          return (
            <Action
              key={item.key}
              type='button'
              styleType={isActive
                ? ActionStyleTypes.Solid | ActionStyleTypes.Rounded
                : ActionStyleTypes.Outline | ActionStyleTypes.UltraThin | ActionStyleTypes.Rounded}
              intentType={isActive ? IntentTypes.Primary : IntentTypes.Secondary}
              onClick={() => setMode(item.key)}
            >
              {item.label}
            </Action>
          );
        })}
      </nav>

      <section class='flex-1 overflow-hidden rounded-md border border-slate-800 bg-slate-950/70 p-4'>
        {mode === 'overview' && (
          <div class='flex h-full flex-col gap-4'>
            <header>
              <h2 class='text-lg font-semibold text-slate-50'>Spec Snapshot</h2>
              <p class='text-sm text-slate-400'>
                Version {meta.Version} | Theme {themeName}
              </p>
            </header>
            <dl class='grid grid-cols-2 gap-4 text-sm text-slate-300 md:grid-cols-4'>
              <div>
                <dt class='font-semibold text-slate-400'>Layout Nodes</dt>
                <dd class='text-xl font-bold text-slate-100'>{summary.nodes}</dd>
              </div>
              <div>
                <dt class='font-semibold text-slate-400'>Providers</dt>
                <dd class='text-xl font-bold text-slate-100'>{summary.providers}</dd>
              </div>
              <div>
                <dt class='font-semibold text-slate-400'>Bindings</dt>
                <dd class='text-xl font-bold text-slate-100'>{summary.bindings}</dd>
              </div>
              <div>
                <dt class='font-semibold text-slate-400'>Actions</dt>
                <dd class='text-xl font-bold text-slate-100'>{summary.actions}</dd>
              </div>
            </dl>
            <div class='rounded border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300'>
              <p class='mb-2 font-semibold text-slate-200'>Shared Imports</p>
              <ul class='list-disc pl-5 text-xs text-slate-400'>
                {(currentSpec.Imports?.Components ?? []).length > 0
                  ? currentSpec.Imports?.Components?.map((name) => (
                    <li key={`component-${name}`}>{name}</li>
                  ))
                  : <li>No component imports declared.</li>}
                {(currentSpec.Imports?.Inputs ?? []).length > 0
                  ? currentSpec.Imports?.Inputs?.map((name) => (
                    <li key={`input-${name}`}>HMI input: {name}</li>
                  ))
                  : <li>No input interfaces referenced.</li>}
              </ul>
            </div>
          </div>
        )}

        {mode === 'visual' && (
          <VisualBuilderCanvas
            spec={currentSpec}
            onSpecChange={(next) => {
              const sanitizedNext = ensureInterfaceSpec(next);
              setCurrentSpec(sanitizedNext);
              onSpecChange?.(sanitizedNext);
            }}
          />
        )}

        {mode === 'code' && (
          <div class='flex h-full flex-col gap-3'>
            <Input
              multiline
              class='h-full w-full flex-1 resize-none rounded border border-slate-800 bg-slate-900/80 p-3 font-mono text-xs text-slate-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-teal-500'
              value={editorValue}
              onInput={(event: JSX.TargetedEvent<HTMLTextAreaElement, Event>) =>
                handleEditorChange((event.currentTarget as HTMLTextAreaElement).value)}
            />
            {lastError && (
              <p class='rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-300'>
                {lastError}
              </p>
            )}
          </div>
        )}

        {mode === 'preview' && (
          <div class='flex h-full flex-col items-center justify-center gap-4 text-center text-slate-300'>
            <span class='rounded-full border border-slate-700 px-4 py-1 text-xs uppercase tracking-wide'>
              Preview
            </span>
            <p class='max-w-md text-sm'>
              Live interface previews will display here once rendering hooks are wired. For now, use
              the Visual or Code modes to iterate on the spec.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
