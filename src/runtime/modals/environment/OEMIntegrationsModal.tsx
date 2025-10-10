import {
  Action,
  ActionStyleTypes,
  IntentTypes,
  JSX,
  Modal,
  useMemo,
  useState,
  WorkspaceManager,
} from '../../../.deps.ts';

type CapabilityPromo = {
  name: string;
  tagline: string;
  description: string;
  topAccent: string;
  iconAccent: string;
  icon: JSX.Element;
  actions: Array<{
    label: string;
    intent: IntentTypes;
    href: string;
    outline?: boolean;
  }>;
};

const capabilityPromos: CapabilityPromo[] = [
  {
    name: 'HighByte',
    tagline: 'Industrial DataOps, ready for your floor',
    description:
      'Model plant data, blend OT/IT context, and push enriched payloads into Open Industrial when you are ready.',
    topAccent: 'from-emerald-500/70 via-sky-500/70 to-cyan-400/70',
    iconAccent: 'from-emerald-500 via-sky-500 to-emerald-400',
    icon: <span class='text-sm font-semibold tracking-wide text-white'>HB</span>,
    actions: [
      {
        label: 'Deploy',
        intent: IntentTypes.Primary,
        href: 'mailto:support@fathym.com?subject=Deploy%20HighByte%20on%20my%20metal',
      },
      {
        label: 'Connect',
        intent: IntentTypes.Info,
        href: 'mailto:support@fathym.com?subject=Connect%20HighByte%20to%20Open%20Industrial',
        outline: true,
      },
    ],
  },
  {
    name: 'NodeRed',
    tagline: 'Flow-based orchestration at the edge',
    description:
      'Build drag-and-drop workflows, orchestrate assets on-prem, and register those flows with Open Industrial routing.',
    topAccent: 'from-fuchsia-500/70 via-violet-500/70 to-sky-500/70',
    iconAccent: 'from-rose-500 via-red-500 to-orange-500',
    icon: (
      <svg viewBox='0 0 32 32' class='h-6 w-6 text-white'>
        <path
          d='M10 10a2 2 0 0 1 4 0v2h4a2 2 0 1 1 0 4h-1.5a2.5 2.5 0 1 1-5 0H10a2 2 0 1 1 0-4h1.5V10Z'
          fill='currentColor'
        />
        <circle cx='21.5' cy='16' r='1.5' fill='currentColor' />
        <circle cx='10' cy='14' r='1.5' fill='currentColor' />
      </svg>
    ),
    actions: [
      {
        label: 'Deploy',
        intent: IntentTypes.Primary,
        href: 'mailto:support@fathym.com?subject=Deploy%20Node-RED%20on%20my%20metal',
      },
      {
        label: 'Connect',
        intent: IntentTypes.Info,
        href: 'mailto:support@fathym.com?subject=Connect%20Node-RED%20to%20Open%20Industrial',
        outline: true,
      },
    ],
  },
  {
    name: 'PowerBI',
    tagline: 'Business-ready dashboards',
    description:
      'Author Power BI reports against plant data, then publish governed dashboards via Open Industrial.',
    topAccent: 'from-amber-400/70 via-orange-400/70 to-pink-400/70',
    iconAccent: 'from-amber-400 via-yellow-400 to-orange-400',
    icon: (
      <svg viewBox='0 0 32 32' class='h-6 w-6 text-slate-900'>
        <path d='M9 22V12a1 1 0 0 1 2 0v10H9Z' fill='currentColor' />
        <path d='M15 22V9a1 1 0 0 1 2 0v13h-2Z' fill='currentColor' />
        <path d='M21 22v-6a1 1 0 0 1 2 0v6h-2Z' fill='currentColor' />
      </svg>
    ),
    actions: [
      {
        label: 'Deploy',
        intent: IntentTypes.Primary,
        href: 'mailto:support@fathym.com?subject=Deploy%20Power%20BI%20on%20my%20metal',
      },
      {
        label: 'Connect',
        intent: IntentTypes.Info,
        href: 'mailto:support@fathym.com?subject=Connect%20Power%20BI%20to%20Open%20Industrial',
        outline: true,
      },
    ],
  },
  {
    name: 'Grafana',
    tagline: 'Unified operations monitoring',
    description:
      'Visualize historians, MQTT streams, and line metrics alongside Open Industrial flows.',
    topAccent: 'from-neon-violet-500/80 via-sky-500/70 to-cyan-400/80',
    iconAccent: 'from-orange-500 via-amber-400 to-rose-400',
    icon: (
      <svg viewBox='0 0 32 32' class='h-6 w-6 text-white'>
        <path
          d='M16 22a6 6 0 1 1 4.24-10.24 5 5 0 1 0 1.65 3.76A5 5 0 0 0 21 10.33 8 8 0 1 0 16 22Z'
          fill='currentColor'
        />
      </svg>
    ),
    actions: [
      {
        label: 'Deploy',
        intent: IntentTypes.Primary,
        href: 'mailto:support@fathym.com?subject=Deploy%20Grafana%20on%20my%20metal',
      },
      {
        label: 'Connect',
        intent: IntentTypes.Info,
        href: 'mailto:support@fathym.com?subject=Connect%20Grafana%20to%20Open%20Industrial',
        outline: true,
      },
    ],
  },
];

