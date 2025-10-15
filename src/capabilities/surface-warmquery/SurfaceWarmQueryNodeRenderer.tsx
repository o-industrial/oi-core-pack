import { ReactPosition } from '../../.deps.ts';
import { NodeProps } from '../../.deps.ts';
import { WorkspaceNodeRendererBase } from '../../.deps.ts';
import { NodeHandle } from '../../.deps.ts';
import { IntentTypes } from '../../.deps.ts';
import { Action, ActionStyleTypes, DeleteIcon, NodeStatTile } from '../../.deps.ts';
import { LinePreviewWithValue } from '../shared/LinePreviewWithValue.tsx';
import { parseTimeAgoString } from '../shared/utils/parseTimeAgoString.ts';
import { SurfaceWarmQueryNodeData } from './SurfaceWarmQueryNodeData.tsx';

export default function SurfaceWarmQueryNodeRenderer({
  data,
}: NodeProps<SurfaceWarmQueryNodeData>) {
  const stats = data.useStats();

  const {
    impulseRates = [],
    matchesHandled = 0,
    avgLatencyMs = 0,
    lastRunAgo = '—',
  } = stats || {};

  const currentRate = impulseRates.at(-1);
  const lastRunAge = parseTimeAgoString(lastRunAgo);

  const classes = `
    transition-[width,height,border-radius,border-color,background-color]
    data-[state=expanded]:w-[300px] data-[state=expanded]:h-auto data-[state=expanded]:rounded-md
  `;

  return (
    <WorkspaceNodeRendererBase
      iconKey='warmQuery'
      label={data.label}
      enabled={data.enabled}
      onDoubleClick={data.onDoubleClick}
      isSelected={data.isSelected}
      class={classes}
      preMain={
        <NodeHandle
          type='target'
          position={ReactPosition.Left}
          intentType={IntentTypes.Secondary}
        />
      }
      postMain={
        <NodeHandle
          type='source'
          position={ReactPosition.Right}
          intentType={IntentTypes.Secondary}
        />
      }
    >
      <div class='w-full flex flex-col items-center justify-center py-2 px-2 gap-2'>
        {/* Live Impulse Chart */}
        {impulseRates.length > 1
          ? (
            <LinePreviewWithValue
              label='Rate'
              values={impulseRates}
              currentValue={currentRate}
              intent={IntentTypes.Info}
              yMin={0}
              yMax={25}
            />
          )
          : <div class='text-sm text-gray-400 italic mb-2'>No live rate data</div>}

        {/* Warm Query Stats */}
        <div class='w-full flex justify-between gap-2 px-2'>
          <NodeStatTile
            label='Matches'
            value={matchesHandled}
            intent={IntentTypes.Tertiary}
          />
          <NodeStatTile
            label='Latency'
            value={`${avgLatencyMs}ms`}
            intent={IntentTypes.Warning}
          />
          <NodeStatTile
            label='Last Run'
            value={lastRunAgo}
            intent={lastRunAge > 30 ? IntentTypes.Error : IntentTypes.Secondary}
            animate={lastRunAge > 30}
          />
        </div>

        {/* Footer Actions */}
        <div class='flex justify-end gap-2 w-full mt-1 px-2'>
          <Action
            title='Delete Warm Query'
            styleType={ActionStyleTypes.Icon}
            intentType={IntentTypes.Error}
            onClick={() => console.log('Delete warm query:', data.label)}
          >
            <DeleteIcon class='w-6 h-6' />
          </Action>
        </div>
      </div>
    </WorkspaceNodeRendererBase>
  );
}
