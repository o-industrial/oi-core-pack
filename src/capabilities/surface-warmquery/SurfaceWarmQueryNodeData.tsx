import { FlowNodeData } from '../../.deps.ts';
import { SurfaceWarmQueryStats } from './SurfaceWarmQueryStats.tsx';
import { SurfaceWarmQuerySettings } from '../../.deps.ts';

export type SurfaceWarmQueryNodeData = FlowNodeData<
  SurfaceWarmQuerySettings,
  SurfaceWarmQueryStats
>;