type InstalledIntegration = {
  id: string;
  name: string;
  vendor: string;
  status: 'online' | 'warning' | 'offline';
  description: string;
  lastSync: string;
};

const seedIntegrations: InstalledIntegration[] = [
  {
    id: 'hb-prod',
    name: 'HighByte Production',
    vendor: 'HighByte',
    status: 'online',
    description: 'Packaging line context models streaming to Open Industrial DataOps.',
    lastSync: '2 minutes ago',
  },
  {
    id: 'nodered-rnd',
    name: 'Node-RED R&D',
    vendor: 'Node-RED',
    status: 'warning',
    description: 'Prototype flow orchestrating lab PLC data into ADX for analytics.',
    lastSync: '17 minutes ago',
  },
  {
    id: 'powerbi-exec',
    name: 'Executive Power BI',
    vendor: 'Microsoft',
    status: 'online',
    description: 'Operational dashboards shared with executive stakeholders.',
    lastSync: '45 minutes ago',
  },
];

function CapabilityCard({
  capability,
  showActions,
}: {
  capability: CapabilityPromo;
  showActions: boolean;
}): JSX.Element {
  return (
    <div class='relative overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-900/70 p-6 shadow-xl transition-transform duration-300 hover:-translate-y-1 hover:border-slate-500/60'>
      <div
        class={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${capability.topAccent} opacity-80`}
      >
      </div>
      <div class='flex flex-col gap-4'>
        <div class='flex items-start gap-3'>
          <div
            class={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${capability.iconAccent} text-slate-900 shadow-lg`}
          >
            {capability.icon}
          </div>
          <div>
            <h5 class='text-lg font-semibold text-white'>{capability.name}</h5>
            <p class='text-xs font-semibold uppercase tracking-[0.2em] text-slate-400'>
              {capability.tagline}
            </p>
          </div>
        </div>
        <p class='text-sm leading-relaxed text-slate-300'>{capability.description}</p>
        {showActions
          ? (
            <div class='flex flex-wrap gap-2'>
              {capability.actions.map((action) => (
                <Action
                  key={action.label}
                  href={action.href}
                  intentType={action.intent}
                  styleType={(action.outline ? ActionStyleTypes.Outline : ActionStyleTypes.Solid) |
                    ActionStyleTypes.Rounded}
                >
                  {action.label}
                </Action>
              ))}
            </div>
          )
          : (
            <p class='text-xs text-slate-400'>
              Connect your workspace cloud to unlock Deploy and Connect actions.
            </p>
          )}
      </div>
    </div>
  );
}

export type OEMIntegrationsModalProps = {
  workspaceMgr: WorkspaceManager;
  onClose: () => void;
};

