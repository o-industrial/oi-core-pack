import {
  IS_BROWSER,
  JSX,
  Modal,
  Select,
  TabbedPanel,
  useEffect,
  useMemo,
  useState,
  WorkspaceManager,
} from '../../../.deps.ts';

export type WarmQueryAPIsModalProps = {
  workspaceMgr: WorkspaceManager;
  onClose: () => void;
};

type WarmQueryOption = {
  lookup: string;
  name: string;
  description?: string;
  apiPath?: string;
};

const HOST_PLACEHOLDER = 'https://your-api-host';

const renderCodeBlock = (code: string): JSX.Element => (
  <pre class='mt-2 overflow-x-auto rounded-2xl border border-neutral-800/70 bg-neutral-950/80 p-4 font-mono text-xs leading-relaxed text-slate-100 shadow-inner'>
    <code>{code}</code>
  </pre>
);

const InfoIcon = ({ path }: { path: string }): JSX.Element => (
  <svg viewBox='0 0 24 24' fill='none' class='h-5 w-5 text-sky-300'>
    <path
      d={path}
      stroke='currentColor'
      stroke-width='1.6'
      stroke-linecap='round'
      stroke-linejoin='round'
    />
  </svg>
);

export function WarmQueryAPIsModal({
  workspaceMgr,
  onClose,
}: WarmQueryAPIsModalProps): JSX.Element {
  const eac = workspaceMgr.UseEaC();

  const warmQueries = useMemo<WarmQueryOption[]>(() => {
    const entries = Object.entries(eac?.WarmQueries ?? {});

    return entries
      .map(([lookup, entry]) => {
        const details =
          (entry as { Details?: { Name?: string; Description?: string; ApiPath?: string } })
            .Details ?? {};

        return {
          lookup,
          name: details.Name?.trim() || lookup,
          description: details.Description,
          apiPath: details.ApiPath,
        } as WarmQueryOption;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [eac]);

  const [selectedLookup, setSelectedLookup] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('curl');

  useEffect(() => {
    if (warmQueries.length === 0) {
      setSelectedLookup('');
      return;
    }

    setSelectedLookup((current) =>
      warmQueries.some((wq) => wq.lookup === current) ? current : warmQueries[0].lookup
    );
  }, [warmQueries]);

  useEffect(() => {
    setActiveTab('curl');
  }, [selectedLookup]);

  const selected = useMemo(
    () => warmQueries.find((wq) => wq.lookup === selectedLookup),
    [warmQueries, selectedLookup],
  );

  const endpointPath = useMemo(() => {
    if (!selected) return '';
    const raw = `/api/workspaces/explorer/warm-queries/${
      (selected.apiPath || selected.lookup).trim()
    }`;
    return raw.startsWith('/') ? raw : `/${raw}`;
  }, [selected]);
  const origin = IS_BROWSER ? location.origin : HOST_PLACEHOLDER;
  const endpointUrl = selected ? `${origin}${endpointPath}` : '';

  const curlSnippet = useMemo(() => {
    if (!selected) return '';

    const host = endpointUrl || `${HOST_PLACEHOLDER}${endpointPath}`;

    return [
      `curl -X GET '${host}' \\`,
      `  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\`,
      `  -H 'Accept: application/json'`,
    ].join('\n');
  }, [selected, endpointUrl, endpointPath]);

  const tsSnippet = useMemo(() => {
    if (!selected) return '';

    const host = endpointUrl || `${HOST_PLACEHOLDER}${endpointPath}`;

    return [
      `const jwt = 'YOUR_JWT_TOKEN';`,
      `const warmQueryLookup = '${selected.lookup}';`,
      `const endpoint = '${host}';`,
      '',
      `const response = await fetch(endpoint, {`,
      `  method: 'GET',`,
      `  headers: {`,
      `    'Authorization': \`Bearer \${jwt}\`,`,
      `    'Accept': 'application/json',`,
      `  },`,
      `});`,
      '',
      `if (!response.ok) {`,
      `  throw new Error(\`Warm query ${selected.lookup} failed: \${response.status} \${response.statusText}\`);`,
      `}`,
      '',
      `const payload = await response.json();`,
      `console.log(payload);`,
    ].join('\n');
  }, [selected, endpointUrl, endpointPath]);

  const tabs = useMemo(() => {
    if (!selected) return [];

    return [
      {
        key: 'curl',
        label: 'cURL',
        content: (
          <div class='space-y-2 text-slate-300'>
            <p>Copy this into your terminal to fetch warm query data using a workspace JWT.</p>
            {renderCodeBlock(curlSnippet)}
          </div>
        ),
      },
      {
        key: 'typescript',
        label: 'TypeScript',
        content: (
          <div class='space-y-2 text-slate-300'>
            <p>Use this snippet in a Node or Edge runtime to call the same endpoint.</p>
            {renderCodeBlock(tsSnippet)}
          </div>
        ),
      },
    ];
  }, [selected, curlSnippet, tsSnippet]);

  return (
    <Modal title='Warm Query APIs' onClose={onClose}>
      <div class='space-y-8 text-sm text-slate-200'>
        <section class='relative overflow-hidden rounded-3xl border border-sky-600/40 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-sky-900/40 p-6 shadow-xl'>
          <div class='relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div class='space-y-3'>
              <h3 class='text-2xl font-semibold text-white'>
                Tap into your warm queries instantly
              </h3>
              <p class='max-w-2xl text-sm leading-relaxed text-slate-200/80'>
                Generate a workspace JWT from the API Keys modal, choose a warm query, and drop the
                examples into your favorite client. Every snippet comes wired with the Bearer token
                header it expects.
              </p>
            </div>
            <div class='relative isolate flex h-20 w-20 shrink-0 items-center justify-center self-start rounded-3xl bg-sky-500/10 ring-1 ring-sky-400/60 backdrop-blur'>
              <svg viewBox='0 0 24 24' class='h-10 w-10 text-sky-300'>
                <path
                  d='M5 12h14M5 12l4-4m-4 4 4 4'
                  stroke='currentColor'
                  stroke-width='1.6'
                  stroke-linecap='round'
                  stroke-linejoin='round'
                  fill='none'
                />
              </svg>
            </div>
          </div>
        </section>

        {warmQueries.length === 0
          ? (
            <section class='rounded-3xl border border-dashed border-amber-400/70 bg-amber-500/10 p-6 text-amber-100'>
              <h4 class='text-lg font-semibold'>No warm queries yet</h4>
              <p class='mt-2 text-sm leading-relaxed'>
                Start by connecting a surface to your data, let it flow for a bit, and save a warm
                query. As soon as one exists, code-ready examples will appear here.
              </p>
            </section>
          )
          : (
            <div class='space-y-6'>
              <section class='rounded-3xl border border-slate-700/50 bg-neutral-900/70 p-5 shadow-lg'>
                <label class='text-xs font-semibold uppercase tracking-wide text-slate-400'>
                  Warm Query
                </label>
                <div class='mt-2'>
                  <Select
                    value={selectedLookup}
                    onChange={(event) => {
                      const next = (event.currentTarget as HTMLSelectElement).value;
                      setSelectedLookup(next);
                    }}
                  >
                    {warmQueries.map((wq) => (
                      <option key={wq.lookup} value={wq.lookup}>
                        {wq.name}
                      </option>
                    ))}
                  </Select>
                </div>
                {selected?.description && (
                  <p class='mt-3 text-xs text-slate-400'>{selected.description}</p>
                )}
              </section>

              {selected && (
                <section class='space-y-5 rounded-3xl border border-slate-700/50 bg-neutral-900/80 p-6 shadow-xl'>
                  <div class='flex flex-wrap items-center justify-between gap-3'>
                    <div>
                      <h4 class='text-xl font-semibold text-white'>{selected.name}</h4>
                      <p class='text-xs uppercase tracking-wide text-slate-500'>
                        Workspace Warm Query
                      </p>
                    </div>
                    <span class='inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-200'>
                      <span class='inline-flex h-2 w-2 rounded-full bg-sky-400'></span>
                      GET
                    </span>
                  </div>

                  <div class='grid gap-4 md:grid-cols-2'>
                    <div class='rounded-2xl border border-neutral-800/60 bg-neutral-950/40 p-4'>
                      <div class='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500'>
                        <InfoIcon path='M5 12h14M12 5v14' />
                        Endpoint
                      </div>
                      <code class='mt-2 block break-all font-mono text-xs text-slate-100'>
                        {endpointUrl}
                      </code>
                    </div>
                    <div class='rounded-2xl border border-neutral-800/60 bg-neutral-950/40 p-4'>
                      <div class='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500'>
                        <InfoIcon path='M12 5 5 9v10l7 4 7-4V9z' />
                        Lookup
                      </div>
                      <p class='mt-2 font-mono text-xs text-slate-100'>{selected.lookup}</p>
                    </div>
                    {selected.apiPath && (
                      <div class='rounded-2xl border border-neutral-800/60 bg-neutral-950/40 p-4 md:col-span-2'>
                        <div class='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500'>
                          <InfoIcon path='M4 5h16M4 12h16M4 19h16' />
                          API Path
                        </div>
                        <p class='mt-2 font-mono text-xs text-slate-100'>{selected.apiPath}</p>
                      </div>
                    )}
                  </div>

                  <p class='text-xs text-slate-400'>
                    Include an{' '}
                    <code class='rounded bg-neutral-800/70 px-2 py-0.5 font-mono text-[0.65rem] text-slate-100'>
                      Authorization: Bearer &lt;your JWT&gt;
                    </code>{' '}
                    header on every request. JWTs are available from the API Keys modal.
                  </p>
                </section>
              )}

              {selected && (
                <section class='rounded-3xl border border-slate-700/50 bg-neutral-900/80 p-6 shadow-xl'>
                  <TabbedPanel
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    scrollableContent
                  />
                </section>
              )}
            </div>
          )}
      </div>
    </Modal>
  );
}

WarmQueryAPIsModal.Modal = (
  workspaceMgr: WorkspaceManager,
): {
  Modal: JSX.Element;
  Hide: () => void;
  IsOpen: () => boolean;
  Show: () => void;
} => {
  const [shown, setShow] = useState(false);

  return {
    Modal: (
      <>
        {shown && (
          <WarmQueryAPIsModal
            workspaceMgr={workspaceMgr}
            onClose={() => setShow(false)}
          />
        )}
      </>
    ),
    Hide: () => setShow(false),
    IsOpen: () => shown,
    Show: () => setShow(true),
  };
};

export default WarmQueryAPIsModal;
