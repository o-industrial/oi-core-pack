import {
  Action,
  ActionStyleTypes,
  JSX,
  LoadingIcon,
  Modal,
  useEffect,
  useState,
  WorkspaceManager,
} from '../../../.deps.ts';

type CalzHighlight = {
  title: string;
  description: string;
  accent: string;
  icon: JSX.Element;
};

const calzHighlights: CalzHighlight[] = [
  {
    title: '0. Prereqs',
    description:
      'Register Azure resource providers, sync available regions, and validate Azure access so the workspace cloud can be provisioned safely.',
    accent: 'from-sky-500/70 via-cyan-400/70 to-emerald-400/70',
    icon: (
      <svg viewBox='0 0 24 24' fill='none' class='h-6 w-6'>
        <path
          d='M5 6h14M5 12h14M5 18h6'
          stroke='currentColor'
          stroke-width='1.6'
          stroke-linecap='round'
          stroke-linejoin='round'
        />
        <path
          d='m13 17 2 2 4-4'
          stroke='currentColor'
          stroke-width='1.6'
          stroke-linecap='round'
          stroke-linejoin='round'
        />
      </svg>
    ),
  },
  {
    title: '1. Base Landing Zone',
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
    title: '2. Secure Operations',
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

const stepLabels: Array<{ index: 0 | 1; label: string }> = [
  { index: 0, label: 'Prereqs' },
  { index: 1, label: 'Base Foundation' },
];

export type PrivateCALZModalProps = {
  workspaceMgr: WorkspaceManager;
  onClose: () => void;
};

export function PrivateCALZModal({
  workspaceMgr,
  onClose,
}: PrivateCALZModalProps): JSX.Element {
  const eac = workspaceMgr.UseEaC();
  const workspaceCloud = (eac?.Clouds || {})['Workspace'];
  const [step, setStep] = useState<0 | 1>(0);
  const [locations, setLocations] = useState<{ Name: string }[]>([]);
  const [loadingLocs, setLoadingLocs] = useState(false);
  const [providersBusy, setProvidersBusy] = useState(false);

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
    } catch (err) {
      console.error('Failed to load locations', err);
    } finally {
      setLoadingLocs(false);
    }
  };

  useEffect(() => {
    if (workspaceCloud?.Details) loadLocations();
  }, [!!workspaceCloud?.Details]);

  const ensureProviders = async () => {
    try {
      setProvidersBusy(true);
      const defs = {
        'Microsoft.Resources': { Types: [] },
        'Microsoft.Network': { Types: [] },
        'Microsoft.KeyVault': { Types: [] },
        'Microsoft.OperationalInsights': { Types: [] },
        'Microsoft.App': { Types: [] },
        'Microsoft.Storage': { Types: [] },
        'Microsoft.Devices': { Types: [] },
        'Microsoft.Kusto': { Types: [] },
      };
      await fetch('/workspace/api/azure/providers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(defs),
      });
    } finally {
      setProvidersBusy(false);
    }
  };

  const submitBase = async () => {
    try {
      setBaseBusy(true);
      setBaseErr(undefined);
      const res = await fetch('/workspace/api/o-industrial/calz/base', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ region, rgName }),
      });
      const data = await res.json();
      if (!data?.status) throw new Error('No status returned');
      setBaseDone(true);
      setStep(1);
    } catch (err) {
      setBaseErr((err as Error).message);
    } finally {
      setBaseBusy(false);
    }
  };

  const hasWorkspaceCloud = !!workspaceCloud?.Details;
  const heroGlow = hasWorkspaceCloud
    ? 'from-emerald-400/40 via-teal-300/30 to-sky-400/40'
    : 'from-amber-400/40 via-orange-400/40 to-pink-400/40';
  const heroPillClass = hasWorkspaceCloud
    ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
    : 'border-amber-400/40 bg-amber-500/10 text-amber-200';
  const heroTitle = hasWorkspaceCloud
    ? 'Manage your private CALZ foundation'
    : 'Connect a workspace cloud to begin';
  const heroDescription = hasWorkspaceCloud
    ? 'Provision the landing zone, reinforce governance, and validate secrets and observability so every workload inherits a compliant baseline.'
    : 'Link a workspace cloud first. Once connected, this guide unlocks private CALZ automation tailored to your environment.';
  const heroPillText = hasWorkspaceCloud
    ? step === 1 ? 'Base Foundation' : 'Prereqs'
    : 'First Step';

  return (
    <Modal title='Private Open Industrial CALZ' onClose={onClose}>
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
          {calzHighlights.map((item) => (
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
                Cloud Connections to unlock private CALZ automation.
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
              <div class='rounded-2xl border border-slate-700/60 bg-slate-900/60 px-4 py-3 text-xs text-slate-300'>
                <div>Regions loaded: {locations.length || 0}</div>
                <div class='mt-1'>
                  Providers ready: {providersBusy ? 'Working...' : 'Ensure before provisioning'}
                </div>
              </div>
            </div>

            <div class='flex flex-wrap items-center gap-3 text-xs font-semibold'>
              {stepLabels.map((item, idx) => (
                <span class='flex items-center gap-2' key={item.index}>
                  <span class={item.index === step ? 'text-sky-300' : 'text-slate-500'}>
                    {item.index}. {item.label}
                  </span>
                  {idx < stepLabels.length - 1 && <span class='text-slate-600'>{'>'}</span>}
                </span>
              ))}
            </div>

            {step === 0 && (
              <div class='space-y-4 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5'>
                <p class='text-sm text-slate-300'>
                  Run these readiness checks so Azure is primed for the landing zone rollout.
                </p>
                <div class='flex flex-wrap gap-2'>
                  <Action
                    styleType={ActionStyleTypes.Outline}
                    onClick={ensureProviders}
                    disabled={providersBusy}
                  >
                    {providersBusy ? 'Registering providers...' : 'Ensure Providers'}
                  </Action>
                  <Action
                    styleType={ActionStyleTypes.Outline}
                    onClick={loadLocations}
                    disabled={loadingLocs}
                  >
                    {loadingLocs ? 'Loading regions...' : 'Load Regions'}
                  </Action>
                </div>
                <div class='text-sm text-slate-300'>
                  {loadingLocs
                    ? (
                      <span class='inline-flex items-center gap-2'>
                        <LoadingIcon class='h-4 w-4 animate-spin text-sky-300' /> Getting regions...
                      </span>
                    )
                    : locations.length > 0
                    ? <span>Regions ready: {locations.length}</span>
                    : <span>No regions loaded yet.</span>}
                </div>
                <div class='pt-2'>
                  <Action
                    onClick={() => setStep(1)}
                    disabled={loadingLocs || providersBusy}
                  >
                    Continue to Base
                  </Action>
                </div>
              </div>
            )}

            {step === 1 && (
              <div class='space-y-6 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5'>
                <div class='space-y-4'>
                  <div>
                    <label class='mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400'>
                      Resource Group Name
                    </label>
                    <input
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
                      onChange={(e) => setRegion((e.target as HTMLSelectElement).value)}
                    >
                      {locations.map((l) => (
                        <option value={l.Name} key={l.Name}>
                          {l.Name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {baseErr && <div class='text-xs text-rose-400'>{baseErr}</div>}
                  <div class='flex flex-wrap items-center gap-2'>
                    <Action
                      styleType={ActionStyleTypes.Outline}
                      onClick={() => setStep(0)}
                    >
                      Back
                    </Action>
                    <Action onClick={submitBase} disabled={baseBusy || !region || !rgName}>
                      {baseBusy ? 'Provisioning...' : 'Provision Base'}
                    </Action>
                    {baseDone && (
                      <span class='text-xs text-emerald-300'>
                        Landing zone applied. Review the services below to finish hardening.
                      </span>
                    )}
                  </div>
                </div>

                <div class='grid gap-4 md:grid-cols-2'>
                  {[
                    {
                      title: 'Azure Key Vault',
                      status: baseDone ? 'Ready for secrets' : 'Pending provisioning',
                      description:
                        'Import certificates, set access policies, and confirm rotation cadence for shared secrets.',
                    },
                    {
                      title: 'Log Analytics Workspace',
                      status: baseDone ? 'Connected to RG' : 'Awaiting base resources',
                      description:
                        'Map resource diagnostic settings and define retention so operations insights stay actionable.',
                    },
                    {
                      title: 'Monitor & Alerts',
                      status: baseDone ? 'Baseline rules queued' : 'Activate after base deploy',
                      description:
                        'Review default metric alerts and wire them into your on-call tooling.',
                    },
                    {
                      title: 'Policy & RBAC',
                      status: baseDone ? 'Assignments staged' : 'Compile requirements',
                      description:
                        'Confirm role assignments and Azure Policy definitions align to your compliance baseline.',
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      class='rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4'
                    >
                      <div class='flex items-center justify-between gap-3 text-sm'>
                        <h5 class='font-semibold text-white'>{item.title}</h5>
                        <span class={`text-xs ${baseDone ? 'text-emerald-300' : 'text-slate-400'}`}>
                          {item.status}
                        </span>
                      </div>
                      <p class='mt-2 text-xs text-slate-400 leading-relaxed'>{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div class='rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 text-slate-300'>
              Want it faster? Email{' '}
              <a
                href='mailto:support@fathym.com?subject=Private%20CALZ%20Setup'
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

PrivateCALZModal.Modal = (
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
          <PrivateCALZModal
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

export default PrivateCALZModal;
