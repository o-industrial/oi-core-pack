import {
  Action,
  ActionStyleTypes,
  IS_BROWSER,
  JSX,
  LoadingIcon,
  Modal,
  useEffect,
  useState,
  WorkspaceManager,
} from '../../../.deps.ts';

type FoundationHighlight = {
  title: string;
  description: string;
  accent: string;
  icon: JSX.Element;
};

const foundationHighlights: FoundationHighlight[] = [
  {
    title: 'Base Foundation',
    description:
      'Shape the landing zone resource group and lay down networking, Key Vault, and policy scaffolding tuned for private operations.',
    accent: 'from-indigo-500/70 via-sky-500/70 to-cyan-400/70',
    icon: (
      <svg viewBox='0 0 24 24' fill='none' class='h-6 w-6'>
        <path
          d='M4 10 12 5l8 5v9a1 1 0 0 1-1 1h-6v-5H9v5H5a1 1 0 0 1-1-1v-9Z'
          stroke='currentColor'
          stroke-width='1.6'
          stroke-linecap='round'
          stroke-linejoin='round'
        />
      </svg>
    ),
  },
  {
    title: 'Secure Operations',
    description:
      'Wire diagnostics, Log Analytics, and secret management so engineering teams inherit a healthy runway from day zero.',
    accent: 'from-fuchsia-500/70 via-violet-500/70 to-indigo-400/70',
    icon: (
      <svg viewBox='0 0 24 24' fill='none' class='h-6 w-6'>
        <path
          d='M12 5v14m7-8H5'
          stroke='currentColor'
          stroke-width='1.6'
          stroke-linecap='round'
          stroke-linejoin='round'
        />
        <path
          d='M7 9h2v2H7zm0 4h2v2H7zm8-4h2v2h-2zm0 4h2v2h-2z'
          fill='currentColor'
        />
      </svg>
    ),
  },
];

type PreconnectHighlight = {
  title: string;
  description: string;
  accent: string;
  icon: JSX.Element;
};

const preconnectHighlights: PreconnectHighlight[] = [
  {
    title: 'Key Vault readiness',
    description:
      'Document your secret rotation policy, identify certificates to import, and note which services will need managed identities once the vault is online.',
    accent: 'from-amber-500/70 via-orange-400/60 to-pink-400/60',
    icon: (
      <svg viewBox='0 0 24 24' fill='none' class='h-6 w-6'>
        <path
          d='M12 3a4 4 0 0 0-4 4v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a4 4 0 0 0-4-4Z'
          stroke='currentColor'
          stroke-width='1.6'
          stroke-linecap='round'
          stroke-linejoin='round'
        />
        <path
          d='M12 14v2'
          stroke='currentColor'
          stroke-width='1.6'
          stroke-linecap='round'
        />
      </svg>
    ),
  },
  {
    title: 'Logging & analytics plan',
    description:
      'Decide which resource diagnostics need to land in Log Analytics, set retention goals, and capture any existing SIEM forwarding requirements.',
    accent: 'from-sky-500/70 via-indigo-500/70 to-violet-500/70',
    icon: (
      <svg viewBox='0 0 24 24' fill='none' class='h-6 w-6'>
        <path
          d='M5 19h14M7 16V8m5 8V5m5 11V10'
          stroke='currentColor'
          stroke-width='1.6'
          stroke-linecap='round'
          stroke-linejoin='round'
        />
      </svg>
    ),
  },
  {
    title: 'Policy baseline review',
    description:
      'List the required Azure Policy assignments, RBAC roles, and resource tags so they can be baked into the landing zone templates.',
    accent: 'from-emerald-500/70 via-teal-400/70 to-sky-500/70',
    icon: (
      <svg viewBox='0 0 24 24' fill='none' class='h-6 w-6'>
        <path
          d='M12 4 4 8v8l8 4 8-4V8l-8-4Z'
          stroke='currentColor'
          stroke-width='1.6'
          stroke-linejoin='round'
        />
        <path
          d='m9 12 2 2 4-4'
          stroke='currentColor'
          stroke-width='1.6'
          stroke-linecap='round'
          stroke-linejoin='round'
        />
      </svg>
    ),
  },
];

