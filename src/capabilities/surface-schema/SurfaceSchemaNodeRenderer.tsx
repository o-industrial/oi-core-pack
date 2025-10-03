import { ReactPosition } from '../../.deps.ts';
import { Action, ActionStyleTypes, DeleteIcon, LinePreviewWithValue } from '../../.deps.ts';
import { NodeHandle } from '../../.deps.ts';
import { WorkspaceNodeRendererBase } from '../../.deps.ts';
import { IntentTypes } from '../../.deps.ts';
import { NodeProps } from '../../.deps.ts';
import { SurfaceSchemaNodeData } from './SurfaceSchemaNodeData.tsx';

export default function SurfaceSchemaNodeRenderer({
  data,
}: NodeProps<SurfaceSchemaNodeData>) {
  const stats = data.useStats();
  const impulseRates = stats?.ImpulseRates ?? [];
  const latest = impulseRates.at(-1);

  const classes = `
    transition-[width,height,border-radius,border-color,background-color]
    data-[state=expanded]:w-[300px] data-[state=expanded]:h-auto data-[state=expanded]:rounded-md
  `;

  return (
    <WorkspaceNodeRendererBase
      iconKey='schema'
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
              currentValue={latest}
              intent={IntentTypes.Info}
              yMin={0}
              yMax={25}
            />
          )
          : <div class='text-sm text-gray-400 italic mb-2'>No live rate data</div>}

        {/* Footer Actions */}
        <div class='flex justify-end gap-2 w-full mt-1 px-2'>
          <Action
            title='Delete Schema'
            styleType={ActionStyleTypes.Icon}
            intentType={IntentTypes.Error}
            onClick={() => console.log('Delete schema:', data.label)}
          >
            <DeleteIcon class='w-6 h-6' />
          </Action>
        </div>
      </div>
    </WorkspaceNodeRendererBase>
  );
}
