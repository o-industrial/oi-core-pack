import {
  Action,
  ActionStyleTypes,
  JSX,
  LoadingIcon,
  Modal,
  Select,
  useEffect,
  useRef,
  useState,
  WorkspaceManager,
  EaCStatus,
  EaCStatusProcessingTypes,
  EaCFoundationAsCode,
  EaCFoundationDetails,
  EaCServiceDefinitions,
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

const [baseHighlight, secureHighlight] = foundationHighlights;

const WORKSPACE_CLOUD_LOOKUP = 'Workspace';
const WORKSPACE_FOUNDATION_LOOKUP = 'cloud-foundation-plan';
const DEFAULT_FOUNDATION_NAME = 'Private Cloud Foundation Plan';
const DEFAULT_FOUNDATION_DESCRIPTION =
  'Blueprint inputs for provisioning the workspace landing zone and guardrails.';

type FoundationPlanDraft = Partial<EaCFoundationDetails>;

type PreconnectHighlight = {
  title: string;
  description: string;
  accent: string;
  icon: JSX.Element;
};

type FoundationCommitStatus = Partial<EaCStatus> & {
  CommitID?: string;
  ID?: string;
  Processing: EaCStatus['Processing'];
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
  const workspaceCloud = (eac?.Clouds || {})[WORKSPACE_CLOUD_LOOKUP];
  const foundationEntries = Object.entries(eac?.Foundations ?? {}) as Array<
    [string, EaCFoundationAsCode]
  >;
  const workspaceFoundationEntry = foundationEntries.find(([, foundation]) =>
    foundation?.CloudLookup === WORKSPACE_CLOUD_LOOKUP
  );
  const workspaceFoundationLookup = workspaceFoundationEntry?.[0] ??
    WORKSPACE_FOUNDATION_LOOKUP;
  const workspaceFoundation = workspaceFoundationEntry?.[1];
  const foundationDetails = workspaceFoundation?.Details as
    | EaCFoundationDetails
    | undefined;
  const foundationOutputs = foundationDetails?.Outputs as
    | Record<string, unknown>
    | undefined;
  const [locations, setLocations] = useState<{ Name: string }[]>([]);
  const [locationError, setLocationError] = useState<string | undefined>(undefined);
  const [loadingLocs, setLoadingLocs] = useState(false);
  const [foundationViewInternal, setFoundationViewInternal] = useState<'plan' | 'manage'>('plan');
  const viewManuallyChanged = useRef(false);
  const [region, setRegion] = useState(
    foundationDetails?.ResourceGroup?.Location ?? '',
  );
  const [rgName, setRgName] = useState(
    foundationDetails?.ResourceGroup?.Name ?? eac.Details?.Name ?? eac.EnterpriseLookup,
  );
  const [baseBusy, setBaseBusy] = useState(false);
  const [baseDone, setBaseDone] = useState(
    Boolean(foundationOutputs && 'LandingZone' in foundationOutputs),
  );
  const [baseErr, setBaseErr] = useState<string | undefined>(undefined);
  const [runQueued, setRunQueued] = useState(false);
  const [previousCommitId, setPreviousCommitId] = useState<string | null>(null);
  const [latestCommitStatus, setLatestCommitStatus] = useState<FoundationCommitStatus | null>(null);
  const [latestCommitError, setLatestCommitError] = useState<string | null>(null);

  const setFoundationView = (view: 'plan' | 'manage', manual = false) => {
    if (manual) viewManuallyChanged.current = true;
    setFoundationViewInternal(view);
  };

  const handleViewChange = (view: 'plan' | 'manage') => {
    setFoundationView(view, true);
  };

  const foundationView = foundationViewInternal;

  useEffect(() => {
    if ((foundationOutputs || runQueued || latestCommitStatus) && !viewManuallyChanged.current) {
      setFoundationViewInternal('manage');
    }
  }, [foundationOutputs, runQueued, latestCommitStatus]);

  useEffect(() => {
    if (!foundationDetails) return;
    if (foundationViewInternal === 'manage') {
      const group = foundationDetails.ResourceGroup ?? {};
      if (group.Name) setRgName(group.Name);
      if (group.Location) setRegion(group.Location);
    }
  }, [
    foundationDetails?.ResourceGroup?.Name,
    foundationDetails?.ResourceGroup?.Location,
    foundationViewInternal,
  ]);

  useEffect(() => {
    const landingZone = Boolean((foundationOutputs as Record<string, unknown> | undefined)?.LandingZone);
    setBaseDone(landingZone);
    if (landingZone) {
      setRunQueued(false);
    }
  }, [foundationOutputs?.LandingZone]);

const buildFoundationDetails = (
  overrides: FoundationPlanDraft = {},
): EaCFoundationDetails => ({
  Type: overrides.Type ?? foundationDetails?.Type ?? 'CloudFoundationPlan',
  Name: overrides.Name ?? foundationDetails?.Name ?? DEFAULT_FOUNDATION_NAME,
    Description: overrides.Description ??
      foundationDetails?.Description ??
      DEFAULT_FOUNDATION_DESCRIPTION,
    Order: overrides.Order ?? foundationDetails?.Order ?? 1,
    WorkspaceLookup: overrides.WorkspaceLookup ??
      foundationDetails?.WorkspaceLookup ??
      eac?.EnterpriseLookup ??
      '',
    ResourceGroup: {
      Name: overrides.ResourceGroup?.Name ??
        foundationDetails?.ResourceGroup?.Name ??
        rgName,
      Location: overrides.ResourceGroup?.Location ??
        foundationDetails?.ResourceGroup?.Location ??
        region,
      Tags: overrides.ResourceGroup?.Tags ??
        foundationDetails?.ResourceGroup?.Tags,
    },
    Network: overrides.Network ?? foundationDetails?.Network,
    KeyVault: overrides.KeyVault ?? foundationDetails?.KeyVault,
    LogAnalytics: overrides.LogAnalytics ?? foundationDetails?.LogAnalytics,
    Diagnostics: overrides.Diagnostics ?? foundationDetails?.Diagnostics,
    Governance: overrides.Governance ?? foundationDetails?.Governance,
    Outputs: foundationDetails?.Outputs,
  });

const mergeFoundationPartial = (details: EaCFoundationDetails) => {
  workspaceMgr.EaC.MergePartial({
    Foundations: {
      [workspaceFoundationLookup]: {
        CloudLookup: WORKSPACE_CLOUD_LOOKUP,
          Details: details,
        },
      },
    } as unknown as Record<string, unknown>);
  };

  const loadLocations = async () => {
    try {
      setLoadingLocs(true);
      setLocationError(undefined);

      const res = await fetch('/workspace/api/azure/locations', {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          ...workspaceMgr.GetAuthHeaders(),
        },
      });

      if (!res.ok) {
        throw new Error(`Unable to load locations (status ${res.status})`);
      }

      const data = await res.json();

      const locs = (data?.Locations ?? []) as {
        name?: string;
        displayName?: string;
      }[];
      const mapped = locs
        .map((l) => ({ Name: l.displayName || l.name || '' }))
        .filter((l) => l.Name);
      setLocations(mapped);
      const hasSelectedRegion = mapped.some((loc) => loc.Name === region);
      if (mapped.length > 0) {
        if (!hasSelectedRegion) {
          setRegion(mapped[0].Name);
        }
      } else if (!hasSelectedRegion) {
        setRegion('');
      }
    } catch (err) {
      console.error('Failed to load locations', err);
      setLocationError('Unable to load Azure regions automatically. Select or enter a region manually.');
      setLocations([]);
      setRegion('');
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
      handleViewChange('manage');
      const workspaceLookup = eac?.EnterpriseLookup || '';
      const draftDetails = buildFoundationDetails({
        WorkspaceLookup: workspaceLookup,
        ResourceGroup: {
          Name: rgName,
          Location: region,
        },
      });
      const payloadDetails = { ...draftDetails } as EaCFoundationDetails;
      delete (payloadDetails as Record<string, unknown>).Outputs;

      const res = await fetch('/workspace/api/o-industrial/calz/base', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          region,
          rgName,
          foundationPlan: payloadDetails,
        }),
      });
      if (!res.ok) {
        throw new Error(`Foundation request failed (status ${res.status})`);
      }
      const data = await res.json();
      if (!data?.status) throw new Error('No status returned');
      const statusPayload = data.status as FoundationCommitStatus;
      const resolvedCommitId = typeof data.commitId === 'string' && data.commitId.length > 0
        ? data.commitId
        : statusPayload.CommitID ?? statusPayload.ID ?? '';
      const normalizedStatus: FoundationCommitStatus = {
        ...statusPayload,
        CommitID: statusPayload.CommitID ?? (resolvedCommitId || undefined),
        ID: statusPayload.ID ?? (resolvedCommitId || statusPayload.CommitID),
        Processing: statusPayload.Processing ?? EaCStatusProcessingTypes.PROCESSING,
      };
      mergeFoundationPartial(payloadDetails);
      setLatestCommitStatus(normalizedStatus);
      setLatestCommitError(null);
      setRunQueued(true);
      if (resolvedCommitId) {
        setPreviousCommitId(resolvedCommitId);
      } else if (lastCommitId) {
        setPreviousCommitId(lastCommitId);
      } else {
        setPreviousCommitId((prev) => prev ?? 'Pending run');
      }
    } catch (err) {
      setBaseErr((err as Error).message);
      setLatestCommitStatus(null);
      setLatestCommitError((err as Error).message);
      handleViewChange('plan');
      setRunQueued(false);
    } finally {
      setBaseBusy(false);
    }
  };

  useEffect(() => {
    if (!previousCommitId || !runQueued) {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      if (cancelled) return;

      let nextDelay = 4000;

      try {
        const status = await workspaceMgr.GetCommitStatus(previousCommitId);
        if (cancelled) return;

        const normalized: FoundationCommitStatus = {
          ...status,
          CommitID: status.CommitID ?? status.ID ?? previousCommitId,
          ID: status.ID ?? status.CommitID ?? previousCommitId,
          Processing: status.Processing,
        };

        setLatestCommitStatus(normalized);
        setLatestCommitError(null);

        if (
          status.Processing === EaCStatusProcessingTypes.COMPLETE ||
          status.Processing === EaCStatusProcessingTypes.ERROR
        ) {
          setRunQueued(false);
          return;
        }
      } catch (err) {
        if (cancelled) return;
        setLatestCommitError((err as Error).message);
        nextDelay = 6000;
      }

      timeoutId = setTimeout(poll, nextDelay);
    };

    poll();

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [previousCommitId, runQueued, workspaceMgr]);

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
      : 'Design your private cloud foundation'
    : 'Connect a workspace cloud to begin';
  const heroDescription = hasWorkspaceCloud
    ? isManagingFoundation
      ? 'Watch the landing zone baseline come online, track hardening tasks, and keep security operations aligned as workloads move in.'
      : 'Lay down the landing zone resource group, networking, and governance guardrails to back every workload from the start while the review below keeps the blueprint transparent.'
    : 'Link a workspace cloud first. Once connected, this guide unlocks private foundation automation tailored to your environment.';
  const heroPillText = hasWorkspaceCloud
    ? isManagingFoundation ? 'Foundation Management' : 'Plan Foundation'
    : 'First Step';
  const outputsRecord = foundationOutputs as
    | {
      LandingZone?: unknown;
      KeyVault?: unknown;
      LogAnalytics?: unknown;
      Diagnostics?: unknown;
      Governance?: unknown;
    }
    | undefined;
  const landingZoneReady = Boolean(outputsRecord?.LandingZone);
  const keyVaultReady = Boolean(outputsRecord?.KeyVault);
  const logAnalyticsReady = Boolean(outputsRecord?.LogAnalytics);
  const diagnosticsReady = Boolean(outputsRecord?.Diagnostics);
  const governanceReady = Boolean(outputsRecord?.Governance);
  const commitProcessingState = latestCommitStatus?.Processing;
  const commitStateIsError = commitProcessingState === EaCStatusProcessingTypes.ERROR;
  const commitStateIsComplete = commitProcessingState === EaCStatusProcessingTypes.COMPLETE;
  const commitStateIsActive = commitProcessingState
    ? commitProcessingState !== EaCStatusProcessingTypes.COMPLETE &&
      commitProcessingState !== EaCStatusProcessingTypes.ERROR
    : false;
  const provisioningInFlight = baseBusy || commitStateIsActive;
  const foundationReady = landingZoneReady;
  const foundationStarted = Boolean(
    commitStateIsActive ||
      commitProcessingState === EaCStatusProcessingTypes.QUEUED ||
      runQueued ||
      baseBusy ||
      foundationReady,
  );
  const managementStatusClass = (() => {
    if (commitStateIsError) return 'text-rose-300';
    if (commitStateIsComplete) return 'text-emerald-300';
    if (commitStateIsActive || baseBusy) return 'text-sky-300';
    if (foundationReady) return 'text-emerald-300';
    if (foundationStarted) return 'text-slate-300';
    return 'text-slate-500';
  })();
  const managementStatusText = (() => {
    if (commitProcessingState) {
      switch (commitProcessingState) {
        case EaCStatusProcessingTypes.COMPLETE:
          return 'Foundation ready';
        case EaCStatusProcessingTypes.ERROR:
          return 'Error';
        case EaCStatusProcessingTypes.PROCESSING:
          return 'Provisioning...';
        case EaCStatusProcessingTypes.QUEUED:
          return 'Queued';
        default: {
          const formatted = commitProcessingState.toLowerCase();
          return formatted.charAt(0).toUpperCase() + formatted.slice(1);
        }
      }
    }
    if (provisioningInFlight) return 'Provisioning...';
    if (foundationReady) return 'Foundation ready';
    if (foundationStarted) return 'Queued';
    return 'Not started';
  })();
  const commitStatusBadgeClass = (() => {
    if (commitStateIsError) return 'text-rose-300';
    if (commitStateIsComplete) return 'text-emerald-300';
    if (commitStateIsActive || baseBusy) return 'text-sky-300';
    return 'text-slate-400';
  })();
  const latestCommitDisplayId = latestCommitStatus?.ID ?? latestCommitStatus?.CommitID ?? previousCommitId ?? '';
  const latestCommitStageEntries = latestCommitStatus?.StageStates &&
      typeof latestCommitStatus.StageStates === 'object'
    ? Object.entries(
      latestCommitStatus.StageStates as Record<
        string,
        { status?: string; message?: string }
      >,
    )
    : [];
  const unitStatus = (
    readyCondition: boolean,
    ready: string,
    provisioning: string,
    queued: string,
    idle: string,
  ) => {
    if (commitStateIsError) return 'Error';
    if (readyCondition) return ready;
    if (provisioningInFlight) return provisioning;
    if (foundationStarted) return queued;
    return idle;
  };
  const lastCommitId = typeof (foundationOutputs as { CommitID?: unknown } | undefined)?.CommitID ===
      'string'
    ? (foundationOutputs as { CommitID?: string }).CommitID
    : undefined;
  useEffect(() => {
    if (lastCommitId) {
      setPreviousCommitId(lastCommitId);
    }
  }, [lastCommitId]);
  const blueprintCards = [
    {
      title: 'Landing zone resource group',
      summary: `${rgName || 'Resource group TBD'} - ${region || 'Region pending'}`,
      why:
        'Scopes the private foundation, centralizing policy, secrets, and networking assets for downstream workloads.',
    },
    {
      title: 'Virtual network & subnets',
      summary: 'Creates isolated network fabric with workload-ready subnets and routing defaults.',
      why:
        'Gives every environment a secure, traffic-controlled runway before applications arrive.',
    },
    {
      title: 'Azure Key Vault',
      summary: 'Deploys a managed vault aligned to the landing zone naming.',
      why: 'Keeps secrets, certificates, and identity wiring standardized from day zero.',
    },
    {
      title: 'Log Analytics & Monitor',
      summary: 'Provisions Log Analytics workspace plus baseline metric/log forwarding.',
      why: 'Delivers observability guardrails so operations teams inherit actionable telemetry.',
    },
    {
      title: 'Policy & RBAC guardrails',
      summary: 'Applies baseline Azure Policy assignments and role definitions tied to the zone.',
      why:
        'Ensures governance and compliance requirements are enforced automatically as apps land.',
    },
  ];
  const managementCards = [
    {
      title: 'Azure Key Vault',
      status: unitStatus(
        keyVaultReady,
        'Ready for secrets',
        'Provisioning vault resources...',
        'Waiting for foundation start',
        'Not yet started',
      ),
      description:
        'Import certificates, set access policies, and confirm rotation cadence for shared secrets.',
    },
    {
      title: 'Log Analytics Workspace',
      status: unitStatus(
        logAnalyticsReady,
        'Connected to RG',
        'Linking diagnostic settings...',
        'Awaiting base resources',
        'Not yet started',
      ),
      description:
        'Map resource diagnostic settings and define retention so operations insights stay actionable.',
    },
    {
      title: 'Monitor & Alerts',
      status: unitStatus(
        diagnosticsReady,
        'Baseline rules queued',
        'Syncing default alerts...',
        'Activate after foundation deploy',
        'Not yet started',
      ),
      description: 'Review default metric alerts and wire them into your on-call tooling.',
    },
    {
      title: 'Policy & RBAC',
      status: unitStatus(
        governanceReady,
        'Assignments staged',
        'Applying governance guardrails...',
        'Compile requirements',
        'Not yet started',
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

        {!hasWorkspaceCloud && (
          <section class='space-y-6'>
            <div class='relative overflow-hidden rounded-3xl border border-amber-400/60 bg-amber-500/10 p-6 text-amber-100 shadow-xl'>
              <div class='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-amber-400/60 via-orange-400/50 to-pink-400/60 opacity-70 rounded-t-3xl'>
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
                    class={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent} opacity-80 rounded-t-3xl`}
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
          <section class='space-y-6'>
            {foundationView === 'plan' && (
              <>
                <div class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-xl space-y-6'>
                  <div class={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${baseHighlight.accent} opacity-80 rounded-t-3xl`}>
                  </div>
                  <div class='relative space-y-6'>
                    <div class='flex items-start gap-4'>
                      <div
                        class={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${baseHighlight.accent} text-slate-900 shadow-lg`}
                      >
                        {baseHighlight.icon}
                      </div>
                      <div class='space-y-2'>
                        <h4 class='text-xl font-semibold text-white'>{baseHighlight.title}</h4>
                        <p class='text-sm leading-relaxed text-slate-300'>
                          {baseHighlight.description}
                        </p>
                        <div class='space-y-1 text-xs leading-relaxed text-slate-400'>
                          <p>
                            Choose the resource group and default region. These anchor the landing zone
                            templates the automation will apply for your private cloud foundation.
                          </p>
                          <p>
                            Adjust these inputs anytime before you start provisioning. The live review
                            below mirrors every change so stakeholders can see exactly what will deploy.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div class='space-y-5'>
                      <div class='space-y-4 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5'>
                        <div class='grid gap-4 md:grid-cols-2'>
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
                        <Select
                          searchable
                          searchPlaceholder='Search regions...'
                          noResultsText='No matching regions'
                          value={region}
                          disabled={loadingLocs}
                          onChange={(event) =>
                            setRegion((event.target as HTMLSelectElement).value)}
                        >
                          {locations.length > 0
                            ? locations.map((l) => (
                              <option value={l.Name} key={l.Name}>
                                {l.Name}
                              </option>
                            ))
                            : (
                              <option value=''>
                                {locationError ?? 'No regions available'}
                              </option>
                            )}
                        </Select>
                        {locationError && (
                          <p class='mt-2 text-xs text-amber-300'>{locationError}</p>
                        )}
                            <div class='mt-2 space-y-1'>
                              <div class='flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400'>
                                <span>
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
                                </span>
                                <button
                                  type='button'
                                  class='text-xs font-semibold text-sky-300 hover:text-sky-200 disabled:text-slate-500'
                                  onClick={loadLocations}
                                  disabled={loadingLocs}
                                >
                                  {loadingLocs ? 'Refreshing...' : 'Refresh'}
                                </button>
                              </div>
                              {!loadingLocs && locations.length === 0 && (
                                <div class='text-xs text-amber-300'>
                                  No regions returned. Refresh after your subscription permissions are
                                  confirmed.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {baseErr && <div class='text-xs text-rose-400'>{baseErr}</div>}
                      </div>
                      <div class='pt-2'>
                        <div class='sticky bottom-4 z-20 rounded-2xl border border-slate-700/70 bg-slate-950/90 p-4 shadow-xl backdrop-blur'>
                          <div class='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                            <div class='flex flex-wrap items-center gap-3'>
                              <Action
                                onClick={submitBase}
                                disabled={baseBusy || !region || !rgName || loadingLocs}
                              >
                                {baseBusy ? 'Provisioning foundation...' : 'Start provisioning'}
                              </Action>
                            </div>
                            <span class='text-xs text-slate-400'>
                              Clicking start provisioning moves you to the management dashboard.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-xl space-y-6'>
                  <div class={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${secureHighlight.accent} opacity-80 rounded-t-3xl`}>
                  </div>
                  <div class='relative space-y-5'>
                    <div class='flex items-start gap-4'>
                      <div
                        class={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${secureHighlight.accent} text-slate-900 shadow-lg`}
                      >
                        {secureHighlight.icon}
                      </div>
                      <div class='space-y-2'>
                        <h4 class='text-xl font-semibold text-white'>{secureHighlight.title}</h4>
                        <p class='text-sm leading-relaxed text-slate-300'>
                          {secureHighlight.description}
                        </p>
                        <p class='text-xs text-slate-400 leading-relaxed'>
                          Confirm the resources and guardrails that will deploy with this foundation.
                        </p>
                      </div>
                    </div>
                    <div class='space-y-4'>
                      <div class='grid gap-3 sm:grid-cols-2'>
                        <div class='rounded-xl border border-slate-700/60 bg-slate-900/60 p-3 text-xs text-slate-300'>
                          <div class='font-semibold text-slate-100'>Resource group</div>
                          <div class='mt-1'>
                            {rgName || 'Not set'}
                          </div>
                        </div>
                        <div class='rounded-xl border border-slate-700/60 bg-slate-900/60 p-3 text-xs text-slate-300'>
                          <div class='font-semibold text-slate-100'>Region</div>
                          <div class='mt-1'>
                            {region || 'Select a region'}
                          </div>
                        </div>
                      </div>
                      <div class='grid gap-4 md:grid-cols-2'>
                        {blueprintCards.map((item) => (
                          <div
                            key={item.title}
                            class='rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4'
                          >
                            <div class='text-sm font-semibold text-white'>{item.title}</div>
                            <div class='mt-1 text-xs text-slate-300'>{item.summary}</div>
                            <p class='mt-2 text-xs text-slate-400 leading-relaxed'>{item.why}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {foundationView === 'manage' && (
              <>
                <div class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-xl space-y-5'>
                  <div class={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${baseHighlight.accent} opacity-80 rounded-t-3xl`}>
                  </div>
                  <div class='relative space-y-5'>
                    <div class='flex items-start gap-4'>
                      <div
                        class={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${baseHighlight.accent} text-slate-900 shadow-lg`}
                      >
                        {baseHighlight.icon}
                      </div>
                      <div class='space-y-2'>
                        <h4 class='text-xl font-semibold text-white'>{baseHighlight.title}</h4>
                        <p class='text-sm leading-relaxed text-slate-300'>
                          Keep this view open while automation runs. We will extend it with live activity
                          and hand-offs for security operations next.
                        </p>
                      </div>
                    </div>
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
                      {previousCommitId && (
                        <p class='text-xs text-slate-400'>
                          Last foundation run: {previousCommitId}
                        </p>
                      )}
                      {latestCommitStatus && (
                        <div class='space-y-2 rounded-xl border border-slate-800/60 bg-slate-900/70 p-4'>
                          <div class='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
                            <div class='text-xs text-slate-300'>
                              Commit ID:{' '}
                              <span class='font-mono text-slate-100'>
                                {latestCommitDisplayId || 'Pending assignment'}
                              </span>
                            </div>
                            <span class={`text-xs font-semibold ${commitStatusBadgeClass}`}>
                              {managementStatusText}
                            </span>
                          </div>
                          {latestCommitError && (
                            <div class='text-xs text-amber-300'>
                              {latestCommitError}
                            </div>
                          )}
                          {latestCommitStatus.Messages?.Error && (
                            <div class='text-xs text-rose-300'>
                              {String(latestCommitStatus.Messages.Error)}
                            </div>
                          )}
                          {latestCommitStageEntries.length > 0 && (
                            <div class='space-y-1 text-xs text-slate-400'>
                              {latestCommitStageEntries.map(([stage, state]) => (
                                <div key={stage} class='flex flex-col gap-0.5'>
                                  <span class='text-slate-200 font-semibold uppercase tracking-wide text-[0.65rem]'>
                                    {stage}
                                  </span>
                                  <span>
                                    {(state?.status ?? 'pending').toString()}
                                    {state?.message
                                      ? (
                                        <span class='text-slate-500'>
                                          {' '}— {state.message}
                                        </span>
                                      )
                                      : null}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-xl space-y-5'>
                  <div class={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${secureHighlight.accent} opacity-80 rounded-t-3xl`}>
                  </div>
                  <div class='relative space-y-5'>
                    <div class='flex items-start gap-4'>
                      <div
                        class={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${secureHighlight.accent} text-slate-900 shadow-lg`}
                      >
                        {secureHighlight.icon}
                      </div>
                      <div class='space-y-2'>
                        <h4 class='text-xl font-semibold text-white'>{secureHighlight.title}</h4>
                        <p class='text-sm leading-relaxed text-slate-300'>
                          Follow each track to confirm your operations guardrails finish landing.
                        </p>
                      </div>
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
                </div>
              </>
            )}

            <div class='rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 text-slate-300'>
              Want it faster? Email{' '}
              <a
                href='mailto:support@openindustrial.co?subject=Private%20Cloud%20Foundation%20Setup'
                class='font-semibold text-sky-300 hover:text-sky-200'
              >
                support@openindustrial.co
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
