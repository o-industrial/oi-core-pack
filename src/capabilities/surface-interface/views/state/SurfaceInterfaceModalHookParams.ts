import type { EaCInterfaceDetails, SurfaceInterfaceSettings } from '../../../../.deps.ts';
import type { WorkspaceManager } from '../../../../.deps.ts';

export type SurfaceInterfaceModalHookParams = {
  isOpen: boolean;
  interfaceLookup: string;
  surfaceLookup?: string;
  details: EaCInterfaceDetails;
  settings?: SurfaceInterfaceSettings;
  workspaceMgr: WorkspaceManager;
  onDetailsChange?: (next: Partial<EaCInterfaceDetails>) => void;
};
