import { NodeProps, useMemo } from '../../.deps.ts';
import { ReactPosition } from '../../.deps.ts';
import {
  Action,
  ActionStyleTypes,
  LinePreviewWithValue,
  NodeStatTile,
  parseTimeAgoString,
} from '../../.deps.ts';
import { NodeHandle } from '../../.deps.ts';
import { WorkspaceNodeRendererBase } from '../../.deps.ts';
import { IntentTypes } from '../../.deps.ts';
import { SurfaceNodeData } from './SurfaceNodeData.ts';

export default function SurfaceNodeRenderer({
  data,
  id,
}: NodeProps<SurfaceNodeData>) {
  const stats = data.useStats();

  const impulseRates = stats?.ImpulseRates ?? [];
  const inputCount = stats?.InputCount ?? 0;
  const agentCount = stats?.AgentCount ?? 0;
  const lastSignalAt = stats?.LastSignalAt ?? '—';
  const lastSignalAge = useMemo(
    () => parseTimeAgoString(lastSignalAt),
    [lastSignalAt],
  );
  const currentRate = impulseRates.at(-1);

  return (
    <WorkspaceNodeRendererBase
      iconKey='surface'
      label={data.label}
      enabled={data.enabled}
      onDoubleClick={data.onDoubleClick}
      isSelected={data.isSelected}
      class='data-[state=expanded]:w-[300px] data-[state=expanded]:h-auto data-[state=expanded]:rounded-md'
      preMain={
        <NodeHandle
          type='target'
          position={ReactPosition.Left}
          intentType={IntentTypes.Secondary}
        />
      }
    >
      <div class='w-full flex flex-col gap-2 items-center justify-center py-2 px-2'>
        <div class='w-full flex justify-between mt-2 mb-2 gap-2'>
          <NodeStatTile
            label='Inputs'
            value={inputCount}
            intent={IntentTypes.Tertiary}
          />
          <NodeStatTile
            label='Agents'
            value={agentCount}
            intent={IntentTypes.Secondary}
          />
          <NodeStatTile
            label='Last Signal'
            value={lastSignalAt}
            intent={lastSignalAge > 60 ? IntentTypes.Error : IntentTypes.Primary}
            animate={lastSignalAge > 60}
          />
        </div>

        {impulseRates.length > 1
          ? (
            <LinePreviewWithValue
              label='Rate'
              values={impulseRates}
              currentValue={currentRate}
              intent={IntentTypes.Tertiary}
              yMin={5}
              yMax={20}
            />
          )
          : <div class='text-sm text-gray-400 italic mb-2'>No live rate data</div>}

        <div class='flex justify-end gap-2 w-full mt-1 px-2'>
          <Action
            title='Manage Surface'
            styleType={ActionStyleTypes.Icon}
            intentType={IntentTypes.Info}
            onClick={() => data.onNodeEvent?.({ Type: 'manage', NodeID: id })}
          >
            <svg class='w-6 h-6' viewBox='0 0 24 24' fill='none'>
              <path
                d='M9 18V5l12-2v13'
                stroke='currentColor'
                stroke-width='2'
              />
              <path d='M3 6v13l12 2V8' stroke='currentColor' stroke-width='2' />
            </svg>
          </Action>
        </div>
      </div>
    </WorkspaceNodeRendererBase>
  );
}
