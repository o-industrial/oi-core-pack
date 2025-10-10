import {
  type AccountProfile,
  Action,
  ActionStyleTypes,
  Badge,
  Input,
  IntentTypes,
  JSX,
  Modal,
  Select,
  TabbedPanel,
  type TeamMembership,
  useState,
  WorkspaceManager,
} from '../../../.deps.ts';
import { SignOutModal } from './SignOutModal.tsx';

type AccountProfileModalProps = {
  workspaceMgr: WorkspaceManager;
  onClose: () => void;
};

export function AccountProfileModal({
  workspaceMgr,
  onClose,
}: AccountProfileModalProps): JSX.Element {
  const {
    profile,
    setProfile,
    hasChanges,
    save,
    // teams,
    // updateTeamRole,
    // leaveTeam,
    // deleteAccount,
  } = workspaceMgr.UseAccountProfile();

  const { Modal: signOutModal, Show: showSignOut } = SignOutModal.Modal(workspaceMgr);

  return (
    <Modal
      title={
        <div class='flex items-center gap-3 w-full'>
          <span class='flex-1'>Account Profile</span>
          <Action
            class='ml-auto'
            styleType={ActionStyleTypes.Thin | ActionStyleTypes.Outline}
            intentType={IntentTypes.Info}
            onClick={() => showSignOut()}
            aria-label='Sign out'
          >
            Sign out
          </Action>
        </div>
      }
      onClose={onClose}
    >
      {signOutModal}
      <TabbedPanel
        direction='vertical'
        tabs={[
          {
            key: 'info',
            label: 'Account Info',
            content: (
              <AccountInfoTab
                profile={profile}
                onUpdate={setProfile}
                onSave={() => save().then()}
                hasChanges={hasChanges}
              />
            ),
          },
          // {
          //   key: 'teams',
          //   label: 'Teams',
          //   content: (
          //     <TeamsTab
          //       teams={teams}
          //       onUpdateRole={updateTeamRole}
          //       onLeave={leaveTeam}
          //     />
          //   ),
          // },
          // {
          //   key: 'danger',
          //   label: 'Danger Zone',
          //   content: (
          //     <DangerZoneTab
          //       onDelete={async () => {
          //         const ok = confirm(
          //           'Permanently delete your account? This cannot be undone.'
          //         );
          //         if (ok) await deleteAccount();
          //       }}
          //     />
          //   ),
          // },
        ]}
      />
    </Modal>
  );
}

AccountProfileModal.Modal = (
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
          <AccountProfileModal
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

function AccountInfoTab({
  profile,
  onUpdate,
  onSave,
  hasChanges,
}: {
  profile: AccountProfile;
  onUpdate: (next: Partial<AccountProfile>) => void;
  onSave: () => void;
  hasChanges: boolean;
}) {
  return (
    <div class='space-y-5'>
      <div class='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Input label='Email' required value={profile.Username} disabled />

        <Input
          label='Name'
          required
          value={profile.Name}
          onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
            onUpdate({ Name: (e.target as HTMLInputElement).value })}
        />
      </div>

      <Input
        multiline
        label='Bio'
        placeholder='Description (recommended)'
        value={profile.Bio ?? ''}
        onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
          onUpdate({ Bio: (e.target as HTMLInputElement).value })}
      />

      <Input
        multiline
        label='Additional Optional Information'
        placeholder='Additional info (optional)'
        value={profile.Additional ?? ''}
        onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
          onUpdate({ Additional: (e.target as HTMLInputElement).value })}
      />

      {
        /* <div class="text-xs text-neutral-400 space-y-1">
        {profile.CreatedAt && <div>Created At: {profile.CreatedAt}</div>}
        {profile.ID && <div>User ID: {profile.ID}</div>}
      </div> */
      }

      <div class='flex justify-between mt-2'>
        <div class='flex items-center gap-2'>
          {hasChanges
            ? <Badge intentType={IntentTypes.Info}>Unsaved changes</Badge>
            : <Badge>Saved</Badge>}
        </div>
        <Action onClick={onSave} disabled={!hasChanges}>
          Save Changes
        </Action>
      </div>
    </div>
  );
}

function _TeamsTab({
  teams,
  onUpdateRole,
  onLeave,
}: {
  teams: TeamMembership[];
  onUpdateRole: (teamLookup: string, role: TeamMembership['Role']) => void;
  onLeave: (teamLookup: string) => void;
}) {
  return (
    <div class='space-y-4'>
      <div class='text-sm text-neutral-300 font-medium'>Teams You're On</div>
      <div class='space-y-2'>
        {teams.map((t) => (
          <div class='grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-2 items-center border p-2 rounded'>
            <div class='flex items-center gap-2'>
              <span class='font-medium'>{t.Team}</span>
              <span class='text-xs text-neutral-400'>
                - Member since {t.MemberSince}
              </span>
            </div>

            <div class='md:justify-self-end'>
              <Select
                value={t.Role}
                onChange={(e: JSX.TargetedEvent<HTMLSelectElement, Event>) =>
                  onUpdateRole(
                    t.Lookup,
                    (e.target as HTMLSelectElement)
                      .value as TeamMembership['Role'],
                  )}
              >
                <option>Owner</option>
                <option>Editor</option>
                <option>Viewer</option>
              </Select>
            </div>

            <Action
              intentType={IntentTypes.Error}
              styleType={ActionStyleTypes.Outline}
              onClick={() => onLeave(t.Lookup)}
            >
              Leave
            </Action>
          </div>
        ))}
      </div>
    </div>
  );
}

function _DangerZoneTab({ onDelete }: { onDelete: () => void }) {
  return (
    <div class='space-y-4'>
      <div class='border border-red-500/30 rounded p-4 bg-red-500/5'>
        <div class='text-red-400 font-semibold mb-1'>Delete Account</div>
        <div class='text-sm text-neutral-300'>
          Permanently delete your account. There is no undo.
          <br />
          Workspaces owned solely by this account will be lost forever.
        </div>
        <Action
          class='mt-3'
          intentType={IntentTypes.Error}
          styleType={ActionStyleTypes.Solid}
          onClick={onDelete}
        >
          Delete Account
        </Action>
      </div>
    </div>
  );
}