export type PrivateCloudFoundationModalProps = {
  workspaceMgr: WorkspaceManager;
  onClose: () => void;
};

export function PrivateCloudFoundationModal({
  workspaceMgr,
  onClose,
}: PrivateCloudFoundationModalProps): JSX.Element {
  const eac = workspaceMgr.UseEaC();
  const workspaceCloud = (eac?.Clouds || {})['Workspace'];
  const [locations, setLocations] = useState<{ Name: string }[]>([]);
  const [loadingLocs, setLoadingLocs] = useState(false);
  const [foundationView, setFoundationView] = useState<'provision' | 'manage'>('provision');
  const isLocalPreview = IS_BROWSER && globalThis.location?.hostname === 'localhost';

  // Step 1: Base inputs
  const [region, setRegion] = useState('');
  const [rgName, setRgName] = useState('oi-workspace-rg');
  const [baseBusy, setBaseBusy] = useState(false);
  const [baseDone, setBaseDone] = useState(false);
  const [baseErr, setBaseErr] = useState<string | undefined>(undefined);

  const loadLocations = async () => {
    try {
      setLoadingLocs(true);
      const res = await fetch('/workspace/api/azure/locations');
      const data = await res.json();
      const locs = (data?.Locations ?? []) as {
        name?: string;
        displayName?: string;
      }[];
      const mapped = locs
        .map((l) => ({ Name: l.displayName || l.name || '' }))
        .filter((l) => l.Name);
      setLocations(mapped);
      if (!region && mapped.length > 0) setRegion(mapped[0].Name);
      if (mapped.length === 0 && isLocalPreview) {
        const fallback = [{ Name: 'westus3' }, { Name: 'centralus' }, { Name: 'eastus2' }];
        setLocations(fallback);
        if (!region) setRegion(fallback[0].Name);
      }
    } catch (err) {
      console.error('Failed to load locations', err);
      if (isLocalPreview) {
        const fallback = [{ Name: 'westus3' }, { Name: 'centralus' }, { Name: 'eastus2' }];
        setLocations(fallback);
        if (!region) setRegion(fallback[0].Name);
      }
    } finally {
      setLoadingLocs(false);
    }
  };

  useEffect(() => {
    if (workspaceCloud?.Details) loadLocations();
  }, [!!workspaceCloud?.Details]);

  const submitBase = async () => {
    try {
      setBaseBusy(true);
      setBaseErr(undefined);
      setBaseDone(false);
      setFoundationView('manage');
      const res = await fetch('/workspace/api/o-industrial/calz/base', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ region, rgName }),
      });
      const data = await res.json();
      if (!data?.status) throw new Error('No status returned');
      setBaseDone(true);
    } catch (err) {
      setBaseErr((err as Error).message);
      setFoundationView('provision');
    } finally {
      setBaseBusy(false);
    }
  };

  const hasWorkspaceCloud = !!workspaceCloud?.Details;
  const isManagingFoundation = foundationView === 'manage';
  const heroGlow = hasWorkspaceCloud
    ? 'from-emerald-400/40 via-teal-300/30 to-sky-400/40'
    : 'from-amber-400/40 via-orange-400/40 to-pink-400/40';
  const heroPillClass = hasWorkspaceCloud
    ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
    : 'border-amber-400/40 bg-amber-500/10 text-amber-200';
  const heroTitle = hasWorkspaceCloud
    ? isManagingFoundation
      ? 'Manage your private cloud foundation'
      : 'Provision your private cloud foundation'
    : 'Connect a workspace cloud to begin';
  const heroDescription = hasWorkspaceCloud
    ? isManagingFoundation
      ? 'Watch the landing zone baseline come online, track hardening tasks, and keep security operations aligned as workloads move in.'
      : 'Lay down the landing zone resource group, networking, and governance guardrails to back every workload from the start.'
    : 'Link a workspace cloud first. Once connected, this guide unlocks private foundation automation tailored to your environment.';
  const heroPillText = hasWorkspaceCloud
    ? isManagingFoundation ? 'Foundation Management' : 'Provision Foundation'
    : 'First Step';
  const managementStatusClass = baseDone
    ? 'text-emerald-300'
    : baseBusy
    ? 'text-sky-300'
    : 'text-slate-400';
  const managementStatusText = baseBusy
    ? 'Provisioning...'
    : baseDone
    ? 'Foundation ready'
    : 'Queued';
  const managementStatus = (ready: string, progress: string, queued: string) =>
    baseDone ? ready : baseBusy ? progress : queued;
  const managementCards = [
    {
      title: 'Azure Key Vault',
      status: managementStatus(
        'Ready for secrets',
        'Provisioning vault resources...',
        'Waiting for foundation start',
      ),
      description:
        'Import certificates, set access policies, and confirm rotation cadence for shared secrets.',
    },
    {
      title: 'Log Analytics Workspace',
      status: managementStatus(
        'Connected to RG',
        'Linking diagnostic settings...',
        'Awaiting base resources',
      ),
      description:
        'Map resource diagnostic settings and define retention so operations insights stay actionable.',
    },
    {
      title: 'Monitor & Alerts',
      status: managementStatus(
        'Baseline rules queued',
        'Syncing default alerts...',
        'Activate after foundation deploy',
      ),
      description: 'Review default metric alerts and wire them into your on-call tooling.',
    },
    {
      title: 'Policy & RBAC',
      status: managementStatus(
        'Assignments staged',
        'Applying governance guardrails...',
        'Compile requirements',
      ),
      description:
        'Confirm role assignments and Azure Policy definitions align to your compliance baseline.',
    },
  ];

  return (
    <Modal title='Private Cloud Foundation' onClose={onClose}>
      <div class='space-y-10 text-sm text-slate-200'>
        <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900/60 via-slate-900/30 to-slate-900/60 p-8 shadow-2xl'>
          <div class='relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
            <div class='space-y-4'>
              <span
                class={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${heroPillClass}`}
              >
                <span class='inline-flex h-2 w-2 rounded-full bg-current shadow-[0_0_8px_rgb(56_189_248/0.8)]'>
                </span>
                {heroPillText}
              </span>
              <h3 class='text-3xl font-semibold text-white md:text-4xl'>{heroTitle}</h3>
              <p class='max-w-3xl text-base leading-relaxed text-slate-300'>
                {heroDescription}
              </p>
            </div>
            <div class='relative isolate mt-4 flex h-28 w-full max-w-xs items-center justify-center lg:mt-0'>
              <div class={`absolute inset-0 rounded-full blur-2xl bg-gradient-to-tr ${heroGlow}`}>
              </div>
              <div class='relative flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-900/70 backdrop-blur ring-1 ring-sky-400/60'>
                <svg viewBox='0 0 32 32' class='h-12 w-12 text-sky-200'>
                  <path
                    d='M10 22V12l6-4 6 4v10'
                    stroke='currentColor'
                    stroke-width='1.5'
                    stroke-linecap='round'
                    stroke-linejoin='round'
                    fill='none'
                  />
                  <path
                    d='M10 18h12'
                    stroke='currentColor'
                    stroke-width='1.5'
                    stroke-linecap='round'
                    fill='none'
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        <section class='grid gap-6 md:grid-cols-3'>
          {foundationHighlights.map((item) => (
            <div
              key={item.title}
              class='group relative overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-900/70 p-6 shadow-xl transition-transform duration-300 hover:-translate-y-1 hover:border-slate-500/60'
            >
              <div
                class={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent} opacity-80`}
              >
              </div>
              <div class='relative flex items-start gap-4'>
                <div
                  class={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-slate-900 shadow-lg`}
                >
                  {item.icon}
                </div>
                <div class='space-y-2'>
                  <h4 class='text-lg font-semibold text-white'>{item.title}</h4>
                  <p class='text-sm leading-relaxed text-slate-300'>{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {!hasWorkspaceCloud && (
          <section class='space-y-6'>
            <div class='relative overflow-hidden rounded-3xl border border-amber-400/60 bg-amber-500/10 p-6 text-amber-100 shadow-xl'>
              <div class='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-amber-400/60 via-orange-400/50 to-pink-400/60 opacity-70'>
              </div>
              <h4 class='text-base font-semibold text-amber-100'>Workspace cloud required</h4>
              <p class='mt-2 text-sm text-amber-100/80'>
                No workspace cloud is configured yet. Connect Azure under Environment -{'>'}{' '}
                Cloud Connections to unlock private foundation automation.
              </p>
              <p class='mt-3 text-sm text-amber-100/90'>
                While that&apos;s provisioning, capture the readiness details below so Key Vault,
                logging, and governance can land smoothly once connected.
              </p>
            </div>

            <div class='grid gap-5 lg:grid-cols-2'>
              {preconnectHighlights.map((item) => (
                <div
                  key={item.title}
                  class='relative overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-900/70 p-5 shadow-lg'
                >
                  <div
                    class={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent} opacity-80`}
                  >
                  </div>
                  <div class='flex items-start gap-3'>
                    <div
                      class={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-slate-900 shadow-md`}
                    >
                      {item.icon}
                    </div>
                    <div class='space-y-1'>
                      <h5 class='text-base font-semibold text-white'>{item.title}</h5>
                      <p class='text-sm text-slate-300 leading-relaxed'>{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {hasWorkspaceCloud && (
          <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-xl space-y-6'>
            <div class='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-400/50 via-sky-400/40 to-cyan-400/50 opacity-80'>
            </div>

            <div class='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div class='space-y-2'>
                <h4 class='text-xl font-semibold text-white'>Workspace Cloud</h4>
                <p class='text-sm text-slate-300'>
                  {workspaceCloud?.Details?.Name || 'Workspace Cloud'} -{' '}
                  {workspaceCloud?.Details?.Type || 'Azure'}
                </p>
              </div>
              <div class='rounded-2xl border border-slate-700/60 bg-slate-900/60 px-4 py-3 text-xs text-slate-300 space-y-2'>
                <div class='flex items-center justify-between gap-4'>
                  <span class='font-semibold text-slate-200'>Azure regions</span>
                  <button
                    type='button'
                    class='text-xs font-semibold text-sky-300 hover:text-sky-200 disabled:text-slate-500'
                    onClick={loadLocations}
                    disabled={loadingLocs}
                  >
                    {loadingLocs ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>
                <div>
                  {loadingLocs
                    ? (
                      <span class='inline-flex items-center gap-2'>
                        <LoadingIcon class='h-4 w-4 animate-spin text-sky-300' />{' '}
                        Loading available regions...
                      </span>
                    )
                    : locations.length > 0
                    ? `${locations.length} regions available`
                    : 'No regions returned yet.'}
                </div>
              </div>
            </div>

            {foundationView === 'provision'
              ? (
                <div class='grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]'>
                  <div class='space-y-4'>
                    <h5 class='text-lg font-semibold text-white'>Define the foundation scope</h5>
                    <p class='text-sm text-slate-300 leading-relaxed'>
                      Choose the resource group and default region. These anchor the landing zone
                      templates the automation will apply for your private cloud foundation.
                    </p>
                    <p class='text-xs text-slate-400 leading-relaxed'>
                      Adjust these inputs before you start provisioning. Once provisioning begins
                      the modal shifts into the foundation management view.
                    </p>
                  </div>

                  <div class='space-y-4 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5'>
                    <div class='grid gap-4'>
                      <div>
                        <label class='mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400'>
                          Resource Group Name
                        </label>
                        <input
                          type='text'
                          class='w-full rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400/60'
                          value={rgName}
                          onInput={(e) => setRgName((e.target as HTMLInputElement).value)}
                        />
                      </div>
                      <div>
                        <label class='mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400'>
                          Region
                        </label>
                        <select
                          class='w-full rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400/60'
                          value={region}
                          disabled={loadingLocs || locations.length === 0}
                          onChange={(e) => setRegion((e.target as HTMLSelectElement).value)}
                        >
                          {locations.map((l) => (
                            <option value={l.Name} key={l.Name}>
                              {l.Name}
                            </option>
                          ))}
                        </select>
                        {!loadingLocs && locations.length === 0 && (
                          <div class='mt-1 text-xs text-amber-300'>
                            No regions returned. Refresh after your subscription permissions are
                            confirmed.
                          </div>
                        )}
                      </div>
                    </div>
                    {baseErr && <div class='text-xs text-rose-400'>{baseErr}</div>}
                    <div class='flex flex-wrap items-center gap-3'>
                      <Action
                        onClick={submitBase}
                        disabled={baseBusy || !region || !rgName || loadingLocs}
                      >
                        {baseBusy ? 'Provisioning foundation...' : 'Start provisioning'}
                      </Action>
                      {isLocalPreview && (
                        <Action
                          styleType={ActionStyleTypes.Outline}
                          onClick={() => {
                            setBaseBusy(false);
                            setBaseDone(false);
                            setFoundationView('manage');
                          }}
                        >
                          Preview management view
                        </Action>
                      )}
                      <span class='text-xs text-slate-400'>
                        The management dashboard appears once provisioning kicks off.
                      </span>
                    </div>
                  </div>
                </div>
              )
              : (
                <div class='space-y-5'>
                  <div class='space-y-3 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5'>
                    <div class='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                      <div>
                        <h5 class='text-lg font-semibold text-white'>Foundation status</h5>
                        <p class='text-sm text-slate-300'>
                          {rgName} - {region || 'Region pending'}
                        </p>
                      </div>
                      <span class={`text-xs font-semibold ${managementStatusClass}`}>
                        {managementStatusText}
                      </span>
                    </div>
                    <p class='text-sm text-slate-300 leading-relaxed'>
                      Keep this view open while automation runs. We will extend it with live
                      activity and hand-offs for security operations next.
                    </p>
                    {!baseBusy && (
                      <div class='flex flex-wrap items-center gap-2'>
                        <Action
                          styleType={ActionStyleTypes.Outline}
                          onClick={() => setFoundationView('provision')}
                        >
                          Adjust foundation inputs
                        </Action>
                        {isLocalPreview && (
                          <>
                            <Action
                              styleType={ActionStyleTypes.Outline}
                              onClick={() => setBaseDone(false)}
                            >
                              Show queued state
                            </Action>
                            <Action
                              styleType={ActionStyleTypes.Outline}
                              onClick={() => setBaseDone(true)}
                            >
                              Show ready state
                            </Action>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div class='grid gap-4 md:grid-cols-2'>
                    {managementCards.map((item) => (
                      <div
                        key={item.title}
                        class='rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4'
                      >
                        <div class='flex items-center justify-between gap-3 text-sm'>
                          <h5 class='font-semibold text-white'>{item.title}</h5>
                          <span class={`text-xs ${managementStatusClass}`}>
                            {item.status}
                          </span>
                        </div>
                        <p class='mt-2 text-xs text-slate-400 leading-relaxed'>
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div class='rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 text-slate-300'>
              Want it faster? Email{' '}
              <a
                href='mailto:support@fathym.com?subject=Private%20Cloud%20Foundation%20Setup'
                class='font-semibold text-sky-300 hover:text-sky-200'
              >
                support@fathym.com
              </a>{' '}
              and the team will help provision it today.
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}

PrivateCloudFoundationModal.Modal = (
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
          <PrivateCloudFoundationModal
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

export default PrivateCloudFoundationModal;
