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

export type SignOutModalProps = {
  workspaceMgr: WorkspaceManager;
  onClose: () => void;
};

export function SignOutModal({ workspaceMgr, onClose }: SignOutModalProps): JSX.Element {
  const [ready, setReady] = useState(false);
  const [videoSrc] = useState(() => {
    const videoOptions = [
      'https://www.youtube.com/embed/rOXaPE6gklI?si=ZPGuZtTWiKyuuoew&controls=0&autoplay=1&mute=0&playsinline=1&start=3',
      'https://www.youtube.com/embed/2mkm_mNiJME?controls=0&autoplay=1&mute=0&playsinline=1&start=71',
    ];

    return videoOptions[Math.floor(Math.random() * videoOptions.length)];
  });
  const { signOut } = workspaceMgr.UseAccountProfile();

  return (
    <Modal title='Sign Out' onClose={onClose}>
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
            onLoad={() => setReady(true)}
          />
        </div>

        <div class='flex items-center justify-between'>
          <Badge intentType={IntentTypes.Info}>
            Your session will end after confirmation
          </Badge>

          <Action
            onClick={() => signOut()}
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
        {shown && <SignOutModal workspaceMgr={workspaceMgr} onClose={() => setShow(false)} />}
      </>
    ),
    Hide: () => setShow(false),
    IsOpen: () => shown,
    Show: () => setShow(true),
  };
};
