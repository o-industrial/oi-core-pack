// deno-lint-ignore-file no-explicit-any
import { marked } from 'npm:marked@15.0.1';
import { useEffect, useMemo, useRef, useState } from 'npm:preact@10.20.1/hooks';
import type { FunctionalComponent } from 'npm:preact@10.20.1';
import { SurfaceWarmQueryModalQuery } from './SurfaceWarmQueryModalQuery.tsx';
import { SurfaceWarmQueryModalResults } from './SurfaceWarmQueryModalResults.tsx';
import {
  Action,
  AziPanel,
  type AziState,
  type AzureDataExplorerOutput,
  Modal,
  TabbedPanel,
  WorkspaceManager,
} from '../../../.deps.ts';

const shaHash = async (workspaceLookup: string, id: string): Promise<string> => {
  if (!workspaceLookup || !id) return id;
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return id;
  try {
    const encoded = new TextEncoder().encode(`${workspaceLookup}:${id}`);
    const digest = await subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return id;
  }
};

interface SurfaceWarmQueryModalProps {
  workspace: WorkspaceManager;
  queryName: string;
  queryText: string;
  onClose: () => void;
  onRun: (query: string) => Promise<AzureDataExplorerOutput>;
  aziExtraInputs?: Record<string, unknown>;
  warmQueryLookup: string;
}

export const SurfaceWarmQueryModal: FunctionalComponent<
  SurfaceWarmQueryModalProps
