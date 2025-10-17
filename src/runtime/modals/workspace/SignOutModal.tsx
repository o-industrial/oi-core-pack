import {
  Action,
  ActionStyleTypes,
  Badge,
  IntentTypes,
  JSX,
  Modal,
  useEffect,
  useState,
  WorkspaceManager,
} from '../../../.deps.ts';

type VideoOption = {
  id: string;
  label: string;
  baseSrc: string;
  skipTimes: number[];
};

type AnalyticsWindow = typeof window & {
  dataLayer?: Array<Record<string, unknown>>;
  gtag?: (...args: unknown[]) => void;
  appInsights?: {
    trackEvent?: (event: { name: string }, properties?: Record<string, unknown>) => void;
  };
};

const SIGN_OUT_VIDEOS: VideoOption[] = [
  {
    id: 'robert_tepper_no_easy_way_out',
    label: 'Robert Tepper - No Easy Way out',
    baseSrc:
      'https://www.youtube.com/embed/rOXaPE6gklI?si=ZPGuZtTWiKyuuoew&controls=0&autoplay=1&mute=0&playsinline=1',
    skipTimes: [71, 81, 91, 101, 111, 121, 131],
  },
  {
    id: 'rocky_iv_no_easy_way_out',
    label: 'No Easy Way Out - Rocky IV [HD Audio]',
    baseSrc: 'https://www.youtube.com/embed/2mkm_mNiJME?controls=0&autoplay=1&mute=0&playsinline=1',
    skipTimes: [71, 81, 91, 101, 111, 121, 131],
  },
  {
    id: 'queen_i_want_to_break_free',
    label: 'Queen - I Want To Break Free (Official Video)',
    baseSrc: 'https://www.youtube.com/embed/f4Mc-NYPHaQ?controls=0&autoplay=1&mute=0&playsinline=1',
    skipTimes: [37, 45, 54, 63, 67, 76, 97, 108, 117, 150, 177, 197, 206, 232],
  },
  {
    id: 'police_every_breath_you_take',
    label: 'The Police - Every Breath You Take (Official Music Video)',
    baseSrc: 'https://www.youtube.com/embed/OMOGaugKpzs?controls=0&autoplay=1&mute=0&playsinline=1',
    skipTimes: [19, 40, 46, 80, 91, 166],
  },
  {
    id: 'michael_jackson_smooth_criminal',
    label: 'Michael Jackson - Smooth Criminal (Official Video)',
    baseSrc: 'https://www.youtube.com/embed/h_D3VFfhvs4?controls=0&autoplay=1&mute=0&playsinline=1',
    skipTimes: [11, 23, 41, 55, 74, 90, 103, 118, 137, 144, 172, 243, 325, 346, 384, 413, 540],
  },
  {
    id: 'dead_or_alive_spin_me_round',
    label: 'Dead Or Alive - You Spin Me Round (Like a Record) (Official Video)',
    baseSrc: 'https://www.youtube.com/embed/PGNiXGX2nLU?controls=0&autoplay=1&mute=0&playsinline=1',
    skipTimes: [13, 32, 40, 47, 61, 85, 113, 152, 175],
  },
  {
    id: 'ok_go_here_it_goes_again',
    label: 'OK Go - Here It Goes Again (Official Music Video)',
    baseSrc: 'https://www.youtube.com/embed/dTAAsCNK7RA?controls=0&autoplay=1&mute=0&playsinline=1',
    skipTimes: [18, 29, 35, 42, 74, 92, 124, 139, 160],
  },
  {
    id: 'foo_fighters_everlong',
    label: 'Foo Fighters - Everlong (Official HD Video)',
    baseSrc: 'https://www.youtube.com/embed/eBG7P-K-r1Y?controls=0&autoplay=1&mute=0&playsinline=1',
    skipTimes: [36, 56, 65, 96, 111, 155, 171, 190, 215, 241],
  },
  {
    id: 'twisted_sister_were_not_gonna_take_it',
    label: "Twisted Sister - We're Not Gonna Take It (Official Music Video)",
    baseSrc: 'https://www.youtube.com/embed/4xmckWVPRaI?controls=0&autoplay=1&mute=0&playsinline=1',
    skipTimes: [12, 29, 44, 75, 91, 107, 131, 150, 171, 188, 199, 225],
  },
  {
    id: 'the_darkness_believe_in_a_thing_called_love',
    label: 'The Darkness - I Believe In A Thing Called Love (Official Music Video) [HD]',
    baseSrc: 'https://www.youtube.com/embed/tKjZuykKY1I?controls=0&autoplay=1&mute=0&playsinline=1',
    skipTimes: [10, 29, 57, 77, 94, 100, 119, 165, 179, 218],
  },
  {
    id: 'beastie_boys_sabotage',
    label: 'Beastie Boys - Sabotage (Official Music Video)',
    baseSrc: 'https://www.youtube.com/embed/z5rRZdiu1UE?controls=0&autoplay=1&mute=0&playsinline=1',
    skipTimes: [27, 51, 65, 79, 117, 154, 173, 185],
  },
  {
    id: 'fatboy_slim_weapon_of_choice',
    label: 'Fatboy Slim ft. Bootsy Collins - Weapon Of Choice [Official 4k Video]',
    baseSrc: 'https://www.youtube.com/embed/wCDIYvFmgW8?controls=0&autoplay=1&mute=0&playsinline=1',
    skipTimes: [22, 39, 60, 83, 107, 123, 159, 172, 200],
  },
  {
    id: 'harry_styles_music_for_a_sushi_restaurant',
    label: 'Harry Styles - Music For a Sushi Restaurant (Official Video)',
    baseSrc: 'https://www.youtube.com/embed/CiwMDFh_Rog?controls=0&autoplay=1&mute=0&playsinline=1',
    skipTimes: [29, 38, 56, 88, 119, 155],
  },
];

