// deno-lint-ignore-file jsx-no-useless-fragment
import { useCallback, useEffect, useMemo, useRef, useState } from '../../.deps.ts';
import { IntentTypes } from '../../.deps.ts';
import { Action, ActionStyleTypes, AziPanel, Modal, TabbedPanel } from '../../.deps.ts';
import { marked } from 'npm:marked@15.0.1';
import type { InterfaceSpec } from '../../.deps.ts';
import type { EaCInterfaceDetails, SurfaceInterfaceSettings } from '../../.deps.ts';
import { InterfaceEditorHost } from './InterfaceEditorHost.tsx';
import type { AziState, WorkspaceManager } from '../../.deps.ts';
import type { JSX } from '../../.deps.ts';

type SurfaceInterfaceTabKey = 'editor' | 'preview' | 'code';

const TAB_EDITOR: SurfaceInterfaceTabKey = 'editor';
const TAB_PREVIEW: SurfaceInterfaceTabKey = 'preview';
const TAB_CODE: SurfaceInterfaceTabKey = 'code';

export type SurfaceInterfaceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  interfaceLookup: string;
  surfaceLookup?: string;
  details: EaCInterfaceDetails;
  settings?: SurfaceInterfaceSettings;
  spec: InterfaceSpec;
  draftSpec?: InterfaceSpec;
  workspaceMgr: WorkspaceManager;
  onSpecChange?: (next: InterfaceSpec) => void;
};

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

function cloneSpec(spec: InterfaceSpec): InterfaceSpec {
  const g = globalThis as typeof globalThis & {
    structuredClone?: <T>(value: T) => T;
  };

  if (typeof g.structuredClone === 'function') {
    return ensureInterfaceSpec(g.structuredClone(spec));
  }

  return ensureInterfaceSpec(JSON.parse(JSON.stringify(spec)) as InterfaceSpec);
}

function extractSpecFromState(
  state: AziState | undefined,
): InterfaceSpec | null {
  if (!state) return null;

  const source = state as Record<string, unknown>;
  const directKeys = [
    'InterfaceSpec',
    'Spec',
    'DraftSpec',
    'NextSpec',
    'ProposedSpec',
    'PreviewSpec',
  ];

  for (const key of directKeys) {
    const value = source[key];
    if (value && typeof value === 'object') {
      return ensureInterfaceSpec(value as InterfaceSpec);
    }
  }

  const nestedInterface = source.Interface;
  if (
    nestedInterface &&
    typeof nestedInterface === 'object' &&
    (nestedInterface as Record<string, unknown>).Spec &&
    typeof (nestedInterface as Record<string, unknown>).Spec === 'object'
  ) {
    return ensureInterfaceSpec(
      (nestedInterface as { Spec: InterfaceSpec }).Spec,
    );
  }

  return null;
}


function SurfaceInterfaceDemoView({ spec }: { spec: InterfaceSpec }) {
  const safeSpec = ensureInterfaceSpec(spec);
  const meta = safeSpec.Meta;
  const themeName = meta.Theme ?? 'default';
  const totalNodes = countInterfaceNodes(safeSpec.Layout);
  const providerCount = safeSpec.Data?.Providers?.length ?? 0;
  const bindingCount = Object.keys(safeSpec.Data?.Bindings ?? {}).length;
  const actionCount = safeSpec.Actions?.length ?? 0;

  const layoutElements = renderInterfaceNodes(safeSpec.Layout);

  return (
    <div class='flex h-full flex-col gap-4'>
      <section class='rounded border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400'>
        <p class='font-semibold text-slate-200'>Interactive demo</p>
        <div class='mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4'>
          <div>
            <span class='block text-[10px] uppercase tracking-wide text-slate-500'>
              Theme
            </span>
            <span class='font-semibold text-slate-100'>{themeName}</span>
          </div>
          <div>
            <span class='block text-[10px] uppercase tracking-wide text-slate-500'>
              Layout nodes
            </span>
            <span class='font-semibold text-slate-100'>{totalNodes}</span>
          </div>
          <div>
            <span class='block text-[10px] uppercase tracking-wide text-slate-500'>
              Providers
            </span>
            <span class='font-semibold text-slate-100'>{providerCount}</span>
          </div>
          <div>
            <span class='block text-[10px] uppercase tracking-wide text-slate-500'>
              Bindings
            </span>
            <span class='font-semibold text-slate-100'>{bindingCount}</span>
          </div>
          <div>
            <span class='block text-[10px] uppercase tracking-wide text-slate-500'>
              Actions
            </span>
            <span class='font-semibold text-slate-100'>{actionCount}</span>
          </div>
        </div>
      </section>

      <div class='flex-1 overflow-auto rounded border border-slate-800 bg-slate-950/70 p-4'>
        {layoutElements.length > 0
          ? <div class='flex flex-col gap-4'>{layoutElements}</div>
          : (
            <div class='flex h-full items-center justify-center text-sm text-slate-500'>
              No layout nodes defined in this spec.
            </div>
          )}
      </div>
    </div>
  );
}

