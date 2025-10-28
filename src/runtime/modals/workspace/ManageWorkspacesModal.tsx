import {
  Action,
  ActionStyleTypes,
  Input,
  IntentTypes,
  JSX,
  Modal,
  useState,
  WorkspaceManager,
} from '../../../.deps.ts';

export type ManageWorkspacesModalProps = {
  workspaceMgr: WorkspaceManager;
  onClose: () => void;
};

export function ManageWorkspacesModal(
  { workspaceMgr, onClose }: ManageWorkspacesModalProps,
): JSX.Element {
  const {
    currentWorkspace,
    workspaces,
    switchToWorkspace,
    createWorkspace,
    listWorkspaces,
  } = workspaceMgr.UseWorkspaceSettings();

  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [archivingLookup, setArchivingLookup] = useState<string | null>(null);

  const handleArchiveWorkspace = async (ws: (typeof workspaces)[number]) => {
    const activeLookup = currentWorkspace?.Lookup;
    if (ws.Lookup === activeLookup) {
      alert('Switch to a different workspace before archiving this one.');
      return;
    }

    const name = ws.Details.Name ?? ws.Lookup;
    const ok = confirm(
      `Archive workspace "${name}"? This will remove it from your catalogue.`,
    );
    if (!ok) return;

    try {
      setArchivingLookup(ws.Lookup);
      const res = await fetch('/workspace/api/workspaces/archive', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ WorkspaceLookup: ws.Lookup }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Failed to archive workspace (${res.status})`);
      }

      listWorkspaces();
    } catch (err) {
      console.error('Archive workspace failed', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to archive workspace: ${msg}`);
    } finally {
      setArchivingLookup(null);
    }
  };

  const filtered = workspaces.filter((ws) =>
    ws.Details.Name?.toLowerCase().includes(filter.toLowerCase())
  );

  const active = filtered.filter((ws) => !ws.Archived);
  const archived = filtered.filter((ws) => ws.Archived);

  const renderRows = (
    rows: typeof workspaces,
    opts: { archived?: boolean } = {},
  ) => (
    <tbody>
      {rows.map((ws) => (
        <tr key={ws.Lookup} class='border-t border-slate-800/60 hover:bg-neutral-900/80'>
          <td class='p-3 align-middle text-white'>
            <div class='flex items-center gap-3'>
              <div>
                <span class='font-medium'>{ws.Details.Name ?? 'Untitled'}</span>
                <p class='text-xs text-slate-400'>{ws.Details.Description || 'No description'}</p>
              </div>
              {!opts.archived && ws.Lookup === currentWorkspace.Lookup && (
                <span class='rounded-full border border-sky-400/60 bg-sky-500/15 px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-sky-200'>
                  Current
                </span>
              )}
              {opts.archived && (
                <span class='rounded-full border border-amber-400/60 bg-amber-500/10 px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-amber-200'>
                  Archived
                </span>
              )}
            </div>
          </td>
          <td class='p-3 align-middle'>
            <div class='flex flex-wrap gap-2 text-sm'>
              {!opts.archived && (
                <Action
                  styleType={ActionStyleTypes.Link}
                  onClick={() => handleArchiveWorkspace(ws)}
                  disabled={archivingLookup === ws.Lookup}
                >
                  {archivingLookup === ws.Lookup ? 'Archiving...' : 'Archive'}
                </Action>
              )}
              {(opts.archived || ws.Lookup !== currentWorkspace.Lookup) && (
                <Action
                  styleType={ActionStyleTypes.Link}
                  onClick={() => switchToWorkspace(ws.Lookup)}
                >
                  {opts.archived ? 'Restore' : 'Set Active'}
                </Action>
              )}
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );

  return (
    <>
      <Modal title='Manage Workspaces' onClose={onClose}>
        <div class='space-y-6 text-sm text-slate-200'>
          <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-950/80 p-6 shadow-xl'>
            <div
              class={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-neon-violet-500/80 via-sky-500/70 to-cyan-400/80`}
            />
            <div class='space-y-1'>
              <p class='text-xs font-semibold uppercase tracking-wide text-sky-300/90'>
                Workspace catalogue
              </p>
              <h3 class='text-2xl font-semibold text-white'>Your Workspaces</h3>
              <p class='text-sm text-slate-300'>
                Filter, inspect, and jump between workspaces. Kick off new environments whenever you
                are ready.
              </p>
            </div>
          </section>

          <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-neutral-900/80 p-4 shadow-xl'>
            <div
              class={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fuchsia-500/70 via-violet-500/70 to-sky-500/70 opacity-80`}
            />
            <div class='flex flex-wrap items-center gap-3'>
              <Input
                placeholder='Search workspaces...'
                value={filter}
                onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                  setFilter((e.target as HTMLInputElement).value)}
              />
              <p class='text-xs text-slate-400'>
                {filtered.length} result{filtered.length === 1 ? '' : 's'}
              </p>
            </div>
          </section>

          <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-neutral-900/80 p-4 shadow-xl'>
            <div
              class={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500/70 via-sky-500/70 to-cyan-400/70 opacity-80`}
            />
            <h4 class='text-sm font-semibold text-white'>Active workspaces</h4>
            <div class='mt-3 overflow-x-auto rounded-2xl border border-slate-800/40'>
              <table class='w-full text-left text-sm text-slate-200'>
                <thead class='bg-neutral-900/80 text-xs uppercase tracking-wide text-slate-400'>
                  <tr>
                    <th class='p-2'>Workspace</th>
                    <th class='p-2'>Actions</th>
                  </tr>
                </thead>
                {renderRows(active)}
              </table>
            </div>
            {active.length === 0 && (
              <p class='mt-4 rounded-xl border border-dashed border-slate-700/60 bg-neutral-950/50 p-4 text-center text-xs text-slate-400'>
                No workspaces match your current filter.
              </p>
            )}
          </section>

          <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-neutral-900/80 p-4 shadow-xl'>
            <div
              class={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400/70 via-orange-500/70 to-pink-500/70 opacity-80`}
            />
            <h4 class='text-sm font-semibold text-white'>Archived workspaces</h4>
            {archived.length > 0
              ? (
                <div class='mt-3 overflow-x-auto rounded-2xl border border-slate-800/40'>
                  <table class='w-full text-left text-sm text-slate-200'>
                    <thead class='bg-neutral-900/80 text-xs uppercase tracking-wide text-slate-400'>
                      <tr>
                        <th class='p-2'>Workspace</th>
                        <th class='p-2'>Actions</th>
                      </tr>
                    </thead>
                    {renderRows(archived, { archived: true })}
                  </table>
                </div>
              )
              : (
                <p class='mt-4 rounded-xl border border-dashed border-slate-700/60 bg-neutral-950/50 p-4 text-center text-xs text-slate-400'>
                  No archived workspaces yet.
                </p>
              )}
          </section>

          <div class='flex justify-end gap-2'>
            <Action
              onClick={() => setShowCreate(true)}
              intentType={IntentTypes.Primary}
              styleType={ActionStyleTypes.Outline}
            >
              + Create New Workspace
            </Action>
            <Action onClick={onClose}>Close</Action>
          </div>
        </div>
      </Modal>

      {showCreate && (
        <Modal title='Create New Workspace' onClose={() => setShowCreate(false)}>
          <div class='space-y-4 text-sm text-slate-200'>
            <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-neutral-900/85 p-5 shadow-xl'>
              <div
                class={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-neon-violet-500/80 via-sky-500/70 to-cyan-400/80`}
              />
              <div class='space-y-3'>
                <div class='space-y-1'>
                  <p class='text-xs font-semibold uppercase tracking-wide text-sky-300/90'>
                    Workspace details
                  </p>
                  <h3 class='text-xl font-semibold text-white'>New workspace</h3>
                </div>
                <Input
                  label='Workspace Name'
                  placeholder='e.g. Production Ops'
                  value={newName}
                  onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                    setNewName((e.target as HTMLInputElement).value)}
                />
                <Input
                  multiline
                  label='Description'
                  placeholder='Optional details for teammates'
                  value={newDesc}
                  onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                    setNewDesc((e.target as HTMLInputElement).value)}
                />
                <div class='flex justify-end gap-2 pt-2'>
                  <Action onClick={() => setShowCreate(false)}>Cancel</Action>
                  <Action
                    intentType={IntentTypes.Primary}
                    disabled={creating || !newName.trim()}
                    onClick={async () => {
                      const name = newName.trim();
                      if (!name) return;
                      try {
                        setCreating(true);
                        await createWorkspace(name, newDesc.trim());
                        setShowCreate(false);
                        setNewName('');
                        setNewDesc('');
                      } finally {
                        setCreating(false);
                      }
                    }}
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </Action>
                </div>
              </div>
            </section>
          </div>
        </Modal>
      )}
    </>
  );
}

ManageWorkspacesModal.Modal = (
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
          <ManageWorkspacesModal
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
