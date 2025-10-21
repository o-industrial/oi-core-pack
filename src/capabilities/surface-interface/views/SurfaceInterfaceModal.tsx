import { marked } from 'npm:marked@15.0.1';

import {
  Action,
  ActionStyleTypes,
  AziPanel,
  CodeMirrorEditor,
  Input,
  IntentTypes,
  interfacePageDataToSchema,
  Modal,
  TabbedPanel,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  WorkspaceManager,
} from '../../../.deps.ts';
import type {
  EaCInterfaceCodeBlock,
  EaCInterfaceDataConnectionFeatures,
  EaCInterfaceDetails,
  EaCInterfaceGeneratedDataSlice,
  EaCInterfacePageDataAccessMode,
  EaCInterfacePageDataActionInvocationMode,
  EaCInterfacePageDataType,
  EverythingAsCodeOIWorkspace,
  JSX,
  SurfaceInterfaceSettings,
} from '../../../.deps.ts';
import {
  clonePageDataType,
  ensureInterfaceDetails,
  ensurePageDataType,
} from '../interfaceDefaults.ts';
import { reconcileInterfacePageData } from '../pageDataHelpers.ts';
import { SurfaceInterfaceImportsTab } from './SurfaceInterfaceImportsTab.tsx';
import { SurfaceInterfacePageDataTab } from './SurfaceInterfacePageDataTab.tsx';

type SurfaceInterfaceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  interfaceLookup: string;
  surfaceLookup?: string;
  details: EaCInterfaceDetails;
  settings?: SurfaceInterfaceSettings;
  workspaceMgr: WorkspaceManager;
  onDetailsChange?: (next: Partial<EaCInterfaceDetails>) => void;
};

type SurfaceInterfaceTabKey =
  | 'imports'
  | 'data'
  | 'handler'
  | 'page'
  | 'preview';

const TAB_IMPORTS: SurfaceInterfaceTabKey = 'imports';
const TAB_DATA: SurfaceInterfaceTabKey = 'data';
const TAB_HANDLER: SurfaceInterfaceTabKey = 'handler';
const TAB_PAGE: SurfaceInterfaceTabKey = 'page';
const TAB_PREVIEW: SurfaceInterfaceTabKey = 'preview';