export function SurfaceInterfaceModal({
  isOpen,
  onClose,
  interfaceLookup,
  surfaceLookup,
  details,
  settings,
  spec,
  draftSpec,
  workspaceMgr,
  onSpecChange,
}: SurfaceInterfaceModalProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<SurfaceInterfaceTabKey>(TAB_EDITOR);
  const [currentSpec, setCurrentSpec] = useState<InterfaceSpec>(
    ensureInterfaceSpec(draftSpec ?? spec),
  );
  const persistTimerRef = useRef<number | null>(null);

  const enterpriseLookup = workspaceMgr.EaC.GetEaC().EnterpriseLookup ?? 'workspace';

  useEffect(() => {
    workspaceMgr.CreateInterfaceAziIfNotExist(interfaceLookup);
  }, [workspaceMgr, interfaceLookup]);

  useEffect(() => {
    if (persistTimerRef.current) {
      globalThis.clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }

    setCurrentSpec(ensureInterfaceSpec(draftSpec ?? spec));
  }, [draftSpec, spec]);

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) {
        globalThis.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(TAB_EDITOR);
      return;
    }

    if (!isOpen && persistTimerRef.current && onSpecChange) {
      onSpecChange(currentSpec);
      globalThis.clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
  }, [isOpen, onSpecChange, currentSpec]);

  const currentSpecSignature = useMemo(
    () => JSON.stringify(currentSpec),
    [currentSpec],
  );

  const persistSpec = useCallback(
    (next: InterfaceSpec, immediate = false) => {
      const safeNext = cloneSpec(next);
      setCurrentSpec(safeNext);

      if (!onSpecChange) return;

      if (persistTimerRef.current) {
        globalThis.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }

      if (immediate) {
        onSpecChange(safeNext);
        return;
      }

      persistTimerRef.current = globalThis.setTimeout(() => {
        onSpecChange(safeNext);
        persistTimerRef.current = null;
      }, 300) as unknown as number;
    },
    [onSpecChange],
  );

  const handleSpecFromEditor = useCallback(
    (next: InterfaceSpec) => {
      persistSpec(next);
    },
    [persistSpec],
  );

  const handleAziFinishSend = useCallback(
    (state: AziState) => {
      const extracted = extractSpecFromState(state);
      if (!extracted) return;

      const nextSignature = JSON.stringify(extracted);
      if (nextSignature === currentSpecSignature) return;

      persistSpec(extracted, true);
      setActiveTab(TAB_EDITOR);
    },
    [currentSpecSignature, persistSpec],
  );

  const handleAziStateChange = useCallback(
    (state: AziState) => {
      const extracted = extractSpecFromState(state);
      if (!extracted) return;

      const nextSignature = JSON.stringify(extracted);
      if (nextSignature === currentSpecSignature) return;

      persistSpec(extracted);
    },
    [currentSpecSignature, persistSpec],
  );

  const interfaceAzi = workspaceMgr.InterfaceAzis?.[interfaceLookup];
  const themeName = currentSpec.Meta.Theme ?? 'default';
  const versionLabel = `v${details.Version ?? 1}`;
  const draftPath = details.DraftState?.SpecPath ?? 'N/A';
  const webPath = details.WebPath ?? 'N/A';
  const refreshSummary = settings?.RefreshMs ? `${settings.RefreshMs} ms` : 'disabled';
  const editorRoute = `/workspace/interface/${interfaceLookup}`;

  const metadataItems = useMemo(() => {
    const items: Array<{ label: string; value: string }> = [
      { label: 'Lookup', value: interfaceLookup },
      { label: 'Version', value: versionLabel },
      { label: 'Theme', value: themeName },
      { label: 'Web Path', value: webPath },
      { label: 'Draft Path', value: draftPath },
      { label: 'Refresh', value: refreshSummary },
    ];

    if (surfaceLookup) {
      items.splice(1, 0, { label: 'Surface', value: surfaceLookup });
    }

    return items;
  }, [
    interfaceLookup,
    surfaceLookup,
    versionLabel,
    themeName,
    webPath,
    draftPath,
    refreshSummary,
  ]);

  const tabData = useMemo(
    () => [
      {
        key: TAB_EDITOR,
        label: 'Editor',
        icon: (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 20 20'
            fill='currentColor'
            class='h-5 w-5'
          >
            <path d='M4 13.5V17h3.5l10-10.01-3.5-3.49zm13.71-7.29a1 1 0 0 0 0-1.41L15.2 2.29a1 1 0 0 0-1.41 0l-1.38 1.38 3.5 3.5z' />
          </svg>
        ),
        content: (
          <div class='flex h-full min-h-0 flex-col'>
            <InterfaceEditorHost
              spec={currentSpec}
              draftSpec={draftSpec}
              onSpecChange={handleSpecFromEditor}
              defaultMode='visual'
            />
          </div>
        ),
      },
      {
        key: TAB_DEMO,
        label: 'Demo',
        icon: (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 20 20'
            fill='currentColor'
            class='h-5 w-5'
          >
            <path d='M4 4h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m0 2v8h12V6zm2 2h5l-2.5 3z' />
          </svg>
        ),
        content: <SurfaceInterfaceDemoView spec={currentSpec} />,
      },
    ],
    [currentSpec, draftSpec, handleSpecFromEditor],
  );

  const threadId = useMemo(
    () => `workspace-${enterpriseLookup}-interface-${interfaceLookup}`,
    [enterpriseLookup, interfaceLookup],
  );

  if (!isOpen) return <></>;

  return (
    <Modal
      title={`Interface: ${details.Name ?? interfaceLookup}`}
      onClose={onClose}
      class='max-w-[1200px] border border-slate-800 bg-slate-950 text-slate-100 shadow-lg'
      style={{ height: '90vh' }}
    >
      <div
        class='flex h-full min-h-0 gap-4 bg-slate-950'
        style={{ height: '75vh' }}
      >
        <div class='flex w-2/3 min-h-0 flex-col overflow-hidden pr-2'>
          <section class='rounded border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300'>
            <div class='grid grid-cols-2 gap-3 sm:grid-cols-3'>
              {metadataItems.map((item) => (
                <div key={`${item.label}-${item.value}`}>
                  <span class='block text-[10px] uppercase tracking-wide text-slate-500'>
                    {item.label}
                  </span>
                  <span class='font-semibold text-slate-100'>{item.value}</span>
                </div>
              ))}
            </div>
          </section>

          <div class='mt-3 flex-1 min-h-0 overflow-hidden rounded border border-slate-800 bg-slate-900/50 p-3'>
            <TabbedPanel
              tabs={tabData}
              activeTab={activeTab}
              onTabChange={(key) => setActiveTab(key === TAB_DEMO ? TAB_DEMO : TAB_EDITOR)}
              stickyTabs
              scrollableContent
              class='flex-1 min-h-0 flex flex-col'
            />
          </div>

          <footer class='mt-4 flex flex-wrap items-center justify-between gap-2 rounded border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400'>
            <span>
              Azi threads are stored under{' '}
              <code class='ml-1 rounded bg-slate-800 px-2 py-1 font-mono text-[10px] text-slate-200'>
                {threadId}
              </code>
              .
            </span>
            <Action
              href={editorRoute}
              target='_blank'
              rel='noreferrer'
              styleType={ActionStyleTypes.Outline | ActionStyleTypes.Rounded}
              intentType={IntentTypes.Secondary}
            >
              Open full editor
            </Action>
          </footer>
        </div>

        <div class='w-1/3 min-h-0 border-l border-slate-800 pl-4'>
          {interfaceAzi
            ? (
              <AziPanel
                workspaceMgr={workspaceMgr}
                aziMgr={interfaceAzi}
                onStartSend={() => setActiveTab(TAB_EDITOR)}
                onFinishSend={handleAziFinishSend}
                onStateChange={handleAziStateChange}
                renderMessage={(message) => marked.parse(message) as string}
                extraInputs={{
                  interfaceLookup,
                  surfaceLookup,
                  enterpriseLookup,
                  spec: currentSpec,
                  theme: themeName,
                }}
              />
            )
            : (
              <div class='flex h-full items-center justify-center text-sm text-slate-500'>
                Initializing interface collaborator...
              </div>
            )}
        </div>
      </div>
    </Modal>
  );
}


