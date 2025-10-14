import {
  AccountProfileModal,
  APIKeysModal,
  BillingDetailsModal,
  CloudConnectionsModal,
  CurrentLicenseModal,
  DataAPISuiteModal,
  type EverythingAsCode,
  type EverythingAsCodeClouds,
  type EverythingAsCodeLicensing,
  JSX,
  ManageIoTModal,
  ManageWorkspacesModal,
  type MenuRoot,
  OEMIntegrationsModal,
  PrivateCALZModal,
  SimulatorLibraryModal,
  TeamManagementModal,
  WarmQueryAPIsModal,
  WorkspaceManager,
  WorkspaceSettingsModal,
} from '../.deps.ts';

export type WorkspaceAppMenuHandles = {
  handleMenu: (item: { id: string }) => void;
  modals: JSX.Element;
  showAccProf: () => void;
  showApiKeys: () => void;
  showBilling: () => void;
  showCloudConns: () => void;
  showDataSuite: () => void;
  showLicense: () => void;
  showManageIot: () => void;
  showMngWksps: () => void;
  showOemIntegrations: () => void;
  showSimLib: () => void;
  showTeamMgmt: () => void;
  showWarmQuery: () => void;
  showWkspSets: () => void;
  showPrivateCalz: () => void;
};

export function createWorkspaceAppMenu(
  workspaceMgr: WorkspaceManager,
  eac: EverythingAsCode & EverythingAsCodeLicensing & EverythingAsCodeClouds,
): WorkspaceAppMenuHandles {
  const { Modal: accProfModal, Show: showAccProf } = AccountProfileModal.Modal(workspaceMgr);
  const { Modal: mngWkspsModal, Show: showMngWksps } = ManageWorkspacesModal.Modal(workspaceMgr);
  const { Modal: simLibModal, Show: showSimLib } = SimulatorLibraryModal.Modal(workspaceMgr);
  const { Modal: teamMgmtModal, Show: showTeamMgmt } = TeamManagementModal.Modal(workspaceMgr);
  const { Modal: wkspSetsModal, Show: showWkspSets } = WorkspaceSettingsModal.Modal(workspaceMgr);
  const { Modal: warmQueryModal, Show: showWarmQuery } = WarmQueryAPIsModal.Modal(workspaceMgr);
  const { Modal: apiKeysModal, Show: showApiKeys } = APIKeysModal.Modal(workspaceMgr);
  const { Modal: dataSuiteModal, Show: showDataSuite } = DataAPISuiteModal.Modal(workspaceMgr);
  const { Modal: billingModal, Show: showBilling } = BillingDetailsModal.Modal(workspaceMgr);
  const { Modal: licenseModal, Show: showLicense } = CurrentLicenseModal.Modal(
    eac,
    workspaceMgr,
  );
  const { Modal: cloudConnsModal, Show: showCloudConns } = CloudConnectionsModal.Modal(
    workspaceMgr,
  );
  const { Modal: privateCalzModal, Show: showPrivateCalz } = PrivateCALZModal.Modal(workspaceMgr);
  const { Modal: manageIotModal, Show: showManageIot } = ManageIoTModal.Modal(workspaceMgr);
  const { Modal: oemIntegrationsModal, Show: showOemIntegrations } = OEMIntegrationsModal.Modal(
    workspaceMgr,
  );

  const modals = (
    <>
      {simLibModal}
      {accProfModal}
      {mngWkspsModal}
      {teamMgmtModal}
      {wkspSetsModal}
      {cloudConnsModal}
      {privateCalzModal}
      {manageIotModal}
      {oemIntegrationsModal}
      {warmQueryModal}
      {apiKeysModal}
      {dataSuiteModal}
      {billingModal}
      {licenseModal}
    </>
  );

  const handleMenu = (item: { id: string }) => {
    console.log('menu', item);
    switch (item.id) {
      case 'workspace.settings':
        showWkspSets();
        break;
      case 'workspace.team':
        showTeamMgmt();
        break;
      case 'workspace.viewAll':
        showMngWksps();
        break;
      case 'apis.warmQuery':
        showWarmQuery();
        break;
      case 'apis.apiKeys':
        showApiKeys();
        break;
      case 'apis.dataSuite':
        showDataSuite();
        break;
      case 'env.connections':
        showCloudConns();
        break;
      case 'env.calz':
        showPrivateCalz();
        break;
      case 'env.iot':
        showManageIot();
        break;
      case 'env.oem':
        showOemIntegrations();
        break;
      case 'billing.details':
        showBilling();
        break;
      case 'billing.license':
        showLicense();
        break;
    }
  };

  return {
    handleMenu,
    modals,
    showAccProf,
    showApiKeys,
    showBilling,
    showCloudConns,
    showDataSuite,
    showLicense,
    showManageIot,
    showMngWksps,
    showOemIntegrations,
    showSimLib,
    showTeamMgmt,
    showWarmQuery,
    showWkspSets,
    showPrivateCalz,
  };
}
export function getWorkspaceRuntimeMenus(
  eac: EverythingAsCode & EverythingAsCodeLicensing & EverythingAsCodeClouds,
): MenuRoot[] {
  const icons = {
    settings: 'https://api.iconify.design/lucide:settings.svg',
    users: 'https://api.iconify.design/lucide:users.svg',
    stack: 'https://api.iconify.design/lucide:layers-3.svg',
    link: 'https://api.iconify.design/mdi:link-variant.svg',
    privateCloud: 'https://api.iconify.design/lucide:server.svg',
    iot: 'https://api.iconify.design/lucide:radar.svg',
    oem: 'https://api.iconify.design/lucide:puzzle.svg',
    warmQuery: 'https://api.iconify.design/mdi:sql-query.svg',
    key: 'https://api.iconify.design/lucide:key.svg',
    license: 'https://api.iconify.design/lucide:badge-check.svg',
  } as const;

  const hasWorkspaceCloud = !!eac.Clouds?.Workspace?.Details ||
    Object.keys(eac.Clouds ?? {}).length > 0;

  return [
    {
      id: 'workspace',
      label: 'Workspace',
      items: [
        {
          type: 'item',
          id: 'workspace.settings',
          label: 'Settings',
          iconSrc: icons.settings,
        },
        {
          type: 'item',
          id: 'workspace.team',
          label: 'Team Members',
          iconSrc: icons.users,
        },
        {
          type: 'item',
          id: 'workspace.viewAll',
          label: 'View All...',
          iconSrc: icons.stack,
          payload: { target: 'workspace-index' },
        },
      ],
    },
    {
      id: 'environment',
      label: 'Environment',
      items: [
        {
          type: 'item',
          id: 'env.connections',
          label: 'Cloud Connections',
          iconSrc: icons.link,
        },
        ...(hasWorkspaceCloud
          ? [
            {
              type: 'item' as const,
              id: 'env.calz',
              label: 'Manage Private CALZ',
              iconSrc: icons.privateCloud,
            },
            {
              type: 'item' as const,
              id: 'env.iot',
              label: 'Manage IoT',
              iconSrc: icons.iot,
            },
            {
              type: 'item' as const,
              id: 'env.oem',
              label: 'OEM Integrations',
              iconSrc: icons.oem,
            },
          ]
          : []),
      ],
    },
    {
      id: 'apis',
      label: 'APIs',
      items: [
        {
          type: 'item',
          id: 'apis.apiKeys',
          label: 'API Keys',
          iconSrc: icons.key,
        },
        {
          type: 'item',
          id: 'apis.dataSuite',
          label: 'Data API Suite',
          iconSrc: icons.stack,
          payload: { section: 'data' },
        },
        {
          type: 'item',
          id: 'apis.warmQuery',
          label: 'Warm Query Management',
          iconSrc: icons.warmQuery,
        },
      ],
    },
    {
      id: 'billing',
      label: 'Billing',
      items: [
        {
          type: 'item',
          id: 'billing.license',
          label: 'Current License',
          iconSrc: icons.license,
        },
      ],
    },
  ];
}
