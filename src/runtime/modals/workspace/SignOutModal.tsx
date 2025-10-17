import {
  Action,
  ActionStyleTypes,
  Badge,
  IntentTypes,
  JSX,
  Modal,
  useState,
  WorkspaceManager,
} from '../../../.deps.ts';

type VideoOption = {
  baseSrc: string;
  skipTimes: number[];
};

export type SignOutModalProps = {
  workspaceMgr: WorkspaceManager;
  onClose: () => void;
};

export function SignOutModal({
  workspaceMgr,
  onClose,
}: SignOutModalProps): JSX.Element {
  const [ready, setReady] = useState(false);
  const { profile, signOut } = workspaceMgr.UseAccountProfile();
  const email = profile.Username ?? '';
  const joke = email.toLowerCase().endsWith('@fathym.com');

  const [chosenVideo] = useState<VideoOption>(() => {
    const videoOptions: VideoOption[] = [
      {
        baseSrc:
          'https://www.youtube.com/embed/rOXaPE6gklI?si=ZPGuZtTWiKyuuoew&controls=0&autoplay=1&mute=0&playsinline=1',
        skipTimes: [71, 81, 91, 101, 111, 121, 131],
      },
      {
        baseSrc:
          'https://www.youtube.com/embed/2mkm_mNiJME?controls=0&autoplay=1&mute=0&playsinline=1',
        skipTimes: [71, 81, 91, 101, 111, 121, 131],
      },
      {
        baseSrc:
          'https://www.youtube.com/embed/f4Mc-NYPHaQ?controls=0&autoplay=1&mute=0&playsinline=1',
        // skipTimes: [37, 45, 54, 1:03, 1:07, 1:16, /**1:34*/1:37, 1:48, 1:57, 2:30, 2:57, 3:17, 3:26, 3:52],
        skipTimes: [
          37, 45, 54, 63, 67, 76, /*1:34*/ 97, 108, 117, 150, 177, 197, 206,
          232,
        ],
      },
      {
        baseSrc:
          'https://www.youtube.com/embed/OMOGaugKpzs?controls=0&autoplay=1&mute=0&playsinline=1',
        // skipTimes: [19, 40, 46, 1:20, 1:31, 2:46],
        skipTimes: [19, 40, 46, 80, 91, 166],
      },
      {
        baseSrc:
          'https://www.youtube.com/embed/h_D3VFfhvs4?controls=0&autoplay=1&mute=0&playsinline=1',
        // skipTimes: [11, 23, 41, 55, 1:14, 1:30, 1:43, 1:58, 2:17, 2:24, 2:52, 4:03, 5:25, 5:46, 6:24, 6:53, 9:00],
        skipTimes: [
          11, 23, 41, 55, 74, 90, 103, 118, 137, 144, 172, 243, 325, 346, 384,
          413, 540,
        ],
      },
      {
        baseSrc:
          'https://www.youtube.com/embed/PGNiXGX2nLU?controls=0&autoplay=1&mute=0&playsinline=1',
        // skipTimes: [13, 32, 40, 47, 1:01, 1:25, 1:53, 2:32, 2:55],
        skipTimes: [13, 32, 40, 47, 61, 85, 113, 152, 175],
      },
      {
        baseSrc:
          'https://www.youtube.com/embed/dTAAsCNK7RA?controls=0&autoplay=1&mute=0&playsinline=1',
        // skipTimes: [18, 29, 35, 42, 1:14, 1:32, 2:04, 2:19, 2:40],
        skipTimes: [18, 29, 35, 42, 74, 92, 124, 139, 160],
      },
      {
        baseSrc:
          'https://www.youtube.com/embed/eBG7P-K-r1Y?controls=0&autoplay=1&mute=0&playsinline=1',
        // skipTimes: [36, 56, 1:05, 1:36, 1:51, 2:35, 2:51, 3:10, 3:35, 4:01],
        skipTimes: [36, 56, 65, 96, 111, 155, 171, 190, 215, 241],
      },
      {
        baseSrc:
          'https://www.youtube.com/embed/eBG7P-K-r1Y?controls=0&autoplay=1&mute=0&playsinline=1',
        // skipTimes: [12, 29, 44, 1:15, 1:31, 1:47, 2:11, 2:30, 2:51, 3:08, 3:19, 3:45],
        skipTimes: [12, 29, 44, 75, 91, 107, 131, 150, 171, 188, 199, 225],
      },
      {
        baseSrc:
          'https://www.youtube.com/embed/4xmckWVPRaI?controls=0&autoplay=1&mute=0&playsinline=1',
        // skipTimes: [10, 29, 57, 1:17, 1:34, 1:40, 1:59,2:45, 2:59, 3:38],
        skipTimes: [10, 29, 57, 77, 94, 100, 119, 165, 179, 218],

      },
      {
        baseSrc:
          'https://www.youtube.com/embed/tKjZuykKY1I?controls=0&autoplay=1&mute=0&playsinline=1',
        // skipTimes: [27, 51, 1:05, 1:19, 1:57, 2:34, 2:53, 3:05],
        skipTimes: [27, 51, 65, 79, 117, 154, 173, 185],

      },
      {
        baseSrc:
          'https://www.youtube.com/embed/z5rRZdiu1UE?controls=0&autoplay=1&mute=0&playsinline=1',
        // skipTimes: [17, 38, 1:04, 1:14, 1:51, 2:27,],
        skipTimes: [17, 38, 64, 74, 111, 147],
      },
      {
        baseSrc:
          'https://www.youtube.com/embed/wCDIYvFmgW8?controls=0&autoplay=1&mute=0&playsinline=1',
        // skipTimes: [22, 39, 60, 1:23, 1:47, 2:03, 2:39, 2:52, 3:20],
        skipTimes: [22, 39, 60, 83, 107, 123, 159, 172, 200],

      },
      {
        baseSrc:
          'https://www.youtube.com/embed/CiwMDFh_Rog?controls=0&autoplay=1&mute=0&playsinline=1',
        // skipTimes: [29, 38, 56, 1:28, 1:59, 2:35],
        skipTimes: [29, 38, 56, 88, 119, 155],
      },
    ];

    return videoOptions[Math.floor(Math.random() * videoOptions.length)];
  });
  const [skipIndex, setSkipIndex] = useState(0);
  const [currentStart, setCurrentStart] = useState(
    chosenVideo.skipTimes[0] ?? 0
  );
  const videoSrc = `${chosenVideo.baseSrc}&start=${currentStart}`;

  const handleConfirmSignOut = () => {
    if (!joke) {
      signOut();
      return;
    }

    const nextIndex = skipIndex + 1;
    const nextStart = chosenVideo.skipTimes[nextIndex];

    if (nextStart === undefined) {
      signOut();
      return;
    }

    setSkipIndex(nextIndex);
    setCurrentStart(nextStart);
    setReady(false);
  };

  return (
    <Modal title="Sign Out" onClose={onClose}>
      <div class="space-y-4">
        <div class="w-full max-w-3xl mx-auto" style={{ aspectRatio: '16 / 9' }}>
          <iframe
            class="w-full h-full rounded"
            style={{ width: '100%', height: '100%', minHeight: '350px' }}
            src={videoSrc}
            title="YouTube video player"
            frameBorder={0}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowFullScreen
            onLoad={() => setReady(true)}
          />
        </div>

        <div class="flex items-center justify-between">
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
