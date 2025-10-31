import { marked } from 'npm:marked@15.0.1';

import {
  interfacePageDataToSchema,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from '../../../../.deps.ts';
import type {
  EaCInterfaceDataConnectionFeatures,
  EaCInterfaceDetails,
  EaCInterfaceGeneratedDataSlice,
  EaCInterfacePageDataAccessMode,
  EaCInterfacePageDataActionInvocationMode,
  EaCInterfacePageDataType,
  EverythingAsCodeOIWorkspace,
} from '../../../../.deps.ts';
import { ensureInterfaceDetails, ensurePageDataType } from '../interfaceDefaults.ts';
import { reconcileInterfacePageData } from '../pageDataHelpers.ts';
import {
  buildGeneratedDescription,
  buildGeneratedMessages,
  composeHandlerCode,
  DEFAULT_HANDLER_BODY,
  extractHandlerBody,
  generateHandlerStub,
  HANDLER_PREFIX,
  HANDLER_SUFFIX,
  type SurfaceInterfaceHandlerPlanStep,
} from '../SurfaceInterfaceHandlerCode.ts';
import {
  buildPageScaffold,
  composePageCode,
  extractPageBody,
  PAGE_CODE_PREFIX,
  PAGE_CODE_SUFFIX,
} from '../SurfaceInterfacePageCode.ts';
import { resolveActionSurfaceSupport } from '../SurfaceInterfaceDataTab.tsx';
import { toPascalCase } from '../SurfaceInterfaceTemplates.ts';
import {
  buildInterfaceDetailsPatch,
  deriveInterfaceLookupsFromGraph,
  formatMessages,
  mergeInterfaceSettingsWithLookups,
  parseMessages,
} from '../utils/.exports.ts';
import type { SurfaceInterfaceTabKey } from '../SurfaceInterfaceModal.tsx';
import type { SurfaceInterfaceModalHookParams } from './SurfaceInterfaceModalHookParams.ts';
import type { SurfaceInterfaceModalHookResult } from './SurfaceInterfaceModalHookResult.ts';
import type { SurfaceInterfaceModalHandlerState } from './SurfaceInterfaceModalHandlerState.ts';
import type { SurfaceInterfaceModalPageState } from './SurfaceInterfaceModalPageState.ts';
import type { SurfaceInterfaceModalPreviewState } from './SurfaceInterfaceModalPreviewState.ts';

export function useSurfaceInterfaceModalState(
  params: SurfaceInterfaceModalHookParams,
): SurfaceInterfaceModalHookResult {
  const {
    isOpen,
    interfaceLookup,
    surfaceLookup,
    details,
    settings,
    workspaceMgr,
    onDetailsChange,
  } = params;

  const resolvedDetails = useMemo(
    () => ensureInterfaceDetails(details, interfaceLookup),
    [details, interfaceLookup],
  );

  const safeInterfaceId = useMemo(
    () => toPascalCase(interfaceLookup || 'Interface'),
    [interfaceLookup],
  );

  const resolvedDisplayName = useMemo(() => {
    const name = resolvedDetails.Name?.trim();
    if (name && name.length > 0) return name;
    return `${safeInterfaceId} interface`;
  }, [resolvedDetails.Name, safeInterfaceId]);

  const defaultPageScaffold = useMemo(
    () =>
      buildPageScaffold({
        lookup: interfaceLookup,
        safeId: safeInterfaceId,
        displayName: resolvedDisplayName,
      }),
    [interfaceLookup, safeInterfaceId, resolvedDisplayName],
  );
  const defaultPageBody = defaultPageScaffold.body;
  const defaultPageDescription = defaultPageScaffold.description;
  const defaultPageMessages = defaultPageScaffold.messages;

  const derivedLookups = useMemo(
    () =>
      deriveInterfaceLookupsFromGraph(
        workspaceMgr.Graph.GetGraph(),
        interfaceLookup,
      ),
    [workspaceMgr, interfaceLookup],
  );

  const effectiveSettings = useMemo(
    () => mergeInterfaceSettingsWithLookups(settings, derivedLookups),
    [settings, derivedLookups],
  );

  const { profile } = workspaceMgr.UseAccountProfile();
  const userFirstName = useMemo(() => {
    const name = profile.Name?.trim();
    if (name) {
      const [first] = name.split(/\s+/);
      if (first) return first;
    }
    const username = profile.Username?.trim();
    if (username) {
      const [localPart] = username.split('@');
      return localPart || username;
    }
    return '';
  }, [profile.Name, profile.Username]);

  const [activeTab, setActiveTab] = useState<SurfaceInterfaceTabKey>('imports');

  const [imports, setImports] = useState(resolvedDetails.Imports ?? []);
  const [importsInvalid, setImportsInvalid] = useState(false);
  const [pageDataType, setPageDataType] = useState<EaCInterfacePageDataType>(
    () => {
      const workspace = workspaceMgr.EaC.GetEaC?.() as
        | EverythingAsCodeOIWorkspace
        | undefined;
      return reconcileInterfacePageData(
        ensurePageDataType(resolvedDetails.PageDataType),
        effectiveSettings,
        workspace,
        surfaceLookup,
        interfaceLookup,
      );
    },
  );

  const initialHandlerCode = resolvedDetails.PageHandler?.Code ?? '';
  const initialHandlerBody = initialHandlerCode.trim().length > 0
    ? extractHandlerBody(initialHandlerCode) || initialHandlerCode
    : '';
  const [handlerBody, setHandlerBody] = useState(initialHandlerBody);
  const [handlerEnabled, setHandlerEnabled] = useState<boolean>(
    initialHandlerBody.trim().length > 0,
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
  const handlerFullCode = useMemo(
    () => handlerEnabled && handlerBody.trim().length > 0 ? composeHandlerCode(handlerBody) : '',
    [handlerBody, handlerEnabled],
  );
  const [handlerPlan, setHandlerPlan] = useState<
    SurfaceInterfaceHandlerPlanStep[]
  >([]);
  const lastGeneratedHandlerRef = useRef({
    body: initialHandlerBody.trim(),
    description: (resolvedDetails.PageHandler?.Description ?? '').trim(),
    messages: formatMessages(resolvedDetails.PageHandler?.Messages).trim(),
  });
  const lastSyncedHandlerRef = useRef({
    body: initialHandlerBody.trim(),
    description: (resolvedDetails.PageHandler?.Description ?? '').trim(),
    messages: formatMessages(resolvedDetails.PageHandler?.Messages).trim(),
  });
  const handlerDirtyRef = useRef(false);

  const defaultPageMessagesText = useMemo(
    () => formatMessages(defaultPageMessages),
    [defaultPageMessages],
  );
  const lastGeneratedPageRef = useRef({
    body: defaultPageBody.trim(),
    description: defaultPageDescription.trim(),
    messages: defaultPageMessagesText.trim(),
  });
  const lastSyncedPageRef = useRef({
    body: defaultPageBody.trim(),
    description: defaultPageDescription.trim(),
    messages: defaultPageMessagesText.trim(),
  });
  const pageDirtyRef = useRef(false);

  const pagePrefix = PAGE_CODE_PREFIX;
  const pageSuffix = PAGE_CODE_SUFFIX;
  const [pageBody, setPageBody] = useState(() => {
    const incoming = resolvedDetails.Page?.Code ?? '';
    if (incoming.trim().length > 0) {
      const extracted = extractPageBody(incoming, pagePrefix, pageSuffix);
      return extracted.trim().length > 0 ? extracted : defaultPageBody;
    }
    return defaultPageBody;
  });
  const pageFullCode = useMemo(() => composePageCode(pageBody), [pageBody]);
  const [pageDescription, setPageDescription] = useState(
    (resolvedDetails.Page?.Description ?? '').trim().length > 0
      ? resolvedDetails.Page?.Description ?? ''
      : defaultPageDescription,
  );
  const [pageMessagesText, setPageMessagesText] = useState(() => {
    const incoming = resolvedDetails.Page?.Messages;
    const formatted = formatMessages(incoming);
    if (formatted.trim().length > 0) return formatted;
    return defaultPageMessagesText;
  });
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
  const persistTimerRef = useRef<number | null>(null);
  const lastPersistedRef = useRef<string | null>(null);
  const initializedLookupRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    if (initializedLookupRef.current === interfaceLookup) return;

    setImports(resolvedDetails.Imports ?? []);

    const workspace = workspaceMgr.EaC.GetEaC?.() as
      | EverythingAsCodeOIWorkspace
      | undefined;
    const reconciled = reconcileInterfacePageData(
      ensurePageDataType(resolvedDetails.PageDataType),
      effectiveSettings,
      workspace,
      surfaceLookup,
      interfaceLookup,
    );
    setPageDataType(reconciled);

    const incomingHandlerCode = resolvedDetails.PageHandler?.Code ?? '';
    const nextHandlerBody = incomingHandlerCode.trim().length > 0
      ? extractHandlerBody(incomingHandlerCode) || incomingHandlerCode
      : '';
    setHandlerBody(nextHandlerBody);
    setHandlerEnabled(nextHandlerBody.trim().length > 0);
    lastGeneratedHandlerRef.current.body = nextHandlerBody.trim();
    lastSyncedHandlerRef.current.body = nextHandlerBody.trim();

    const incomingHandlerDescription = resolvedDetails.PageHandler?.Description ?? '';
    setHandlerDescription(incomingHandlerDescription);
    lastGeneratedHandlerRef.current.description = incomingHandlerDescription.trim();
    lastSyncedHandlerRef.current.description = incomingHandlerDescription.trim();

    const incomingHandlerMessages = formatMessages(
      resolvedDetails.PageHandler?.Messages,
    );
    setHandlerMessagesText(incomingHandlerMessages);
    lastGeneratedHandlerRef.current.messages = incomingHandlerMessages.trim();
    lastSyncedHandlerRef.current.messages = incomingHandlerMessages.trim();

    const incomingPageCode = resolvedDetails.Page?.Code ?? '';
    const nextPageBody = incomingPageCode.trim().length > 0
      ? extractPageBody(incomingPageCode, pagePrefix, pageSuffix).trim()
          .length > 0
        ? extractPageBody(incomingPageCode, pagePrefix, pageSuffix)
        : defaultPageBody
      : defaultPageBody;
    setPageBody(nextPageBody);

    const incomingPageDescription = resolvedDetails.Page?.Description ?? '';
    const nextPageDescription = incomingPageDescription.trim().length > 0
      ? incomingPageDescription
      : defaultPageDescription;
    setPageDescription(nextPageDescription);

    const incomingPageMessages = formatMessages(resolvedDetails.Page?.Messages);
    const nextPageMessages = incomingPageMessages.trim().length > 0
      ? incomingPageMessages
      : defaultPageMessagesText;
    setPageMessagesText(nextPageMessages);
    setImportsInvalid(false);

    handlerDirtyRef.current = false;
    pageDirtyRef.current = false;
    lastGeneratedPageRef.current = {
      body: defaultPageBody.trim(),
      description: defaultPageDescription.trim(),
      messages: defaultPageMessagesText.trim(),
    };
    lastSyncedPageRef.current = {
      body: nextPageBody.trim(),
      description: nextPageDescription.trim(),
      messages: nextPageMessages.trim(),
    };
    initializedLookupRef.current = interfaceLookup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    interfaceLookup,
    pagePrefix,
    pageSuffix,
    defaultPageBody,
    defaultPageDescription,
    defaultPageMessagesText,
  ]);

  useEffect(() => {
    if (isOpen) return;
    initializedLookupRef.current = null;
    handlerDirtyRef.current = false;
    pageDirtyRef.current = false;
    lastSyncedPageRef.current = {
      body: defaultPageBody.trim(),
      description: defaultPageDescription.trim(),
      messages: defaultPageMessagesText.trim(),
    };
    lastGeneratedPageRef.current = {
      body: defaultPageBody.trim(),
      description: defaultPageDescription.trim(),
      messages: defaultPageMessagesText.trim(),
    };
    if (persistTimerRef.current) {
      globalThis.clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
  }, [
    isOpen,
    defaultPageBody,
    defaultPageDescription,
    defaultPageMessagesText,
  ]);

  const handleImportsChange = useCallback((next: string[]) => {
    setImports(next);
  }, []);

  const handleHandlerBodyChange = useCallback((next: string) => {
    handlerDirtyRef.current = true;
    setHandlerBody(next);
  }, []);

  const handleHandlerDescriptionChange = useCallback((next: string) => {
    handlerDirtyRef.current = true;
    setHandlerDescription(next);
  }, []);

  const handleHandlerMessagesChange = useCallback((next: string) => {
    handlerDirtyRef.current = true;
    setHandlerMessagesText(next);
  }, []);

  const handleHandlerEnabledChange = useCallback(
    (next: boolean) => {
      handlerDirtyRef.current = true;
      setHandlerEnabled(next);
      if (!next) {
        setHandlerBody('');
      } else if (handlerBody.trim().length === 0) {
        const defaultBody = DEFAULT_HANDLER_BODY;
        setHandlerBody(defaultBody);
      }
    },
    [handlerBody],
  );

  const handlePageBodyChange = useCallback((next: string) => {
    pageDirtyRef.current = true;
    setPageBody(next);
  }, []);

  const handlePageDescriptionChange = useCallback((next: string) => {
    pageDirtyRef.current = true;
    setPageDescription(next);
  }, []);

  const handlePageMessagesChange = useCallback((next: string) => {
    pageDirtyRef.current = true;
    setPageMessagesText(next);
  }, []);
  const persistDetails = useCallback(
    (patch: Partial<EaCInterfaceDetails>) => {
      onDetailsChange?.(patch);
    },
    [onDetailsChange],
  );

  useEffect(() => {
    if (!isOpen || importsInvalid) {
      if (persistTimerRef.current) {
        globalThis.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
      return;
    }

    if (persistTimerRef.current) {
      globalThis.clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = globalThis.setTimeout(() => {
      persistTimerRef.current = null;
      const patch = buildInterfaceDetailsPatch(
        resolvedDetails.PageHandler,
        resolvedDetails.Page,
        imports,
        pageDataType,
        handlerBody,
        handlerDescription,
        handlerMessagesText,
        handlerMessageGroups,
        pageBody,
        pageDescription,
        pageMessagesText,
        pageMessageGroups,
      );
      const serialized = JSON.stringify(patch);
      if (serialized === lastPersistedRef.current) return;
      lastPersistedRef.current = serialized;
      persistDetails(patch);
    }, 300);

    return () => {
      if (persistTimerRef.current) {
        globalThis.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };
  }, [
    isOpen,
    importsInvalid,
    persistDetails,
    resolvedDetails.PageHandler,
    resolvedDetails.Page,
    imports,
    pageDataType,
    handlerBody,
    handlerDescription,
    handlerMessagesText,
    handlerMessageGroups,
    pageBody,
    pageDescription,
    pageMessagesText,
    pageMessageGroups,
  ]);

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

  const updateGeneratedSlice = useCallback(
    (
      key: string,
      updater: (
        slice: EaCInterfaceGeneratedDataSlice,
      ) => EaCInterfaceGeneratedDataSlice | null,
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

  const handleAccessModeChange = useCallback(
    (key: string, mode: EaCInterfacePageDataAccessMode) => {
      updateGeneratedSlice(key, (slice) => {
        const nextSlice: EaCInterfaceGeneratedDataSlice = {
          ...slice,
          AccessMode: mode,
        };

        if (slice.Actions && slice.Actions.length > 0) {
          nextSlice.Actions = slice.Actions.map((action) => {
            const support = resolveActionSurfaceSupport(action);
            const allowHandler = mode !== 'client';
            const allowClient = mode !== 'server';
            const handlerPossible = support.handler && allowHandler;
            const clientPossible = support.client && allowClient;
            const currentMode = action.Invocation?.Mode ?? null;

            if (!currentMode) {
              if (handlerPossible && clientPossible) return action;
              if (handlerPossible) {
                return {
                  ...action,
                  Invocation: { ...(action.Invocation ?? {}), Mode: 'server' },
                };
              }
              if (clientPossible) {
                return {
                  ...action,
                  Invocation: { ...(action.Invocation ?? {}), Mode: 'client' },
                };
              }
              return {
                ...action,
                Invocation: action.Invocation
                  ? { ...action.Invocation, Mode: undefined }
                  : undefined,
              };
            }

            if (currentMode === 'both') {
              if (handlerPossible && clientPossible) return action;
              if (handlerPossible) {
                return {
                  ...action,
                  Invocation: { ...(action.Invocation ?? {}), Mode: 'server' },
                };
              }
              if (clientPossible) {
                return {
                  ...action,
                  Invocation: { ...(action.Invocation ?? {}), Mode: 'client' },
                };
              }
              return {
                ...action,
                Invocation: action.Invocation
                  ? { ...action.Invocation, Mode: undefined }
                  : undefined,
              };
            }

            if (currentMode === 'server' && !handlerPossible) {
              if (clientPossible) {
                return {
                  ...action,
                  Invocation: { ...(action.Invocation ?? {}), Mode: 'client' },
                };
              }
              return {
                ...action,
                Invocation: action.Invocation
                  ? { ...action.Invocation, Mode: undefined }
                  : undefined,
              };
            }

            if (currentMode === 'client' && !clientPossible) {
              if (handlerPossible) {
                return {
                  ...action,
                  Invocation: { ...(action.Invocation ?? {}), Mode: 'server' },
                };
              }
              return {
                ...action,
                Invocation: action.Invocation
                  ? { ...action.Invocation, Mode: undefined }
                  : undefined,
              };
            }

            return action;
          });
        }

        return nextSlice;
      });
    },
    [updateGeneratedSlice],
  );
  const handleDataConnectionFeaturesChange = useCallback(
    (key: string, features: EaCInterfaceDataConnectionFeatures | undefined) => {
      updateGeneratedSlice(key, (slice) => ({
        ...slice,
        DataConnection: features ? JSON.parse(JSON.stringify(features)) : undefined,
      }));
    },
    [updateGeneratedSlice],
  );

  const handleActionModeChange = useCallback(
    (
      sliceKey: string,
      actionKey: string,
      mode: EaCInterfacePageDataActionInvocationMode | null,
    ) => {
      updateGeneratedSlice(sliceKey, (slice) => {
        if (!slice.Actions || slice.Actions.length === 0) return slice;

        const nextActions = slice.Actions.map((action) => {
          if (action.Key !== actionKey) return action;

          const support = resolveActionSurfaceSupport(action);
          const accessMode = slice.AccessMode ?? 'both';
          const allowHandler = accessMode !== 'client';
          const allowClient = accessMode !== 'server';
          const handlerPossible = support.handler && allowHandler;
          const clientPossible = support.client && allowClient;

          let nextMode: EaCInterfacePageDataActionInvocationMode | null = mode;

          if (nextMode) {
            if (nextMode === 'both') {
              if (!(handlerPossible && clientPossible)) {
                nextMode = handlerPossible
                  ? clientPossible ? 'both' : 'server'
                  : clientPossible
                  ? 'client'
                  : null;
              }
            } else if (nextMode === 'server' && !handlerPossible) {
              nextMode = clientPossible ? 'client' : null;
            } else if (nextMode === 'client' && !clientPossible) {
              nextMode = handlerPossible ? 'server' : null;
            }
          }

          const nextInvocation = { ...(action.Invocation ?? {}) };

          if (nextMode) {
            nextInvocation.Mode = nextMode;
          } else {
            delete nextInvocation.Mode;
          }

          const normalizedInvocation = Object.keys(nextInvocation).length > 0
            ? nextInvocation
            : undefined;

          return {
            ...action,
            Invocation: normalizedInvocation,
          };
        });

        return {
          ...slice,
          Actions: nextActions,
        };
      });
    },
    [updateGeneratedSlice],
  );

  useEffect(() => {
    if (activeTab !== 'code') return;

    const stub = generateHandlerStub(handlerPlan);
    const description = buildGeneratedDescription(handlerPlan);
    const messages = buildGeneratedMessages(handlerPlan);

    const stubBody = extractHandlerBody(stub) ?? stub;
    const trimmedStubBody = stubBody.trim();
    const trimmedDescription = description.trim();
    const trimmedMessages = messages.trim();

    const previousGeneratedHandler = { ...lastGeneratedHandlerRef.current };

    if (!handlerEnabled || handlerDirtyRef.current) {
      lastGeneratedHandlerRef.current.body = trimmedStubBody;
      lastGeneratedHandlerRef.current.description = trimmedDescription;
      lastGeneratedHandlerRef.current.messages = trimmedMessages;
    } else {
      const currentBody = handlerBody.trim();
      if (
        trimmedStubBody.length > 0 &&
        (currentBody.length === 0 ||
          currentBody === previousGeneratedHandler.body)
      ) {
        if (handlerBody !== stubBody) {
          setHandlerBody(stubBody);
        }
        handlerDirtyRef.current = false;
        lastGeneratedHandlerRef.current.body = trimmedStubBody;
      } else {
        lastGeneratedHandlerRef.current.body = currentBody;
      }

      const currentDescription = handlerDescription.trim();
      if (
        trimmedDescription.length > 0 &&
        (currentDescription.length === 0 ||
          currentDescription === previousGeneratedHandler.description)
      ) {
        if (handlerDescription !== description) {
          setHandlerDescription(description);
        }
        handlerDirtyRef.current = false;
        lastGeneratedHandlerRef.current.description = trimmedDescription;
      } else {
        lastGeneratedHandlerRef.current.description = currentDescription;
      }

      const currentMessages = handlerMessagesText.trim();
      if (
        trimmedMessages.length > 0 &&
        (currentMessages.length === 0 ||
          currentMessages === previousGeneratedHandler.messages)
      ) {
        if (handlerMessagesText !== messages) {
          setHandlerMessagesText(messages);
        }
        handlerDirtyRef.current = false;
        lastGeneratedHandlerRef.current.messages = trimmedMessages;
      } else {
        lastGeneratedHandlerRef.current.messages = currentMessages;
      }
    }

    const trimmedPageBody = defaultPageBody.trim();
    const trimmedPageDescription = defaultPageDescription.trim();
    const trimmedPageMessages = defaultPageMessagesText.trim();
    const previousGeneratedPage = { ...lastGeneratedPageRef.current };

    if (pageDirtyRef.current) {
      lastGeneratedPageRef.current.body = trimmedPageBody;
      lastGeneratedPageRef.current.description = trimmedPageDescription;
      lastGeneratedPageRef.current.messages = trimmedPageMessages;
      return;
    }

    const currentPageBody = pageBody.trim();
    if (
      trimmedPageBody.length > 0 &&
      (currentPageBody.length === 0 ||
        currentPageBody === previousGeneratedPage.body)
    ) {
      if (pageBody !== defaultPageBody) {
        setPageBody(defaultPageBody);
      }
      pageDirtyRef.current = false;
      lastGeneratedPageRef.current.body = trimmedPageBody;
    } else {
      lastGeneratedPageRef.current.body = currentPageBody;
    }

    const currentPageDescription = pageDescription.trim();
    if (
      trimmedPageDescription.length > 0 &&
      (currentPageDescription.length === 0 ||
        currentPageDescription === previousGeneratedPage.description)
    ) {
      if (pageDescription !== defaultPageDescription) {
        setPageDescription(defaultPageDescription);
      }
      pageDirtyRef.current = false;
      lastGeneratedPageRef.current.description = trimmedPageDescription;
    } else {
      lastGeneratedPageRef.current.description = currentPageDescription;
    }

    const currentPageMessages = pageMessagesText.trim();
    if (
      trimmedPageMessages.length > 0 &&
      (currentPageMessages.length === 0 ||
        currentPageMessages === previousGeneratedPage.messages)
    ) {
      if (pageMessagesText !== defaultPageMessagesText) {
        setPageMessagesText(defaultPageMessagesText);
      }
      pageDirtyRef.current = false;
      lastGeneratedPageRef.current.messages = trimmedPageMessages;
    } else {
      lastGeneratedPageRef.current.messages = currentPageMessages;
    }
  }, [
    activeTab,
    handlerPlan,
    handlerBody,
    handlerDescription,
    handlerMessagesText,
    handlerEnabled,
    setHandlerBody,
    setHandlerDescription,
    setHandlerMessagesText,
    pageBody,
    pageDescription,
    pageMessagesText,
    defaultPageBody,
    defaultPageDescription,
    defaultPageMessagesText,
    setPageBody,
    setPageDescription,
    setPageMessagesText,
  ]);
  const rawExtraInputs = useMemo(
    () => ({
      interfaceLookup,
      surfaceLookup,
      enterpriseLookup,
      UserName: profile.Name || profile.Username || '',
      UserUsername: profile.Username,
      UserFirstName: userFirstName,
      UserProfile: {
        Username: profile.Username || '',
        Name: profile.Name || profile.Username || '',
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
        body: handlerBody,
        prefix: HANDLER_PREFIX.replace(/\s+$/, ''),
        suffix: HANDLER_SUFFIX.trimStart() || '}',
        description: handlerDescription,
        messages: parseMessages(handlerMessagesText),
        enabled: handlerEnabled,
      },
      page: {
        body: pageBody,
        prefix: pagePrefix.replace(/\s+$/, ''),
        suffix: pageSuffix.trimStart() || '}',
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
      handlerBody,
      handlerDescription,
      handlerMessagesText,
      handlerEnabled,
      pageBody,
      pageDescription,
      pageMessagesText,
      pagePrefix,
      pageSuffix,
    ],
  );

  const [debouncedExtraInputs, setDebouncedExtraInputs] = useState(rawExtraInputs);

  useEffect(() => {
    const handle = globalThis.setTimeout(() => {
      setDebouncedExtraInputs((current) =>
        Object.is(current, rawExtraInputs) ? current : rawExtraInputs
      );
    }, 400);

    return () => {
      globalThis.clearTimeout(handle);
    };
  }, [rawExtraInputs]);

  const renderAziMessage = useMemo<(message: string) => string>(() => {
    const cache = new Map<string, string>();

    return (message: string) => {
      const key = message ?? '';
      const cached = cache.get(key);
      if (cached !== undefined) return cached;
      const parsed = marked.parse(key) as string;
      cache.set(key, parsed);
      return parsed;
    };
  }, []);

  const handlerState: SurfaceInterfaceModalHandlerState = {
    body: handlerBody,
    enabled: handlerEnabled,
    description: handlerDescription,
    messagesText: handlerMessagesText,
    fullCode: handlerFullCode,
    plan: handlerPlan,
    setPlan: setHandlerPlan,
    onBodyChange: handleHandlerBodyChange,
    onEnabledChange: handleHandlerEnabledChange,
    onDescriptionChange: handleHandlerDescriptionChange,
    onMessagesChange: handleHandlerMessagesChange,
  };

  const pageState: SurfaceInterfaceModalPageState = {
    prefix: pagePrefix,
    suffix: pageSuffix,
    body: pageBody,
    fullCode: pageFullCode,
    description: pageDescription,
    messagesText: pageMessagesText,
    onBodyChange: handlePageBodyChange,
    onDescriptionChange: handlePageDescriptionChange,
    onMessagesChange: handlePageMessagesChange,
  };

  const previewState: SurfaceInterfaceModalPreviewState = {
    baseOverride: previewBaseOverride,
    setBaseOverride: setPreviewBaseOverride,
    nonce: previewNonce,
    refresh: () => setPreviewNonce((value: number) => value + 1),
  };

  return {
    resolvedDetails,
    resolvedDisplayName,
    safeInterfaceId,
    activeTab,
    setActiveTab,
    imports,
    importsInvalid,
    onImportsChange: handleImportsChange,
    setImportsInvalid,
    pageDataType,
    generatedSliceEntries,
    handler: handlerState,
    page: pageState,
    preview: previewState,
    handleAccessModeChange,
    handleDataConnectionFeaturesChange,
    handleActionModeChange,
    interfaceAzi,
    enterpriseLookup,
    renderAziMessage,
    debouncedExtraInputs,
  };
}