function trackSignOutTelemetry(eventName: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  const analyticsWindow = window as AnalyticsWindow;
  const payload = { event: eventName, ...(properties ?? {}) };

  try {
    analyticsWindow.dataLayer?.push(payload);
  } catch (err) {
    console.warn('[SignOutModal] Failed to push GTM event', err);
  }

  if (typeof analyticsWindow.gtag === 'function') {
    try {
      analyticsWindow.gtag('event', eventName, properties ?? {});
    } catch (err) {
      console.warn('[SignOutModal] Failed to dispatch gtag event', err);
    }
  }

  const appInsights = analyticsWindow.appInsights;
  if (appInsights?.trackEvent) {
    try {
      appInsights.trackEvent({ name: eventName }, properties);
    } catch (err) {
      console.warn('[SignOutModal] Failed to dispatch App Insights event', err);
    }
  }
}

export type SignOutModalProps = {
  workspaceMgr: WorkspaceManager;
  onClose: () => void;
};

export function SignOutModal({ workspaceMgr, onClose }: SignOutModalProps): JSX.Element {
  const [ready, setReady] = useState(false);
  const { profile, signOut } = workspaceMgr.UseAccountProfile();
  const email = profile.Username ?? '';
  const joke = email.toLowerCase().endsWith('@fathym.com');

  const [chosenVideo] = useState<VideoOption>(() => {
    const index = Math.floor(Math.random() * SIGN_OUT_VIDEOS.length);
    return SIGN_OUT_VIDEOS[index];
  });
  const totalSkips = chosenVideo.skipTimes.length;
  const [skipIndex, setSkipIndex] = useState(0);
  const [currentStart, setCurrentStart] = useState(chosenVideo.skipTimes[0] ?? 0);
  const videoSrc = `${chosenVideo.baseSrc}&start=${currentStart}`;

  const track = (eventName: string, properties?: Record<string, unknown>) => {
    trackSignOutTelemetry(eventName, {
      videoId: chosenVideo.id,
      videoLabel: chosenVideo.label,
      jokeEnabled: joke,
      totalSkips,
      ...properties,
    });
  };

  useEffect(() => {
    track('SignOutModal.Opened', {
      skipIndex: 0,
      startSeconds: chosenVideo.skipTimes[0] ?? 0,
    });
    // deno-lint-ignore-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    track('SignOutModal.Closed', {
      skipIndex,
      currentStart,
      ready,
    });
    onClose();
  };

  const handleConfirmSignOut = () => {
    const nextIndex = skipIndex + 1;
    const nextStart = chosenVideo.skipTimes[nextIndex];
    const willSignOut = !joke || nextStart === undefined;

    track('SignOutModal.ConfirmClick', {
      skipIndex,
      currentStart,
      nextIndex: willSignOut ? skipIndex : nextIndex,
      nextStart: willSignOut ? null : nextStart,
      ready,
      willSignOut,
    });

    if (willSignOut) {
      track('SignOutModal.SignOutTriggered', {
        skipIndex,
        currentStart,
        ready,
      });
      signOut();
      return;
    }

    setSkipIndex(nextIndex);
    setCurrentStart(nextStart);
    setReady(false);

    track('SignOutModal.VideoJump', {
      skipIndex: nextIndex,
      startSeconds: nextStart,
    });
  };

  return (
    <Modal title='Sign Out' onClose={handleClose}>
      <div class='space-y-4'>
        <div class='w-full max-w-3xl mx-auto' style={{ aspectRatio: '16 / 9' }}>
          <iframe
            class='w-full h-full rounded'
            style={{ width: '100%', height: '100%', minHeight: '350px' }}
            src={videoSrc}
            title='YouTube video player'
            frameBorder={0}
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
            referrerpolicy='strict-origin-when-cross-origin'
            allowFullScreen
            onLoad={() => {
              setReady(true);
              track('SignOutModal.VideoLoaded', {
                skipIndex,
                currentStart,
              });
            }}
          />
        </div>

        <div class='flex items-center justify-between'>
          <Badge intentType={IntentTypes.Info}>
            Your session will end after confirmation
          </Badge>

          <Action
            onClick={handleConfirmSignOut}
            styleType={ActionStyleTypes.Solid | ActionStyleTypes.Rounded}
            intentType={IntentTypes.Error}
            disabled={!ready}
          >
            Confirm Sign Out
          </Action>
        </div>
      </div>
    </Modal>
  );
}

SignOutModal.Modal = (
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
          <SignOutModal
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
