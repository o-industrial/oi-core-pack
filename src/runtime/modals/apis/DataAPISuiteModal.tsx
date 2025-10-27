import { JSX, MarketingHighlightCard, Modal, useState, WorkspaceManager } from '../../../.deps.ts';

export type DataAPISuiteModalProps = {
  workspaceMgr: WorkspaceManager;
  onClose: () => void;
};

type HighlightCard = {
  title: string;
  description: string;
  accent: string;
  icon: JSX.Element;
};

const highlights: HighlightCard[] = [
  {
    title: 'Cold Query Downloads',
    description:
      'Serve downstream analytics with effortless CSV and JSONL exports that keep historical data in lockstep with your live operations.',
    accent: 'from-sky-500/70 via-cyan-400/70 to-emerald-400/70',
    icon: (
      <svg viewBox='0 0 24 24' fill='none' class='h-6 w-6'>
        <path
          d='M12 3v12m0 0 4-4m-4 4-4-4M5 15v3a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-3'
          stroke='currentColor'
          stroke-width='1.6'
          stroke-linecap='round'
          stroke-linejoin='round'
        />
      </svg>
    ),
  },
  {
    title: 'Warm Query Enhancements',
    description:
      'Unlock richer observability with curated warm query APIs that surface KPIs, deltas, and trends in the moments that matter.',
    accent: 'from-indigo-500/70 via-sky-500/70 to-cyan-400/70',
    icon: (
      <svg viewBox='0 0 24 24' fill='none' class='h-6 w-6'>
        <path
          d='M4 17s2.5-3 6-3 4 3 6 3 4-3 4-3V5s-2 3-4 3-2-3-6-3-6 3-6 3v9z'
          stroke='currentColor'
          stroke-width='1.6'
          stroke-linecap='round'
          stroke-linejoin='round'
        />
      </svg>
    ),
  },
  {
    title: 'Agentic & AI Experiences',
    description:
      'Blend your industrial telemetry directly into copilots and autonomous workflows with upcoming agent-ready APIs.',
    accent: 'from-fuchsia-500/70 via-violet-500/70 to-sky-400/70',
    icon: (
      <svg viewBox='0 0 24 24' fill='none' class='h-6 w-6'>
        <path
          d='M12 3a5 5 0 0 1 5 5v1h1a3 3 0 1 1 0 6h-1v1a5 5 0 1 1-10 0v-1H6a3 3 0 1 1 0-6h1V8a5 5 0 0 1 5-5z'
          stroke='currentColor'
          stroke-width='1.6'
          stroke-linecap='round'
          stroke-linejoin='round'
        />
      </svg>
    ),
  },
  {
    title: 'MCP & Profiles',
    description:
      'Invite every system to the conversation with Model Context Protocol servers and reusable connection profiles that keep access tidy.',
    accent: 'from-amber-400/70 via-orange-400/70 to-pink-400/70',
    icon: (
      <svg viewBox='0 0 24 24' fill='none' class='h-6 w-6'>
        <path
          d='M12 5v14m0-14L5 9m7-4 7 4m-7 14-7-4V9l7 4 7-4v10l-7 4z'
          stroke='currentColor'
          stroke-width='1.6'
          stroke-linecap='round'
          stroke-linejoin='round'
        />
      </svg>
    ),
  },
];

export function DataAPISuiteModal({
  workspaceMgr,
  onClose,
}: DataAPISuiteModalProps): JSX.Element {
  void workspaceMgr;

  return (
    <Modal title='Data API Suite' onClose={onClose}>
      <div class='space-y-10 text-sm text-slate-200'>
        <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900/60 via-slate-900/20 to-slate-900/60 p-8 shadow-2xl'>
          <div class='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div class='space-y-3'>
              <span class='inline-flex items-center gap-2 self-start rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200'>
                <span class='inline-flex h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgb(56_189_248/0.8)]'>
                </span>
                Coming Soon
              </span>
              <h3 class='text-3xl font-semibold text-white md:text-4xl'>
                The Data API Suite is almost here
              </h3>
              <p class='max-w-2xl text-base leading-relaxed text-slate-300'>
                We are polishing a unified API surface that moves fluidly between live operations,
                rich historical insights, and intelligent automations so every decision has the
                context it deserves.
              </p>
            </div>
            <div class='relative isolate mt-4 flex h-28 w-full max-w-xs items-center justify-center md:mt-0'>
              <div class='absolute inset-0 rounded-full bg-gradient-to-tr from-sky-500/40 via-cyan-400/40 to-emerald-400/40 blur-2xl'>
              </div>
              <div class='relative flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-900/70 backdrop-blur ring-1 ring-sky-400/60'>
                <svg viewBox='0 0 32 32' class='h-12 w-12 text-sky-300'>
                  <path
                    d='M6 10c0-2.21 1.79-4 4-4h12c2.21 0 4 1.79 4 4v12c0 2.21-1.79 4-4 4H10c-2.21 0-4-1.79-4-4V10z'
                    stroke='currentColor'
                    stroke-width='1.5'
                    fill='none'
                    stroke-linecap='round'
                    stroke-linejoin='round'
                  />
                  <path
                    d='M10 12h12M10 20h6'
                    stroke='currentColor'
                    stroke-width='1.5'
                    stroke-linecap='round'
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        <section class='grid gap-6 md:grid-cols-2'>
          {highlights.map((item) => (
            <MarketingHighlightCard
              key={item.title}
              variant='onyx'
              accentGradient={item.accent}
              title={item.title}
              description={item.description}
              icon={item.icon}
            />
          ))}
        </section>

        <section class='relative overflow-hidden rounded-3xl border border-dashed border-sky-400/60 bg-sky-500/10 p-6 text-slate-100 shadow-inner'>
          <div class='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div class='space-y-2'>
              <h4 class='text-lg font-semibold text-white'>Want in early?</h4>
              <p class='max-w-3xl text-sm text-slate-100/80'>
                We are lining up design partners now. Tell us what unlocks your next experience and
                we will invite you to the preview cohort.
              </p>
            </div>
            <a
              class='inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-sky-400'
              href='mailto:support@openindustrial.co'
            >
              <span class='inline-flex h-2 w-2 rounded-full bg-slate-900/60'></span>
              Email support@openindustrial.co
            </a>
          </div>
        </section>
      </div>
    </Modal>
  );
}

DataAPISuiteModal.Modal = (
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
          <DataAPISuiteModal
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

export default DataAPISuiteModal;