export function SurfaceInterfaceModal({
  isOpen,
  onClose,
  interfaceLookup,
  surfaceLookup,
  details,
  settings,
  workspaceMgr,
  onDetailsChange,
}: SurfaceInterfaceModalProps): JSX.Element | null {
  const resolvedDetails = useMemo(
    () => ensureInterfaceDetails(details, interfaceLookup),
    [details, interfaceLookup],
  );

  const [activeTab, setActiveTab] = useState<SurfaceInterfaceTabKey>(TAB_IMPORTS);

  const [imports, setImports] = useState(resolvedDetails.Imports ?? []);
  const [importsInvalid, setImportsInvalid] = useState(false);
  const [pageDataType, setPageDataType] = useState<EaCInterfacePageDataType>(() => {
    const workspace = workspaceMgr.EaC.GetEaC?.() as
      | EverythingAsCodeOIWorkspace
      | undefined;
    return reconcileInterfacePageData(
      ensurePageDataType(resolvedDetails.PageDataType),
      settings,
      workspace,
      surfaceLookup,
      interfaceLookup,
    );
  });
  const [handlerCode, setHandlerCode] = useState(
    resolvedDetails.PageHandler?.Code ?? '',
  );
  const [handlerDescription, setHandlerDescription] = useState(
    resolvedDetails.PageHandler?.Description ?? '',
  );
  const [handlerMessagesText, setHandlerMessagesText] = useState(
    formatMessages(resolvedDetails.PageHandler?.Messages),
  );
  const [handlerMessageGroups] = useState(
    resolvedDetails.PageHandler?.MessageGroups ?? [],
  );

  const [pageCode, setPageCode] = useState(resolvedDetails.Page?.Code ?? '');
  const [pageDescription, setPageDescription] = useState(
    resolvedDetails.Page?.Description ?? '',
  );
  const [pageMessagesText, setPageMessagesText] = useState(
    formatMessages(resolvedDetails.Page?.Messages),
  );
  const [pageMessageGroups] = useState(
    resolvedDetails.Page?.MessageGroups ?? [],
  );
  const [previewBaseOverride, setPreviewBaseOverride] = useState(() => {
    const storage = (globalThis as { localStorage?: Storage }).localStorage;
    if (!storage) return '';
    try {
      const stored = storage.getItem('oi.interfacePreviewBase');
      return stored ?? '';
    } catch {
      return '';
    }
  });
  const [previewNonce, setPreviewNonce] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    setImports(resolvedDetails.Imports ?? []);

    const workspace = workspaceMgr.EaC.GetEaC?.() as
      | EverythingAsCodeOIWorkspace
      | undefined;
    const reconciled = reconcileInterfacePageData(
      ensurePageDataType(resolvedDetails.PageDataType),
      settings,
      workspace,
      surfaceLookup,
      interfaceLookup,
    );
    setPageDataType(reconciled);

    setHandlerCode(resolvedDetails.PageHandler?.Code ?? '');
    setHandlerDescription(resolvedDetails.PageHandler?.Description ?? '');
    setHandlerMessagesText(
      formatMessages(resolvedDetails.PageHandler?.Messages),
    );

    setPageCode(resolvedDetails.Page?.Code ?? '');
    setPageDescription(resolvedDetails.Page?.Description ?? '');
    setPageMessagesText(formatMessages(resolvedDetails.Page?.Messages));
    setImportsInvalid(false);
  }, [isOpen, resolvedDetails, settings, workspaceMgr, surfaceLookup, interfaceLookup]);

  const generatedSlices = pageDataType.Generated;
  const generatedSliceEntries = useMemo(
    () =>
      Object.entries(generatedSlices) as Array<
        [string, EaCInterfaceGeneratedDataSlice]
      >,
    [generatedSlices],
  );

  const interfaceAzi = workspaceMgr.InterfaceAzis?.[interfaceLookup];
  const enterpriseLookup = workspaceMgr.EaC.GetEaC().EnterpriseLookup ?? 'workspace';

  if (!isOpen) return null;

  const resolvedSnapshot = useMemo(
    () =>
      JSON.stringify(
        buildInterfaceDetailsPatch(
          resolvedDetails.PageHandler,
          resolvedDetails.Page,
          resolvedDetails.Imports ?? [],
          ensurePageDataType(resolvedDetails.PageDataType),
          resolvedDetails.PageHandler?.Code ?? '',
          resolvedDetails.PageHandler?.Description ?? '',
          formatMessages(resolvedDetails.PageHandler?.Messages),
          resolvedDetails.PageHandler?.MessageGroups,
          resolvedDetails.Page?.Code ?? '',
          resolvedDetails.Page?.Description ?? '',
          formatMessages(resolvedDetails.Page?.Messages),
          resolvedDetails.Page?.MessageGroups,
        ),
      ),
    [resolvedDetails],
  );

  const lastAppliedRef = useRef<string>(resolvedSnapshot);

  useEffect(() => {
    lastAppliedRef.current = resolvedSnapshot;
  }, [resolvedSnapshot]);

  const nextDetails = useMemo(() => {
    if (importsInvalid) return null;

    return buildInterfaceDetailsPatch(
      resolvedDetails.PageHandler,
      resolvedDetails.Page,
      imports,
      pageDataType,
      handlerCode,
      handlerDescription,
      handlerMessagesText,
      handlerMessageGroups,
      pageCode,
      pageDescription,
      pageMessagesText,
      pageMessageGroups,
    );
  }, [
    importsInvalid,
    resolvedDetails.PageHandler,
    resolvedDetails.Page,
    imports,
    pageDataType,
    handlerCode,
    handlerDescription,
    handlerMessagesText,
    handlerMessageGroups,
    pageCode,
    pageDescription,
    pageMessagesText,
    pageMessageGroups,
  ]);

  useEffect(() => {
    if (!onDetailsChange || !nextDetails) return;
    const serialized = JSON.stringify(nextDetails);
    if (serialized === lastAppliedRef.current) return;
    lastAppliedRef.current = serialized;
    onDetailsChange(nextDetails);
  }, [nextDetails, onDetailsChange]);

  const updateGeneratedSlice = useCallback(
    (
      key: string,
      updater: (slice: EaCInterfaceGeneratedDataSlice) => EaCInterfaceGeneratedDataSlice | null,
    ) => {
      setPageDataType((current) => {
        const slice = current.Generated[key];
        if (!slice) return current;
        const nextSlice = updater(slice);
        if (!nextSlice) return current;
        if (nextSlice === slice) return current;
        return {
          ...current,
          Generated: {
            ...current.Generated,
            [key]: nextSlice,
          },
        };
      });
    },
    [],
  );

  const handleAccessModeChange = (key: string, mode: EaCInterfacePageDataAccessMode) => {
    updateGeneratedSlice(key, (slice) => {
      const nextSlice: EaCInterfaceGeneratedDataSlice = {
        ...slice,
        AccessMode: mode,
      };

      if (slice.Actions && slice.Actions.length > 0) {
        nextSlice.Actions = slice.Actions.map((action) => {
          const currentMode = action.Invocation?.Mode ?? 'both';
          let nextMode = currentMode;

          if (mode === 'server' && currentMode === 'both') {
            nextMode = 'server';
          } else if (mode === 'client' && currentMode === 'both') {
            nextMode = 'client';
          }

          return {
            ...action,
            Invocation: {
              ...(action.Invocation ?? {}),
              ...(nextMode ? { Mode: nextMode } : {}),
            },
          };
        });
      }

      return nextSlice;
    });
  };

  const handleDataConnectionFeaturesChange = (
    key: string,
    features: EaCInterfaceDataConnectionFeatures | undefined,
  ) => {
    updateGeneratedSlice(key, (slice) => ({
      ...slice,
      DataConnection: features ? JSON.parse(JSON.stringify(features)) : undefined,
    }));
  };

  const handleActionModeChange = (
    sliceKey: string,
    actionKey: string,
    mode: EaCInterfacePageDataActionInvocationMode,
  ) => {
    updateGeneratedSlice(sliceKey, (slice) => {
      if (!slice.Actions || slice.Actions.length === 0) return slice;

      const nextActions = slice.Actions.map((action) => {
        if (action.Key !== actionKey) return action;

        const nextInvocation = {
          ...(action.Invocation ?? {}),
          Mode: mode,
        };

        return {
          ...action,
          Invocation: nextInvocation,
        };
      });

      return {
        ...slice,
        Actions: nextActions,
      };
    });
  };

  const extraInputs = useMemo(
    () => ({
      interfaceLookup,
      surfaceLookup,
      enterpriseLookup,
      UserName: profile.Name,
      UserUsername: profile.Username,
      UserFirstName: userFirstName,
      UserProfile: {
        Username: profile.Username,
        Name: profile.Name,
        FirstName: userFirstName,
      },
      imports,
      pageData: {
        summary: {
          totalSlices: generatedSliceEntries.length,
        },
        schema: interfacePageDataToSchema(pageDataType),
        generated: generatedSliceEntries.map(([key, slice]) => ({
          key,
          label: slice.Label,
          source: slice.SourceCapability,
          hydration: slice.Hydration,
          accessMode: slice.AccessMode,
          dataConnection: slice.DataConnection,
          actionCount: slice.Actions?.length ?? 0,
          actions: slice.Actions?.map((action) => ({
            key: action.Key,
            label: action.Label,
            mode: action.Invocation?.Mode,
            type: action.Invocation?.Type,
          })),
        })),
      },
      handler: {
        code: handlerCode,
        description: handlerDescription,
        messages: parseMessages(handlerMessagesText),
      },
      page: {
        code: pageCode,
        description: pageDescription,
        messages: parseMessages(pageMessagesText),
      },
    }),
    [
      interfaceLookup,
      surfaceLookup,
      enterpriseLookup,
      profile.Name,
      profile.Username,
      userFirstName,
      imports,
      pageDataType,
      generatedSliceEntries,
      handlerCode,
      handlerDescription,
      handlerMessagesText,
      pageCode,
      pageDescription,
      pageMessagesText,
    ],
  );

  const tabData = [
    {
      key: TAB_IMPORTS,
      label: 'Imports',
      content: (
        <SurfaceInterfaceImportsTab
          imports={imports}
          onChange={setImports}
          onValidityChange={setImportsInvalid}
        />
      ),
    },
    {
      key: TAB_DATA,
      label: 'Page Data',
      content: (
        <SurfaceInterfacePageDataTab
          generatedSlices={generatedSliceEntries}
          onAccessModeChange={handleAccessModeChange}
          onDataConnectionChange={handleDataConnectionFeaturesChange}
          onActionModeChange={handleActionModeChange}
        />
      ),
    },
    {
      key: TAB_HANDLER,
      label: 'Handler',
      content: (
        <div class='flex h-full min-h-0 flex-col'>
          <CodeEditorPanel
            code={handlerCode}
            description={handlerDescription}
            messages={handlerMessagesText}
            onCodeChange={setHandlerCode}
            onDescriptionChange={setHandlerDescription}
            onMessagesChange={setHandlerMessagesText}
            placeholder='export async function loadPageData(...) { ... }'
          />
        </div>
      ),
    },
    {
      key: TAB_PAGE,
      label: 'Page',
      content: (
        <div class='flex h-full min-h-0 flex-col'>
          <CodeEditorPanel
            code={pageCode}
            description={pageDescription}
            messages={pageMessagesText}
            onCodeChange={setPageCode}
            onDescriptionChange={setPageDescription}
            onMessagesChange={setPageMessagesText}
            placeholder='export default function InterfacePage({ data }: { data?: InterfacePageData }) { ... }'
          />
        </div>
      ),
    },
    {
      key: TAB_PREVIEW,
      label: 'Preview',
      content: (
        <InterfacePreviewTab
          interfaceLookup={interfaceLookup}
          surfaceLookup={surfaceLookup}
          previewBaseOverride={previewBaseOverride}
          onPreviewBaseChange={setPreviewBaseOverride}
          previewNonce={previewNonce}
          onRefreshPreview={() => setPreviewNonce((value: number) => value + 1)}
        />
      ),
    },
  ];

  return (
    <Modal
      title={`Interface: ${resolvedDetails.Name ?? interfaceLookup}`}
      onClose={onClose}
      class='max-w-[1200px] border border-neutral-700 bg-neutral-900'
      style={{ height: '90vh' }}
    >
      <div
        class='flex h-full min-h-0 flex-row gap-4 bg-neutral-900'
        style={{ height: '75vh' }}
      >
        <div class='w-2/3 flex min-h-0 flex-col gap-3'>
          {importsInvalid && (
            <div class='rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300'>
              Resolve import validation issues to persist interface updates.
            </div>
          )}

          <TabbedPanel
            tabs={tabData}
            activeTab={activeTab}
            onTabChange={(key) => {
              if (
                key === TAB_IMPORTS ||
                key === TAB_DATA ||
                key === TAB_HANDLER ||
                key === TAB_PAGE ||
                key === TAB_PREVIEW
              ) {
                setActiveTab(key as SurfaceInterfaceTabKey);
              }
            }}
            stickyTabs
            scrollableContent
            class='flex-1 min-h-0'
          />
        </div>

        <div class='w-1/3 min-h-0 border-l border-gray-700 pl-4 overflow-y-auto'>
          {interfaceAzi
            ? (
              <AziPanel
                workspaceMgr={workspaceMgr}
                aziMgr={interfaceAzi}
                renderMessage={(message) => marked.parse(message) as string}
                extraInputs={extraInputs}
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

type CodeEditorPanelProps = {
  code: string;
  description: string;
  messages: string;
  onCodeChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onMessagesChange: (value: string) => void;
  placeholder: string;
};

function CodeEditorPanel({
  code,
  description,
  messages,
  onCodeChange,
  onDescriptionChange,
  onMessagesChange,
  placeholder,
}: CodeEditorPanelProps) {
  return (
    <div class='flex flex-1 min-h-0 flex-col gap-3'>
      <CodeMirrorEditor
        fileContent={code}
        onContentChange={onCodeChange}
        placeholder={placeholder}
        class='flex-1 min-h-[320px] [&>.cm-editor]:h-full [&>.cm-editor]:min-h-0'
      />
      <textarea
        class='h-16 w-full resize-none rounded border border-neutral-700 bg-neutral-950 p-2 text-sm text-neutral-200 outline-none focus:border-teal-400'
        placeholder='Optional description for this code block'
        value={description}
        onInput={(event) => onDescriptionChange((event.target as HTMLTextAreaElement).value)}
      />
      <textarea
        class='h-24 w-full resize-none rounded border border-neutral-800 bg-neutral-950 p-2 text-xs text-neutral-300 outline-none focus:border-teal-400'
        placeholder='Guidance messages (one per line) to share with AI collaborators'
        value={messages}
        onInput={(event) => onMessagesChange((event.target as HTMLTextAreaElement).value)}
      />
    </div>
  );
}

function formatMessages(messages?: string[]): string {
  return (messages ?? []).join('\n');
}

function parseMessages(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length);
}

function buildCodeBlock(
  base: EaCInterfaceCodeBlock | undefined,
  code: string,
  description: string,
  messages: string[],
  messageGroups: EaCInterfaceCodeBlock['MessageGroups'] | undefined,
): EaCInterfaceCodeBlock | undefined {
  const trimmedCode = code.trim();
  const trimmedDescription = description.trim();
  const hasMessages = messages.length > 0;
  const hasGroups = messageGroups && messageGroups.length > 0;

  if (!trimmedCode && !trimmedDescription && !hasMessages && !hasGroups) {
    return undefined;
  }

  return {
    ...(base ?? {}),
    ...(trimmedCode ? { Code: trimmedCode } : { Code: undefined }),
    ...(trimmedDescription ? { Description: trimmedDescription } : { Description: undefined }),
    ...(hasMessages ? { Messages: messages } : { Messages: undefined }),
    ...(hasGroups ? { MessageGroups: messageGroups } : { MessageGroups: undefined }),
  };
}

type InterfacePreviewTabProps = {
  interfaceLookup: string;
  surfaceLookup?: string;
  previewBaseOverride: string;
  onPreviewBaseChange: (value: string) => void;
  previewNonce: number;
  onRefreshPreview: () => void;
};

function InterfacePreviewTab({
  interfaceLookup,
  surfaceLookup,
  previewBaseOverride,
  onPreviewBaseChange,
  previewNonce,
  onRefreshPreview,
}: InterfacePreviewTabProps) {
  const globalLocation = (globalThis as { location?: Location }).location;
  const globalLocalStorage = (globalThis as { localStorage?: Storage })
    .localStorage;
  const globalOpen = (globalThis as { open?: typeof open }).open;

  const defaultHost = globalLocation?.origin ?? '';
  const globalBase = (globalThis as { __OI_INTERFACE_PREVIEW_BASE__?: string })
    .__OI_INTERFACE_PREVIEW_BASE__ ??
    (globalThis as { __INTERFACE_PREVIEW_BASE__?: string })
      .__INTERFACE_PREVIEW_BASE__ ??
    '';

  const effectivePreviewBase = useMemo(() => {
    const trimmedGlobal = globalBase?.trim();
    if (trimmedGlobal) return trimmedGlobal;

    const trimmedOverride = previewBaseOverride?.trim();
    if (trimmedOverride) return trimmedOverride;

    return defaultHost;
  }, [globalBase, previewBaseOverride, defaultHost]);

  useEffect(() => {
    if (!globalLocalStorage) return;

    try {
      const trimmedOverride = previewBaseOverride.trim();
      if (trimmedOverride.length > 0) {
        globalLocalStorage.setItem('oi.interfacePreviewBase', trimmedOverride);
      } else {
        globalLocalStorage.removeItem('oi.interfacePreviewBase');
      }
    } catch {
      // best effort
    }
  }, [globalLocalStorage, previewBaseOverride]);

  const previewUrl = useMemo(() => {
    if (!effectivePreviewBase) return undefined;

    const previewPath = surfaceLookup
      ? `/surfaces/${
        encodeURIComponent(
          surfaceLookup,
        )
      }/interfaces/${encodeURIComponent(interfaceLookup)}`
      : `/interfaces/${encodeURIComponent(interfaceLookup)}`;

    try {
      const baseUrl = new URL(
        effectivePreviewBase,
        defaultHost || 'http://localhost',
      );
      const prefix = baseUrl.pathname.endsWith('/')
        ? baseUrl.pathname.slice(0, -1)
        : baseUrl.pathname;
      baseUrl.pathname = `${prefix}${previewPath}`;
      return baseUrl.toString();
    } catch {
      if (!globalLocation) return undefined;
      try {
        return new URL(previewPath, globalLocation.origin).toString();
      } catch {
        return undefined;
      }
    }
  }, [
    defaultHost,
    effectivePreviewBase,
    globalLocation,
    interfaceLookup,
    surfaceLookup,
  ]);

  const previewDescription = useMemo(() => {
    if (globalBase?.trim()) {
      return `Preview base is provided by global configuration (${globalBase.trim()}).`;
    }
    if (previewBaseOverride.trim()) {
      return 'Preview base overrides the default origin so you can point at a deployed runtime.';
    }
    return 'Preview defaults to the current origin. Override the host if your interface runs on a different domain.';
  }, [globalBase, previewBaseOverride]);

  return (
    <div class='flex h-full min-h-0 flex-col gap-3'>
      <div class='space-y-2'>
        <Input
          label='Preview Host'
          placeholder='https://workspace-preview.example.com'
          value={previewBaseOverride}
          onInput={(event: JSX.TargetedEvent<HTMLInputElement, Event>) =>
            onPreviewBaseChange((event.currentTarget as HTMLInputElement).value)}
        />
        <p class='text-xs text-neutral-400'>{previewDescription}</p>
      </div>

      <div class='flex items-center justify-between'>
        <div class='flex flex-col text-xs text-neutral-400'>
          <span>Surface: {surfaceLookup ?? '(workspace default)'}</span>
          <span>Interface: {interfaceLookup}</span>
          {previewUrl && (
            <span class='truncate text-neutral-500'>
              Preview URL: {previewUrl}
            </span>
          )}
        </div>
        <div class='flex items-center gap-2'>
          <Action
            styleType={ActionStyleTypes.Outline | ActionStyleTypes.Rounded}
            intentType={IntentTypes.Secondary}
            disabled={!previewUrl}
            onClick={() => onRefreshPreview()}
          >
            Refresh
          </Action>
          <Action
            styleType={ActionStyleTypes.Solid | ActionStyleTypes.Rounded}
            intentType={IntentTypes.Primary}
            disabled={!previewUrl}
            onClick={() => {
              if (previewUrl && globalOpen) {
                globalOpen(previewUrl, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            Open in new tab
          </Action>
        </div>
      </div>

      <div class='flex-1 min-h-0 rounded border border-neutral-800 bg-neutral-950 overflow-hidden'>
        {previewUrl
          ? (
            <iframe
              key={previewNonce}
              src={previewUrl}
              title='Interface Preview'
              loading='lazy'
              class='h-full w-full border-0'
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
              sandbox='allow-scripts allow-same-origin allow-popups allow-forms'
            />
          )
          : (
            <div class='flex h-full items-center justify-center p-6 text-center text-sm text-neutral-400'>
              Unable to determine a preview URL. Provide a preview host or verify your runtime
              configuration.
            </div>
          )}
      </div>
    </div>
  );
}

function buildInterfaceDetailsPatch(
  baseHandler: EaCInterfaceCodeBlock | undefined,
  basePage: EaCInterfaceCodeBlock | undefined,
  imports: string[],
  pageDataType: EaCInterfacePageDataType,
  handlerCode: string,
  handlerDescription: string,
  handlerMessages: string,
  handlerMessageGroups: EaCInterfaceCodeBlock['MessageGroups'] | undefined,
  pageCode: string,
  pageDescription: string,
  pageMessages: string,
  pageMessageGroups: EaCInterfaceCodeBlock['MessageGroups'] | undefined,
): Partial<EaCInterfaceDetails> {
  return {
    Imports: imports.length ? imports : undefined,
    PageDataType: clonePageDataType(pageDataType),
    PageHandler: buildCodeBlock(
      baseHandler,
      handlerCode,
      handlerDescription,
      parseMessages(handlerMessages),
      handlerMessageGroups,
    ),
    Page: buildCodeBlock(
      basePage,
      pageCode,
      pageDescription,
      parseMessages(pageMessages),
      pageMessageGroups,
    ),
  };
}
