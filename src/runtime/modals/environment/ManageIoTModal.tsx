import {
  Action,
  ActionStyleTypes,
  IntentTypes,
  JSX,
  Modal,
  useEffect,
  useMemo,
  useState,
  WorkspaceManager,
} from '../../../.deps.ts';

type FlowKey = 'hot' | 'warm' | 'cold';

type FlowOption = {
  key: FlowKey;
  label: string;
  description: string;
};

const flowOptions: FlowOption[] = [
  {
    key: 'hot',
    label: 'Hot path',
    description:
      'Low latency event routing into streaming dashboards and alerting hooks.',
  },
  {
    key: 'warm',
    label: 'Warm path',
    description:
      'Operational storage with ADX and enriched transformations for analytics workloads.',
  },
  {
    key: 'cold',
    label: 'Cold path',
    description:
      'Long-term archival into Data Lake or Blob for compliance and ML training.',
  },
];

type FabricHighlight = {
  title: string;
  accent: string;
  icon: JSX.Element;
  description: string;
};

const fabricHighlights: FabricHighlight[] = [
  {
    title: 'IoT Hub & DPS',
    accent: 'from-sky-500/70 via-indigo-500/70 to-cyan-400/70',
    description:
      'Scale device onboarding with per-tenant enrollment groups and plug secure tunnel options into your fleet tooling.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" class="h-6 w-6">
        <path
          d="M7 7h2a2 2 0 1 1 0 4H7zm8 6h2a2 2 0 1 1 0 4h-2z"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="m9 9 6 6"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        />
        <path
          d="M17 5V3M17 21v-2M21 7h2M19 7h-2M5 17H3m4 0h2"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        />
      </svg>
    ),
  },
  {
    title: 'Data Explorer',
    accent: 'from-emerald-500/70 via-teal-500/70 to-sky-400/70',
    description:
      'Shape ADX databases for warm telemetry, retention policies, and near real-time analytics queries.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" class="h-6 w-6">
        <path d="M4 4h16v16H4z" stroke="currentColor" stroke-width="1.6" />
        <path d="M8 8h8v8H8z" stroke="currentColor" stroke-width="1.6" />
      </svg>
    ),
  },
  {
    title: 'Transformations',
    accent: 'from-fuchsia-500/70 via-violet-500/70 to-sky-500/70',
    description:
      'Pre-wire Stream Analytics or Functions to shape payloads before they land in business systems.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" class="h-6 w-6">
        <path
          d="m7 7 10 10M7 17 17 7"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        />
        <path
          d="M4 12h1m14 0h1"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        />
      </svg>
    ),
  },
];

export type ManageIoTModalProps = {
  workspaceMgr: WorkspaceManager;
  onClose: () => void;
};

