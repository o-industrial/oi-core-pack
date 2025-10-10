import {
  Action,
  ActionStyleTypes,
  Input,
  IntentTypes,
  JSX,
  Modal,
  useEffect,
  useState,
  WorkspaceManager,
} from '../../../.deps.ts';

export type TeamManagementModalProps = {
  workspaceMgr: WorkspaceManager;
  onClose: () => void;
};

const friendlyDate = (joined?: string): string => {
  if (!joined) return 'Unknown';
  try {
    return new Date(joined).toLocaleDateString();
  } catch {
    return joined;
  }
};

const resolveJoined = (member: unknown): string | undefined => {
  if (
    member &&
    typeof member === 'object' &&
    'Joined' in (member as Record<string, unknown>)
  ) {
    const value = (member as { Joined?: string }).Joined;
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
};

export function TeamManagementModal({
  workspaceMgr,
  onClose,
}: TeamManagementModalProps): JSX.Element {
  const { currentWorkspace, teamMembers, inviteMember, removeMember } = workspaceMgr
    .UseWorkspaceSettings();

  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [toast, setToast] = useState<
    {
      message: string;
      kind: 'success' | 'error' | 'warning';
    } | null
  >(null);
  const [localMembers, setLocalMembers] = useState(teamMembers);

  useEffect(() => setLocalMembers(teamMembers), [teamMembers]);

  const showToast = (
    message: string,
    kind: 'success' | 'error' | 'warning' = 'success',
  ) => {
    setToast({ message, kind });
    setTimeout(() => setToast(null), 4000);
  };

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  return (
    <>
      <Modal title='Team Members' onClose={onClose}>
        <div class='space-y-6 text-sm text-slate-200'>
          <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-950/80 p-6 shadow-xl'>
            <div
              class={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-neon-violet-500/80 via-sky-500/70 to-cyan-400/80`}
            />
            <div class='space-y-1'>
              <p class='text-xs font-semibold uppercase tracking-wide text-sky-300/90'>
                Workspace
              </p>
              <h3 class='text-2xl font-semibold text-white'>
                {currentWorkspace.Details.Name}
              </h3>
              <p class='text-sm text-slate-300'>
                Invite collaborators and keep membership aligned with your deployment cadence.
              </p>
            </div>
          </section>

          <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-neutral-900/80 p-6 shadow-xl'>
            <div
              class={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fuchsia-500/70 via-violet-500/70 to-sky-500/70 opacity-80`}
            />
            <div class='flex items-center justify-between'>
              <h4 class='text-sm font-semibold text-white'>Current members</h4>
              <span class='text-xs text-slate-400'>
                {localMembers.length} total
              </span>
            </div>

            <div class='mt-3 space-y-2 max-h-64 overflow-y-auto'>
              {localMembers.map((member) => (
                <div
                  class='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/60 bg-neutral-950/60 px-3 py-2'
                  key={member.Username}
                >
                  <div class='text-sm text-slate-200'>
                    <p>{member.Username}</p>
                    <p class='text-xs text-slate-500'>
                      Joined {friendlyDate(resolveJoined(member))}
                    </p>
                  </div>
                  <Action
                    intentType={IntentTypes.Error}
                    styleType={ActionStyleTypes.Outline}
                    onClick={async () => {
                      const username = member.Username;
                      if (!confirm(`Remove ${username} from this workspace?`)) {
                        return;
                      }
                      try {
                        await removeMember(username);
                        setLocalMembers((prev) => prev.filter((m) => m.Username !== username));
                        showToast(`${username} has been removed`, 'success');
                      } catch (err) {
                        console.error('Remove user failed', err);
                        showToast(`Failed to remove ${username}`, 'error');
                      }
                    }}
                  >
                    Remove
                  </Action>
                </div>
              ))}
            </div>

            {localMembers.length === 0 && (
              <p class='mt-4 rounded-xl border border-dashed border-slate-700/60 bg-neutral-950/50 p-4 text-center text-xs text-slate-400'>
                No members yet. Invite your teammates below.
              </p>
            )}
          </section>

          <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-neutral-900/80 p-6 shadow-xl'>
            <div
              class={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500/70 via-sky-500/70 to-cyan-400/70 opacity-80`}
            />
            <div class='space-y-3'>
              <h4 class='text-sm font-semibold text-white'>
                Invite a new member
              </h4>
              <div class='flex flex-wrap items-center gap-3'>
                <Input
                  placeholder='Email'
                  value={email}
                  onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                    setEmail((e.target as HTMLInputElement).value)}
                />
                <Action
                  intentType={IntentTypes.Primary}
                  disabled={inviting || !email.trim()}
                  onClick={async () => {
                    const target = email.trim().toLowerCase();
                    if (!target) return;
                    if (!isValidEmail(target)) {
                      showToast(`"${email}" is not a valid email`, 'warning');
                      return;
                    }
                    const exists = localMembers.some(
                      (m) => (m.Username ?? '').toLowerCase() === target,
                    );
                    if (exists) {
                      showToast(
                        `${target} is already on this workspace`,
                        'warning',
                      );
                      return;
                    }
                    try {
                      setInviting(true);
                      await inviteMember(email, 'Viewer', '');
                      setLocalMembers((prev) => [
                        ...prev,
                        { Username: target } as (typeof prev)[number],
                      ]);
                      setEmail('');
                      showToast(`Invitation sent to ${target}`, 'success');
                    } catch (err) {
                      console.error('Invite failed', err);
                      showToast(`Failed to invite ${target}`, 'error');
                    } finally {
                      setInviting(false);
                    }
                  }}
                >
                  {inviting ? 'Inviting...' : 'Invite'}
                </Action>
              </div>
              <p class='text-xs text-slate-400'>
                Invited members receive email instructions. Access defaults to Viewer; adjust
                permissions once they join.
              </p>
            </div>
          </section>

          {toast && (
            <div class='sticky bottom-0 z-10 pt-2 -mb-2'>
              <div class='flex justify-center pointer-events-none'>
                <div
                  role='status'
                  aria-live='polite'
                  class={`pointer-events-auto rounded-lg px-4 py-3 shadow-lg text-sm font-medium ${
                    toast.kind === 'success'
                      ? 'bg-emerald-600 text-white'
                      : toast.kind === 'warning'
                      ? 'bg-amber-500 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {toast.message}
                  <Action
                    styleType={ActionStyleTypes.Link}
                    class='ml-3'
                    onClick={() => setToast(null)}
                  >
                    Dismiss
                  </Action>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

TeamManagementModal.Modal = (
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
          <TeamManagementModal
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