> = ({
  workspace: workspace,
  queryName,
  queryText: initialQuery,
  onClose,
  onRun,
  aziExtraInputs,
  warmQueryLookup,
}) => {
  const userEditedRef = useRef(false);
  const autoAppliedQueryRef = useRef<string | null>(null);
  const [query, setQuery] = useState(initialQuery);
  type QueryResultRow = Record<string, unknown>;
  const [queryResults, setQueryResults] = useState<QueryResultRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState('query');
  const [errors, setErrors] = useState('');
  const eac = workspace.UseEaC();
  const { profile } = workspace.UseAccountProfile();
  console.log("KBTEST: core " + JSON.stringify(profile));
  const userFirstName = useMemo(() => {
    const name = profile.Name?.trim();
    if (name) {
      const [first] = name.split(/\s+/);
      if (first) return first;
    }
    const username = profile.Username?.trim();
    return username ?? '';
  }, [profile.Name, profile.Username]);
  const [defaultDeviceIds, setDefaultDeviceIds] = useState<string[]>([]);

  const isRunDisabled = !query || isLoading;

  const seenFirstErrorRef = useRef(false);
  const isAziStreamingRef = useRef(false);
  const streamBaselineDataQueryRef = useRef<string | undefined>(undefined);

  // Debounced persistence of Query edits back to EaC so main Save commits them
  const persistTimerRef = useRef<number | null>(null);
  const persistQuery = (value: string) => {
    if (persistTimerRef.current) {
      globalThis.clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = globalThis.setTimeout(() => {
      try {
        workspace.EaC.UpdateNodePatch(warmQueryLookup, {
          Details: { Query: value } as any,
        });
      } catch (err) {
        console.warn(
          '[SurfaceWarmQueryModal] Failed to persist query change',
          err,
        );
      }
      persistTimerRef.current = null;
    }, 300);
  };

  // Persist any programmatic query changes (e.g., Azi suggestions)
  // so they are saved even when no user input event fires.
  useEffect(() => {
    if (typeof query === 'string') {
      persistQuery(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const applyAziDataQuery = (next?: string) => {
    if (!next) return;
    const baseline = streamBaselineDataQueryRef.current;
    if (baseline !== undefined && baseline === next) {
      return;
    }

    streamBaselineDataQueryRef.current = next;
    setQuery(next);
    userEditedRef.current = true;
    autoAppliedQueryRef.current = null;
    if (activeTabKey !== 'results') {
      setActiveTabKey('query');
    }
  };

  const onAziFinishSend = (state?: AziState) => {
    const wasStreaming = isAziStreamingRef.current;
    isAziStreamingRef.current = false;
    setIsLoading(false);
    if (
      wasStreaming &&
      state &&
      state.DataQuery &&
      state.DataQuery != state.CurrentQuery
    ) {
      const nextQuery = typeof state.DataQuery === 'string' ? state.DataQuery : undefined;
      applyAziDataQuery(nextQuery);
    }

    // Append final banner without overwriting any streamed error history
    setErrors((prev) => (prev ? prev + '\n\n' : '') + '> Azi Responded');
  };

  // Clear console and reset stream tracking when the modal mounts (every open)
  useEffect(() => {
    setErrors('');
    try {
      seenFirstErrorRef.current = false;
      lastAppendedErrorRef.current = undefined;
      lastAppendedErrorCodeRef.current = undefined;
      lastAppendedDataQueryRef.current = undefined;
      isAziStreamingRef.current = false;
      streamBaselineDataQueryRef.current = undefined;
      userEditedRef.current = false;
      autoAppliedQueryRef.current = null;
    } catch (err) {
      console.log(err);
    }
  }, []);

  // Append state.Error changes as they stream
  const lastAppendedErrorRef = useRef<string | undefined>(undefined);
  const lastAppendedErrorCodeRef = useRef<string | undefined>(undefined);
  const lastAppendedDataQueryRef = useRef<string | undefined>(undefined);

  const onAziStateChange = (state: AziState) => {
    try {
      const dq = (state as any)?.DataQuery as string | undefined;
      const cq = (state as any)?.CurrentQuery as string | undefined;
      if (isAziStreamingRef.current && dq && dq !== cq) {
        applyAziDataQuery(dq);
      }
    } catch {
      console.log('Error: state change');
    }
    if (!isLoading) return;

    const err = (state as any)?.Error;
    if (!err) return;

    const errCode = (state as any)?.ErrorCode ?? 'UNKNOWN';
    const dataQuery = (state as any)?.DataQuery ?? (state as any).CurrentQuery;

    const msg = typeof err === 'string' ? err : String(err);

    if (msg === lastAppendedErrorRef.current) {
      return; // append only on change
    }

    lastAppendedErrorRef.current = msg;
    lastAppendedDataQueryRef.current = dataQuery;

    setErrors((prev) => {
      const lead = prev ? prev + '\n\n' : '';
      if (isAziStreamingRef.current) {
        const nextQuery = typeof dataQuery === 'string' ? dataQuery : undefined;
        applyAziDataQuery(nextQuery);
      }
      if (!seenFirstErrorRef.current) {
        // First error of this run: plain
        seenFirstErrorRef.current = true;
        lastAppendedErrorCodeRef.current = errCode;
        return lead + `> ERROR : ${msg}`;
      } else {
        // Subsequent errors: add resolved banner first
        const final = lead +
          `> Azi Resolved Error: ${lastAppendedErrorCodeRef.current}\n\n> ERROR : ${msg}`;
        lastAppendedErrorCodeRef.current = errCode;
        return final;
      }
    });
  };

  const onAziStartSend = (initialState?: AziState) => {
    const initialDataQuery = (initialState as any)?.DataQuery as string | undefined;
    streamBaselineDataQueryRef.current = initialDataQuery ?? undefined;
    isAziStreamingRef.current = true;
    setIsLoading(true);
    setActiveTabKey('query');
    setErrors('> Azi Thinking...');
    lastAppendedErrorRef.current = undefined;
    lastAppendedDataQueryRef.current = undefined;
    lastAppendedErrorCodeRef.current = undefined;
    seenFirstErrorRef.current = false;
  };

  const handleRunClick = async () => {
    isAziStreamingRef.current = false;
    streamBaselineDataQueryRef.current = undefined;
    setActiveTabKey('query');
    setErrors('> Executing Query...');
    setIsLoading(true);
    const result = await onRun(query);
    interface QueryTable {
      name: string;
      data: Record<string, unknown>[];
    }

    if ((result as any).HasError) {
      const errTxt = (result as any).Messages.Error;
      setErrors(`> Executing Query...\n\n> ERROR: ${errTxt}`);
      setActiveTabKey('query');
    } else {
      setErrors('> Query Executed Successfully');
      const table = result?.tables?.find((t) => t.name === 'PrimaryResult');
      const data = table && 'data' in table ? (table as QueryTable).data : [];
      setQueryResults(data);
      setActiveTabKey('results');
    }
    setIsLoading(false);
  };

  // Always clear console errors when the modal opens
  useEffect(() => {
    setErrors('');
  }, []);

  const connectionLookups = useMemo(() => {
    if (!eac?.Surfaces) return [] as string[];
    for (const surface of Object.values(eac.Surfaces)) {
      const warmSettings = surface?.WarmQueries?.[warmQueryLookup];
      if (!warmSettings) continue;
      const dedup = new Set<string>();
      for (const raw of warmSettings.DataConnectionLookups ?? []) {
        if (!raw) continue;
        const trimmed = raw.trim();
        if (!trimmed) continue;
        const idx = trimmed.lastIndexOf('->');
        const parsed = idx >= 0 ? trimmed.slice(idx + 2).trim() : trimmed;
        if (parsed) dedup.add(parsed);
      }
      return Array.from(dedup);
    }
    return [] as string[];
  }, [eac, warmQueryLookup]);

  const hasDataConnections = connectionLookups.length > 0;

  useEffect(() => {
    let cancelled = false;

    if (!hasDataConnections || !eac?.EnterpriseLookup) {
      setDefaultDeviceIds([]);
      return;
    }

    (async () => {
      try {
        const hashed = await Promise.all(
          connectionLookups.map((lookup) => shaHash(eac.EnterpriseLookup as string, lookup)),
        );
        const distinct = Array.from(new Set(hashed.filter(Boolean)));
        if (!cancelled) {
          setDefaultDeviceIds(distinct);
        }
      } catch {
        if (!cancelled) {
          setDefaultDeviceIds([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [connectionLookups, hasDataConnections, eac?.EnterpriseLookup]);

  useEffect(() => {
    if (userEditedRef.current) return;

    const baseDefault = 'Devices\n| take 10';
    const deviceDefault = defaultDeviceIds.length
      ? `Devices\n| where DeviceID in (${
        defaultDeviceIds.map((id) => `"${id}"`).join(', ')
      })\n| take 10`
      : baseDefault;
    const nextDefault = hasDataConnections ? deviceDefault : baseDefault;
    const shouldApply = query.trim().length === 0 || autoAppliedQueryRef.current === query;

    if (!shouldApply) return;
    if (query === nextDefault) {
      autoAppliedQueryRef.current = nextDefault;
      return;
    }

    autoAppliedQueryRef.current = nextDefault;
    setQuery(nextDefault);
  }, [defaultDeviceIds, hasDataConnections, query]);

  const coerceQueryValue = (val: string | { currentTarget?: { value?: string } }): string =>
    typeof val === 'string' ? val : val?.currentTarget?.value ?? '';

  const tabData = [
    {
      key: 'query',
      label: 'Query',
      icon: (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 20 20'
          fill='currentColor'
          class='h-5 w-5'
        >
          <path d='M18.68 12.32a4.49 4.49 0 0 0-6.36.01a4.49 4.49 0 0 0 0 6.36a4.51 4.51 0 0 0 5.57.63L21 22.39L22.39 21l-3.09-3.11c1.13-1.77.87-4.09-.62-5.57m-1.41 4.95c-.98.98-2.56.97-3.54 0c-.97-.98-.97-2.56.01-3.54c.97-.97 2.55-.97 3.53 0c.97.98.97 2.56 0 3.54M10.9 20.1a6.5 6.5 0 0 1-1.48-2.32C6.27 17.25 4 15.76 4 14v3c0 2.21 3.58 4 8 4c-.4-.26-.77-.56-1.1-.9M4 9v3c0 1.68 2.07 3.12 5 3.7v-.2c0-.93.2-1.85.58-2.69C6.34 12.3 4 10.79 4 9m8-6C7.58 3 4 4.79 4 7c0 2 3 3.68 6.85 4h.05c1.2-1.26 2.86-2 4.6-2c.91 0 1.81.19 2.64.56A3.22 3.22 0 0 0 20 7c0-2.21-3.58-4-8-4' />
        </svg>
      ),
      content: (
        <SurfaceWarmQueryModalQuery
          query={query}
          onQueryChange={(val) => {
            userEditedRef.current = true;
            autoAppliedQueryRef.current = null;
            const next = coerceQueryValue(val as any);
            setQuery(next);
            persistQuery(next);
          }}
          errors={errors}
          isLoading={isLoading}
        />
      ),
    },
    {
      key: 'results',
      label: 'Results',
      icon: (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 20 20'
          fill='currentColor'
          class='h-5 w-5'
        >
          <path d='M11 16H3v3q0 .825.588 1.413T5 21h6zm2 0v5h6q.825 0 1.413-.587T21 19v-3zm-2-2V9H3v5zm2 0h8V9h-8zM3 7h18V5q0-.825-.587-1.412T19 3H5q-.825 0-1.412.588T3 5z' />
        </svg>
      ),
      content: (
        <div class='h-full min-h-0 flex flex-col'>
          <SurfaceWarmQueryModalResults
            isLoading={isLoading}
            queryName={queryName}
            queryResults={queryResults}
          />
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={`Query: ${queryName}`}
      onClose={onClose}
      class='w-full max-w-[1200px] border border-neutral-700 bg-neutral-900'
      style={{ height: '90vh' }}
    >
      <div
        id='modalstart'
        class='flex flex-row gap-4 h-full min-h-0 bg-neutral-900'
        style={{ height: '75vh' }}
      >
        {/* Left Side: Tabs and Buttons */}
        <div class='w-2/3 flex flex-col overflow-hidden pr-2 min-h-0'>
          {/* Tabs Section */}
          <div
            id='tabs1'
            class='flex-1 min-h-0 overflow-hidden bg-neutral-900 p-4 flex flex-col'
            style={{ height: '82vh' }}
          >
            <div id='tabs2' class='mt-2 flex-1 min-h-0 flex flex-col'>
              <TabbedPanel
                id='tabpanel'
                class='flex-1 min-h-0 flex flex-col h-full overflow-hidden'
                /* if your TabbedPanel supports a body/content class, add it too: */
                /* contentClassName="flex-1 min-h-0 overflow-hidden" */
                tabs={tabData}
                activeTab={activeTabKey}
                onTabChange={setActiveTabKey}
                scrollableContent
                stickyTabs
              />
            </div>
          </div>

          {/* Buttons at the bottom */}
          <div class='mt-3 flex justify-end'>
            <div class='flex space-x-4'>
              <div id='runWrap' tabIndex={0} aria-disabled='true'>
                <Action
                  type='button'
                  id='run'
                  onClick={handleRunClick}
                  disabled={isRunDisabled}
                  class={`font-bold py-2 px-4 rounded ${
                    isRunDisabled
                      ? 'bg-gray-500 cursor-not-allowed opacity-50'
                      : 'bg-teal-600 hover:bg-teal-700'
                  } text-white`}
                >
                  Run Query
                </Action>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: AziPanel */}
        <div class='w-1/3 min-h-0 border-l border-gray-700 pl-4'>
          <AziPanel
            workspaceMgr={workspace}
            title='WARM QUERYS WITH AZI'
            onStartSend={onAziStartSend}
            onFinishSend={onAziFinishSend}
            onStateChange={onAziStateChange}
            renderMessage={(msg) => marked.parse(msg) as string}
            aziMgr={workspace.WarmQueryAzis[warmQueryLookup]}
            extraInputs={{
              ...aziExtraInputs,
              CurrentQuery: query,
              UserName: profile.Name,
              UserUsername: profile.Username,
              UserFirstName: userFirstName,
              UserProfile: {
                Username: profile.Username,
                Name: profile.Name,
                FirstName: userFirstName,
              },
            }}
          />
        </div>
      </div>
    </Modal>
  );
};
