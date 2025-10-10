import {
  Action,
  ActionStyleTypes,
  CloudConnectAzureForm,
  EaCCreateSubscriptionForm,
  EaCManageCloudForm,
  EaCSelectSubscriptionForm,
  IntentTypes,
  IS_BROWSER,
  JSX,
  LoadingIcon,
  Modal,
  TabbedPanel,
  useEffect,
  useRef,
  useState,
  WorkspaceManager,
} from '../../../.deps.ts';

type CloudHighlight = {
  title: string;
  description: string;
  accent: string;
  icon: JSX.Element;
};

const cloudHighlights: CloudHighlight[] = [
  // {
  //   title: 'Managed Azure Subscription',
  //   description:
  //     'Spin up a managed Azure tenant in minutes. Open Industrial provisions, secures, and keeps the subscription compliant with automatic credential rotation.',
  //   accent: 'from-sky-500/70 via-cyan-400/70 to-emerald-400/70',
  //   icon: (
  //     <svg viewBox='0 0 24 24' fill='none' class='h-6 w-6'>
  //       <path
  //         d='M5 15.5A4.5 4.5 0 0 1 9.5 11h.8A5.7 5.7 0 0 1 20 13.9a3.6 3.6 0 0 1-3.6 3.6H7.2A2.2 2.2 0 0 1 5 15.5Z'
  //         stroke='currentColor'
  //         stroke-width='1.6'
  //         stroke-linecap='round'
  //         stroke-linejoin='round'
  //       />
  //       <path
  //         d='M9 8.5A3.5 3.5 0 0 1 15.1 7'
  //         stroke='currentColor'
  //         stroke-width='1.6'
  //         stroke-linecap='round'
  //       />
  //     </svg>
  //   ),
  // },
  // {
  //   title: 'Bring Your Own Azure Cloud',
  //   description:
  //     'Authenticate once and connect the subscription that fits your governance model - select existing tenants, create new ones, or register service principals securely.',
  //   accent: 'from-indigo-500/70 via-sky-500/70 to-cyan-400/70',
  //   icon: (
  //     <svg viewBox='0 0 24 24' fill='none' class='h-6 w-6'>
  //       <path
  //         d='M8 12a4 4 0 1 1 4 4H9l-3 2v-2.5a4 4 0 0 1 2-3.5'
  //         stroke='currentColor'
  //         stroke-width='1.6'
  //         stroke-linecap='round'
  //         stroke-linejoin='round'
  //       />
  //       <path
  //         d='M15 6h4M17 4v4'
  //         stroke='currentColor'
  //         stroke-width='1.6'
  //         stroke-linecap='round'
  //       />
  //     </svg>
  //   ),
  // },
  {
    title: 'Telemetry-Ready Defaults',
    description:
      'Every path primes your workspace for CALZ provisioning, observability, and downstream data products without extra wiring.',
    accent: 'from-fuchsia-500/70 via-violet-500/70 to-sky-400/70',
    icon: (
      <svg viewBox='0 0 24 24' fill='none' class='h-6 w-6'>
        <path
          d='M4 17s2.5-3 6-3 4 3 6 3 4-3 4-3V7s-2 3-4 3-2-3-6-3-6 3-6 3v7z'
          stroke='currentColor'
          stroke-width='1.6'
          stroke-linecap='round'
          stroke-linejoin='round'
        />
        <path
          d='M12 10v4'
          stroke='currentColor'
          stroke-width='1.6'
          stroke-linecap='round'
        />
      </svg>
    ),
  },
  {
    title: 'OEM Integrations on Standby',
    description:
      'Unlock curated integrations like HighByte, Node-RED, Power BI, and Grafana. Once your cloud is connected, deploy and manage them directly from the OEM Integrations console.',
    accent: 'from-emerald-500/70 via-teal-500/70 to-sky-400/70',
    icon: (
      <svg viewBox='0 0 24 24' fill='none' class='h-6 w-6'>
        <path
          d='M9 3h6l3 3v6l-3 3H9l-3-3V6l3-3Z'
          stroke='currentColor'
          stroke-width='1.6'
          stroke-linejoin='round'
        />
        <path
          d='M9 9h6v6H9z'
          stroke='currentColor'
          stroke-width='1.6'
          stroke-linejoin='round'
        />
      </svg>
    ),
  },
];