export function OEMIntegrationsModal({
  workspaceMgr,
  onClose,
}: OEMIntegrationsModalProps): JSX.Element {
  const eac = workspaceMgr.UseEaC();
  const workspaceCloud = (eac?.Clouds || {})['Workspace'];
  const hasWorkspaceCloud = !!workspaceCloud?.Details;

  const [integrations] = useState(seedIntegrations);
  const [filterStatus, setFilterStatus] = useState<'all' | InstalledIntegration['status']>('all');

  const filteredIntegrations = useMemo(() => {
    if (filterStatus === 'all') return integrations;
    return integrations.filter((item) => item.status === filterStatus);
  }, [filterStatus, integrations]);

  const heroPill = hasWorkspaceCloud ? 'OEM Integrations' : 'Preview';
  const heroTitle = hasWorkspaceCloud
    ? 'Install, configure, and monitor OEM integrations'
    : 'Connect a workspace cloud to activate integrations';
  const heroDescription = hasWorkspaceCloud
    ? 'Deploy reference integrations, map credentials in Key Vault, and stay ahead of health across HighByte, Node-RED, Power BI, Grafana, and more.'
    : 'Once your workspace cloud is linked, you can deploy OEM integrations, connect credentials, and observe their health from this console.';

  return (
    <Modal title='OEM Integrations' onClose={onClose}>
      <div class='space-y-10 text-sm text-slate-200'>
        <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900/60 via-slate-900/30 to-slate-900/60 p-8 shadow-2xl'>
          <div class='relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
            <div class='space-y-4'>
              <span
                class={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                  hasWorkspaceCloud
                    ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-amber-400/40 bg-amber-500/10 text-amber-200'
                }`}
              >
                <span class='inline-flex h-2 w-2 rounded-full bg-current shadow-[0_0_8px_rgb(56_189_248/0.75)]'>
                </span>
                {heroPill}
              </span>
              <h3 class='text-3xl font-semibold text-white md:text-4xl'>{heroTitle}</h3>
              <p class='max-w-3xl text-base leading-relaxed text-slate-300'>{heroDescription}</p>
            </div>
            <div class='relative isolate mt-4 flex h-28 w-full max-w-xs items-center justify-center lg:mt-0'>
              <div
                class={`absolute inset-0 rounded-full blur-2xl bg-gradient-to-tr ${
                  hasWorkspaceCloud
                    ? 'from-emerald-400/40 via-teal-300/30 to-sky-400/40'
                    : 'from-amber-400/40 via-orange-400/40 to-pink-400/40'
                }`}
              >
              </div>
              <div class='relative flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-900/70 backdrop-blur ring-1 ring-sky-400/60'>
                <svg viewBox='0 0 32 32' class='h-12 w-12 text-sky-200'>
                  <path
                    d='M12 6h8l4 4v8l-4 4h-8l-4-4v-8l4-4Z'
                    stroke='currentColor'
                    stroke-width='1.5'
                    stroke-linejoin='round'
                    fill='none'
                  />
                  <path
                    d='M12 12h8v8h-8z'
                    stroke='currentColor'
                    stroke-width='1.5'
                    stroke-linejoin='round'
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        <section class='space-y-6 rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-xl'>
          <div class='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div class='space-y-1'>
              <h4 class='text-xl font-semibold text-white'>Installed integrations</h4>
              <p class='text-sm text-slate-300'>
                Track sync health, credential rotation, and deployment notes across your connected
                OEM platforms.
              </p>
            </div>
            <div class='flex items-center gap-2 text-xs'>
              <span class='text-slate-400'>Filter:</span>
              <select
                class='rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400/60'
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus((e.target as HTMLSelectElement).value as typeof filterStatus)}
              >
                <option value='all'>All statuses</option>
                <option value='online'>Online</option>
                <option value='warning'>Warning</option>
                <option value='offline'>Offline</option>
              </select>
            </div>
          </div>

          <div class='grid gap-4 md:grid-cols-2'>
            {filteredIntegrations.map((integration) => (
              <div
                key={integration.id}
                class='flex flex-col gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 text-sm'
              >
                <div class='flex items-start justify-between gap-3'>
                  <div>
                    <div class='text-base font-semibold text-white'>{integration.name}</div>
                    <div class='text-xs uppercase tracking-[0.2em] text-slate-400'>
                      {integration.vendor}
                    </div>
                  </div>
                  <span
                    class={`rounded-full px-3 py-1 text-xs font-semibold ${
                      integration.status === 'online'
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : integration.status === 'warning'
                        ? 'bg-amber-500/10 text-amber-300'
                        : 'bg-rose-500/10 text-rose-300'
                    }`}
                  >
                    {integration.status === 'online'
                      ? 'Online'
                      : integration.status === 'warning'
                      ? 'Action needed'
                      : 'Offline'}
                  </span>
                </div>
                <p class='text-slate-300'>{integration.description}</p>
                <div class='flex items-center justify-between text-xs text-slate-400'>
                  <span>Last sync: {integration.lastSync}</span>
                  <div class='flex items-center gap-2'>
                    <Action
                      styleType={ActionStyleTypes.Thin | ActionStyleTypes.Rounded |
                        ActionStyleTypes.Outline}
                      intentType={IntentTypes.Info}
                    >
                      View logs
                    </Action>
                    <Action
                      styleType={ActionStyleTypes.Thin | ActionStyleTypes.Rounded}
                      intentType={IntentTypes.Primary}
                    >
                      Manage
                    </Action>
                  </div>
                </div>
              </div>
            ))}
            {filteredIntegrations.length === 0 && (
              <div class='rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 text-center text-sm text-slate-400'>
                No integrations match that filter.
              </div>
            )}
          </div>
        </section>

        <section class='space-y-5 rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-xl'>
          <div class='space-y-2'>
            <h4 class='text-xl font-semibold text-white'>Discover OEM integrations</h4>
            <p class='text-sm text-slate-300'>
              Spin up on-prem experiences and connect them into Open Industrial flows with managed
              support.
            </p>
          </div>
          <div class='grid gap-5 lg:grid-cols-2'>
            {capabilityPromos.map((capability) => (
              <CapabilityCard
                key={capability.name}
                capability={capability}
                showActions={hasWorkspaceCloud}
              />
            ))}
          </div>
        </section>

        <div class='rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 text-slate-300'>
          Need a bespoke integration? Email{' '}
          <a
            href='mailto:support@fathym.com?subject=OEM%20Integration%20Request'
            class='font-semibold text-sky-300 hover:text-sky-200'
          >
            support@fathym.com
          </a>{' '}
          and we&apos;ll scope the connector with you.
        </div>
      </div>
    </Modal>
  );
}

OEMIntegrationsModal.Modal = (
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
          <OEMIntegrationsModal
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

export default OEMIntegrationsModal;
