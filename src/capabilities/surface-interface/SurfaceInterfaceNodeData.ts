import { FlowNodeData } from '../../.deps.ts';
import { EaCInterfaceDetails, SurfaceInterfaceSettings } from '../../.deps.ts';
import { SurfaceInterfaceStats } from './SurfaceInterfaceStats.tsx';

export type SurfaceInterfaceNodeDetails =
  & EaCInterfaceDetails
  & SurfaceInterfaceSettings
  & {
    SurfaceLookup?: string;
  };

export type SurfaceInterfaceNodeData = FlowNodeData<
  SurfaceInterfaceNodeDetails,
  SurfaceInterfaceStats
>;