type ConnectionOptionCardProps = {
  accent: string;
  icon: JSX.Element;
  title: string;
  description: string;
  children: JSX.Element | JSX.Element[];
};

function ConnectionOptionCard({
  accent,
  icon,
  title,
  description,
  children,
}: ConnectionOptionCardProps): JSX.Element {
  return (
    <>
      <div class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-xl'>
        <div
          class={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent} opacity-80`}
        >
        </div>
        <div class='flex items-start gap-4'>
          <div class='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900/70 ring-1 ring-slate-700/80'>
            {icon}
          </div>
          <div class='space-y-3'>
            <div class='space-y-1'>
              <h3 class='text-lg font-semibold text-white'>{title}</h3>
              <p class='text-sm text-slate-300'>{description}</p>
            </div>
          </div>
        </div>

        <div class='py-2'>{children}</div>
      </div>
    </>
  );
}

const managedFeatures = [
  'Provision a production-ready subscription in minutes',
  'Managed tenant curated for industrial workloads',
  'Secrets rotated automatically with every renewal',
  'Shared governance guardrails maintained by Open Industrial',
] as const;

const managedIcon = (
  <svg viewBox='0 0 24 24' fill='none' class='h-7 w-7 text-sky-300'>
    <path
      d='M6 9a4 4 0 1 1 8 0v1h1a3 3 0 1 1 0 6h-1.2a3.8 3.8 0 0 1-6.6 0H6a3 3 0 0 1 0-6h0.2'
      stroke='currentColor'
      stroke-width='1.6'
      stroke-linecap='round'
      stroke-linejoin='round'
    />
  </svg>
);

const privateIcon = (
  <svg viewBox='0 0 24 24' fill='none' class='h-7 w-7 text-indigo-300'>
    <path
      d='M4 6h16v12H4z'
      stroke='currentColor'
      stroke-width='1.6'
      stroke-linejoin='round'
    />
    <path
      d='M8 10h8M8 14h5'
      stroke='currentColor'
      stroke-width='1.6'
      stroke-linecap='round'
    />
  </svg>
);

export type CloudConnectionsModalProps = {
  workspaceMgr: WorkspaceManager;
  onClose: () => void;
};

export function CloudConnectionsModal({
  workspaceMgr,
  onClose,
}: CloudConnectionsModalProps): JSX.Element {
  const eac = workspaceMgr.UseEaC();
  const {
    isAzureConnected,
    loading,
    canUseManaged,
    canUsePrivate,
    refreshAzureStatus,
  } = workspaceMgr.UseAzureAuth();

  const entLookup = eac?.EnterpriseLookup ?? '';
  const workspaceCloud = (eac?.Clouds || {})['Workspace'];
  const workspaceCloudDetails = workspaceCloud?.Details as
    | {
      Type?: string;
      Name?: string;
      Description?: string;
      SubscriptionID?: string;
      TenantID?: string;
    }
    | undefined;

  const [mode, setMode] = useState<'summary' | 'connect'>(
    workspaceCloudDetails ? 'summary' : 'connect',
  );
  const [checking, setChecking] = useState(false);
  const [isValid, setIsValid] = useState<boolean | undefined>(undefined);
  const [checkError, setCheckError] = useState<string | undefined>(undefined);
  const [creatingManaged, setCreatingManaged] = useState(false);
  const [managedError, setManagedError] = useState<string | undefined>(
    undefined,
  );
  const authRefreshTimeout = useRef<number | undefined>(undefined);
  const [authInFlight, setAuthInFlight] = useState(false);

  const connectionOptionCount = (canUseManaged ? 1 : 0) + (canUsePrivate ? 1 : 0);

  useEffect(() => {
    if (!IS_BROWSER) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== location.origin) {
        return;
      }

      const data = event.data as Record<string, unknown> | null;

      if (!data) {
        return;
      }

      const messageType = data.type;

      if (
        typeof messageType !== 'string' ||
        messageType !== 'azure-auth-success'
      ) {
        return;
      }

      if (authRefreshTimeout.current !== undefined) {
        clearTimeout(authRefreshTimeout.current);
        authRefreshTimeout.current = undefined;
      }

      setAuthInFlight(false);
      refreshAzureStatus();
    };

    addEventListener('message', handleMessage);

    return () => {
      removeEventListener('message', handleMessage);

      if (authRefreshTimeout.current !== undefined) {
        clearTimeout(authRefreshTimeout.current);
        authRefreshTimeout.current = undefined;
      }
    };
  }, [refreshAzureStatus]);

  const createManagedSubscription = async () => {
    setCreatingManaged(true);
    setManagedError(undefined);

    try {
      const resp = await fetch('/workspace/api/o-industrial/eac/clouds/subs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        const message = typeof data?.error === 'string'
          ? data.error
          : `Failed to start managed subscription (status ${resp.status}).`;
        setManagedError(message);
        return;
      }

      const redirectUrl = typeof data?.redirect === 'string' ? data.redirect : undefined;

      if (redirectUrl) {
        location.href = redirectUrl;
        return;
      }

      if (data?.status?.ID) {
        location.href = `/workspace/commit/${data.status.ID}`;
        return;
      }

      setManagedError(
        'Managed subscription provisioning returned an unexpected response.',
      );
    } catch (err) {
      setManagedError(
        err instanceof Error ? err.message : 'Unexpected error starting managed subscription.',
      );
    } finally {
      setCreatingManaged(false);
    }
  };

  const maskId = (id?: string) => {
    if (!id) return '----';
    const cleaned = id.replace(/[^a-zA-Z0-9]/g, '');
    const last = cleaned.slice(-4) || '----';
    return `****-****-****-${last}`;
  };

  const checkConnection = async () => {
    try {
      setChecking(true);
      setCheckError(undefined);
      setIsValid(undefined);
      const res = await fetch('/workspace/api/azure/validate-cloud');
      const data = await res.json();
      setIsValid(!!data?.valid);
      if (!data?.valid && data?.message) setCheckError(String(data.message));
    } catch (err) {
      setIsValid(false);
      setCheckError((err as Error).message);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (mode === 'summary' && workspaceCloudDetails) {
      checkConnection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, !!workspaceCloudDetails]);

  const heroConnected = mode === 'summary' && !!workspaceCloudDetails;
  const heroGlow = heroConnected
    ? 'from-emerald-400/40 via-lime-300/30 to-sky-400/40'
    : 'from-sky-500/40 via-cyan-400/30 to-indigo-400/40';
  const heroPillClass = heroConnected
    ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
    : 'border-sky-400/40 bg-sky-500/10 text-sky-200';
  const heroIconRing = heroConnected
    ? 'ring-emerald-400/60 text-emerald-200'
    : 'ring-sky-400/60 text-sky-200';
  const heroTitle = heroConnected
    ? 'Cloud connections are standing by'
    : 'Bridge your workspace to Azure';
  const heroDescription = heroConnected
    ? 'Refresh credentials, extend to new subscriptions, or double-check health with a few guided actions.'
    : 'Authenticate with Azure and choose a managed subscription or bring your own tenant - the workspace unlocks deployment-ready infrastructure either way.';

  return (
    <Modal title='Cloud Connections' onClose={onClose}>
      <div class='space-y-10 text-sm text-slate-200'>
        <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900/60 via-slate-900/30 to-slate-900/60 p-8 shadow-2xl'>
          <div class='relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
            <div class='space-y-4'>
              <span
                class={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${heroPillClass}`}
              >
                <span class='inline-flex h-2 w-2 rounded-full bg-current shadow-[0_0_8px_rgb(56_189_248/0.8)]'>
                </span>
                {heroConnected ? 'Connected' : 'Setup Flow'}
              </span>
              <h3 class='text-3xl font-semibold text-white md:text-4xl'>
                {heroTitle}
              </h3>
              <p class='max-w-2xl text-base leading-relaxed text-slate-300'>
                {heroDescription}
              </p>
            </div>
            <div class='relative isolate mt-4 flex h-28 w-full max-w-xs items-center justify-center lg:mt-0'>
              <div
                class={`absolute inset-0 rounded-full blur-2xl bg-gradient-to-tr ${heroGlow}`}
              >
              </div>
              <div
                class={`relative flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-900/70 backdrop-blur ring-1 ${heroIconRing}`}
              >
                <svg viewBox='0 0 32 32' class='h-12 w-12'>
                  <path
                    d='M9 18.5A6.5 6.5 0 0 1 15.3 12h1a7.2 7.2 0 0 1 6.7 4.2 4.8 4.8 0 0 1-4.5 6.8H12a3.5 3.5 0 0 1-3-4.5Z'
                    stroke='currentColor'
                    stroke-width='1.5'
                    stroke-linecap='round'
                    stroke-linejoin='round'
                    fill='none'
                  />
                  <path
                    d='M12 9a4 4 0 0 1 7.4-1.9'
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

        {!heroConnected && (
          <section class='grid gap-6 md:grid-cols-2'>
            {cloudHighlights.map((item) => (
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
                    <h4 class='text-lg font-semibold text-white'>
                      {item.title}
                    </h4>
                    <p class='text-sm leading-relaxed text-slate-300'>
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {heroConnected && workspaceCloudDetails && (
          <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-xl'>
            <div class='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-400/50 via-sky-400/40 to-cyan-400/50 opacity-80'>
            </div>
            <div class='grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(240px,1fr)]'>
              <div class='space-y-5'>
                <div class='space-y-2'>
                  <h4 class='text-xl font-semibold text-white'>
                    Workspace Cloud Connection
                  </h4>
                  <p class='text-sm text-slate-300'>
                    Safe summary of the subscription currently backing this workspace. Rotate
                    credentials or switch tenants whenever you need.
                  </p>
                </div>
                <dl class='grid gap-y-3 gap-x-8 text-sm text-slate-100 sm:grid-cols-2'>
                  <dt class='text-slate-400'>Provider</dt>
                  <dd>{workspaceCloudDetails.Type ?? 'Azure'}</dd>

                  <dt class='text-slate-400'>Name</dt>
                  <dd>{workspaceCloudDetails.Name ?? 'Workspace Cloud'}</dd>

                  <dt class='text-slate-400'>Subscription</dt>
                  <dd>{maskId(workspaceCloudDetails.SubscriptionID)}</dd>

                  <dt class='text-slate-400'>Tenant</dt>
                  <dd>{maskId(workspaceCloudDetails.TenantID)}</dd>
                </dl>
              </div>
              <div class='space-y-4 rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4 backdrop-blur'>
                <div class='flex items-center gap-3 text-sm font-medium text-slate-100'>
                  {checking
                    ? (
                      <>
                        <LoadingIcon class='h-4 w-4 animate-spin text-sky-300' />
                        <span>Checking connection...</span>
                      </>
                    )
                    : isValid === true
                    ? (
                      <>
                        <span class='inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]'>
                        </span>
                        <span>Connection valid</span>
                      </>
                    )
                    : isValid === false
                    ? (
                      <>
                        <span class='inline-block h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]'>
                        </span>
                        <span>Connection failed</span>
                      </>
                    )
                    : (
                      <>
                        <span class='inline-block h-2 w-2 rounded-full bg-slate-500'></span>
                        <span>Status unknown</span>
                      </>
                    )}
                </div>
                {checkError && <p class='text-xs text-rose-400 break-all'>{checkError}</p>}
                <div class='flex flex-wrap gap-2'>
                  <Action
                    intentType={IntentTypes.Primary}
                    styleType={ActionStyleTypes.Outline}
                    disabled={checking}
                    onClick={checkConnection}
                  >
                    {checking ? 'Checking...' : 'Recheck Connection'}
                  </Action>
                  <Action
                    intentType={IntentTypes.Primary}
                    onClick={() => setMode('connect')}
                  >
                    Renew Connection
                  </Action>
                </div>
              </div>
            </div>
          </section>
        )}

        {mode === 'connect' && (
          <section class='space-y-6'>
            {!canUseManaged && !canUsePrivate && (
              <div class='relative overflow-hidden rounded-3xl border border-amber-400/60 bg-amber-500/10 p-6 text-amber-100 shadow-xl'>
                <div class='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-amber-400/60 via-orange-400/50 to-pink-400/60 opacity-70'>
                </div>
                <h3 class='text-base font-semibold text-amber-100'>
                  Upgrade needed
                </h3>
                <p class='mt-2 text-sm text-amber-100/80'>
                  Your current plan does not include managed or private Azure connections. Upgrade
                  to the Pro or Sovereign plan to unlock these flows.
                </p>
              </div>
            )}

            {connectionOptionCount > 0 && (
              <div
                class={`grid gap-6 ${connectionOptionCount > 1 ? 'lg:grid-cols-2' : ''}`}
              >
                {canUseManaged && (
                  <ConnectionOptionCard
                    accent='from-sky-400/50 via-cyan-400/40 to-emerald-400/50'
                    icon={managedIcon}
                    title='Managed Azure Subscription'
                    description='Launch into our managed tenant in minutes - Open Industrial provisions, secures, and keeps the subscription compliant with automatic credential rotation.'
                  >
                    <div class='space-y-4'>
                      <ul class='space-y-2 text-sm text-slate-300'>
                        {managedFeatures.map((feature) => (
                          <li class='flex items-start gap-2' key={feature}>
                            <span class='mt-1 h-1.5 w-1.5 rounded-full bg-sky-400'></span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div class='flex flex-wrap gap-2'>
                        <Action
                          intentType={IntentTypes.Primary}
                          styleType={ActionStyleTypes.Outline}
                          disabled={creatingManaged}
                          onClick={createManagedSubscription}
                        >
                          {creatingManaged ? 'Provisioning...' : 'Create Managed Subscription'}
                        </Action>
                        {managedError && (
                          <p class='w-full text-sm text-rose-300'>
                            {managedError}
                          </p>
                        )}
                      </div>
                    </div>
                  </ConnectionOptionCard>
                )}

                {canUsePrivate && (
                  <ConnectionOptionCard
                    accent='from-indigo-400/50 via-sky-400/40 to-cyan-400/50'
                    icon={privateIcon}
                    title='Private Azure Cloud'
                    description='Authenticate once and connect your own subscription - select existing tenants, create new ones, or register service principals to match your governance model.'
                  >
                    <div class='space-y-4'>
                      {loading && (
                        <div class='flex items-center justify-center py-10'>
                          <LoadingIcon class='h-10 w-10 animate-spin text-sky-300' />
                        </div>
                      )}

                      {!loading && !isAzureConnected && (
                        <div class='space-y-4 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4'>
                          <p class='text-sm text-slate-300'>
                            Sign in with Microsoft so Open Industrial can discover subscriptions and
                            stage the required service principals.
                          </p>
                          <CloudConnectAzureForm
                            action='./azure/oauth/signin'
                            data-eac-bypass-base
                            actionText='Sign in with Microsoft'
                            submitDisabled={authInFlight}
                            onSubmitCapture={() => {
                              setAuthInFlight(true);

                              if (!IS_BROWSER) {
                                refreshAzureStatus();
                                return;
                              }

                              if (authRefreshTimeout.current !== undefined) {
                                clearTimeout(authRefreshTimeout.current);
                              }

                              authRefreshTimeout.current = setTimeout(() => {
                                authRefreshTimeout.current = undefined;
                                setAuthInFlight(false);
                                refreshAzureStatus();
                              }, 5000);
                            }}
                          />
                          {authInFlight && (
                            <p class='text-xs text-slate-400'>
                              Complete the Microsoft sign-in popup to continue.
                            </p>
                          )}
                        </div>
                      )}

                      {!loading && isAzureConnected && (
                        <div class='space-y-4'>
                          <div class='rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4'>
                            <TabbedPanel
                              tabs={[
                                {
                                  key: 'existing',
                                  label: 'Select Subscription',
                                  content: (
                                    <EaCSelectSubscriptionForm
                                      data-eac-bypass-base
                                      entLookup={entLookup}
                                      cloudLookup=''
                                    />
                                  ),
                                },
                                {
                                  key: 'create',
                                  label: 'Create Subscription',
                                  content: (
                                    <EaCCreateSubscriptionForm
                                      data-eac-bypass-base
                                      entLookup={entLookup}
                                      cloudLookup=''
                                    />
                                  ),
                                },
                                {
                                  key: 'manual',
                                  label: 'Manual (IDs + Secret)',
                                  content: (
                                    <EaCManageCloudForm
                                      action='/workspace/api/o-industrial/eac/clouds'
                                      data-eac-bypass-base
                                      entLookup={entLookup}
                                      cloudLookup=''
                                    />
                                  ),
                                },
                              ]}
                            />
                          </div>
                          <p class='text-xs text-slate-400'>
                            Tip: capture subscription owners in your runbook so CALZ automation can
                            assign access consistently.
                          </p>
                        </div>
                      )}

                      {workspaceCloudDetails && (
                        <div class='flex flex-wrap gap-2'>
                          <Action
                            styleType={ActionStyleTypes.Outline}
                            onClick={() => setMode('summary')}
                          >
                            Back to Overview
                          </Action>
                        </div>
                      )}
                    </div>
                  </ConnectionOptionCard>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </Modal>
  );
}

CloudConnectionsModal.Modal = (
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
          <CloudConnectionsModal
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

export default CloudConnectionsModal;
