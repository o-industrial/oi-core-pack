import {
  Action,
  ActionStyleTypes,
  Input,
  JSX,
  Modal,
  SearchIcon,
  SimulatorCard,
  SimulatorDefinition,
  SimulatorPackCard,
  SimulatorPackDefinition,
  useState,
  WorkspaceManager,
} from '../../../.deps.ts';

type SimulatorLibraryModalProps = {
  workspaceMgr: WorkspaceManager;
  onClose: () => void;
};

const CATEGORIES = [
  { key: 'all', label: 'All Simulators' },
  { key: 'environmental', label: 'Environmental' },
  { key: 'factory', label: 'Factory' },
  { key: 'medical', label: 'Medical' },
  { key: 'custom', label: 'Custom / External' },
];

export function SimulatorLibraryModal({
  workspaceMgr,
  onClose,
}: SimulatorLibraryModalProps): JSX.Element {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const simulators = workspaceMgr.Simulators.GetByCategory(category).filter(
    (sim) => sim.Label.toLowerCase().includes(search.toLowerCase()),
  );

  const packs: SimulatorPackDefinition[] = workspaceMgr.Simulators.GetPacksByCategory(category);

  const handleInstall = (sims: SimulatorDefinition[]) => {
    workspaceMgr.EaC.InstallSimulators(sims);

    onClose();
  };

  return (
    <Modal title='Simulator Marketplace' onClose={onClose}>
      <div class='flex h-full'>
        {/* Sidebar */}
        <div class='w-64 flex-shrink-0 pr-4 border-r border-neutral-700'>
          <div class='flex items-center gap-2 mb-4'>
            <Input
              placeholder='Search simulators...'
              value={search}
              onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                setSearch((e.target as HTMLInputElement).value)}
              class='w-full'
            />
            <Action
              title='Search'
              onClick={() => {}}
              styleType={ActionStyleTypes.Icon}
            >
              <SearchIcon class='w-6 h-6' />
            </Action>
          </div>

          <div class='space-y-1 text-sm'>
            {CATEGORIES.map((cat) => (
              <Action
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                class={`w-full text-left px-3 py-1 rounded transition ${
                  category === cat.key
                    ? 'bg-neon-violet-500 text-white font-semibold'
                    : 'text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                {cat.label}
              </Action>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div class='flex-1 pl-4 overflow-y-auto'>
          <div class='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
            {simulators.map((sim) => (
              <SimulatorCard
                key={sim.ID}
                id={sim.ID}
                name={sim.Label}
                description={sim.Description}
                category={sim.Category}
                onInstall={() => handleInstall([sim])}
              />
            ))}

            {packs.map((pack) => (
              <SimulatorPackCard
                key={pack.ID}
                id={pack.ID}
                name={pack.Label}
                description={pack.Description}
                simulatorCount={pack.Simulators.length}
                usedSimulators={0}
                onInstallPack={(id) => {
                  const sims = workspaceMgr.Simulators.ResolvePack(id);
                  if (sims.length) {
                    handleInstall(sims);
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

SimulatorLibraryModal.Modal = (
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
          <SimulatorLibraryModal
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
