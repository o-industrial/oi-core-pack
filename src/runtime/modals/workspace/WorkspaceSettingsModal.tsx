import {
  Action,
  ActionStyleTypes,
  EaCEnterpriseDetails,
  Input,
  IntentTypes,
  JSX,
  Modal,
  useState,
  WorkspaceManager,
} from '../../../.deps.ts';
import { TeamManagementModal } from './TeamManagementModal.tsx';
import { ManageWorkspacesModal } from './ManageWorkspacesModal.tsx';

type WorkspaceSettingsModalProps = {
  workspaceMgr: WorkspaceManager;
  onClose: () => void;
};

export function WorkspaceSettingsModal({
  workspaceMgr,
  onClose,
}: WorkspaceSettingsModalProps): JSX.Element {
  const { currentWorkspace, update, save, archive, hasChanges } = workspaceMgr
    .UseWorkspaceSettings();

  const { Modal: teamModal, Show: showTeamModal } = TeamManagementModal.Modal(workspaceMgr);
  const { Modal: mngWkspcsModal, Show: _showMngWkspcs } = ManageWorkspacesModal.Modal(workspaceMgr);

  const details: EaCEnterpriseDetails = currentWorkspace.Details;

  return (
    <>
      <Modal title='Workspace Settings' onClose={onClose}>
        <div class='space-y-6 text-sm text-slate-200'>
          <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-950/80 p-6 shadow-xl'>
            <div
              class={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-neon-violet-500/80 via-sky-500/70 to-cyan-400/80`}
            />
            <div class='flex flex-wrap items-center justify-between gap-4'>
              <div class='space-y-2'>
                <p class='text-xs font-semibold uppercase tracking-wide text-sky-300/90'>
                  Workspace overview
                </p>
                <h3 class='text-2xl font-semibold text-white'>
                  {details.Name || 'Untitled Workspace'}
                </h3>
                {details.Description && (
                  <p class='max-w-2xl text-sm leading-relaxed text-slate-300'>
                    {details.Description}
                  </p>
                )}
                <div class='flex flex-wrap gap-3 text-xs text-slate-400'>
                  {currentWorkspace.Lookup && <span>ID: {currentWorkspace.Lookup}</span>}
                </div>
              </div>
              <div class='flex flex-wrap gap-2'>
                <Action
                  intentType={IntentTypes.Secondary}
                  styleType={ActionStyleTypes.Outline}
                  onClick={() => showTeamModal()}
                >
                  Manage Team Members
                </Action>
              </div>
            </div>
          </section>

          <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-neutral-900/80 p-6 shadow-xl'>
            <div
              class={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fuchsia-500/70 via-violet-500/70 to-sky-500/70 opacity-80`}
            />
            <WorkspaceDetailsTab
              details={details}
              onUpdate={update}
              onSave={() => save().then()}
              onArchive={archive}
              hasChanges={hasChanges}
            />
          </section>
        </div>
      </Modal>
      {teamModal}
      {mngWkspcsModal}
    </>
  );
}

WorkspaceSettingsModal.Modal = (
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
          <WorkspaceSettingsModal
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

function WorkspaceDetailsTab({
  details,
  onUpdate,
  onSave,
  onArchive,
  hasChanges,
}: {
  details: EaCEnterpriseDetails;
  onUpdate: (next: Partial<EaCEnterpriseDetails>) => void;
  onSave: () => void;
  onArchive: () => void;
  hasChanges: boolean;
}) {
  return (
    <div class='space-y-4'>
      <Input
        label='Workspace Name'
        value={details.Name}
        onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
          onUpdate({ Name: (e.target as HTMLInputElement).value })}
      />
      <Input
        multiline
        label='Description'
        value={details.Description}
        onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
          onUpdate({ Description: (e.target as HTMLInputElement).value })}
      />

      <div class='flex justify-between mt-4 gap-2'>
        <Action onClick={onSave} disabled={!hasChanges}>
          Save Changes
        </Action>
        <div class='flex gap-2'>
          <Action
            onClick={() => {
              if (confirm('Are you sure you want to archive this workspace?')) {
                onArchive();
              }
            }}
            intentType={IntentTypes.Error}
            styleType={ActionStyleTypes.Outline}
          >
            Archive Workspace
          </Action>
        </div>
      </div>
    </div>
  );
}
