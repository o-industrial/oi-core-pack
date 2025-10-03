import { EaCSimulatorDetails } from '../../.deps.ts';
import { FlowNodeData } from '../../.deps.ts';
import { SimulatorStats } from './SimulatorStats.tsx';

export type SimulatorNodeData = FlowNodeData<
  EaCSimulatorDetails,
  SimulatorStats
>;
