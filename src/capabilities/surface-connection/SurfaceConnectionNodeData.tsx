import { SurfaceDataConnectionSettings } from '../../.deps.ts';
import { FlowNodeData } from '../../.deps.ts';
import { SurfaceConnectionStats } from './SurfaceConnectionStats.tsx';

export type SurfaceConnectionNodeData = FlowNodeData<
  SurfaceDataConnectionSettings,
  SurfaceConnectionStats
>;
