import { SurfaceNodeEvent } from './SurfaceNodeEvent.ts';
import { SurfaceStats } from './SurfaceStats.ts';
import { EaCSurfaceDetails } from '../../.deps.ts';
import { FlowNodeData } from '../../.deps.ts';

export type SurfaceNodeData = FlowNodeData<
  EaCSurfaceDetails,
  SurfaceStats,
  SurfaceNodeEvent
>;