export function ManageIoTModal({
  workspaceMgr,
  onClose,
}: ManageIoTModalProps): JSX.Element {
  const eac = workspaceMgr.UseEaC();
  const workspaceCloud = (eac?.Clouds || {})['Workspace'];
  const hasWorkspaceCloud = !!workspaceCloud?.Details;

  const defaultRg = useMemo(() => {
    const maybeName = workspaceCloud?.Details?.ResourceGroup as
      | string
      | undefined;
    return maybeName && maybeName.length > 0
      ? maybeName
      : eac.Details?.Name ?? eac.EnterpriseLookup;
  }, [workspaceCloud?.Details?.ResourceGroup]);

  const [rgName, setRgName] = useState(defaultRg);
  const [flowSelections, setFlowSelections] = useState<
    Record<FlowKey, boolean>
  >({
    hot: true,
    warm: true,
    cold: false,
  });
  const [useDps, setUseDps] = useState(true);
  const [useEdgeModules, setUseEdgeModules] = useState(false);
  const [notes, setNotes] = useState('');

  const [iotBusy, setIotBusy] = useState(false);
  const [iotDone, setIotDone] = useState(false);
  const [iotErr, setIotErr] = useState<string | undefined>(undefined);

  useEffect(() => {
    setRgName(defaultRg);
  }, [defaultRg]);

  const selectedFlows = useMemo(
    () => flowOptions.filter((opt) => flowSelections[opt.key]),
    [flowSelections]
  );

  const toggleFlow = (key: FlowKey) => {
    setFlowSelections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const submitIoT = async () => {
    try {
      setIotBusy(true);
      setIotErr(undefined);
      const payload = {
        rgName,
      };

      const res = await fetch('/workspace/api/o-industrial/calz/iot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data?.status) throw new Error('No status returned');
      setIotDone(true);
    } catch (err) {
      setIotErr((err as Error).message);
    } finally {
      setIotBusy(false);
    }
  };

  const heroPill = hasWorkspaceCloud ? 'IoT Fabric' : 'First Step';
  const heroTitle = hasWorkspaceCloud
    ? 'Configure your IoT foundation'
    : 'Connect a workspace cloud to manage IoT';
  const heroDescription = hasWorkspaceCloud
    ? 'Roll out IoT Hub, DPS, warm/cold pathways, and monitoring so devices can stream into Open Industrial with confidence.'
    : 'Once a workspace cloud is connected, you can stage IoT Hub, data flows, and monitoring from this console.';

  return (
    <Modal title="Manage IoT Fabric" onClose={onClose}>
      <div class="space-y-10 text-sm text-slate-200">
        <section class="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900/60 via-slate-900/30 to-slate-900/60 p-8 shadow-2xl">
          <div class="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div class="space-y-4">
              <span
                class={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                  hasWorkspaceCloud
                    ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-amber-400/40 bg-amber-500/10 text-amber-200'
                }`}
              >
                <span class="inline-flex h-2 w-2 rounded-full bg-current shadow-[0_0_8px_rgb(56_189_248/0.75)]"></span>
                {heroPill}
              </span>
              <h3 class="text-3xl font-semibold text-white md:text-4xl">
                {heroTitle}
              </h3>
              <p class="max-w-3xl text-base leading-relaxed text-slate-300">
                {heroDescription}
              </p>
            </div>
            <div class="relative isolate mt-4 flex h-28 w-full max-w-xs items-center justify-center lg:mt-0">
              <div
                class={`absolute inset-0 rounded-full blur-2xl bg-gradient-to-tr ${
                  hasWorkspaceCloud
                    ? 'from-emerald-400/40 via-teal-300/30 to-sky-400/40'
                    : 'from-amber-400/40 via-orange-400/40 to-pink-400/40'
                }`}
              ></div>
              <div class="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-900/70 backdrop-blur ring-1 ring-sky-400/60">
                <svg viewBox="0 0 32 32" class="h-12 w-12 text-sky-200">
                  <path
                    d="M10 22v-6l6-4 6 4v6"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    fill="none"
                  />
                  <path
                    d="M8 24h16"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        <section class="grid gap-6 md:grid-cols-3">
          {fabricHighlights.map((item) => (
            <div
              key={item.title}
              class="group relative overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-900/70 p-6 shadow-xl transition-transform duration-300 hover:-translate-y-1 hover:border-slate-500/60"
            >
              <div
                class={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent} opacity-80`}
              ></div>
              <div class="relative flex items-start gap-4">
                <div
                  class={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-slate-900 shadow-lg`}
                >
                  {item.icon}
                </div>
                <div class="space-y-2">
                  <h4 class="text-lg font-semibold text-white">{item.title}</h4>
                  <p class="text-sm leading-relaxed text-slate-300">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {!hasWorkspaceCloud && (
          <div class="relative overflow-hidden rounded-3xl border border-amber-400/60 bg-amber-500/10 p-6 text-amber-100 shadow-xl">
            <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-amber-400/60 via-orange-400/50 to-pink-400/60 opacity-70"></div>
            <h4 class="text-base font-semibold text-amber-100">
              Workspace cloud required
            </h4>
            <p class="mt-2 text-sm text-amber-100/80">
              Connect Azure under Environment -{'>'} Cloud Connections to unlock
              IoT provisioning.
            </p>
            <p class="mt-3 text-sm text-amber-100/90">
              Capture desired IoT Hub naming, DPS enrollment strategy, and data
              flow targets while the connection is being established.
            </p>
          </div>
        )}

        {hasWorkspaceCloud && (
          <section class="space-y-6 rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-xl">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="space-y-1">
                <h4 class="text-xl font-semibold text-white">
                  IoT environment
                </h4>
                <p class="text-sm text-slate-300">
                  {workspaceCloud?.Details?.Name || 'Workspace Cloud'} /{' '}
                  {rgName}
                </p>
              </div>
              <div class="rounded-2xl border border-slate-700/60 bg-slate-900/60 px-4 py-3 text-xs text-slate-300">
                <div>Flows selected: {selectedFlows.length}</div>
                <div class="mt-1">
                  Device provisioning: {useDps ? 'Enabled' : 'Manual only'}
                </div>
              </div>
            </div>

            <div class="grid gap-5 lg:grid-cols-2">
              <div class="space-y-4 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5">
                <div>
                  <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Resource Group
                  </label>
                  <input
                    class="w-full rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                    value={rgName}
                    onInput={(e) =>
                      setRgName((e.target as HTMLInputElement).value)
                    }
                  />
                </div>

                <fieldset class="space-y-3">
                  <legend class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Data flows
                  </legend>
                  {flowOptions.map((option) => (
                    <label
                      key={option.key}
                      class="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-3 text-sm text-slate-200 transition-colors hover:border-slate-500/60"
                    >
                      <input
                        type="checkbox"
                        class="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-400 focus:ring-sky-400"
                        checked={flowSelections[option.key]}
                        onChange={() => toggleFlow(option.key)}
                      />
                      <span>
                        <span class="block font-semibold text-white">
                          {option.label}
                        </span>
                        <span class="text-xs text-slate-400">
                          {option.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </fieldset>

                <div class="space-y-3">
                  <label class="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      class="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-400 focus:ring-sky-400"
                      checked={useDps}
                      onChange={() => setUseDps((prev) => !prev)}
                    />
                    Enable Device Provisioning Service (DPS)
                  </label>
                  <label class="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      class="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-400 focus:ring-sky-400"
                      checked={useEdgeModules}
                      onChange={() => setUseEdgeModules((prev) => !prev)}
                    />
                    Pre-stage IoT Edge modules for gateway scenarios
                  </label>
                </div>
              </div>

              <div class="space-y-4 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5">
                <div>
                  <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Observability & routing notes
                  </label>
                  <textarea
                    class="h-32 w-full resize-none rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                    placeholder="List custom endpoints, enrichment rules, or alerting integrations to wire up after deployment."
                    value={notes}
                    onInput={(e) =>
                      setNotes((e.target as HTMLTextAreaElement).value)
                    }
                  />
                </div>

                <div class="space-y-3 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 text-xs text-slate-300">
                  <div class="flex items-center justify-between">
                    <span>IoT Hub</span>
                    <span
                      class={iotDone ? 'text-emerald-300' : 'text-slate-400'}
                    >
                      {iotDone ? 'Provisioned' : 'Pending'}
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>Device Provisioning</span>
                    <span
                      class={
                        useDps
                          ? iotDone
                            ? 'text-emerald-300'
                            : 'text-slate-400'
                          : 'text-slate-500'
                      }
                    >
                      {useDps ? (iotDone ? 'Online' : 'Queued') : 'Disabled'}
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>ADX databases</span>
                    <span
                      class={
                        selectedFlows.some((f) => f.key !== 'hot')
                          ? iotDone
                            ? 'text-emerald-300'
                            : 'text-slate-400'
                          : 'text-slate-500'
                      }
                    >
                      {selectedFlows.some((f) => f.key !== 'hot')
                        ? iotDone
                          ? 'Linked'
                          : 'Pending'
                        : 'Not requested'}
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>Edge modules</span>
                    <span
                      class={
                        useEdgeModules
                          ? iotDone
                            ? 'text-emerald-300'
                            : 'text-slate-400'
                          : 'text-slate-500'
                      }
                    >
                      {useEdgeModules
                        ? iotDone
                          ? 'Published'
                          : 'Staging'
                        : 'Not included'}
                    </span>
                  </div>
                </div>

                {iotErr && <div class="text-xs text-rose-400">{iotErr}</div>}

                <div class="flex flex-wrap items-center gap-2">
                  <Action
                    intentType={IntentTypes.Tertiary}
                    styleType={ActionStyleTypes.Outline}
                    onClick={() => setIotDone(false)}
                    disabled={iotBusy}
                  >
                    Reset status
                  </Action>
                  <Action onClick={submitIoT} disabled={iotBusy || !rgName}>
                    {iotBusy ? 'Applying...' : 'Provision IoT Layer'}
                  </Action>
                  {iotDone && (
                    <span class="text-xs text-emerald-300">
                      IoT fabric updated.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <div class="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 text-slate-300">
          Need help mapping bespoke data flows? Email{' '}
          <a
            href="mailto:support@openindustrial.co?subject=Manage%20IoT%20Support"
            class="font-semibold text-sky-300 hover:text-sky-200"
          >
            support@openindustrial.co
          </a>{' '}
          and the team can co-design the topology with you.
        </div>
      </div>
    </Modal>
  );
}

ManageIoTModal.Modal = (
  workspaceMgr: WorkspaceManager
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
          <ManageIoTModal
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

export default ManageIoTModal;
