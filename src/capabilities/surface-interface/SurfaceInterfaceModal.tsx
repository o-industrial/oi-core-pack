// deno-lint-ignore-file jsx-no-useless-fragment
import { useCallback, useEffect, useMemo, useRef, useState } from '../../.deps.ts';
import { AziPanel, CodeMirrorEditor, Modal, TabbedPanel } from '../../.deps.ts';
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

export function SurfaceInterfaceModal({
  isOpen,
  onClose,
  interfaceLookup,
  surfaceLookup,
  details,
  settings: _settings,
  spec,
  draftSpec,
  workspaceMgr,
  onSpecChange,
}: SurfaceInterfaceModalProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<SurfaceInterfaceTabKey>(TAB_EDITOR);
  const [currentSpec, setCurrentSpec] = useState<InterfaceSpec>(
    ensureInterfaceSpec(draftSpec ?? spec),
  );
  const [codeContent, setCodeContent] = useState<string>(() =>
    JSON.stringify(ensureInterfaceSpec(draftSpec ?? spec), null, 2)
  );
  const [codeError, setCodeError] = useState<string | null>(null);
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
  }, [isOpen, onSpecChange]);

  const currentSpecSignature = useMemo(
    () => JSON.stringify(currentSpec),
    [currentSpec],
  );
  const formattedSpec = useMemo(
    () => JSON.stringify(currentSpec, null, 2),
    [currentSpecSignature],
  );

  useEffect(() => {
    setCodeContent((existing) => (existing === formattedSpec ? existing : formattedSpec));
    setCodeError(null);
  }, [formattedSpec]);

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

  const handleCodeContentChange = useCallback(
    (next: string) => {
      setCodeContent(next);

      if (!next.trim()) {
        setCodeError('Interface spec JSON cannot be empty.');
        return;
      }

      try {
        const parsed = JSON.parse(next) as InterfaceSpec;
        const ensured = ensureInterfaceSpec(parsed);
        setCodeError(null);

        const ensuredSignature = JSON.stringify(ensured);
        if (ensuredSignature !== currentSpecSignature) {
          persistSpec(ensured);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid JSON input.';
        setCodeError(message);
      }
    },
    [currentSpecSignature, persistSpec],
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
  const interfaceName = details.Name ?? interfaceLookup;
  const themeName = currentSpec.Meta.Theme ?? 'default';
  const previewUrl = useMemo(() => {
    const path = details.WebPath?.trim();
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith('/')) return path;
    return `/${path}`;
  }, [details.WebPath]);

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
            />
          </div>
        ),
      },
      {
        key: TAB_PREVIEW,
        label: 'Preview',
        icon: (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 20 20'
            fill='currentColor'
            class='h-5 w-5'
          >
            <path d='M2 4.5A2.5 2.5 0 0 1 4.5 2h11A2.5 2.5 0 0 1 18 4.5v7A2.5 2.5 0 0 1 15.5 14H11l2.29 2.29L12.17 17.4L8.77 14H4.5A2.5 2.5 0 0 1 2 11.5z' />
          </svg>
        ),
        content: previewUrl
          ? (
            <div class='flex h-full min-h-0 flex-col gap-3'>
              <iframe
                src={previewUrl}
                title={`Interface preview for ${interfaceName}`}
                loading='lazy'
                class='flex-1 min-h-0 w-full rounded border border-neutral-700 bg-neutral-900'
                allow='clipboard-write; fullscreen'
              />
              <p class='text-xs text-neutral-400'>
                Rendering {previewUrl} in an embedded preview.
              </p>
            </div>
          )
          : (
            <div class='flex h-full items-center justify-center text-sm text-neutral-500'>
              Preview unavailable. Set a web path to enable the embedded view.
            </div>
          ),
      },
      {
        key: TAB_CODE,
        label: 'Code',
        icon: (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 20 20'
            fill='currentColor'
            class='h-5 w-5'
          >
            <path d='M7.41 6.59L2 12l5.41 5.41L8.82 16l-4-4 4-4zm4.18 0L11.18 8l4 4-4 4l1.41 1.41L18 12z' />
          </svg>
        ),
        content: (
          <div class='flex h-full min-h-0 flex-col gap-2'>
            <CodeMirrorEditor
              fileContent={codeContent}
              onContentChange={handleCodeContentChange}
              class='flex-1 min-h-0 [&>.cm-editor]:h-full [&>.cm-editor]:min-h-0 [&>.cm-editor]:rounded-md [&>.cm-editor]:border [&>.cm-editor]:border-neutral-700 [&>.cm-editor]:bg-neutral-950'
            />
            <p class={`text-xs ${codeError ? 'text-red-400' : 'text-neutral-400'}`}>
              {codeError
                ? `Invalid JSON: ${codeError}`
                : 'Edit the JSON spec to update the interface definition.'}
            </p>
          </div>
        ),
      },
    ],
    [
      currentSpec,
      draftSpec,
      handleSpecFromEditor,
      interfaceName,
      previewUrl,
      codeContent,
      codeError,
      handleCodeContentChange,
    ],
  );

  if (!isOpen) return <></>;

  return (
    <Modal
      title={`Interface: ${interfaceName}`}
      onClose={onClose}
      class='max-w-[1200px] border border-neutral-700 bg-neutral-900'
      style={{ height: '90vh' }}
    >
      <div
        class='flex flex-row gap-4 h-full min-h-0 bg-neutral-900'
        style={{ height: '75vh' }}
      >
        <div class='w-2/3 flex flex-col overflow-hidden pr-2 min-h-0'>
          <div
            class='flex-1 min-h-0 overflow-hidden bg-neutral-900 p-4 flex flex-col'
            style={{ height: '82vh' }}
          >
            <div class='mt-2 flex-1 min-h-0 flex flex-col'>
              <TabbedPanel
                tabs={tabData}
                activeTab={activeTab}
                onTabChange={(key) => {
                  if (key === TAB_PREVIEW || key === TAB_CODE || key === TAB_EDITOR) {
                    setActiveTab(key as SurfaceInterfaceTabKey);
                    return;
                  }

                  setActiveTab(TAB_EDITOR);
                }}
                stickyTabs
                scrollableContent
                class='flex-1 min-h-0 flex flex-col h-full overflow-hidden'
              />
            </div>
          </div>
        </div>

        <div class='w-1/3 min-h-0 border-l border-gray-700 pl-4 overflow-y-auto'>
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
              <div class='flex h-full items-center justify-center text-sm text-neutral-500'>
                Initializing interface collaborator...
              </div>
            )}
        </div>
      </div>
    </Modal>
  );
}
