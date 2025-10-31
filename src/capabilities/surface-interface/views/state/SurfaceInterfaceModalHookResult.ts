import type {
  EaCInterfaceDataConnectionFeatures,
  EaCInterfaceDetails,
  EaCInterfaceGeneratedDataSlice,
  EaCInterfacePageDataAccessMode,
  EaCInterfacePageDataActionInvocationMode,
  EaCInterfacePageDataType,
} from '../../../../.deps.ts';
import type { SurfaceInterfaceTabKey } from '../SurfaceInterfaceModal.tsx';
import type { SurfaceInterfaceModalHandlerState } from './SurfaceInterfaceModalHandlerState.ts';
import type { SurfaceInterfaceModalPageDocs } from './SurfaceInterfaceModalPageDocs.ts';
import type { SurfaceInterfaceModalPageState } from './SurfaceInterfaceModalPageState.ts';
import type { SurfaceInterfaceModalPreviewState } from './SurfaceInterfaceModalPreviewState.ts';

export type SurfaceInterfaceModalHookResult = {
  resolvedDetails: EaCInterfaceDetails;
  resolvedDisplayName: string;
  safeInterfaceId: string;
  activeTab: SurfaceInterfaceTabKey;
  setActiveTab: (tab: SurfaceInterfaceTabKey) => void;
  imports: string[];
  importsInvalid: boolean;
  onImportsChange: (next: string[]) => void;
  setImportsInvalid: (next: boolean) => void;
  pageDataType: EaCInterfacePageDataType;
  generatedSliceEntries: Array<[string, EaCInterfaceGeneratedDataSlice]>;
  handler: SurfaceInterfaceModalHandlerState;
  page: SurfaceInterfaceModalPageState;
  preview: SurfaceInterfaceModalPreviewState;
  pageDocs: SurfaceInterfaceModalPageDocs;
  handleAccessModeChange: (
    key: string,
    mode: EaCInterfacePageDataAccessMode,
  ) => void;
  handleDataConnectionFeaturesChange: (
    key: string,
    features: EaCInterfaceDataConnectionFeatures | undefined,
  ) => void;
  handleActionModeChange: (
    sliceKey: string,
    actionKey: string,
    mode: EaCInterfacePageDataActionInvocationMode | null,
  ) => void;
  interfaceAzi: unknown;
  enterpriseLookup: string;
  renderAziMessage: (message: string) => string;
  debouncedExtraInputs: Record<string, unknown>;
};
