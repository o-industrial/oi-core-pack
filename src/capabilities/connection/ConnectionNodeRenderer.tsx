import {
  Action,
  ActionStyleTypes,
  DeleteIcon,
  IntentTypes,
  JSX,
  LinePreviewWithValue,
  memo,
  NodeHandle,
  NodeProps,
  ReactPosition,
  TriggerMatchIcon,
  WorkspaceNodeRendererBase,
} from '../../.deps.ts';
import { DataConnectionNodeData } from './DataConnectionNodeData.tsx';

export const MemoizedConnectionRenderer: ({
  data,
}: NodeProps<DataConnectionNodeData>) => JSX.Element = memo(
  ConnectionNodeRenderer,
);

export default function ConnectionNodeRenderer({
  data,
}: NodeProps<DataConnectionNodeData>) {
  const stats = data.useStats();

  const { ImpulseRates: impulseRates = [], Metadata: connectionInfo = {} } = stats ?? {};

  const latest = impulseRates.at(-1);

  const classes = `
    transition-[width,height,border-radius,border-color,background-color]
    data-[state=expanded]:w-[300px] data-[state=expanded]:h-auto data-[state=expanded]:rounded-md
  `;

  return (
    <WorkspaceNodeRendererBase
      iconKey='connection'
      label={data.label}
      enabled={data.enabled}
      onDoubleClick={data.onDoubleClick}
      isSelected={data.isSelected}
      class={classes}
      preMain={
        <NodeHandle
          type='target'
          position={ReactPosition.Left}
          intentType={IntentTypes.Tertiary}
        />
      }
      postMain={
        <NodeHandle
          type='source'
          position={ReactPosition.Right}
          intentType={IntentTypes.Tertiary}
        />
      }
    >
      <div class='w-full flex flex-col items-center justify-center py-2 px-2 gap-2'>
        {/* Live Impulse Rate Chart */}
        {impulseRates.length > 1
          ? (
            <LinePreviewWithValue
              label='Rate'
              values={impulseRates}
              currentValue={latest}
              intent={IntentTypes.Warning}
              yMin={15}
              yMax={30}
            />
          )
          : <div class='text-sm text-gray-400 italic mb-2'>No live rate data</div>}

        {/* Optional Connection Info Preview */}
        {Object.keys(connectionInfo).length > 0 && (
          <div class='w-full border border-neutral-700 rounded p-2 bg-neutral-800'>
            <h4 class='text-xs font-semibold text-white mb-1'>Connection</h4>
            <ul class='text-xs text-neutral-300 space-y-1'>
              {Object.entries(connectionInfo).map(([key, val]) => (
                <li key={key} class='flex justify-between'>
                  <span class='text-neutral-400'>{key}</span>
                  <span class='font-mono'>{val}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer Actions */}
        <div class='flex justify-end gap-2 w-full mt-1 px-2'>
          <Action
            title='Filter Stream'
            styleType={ActionStyleTypes.Icon}
            intentType={IntentTypes.Tertiary}
            onClick={() => console.log('Filter stream for:', data.label)}
          >
            <TriggerMatchIcon class='w-6 h-6' />
          </Action>

          <Action
            title='Delete Connection'
            styleType={ActionStyleTypes.Icon}
            intentType={IntentTypes.Error}
            onClick={() => console.log('Delete node:', data.label)}
          >
            <DeleteIcon class='w-6 h-6' />
          </Action>
        </div>
      </div>
    </WorkspaceNodeRendererBase>
  );
}
