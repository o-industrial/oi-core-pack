import { NodeProps } from '../../.deps.ts';
import { ReactPosition } from '../../.deps.ts';
import { LinePreviewWithValue } from '../../.deps.ts';
import { NodeHandle } from '../../.deps.ts';
import { IntentTypes } from '../../.deps.ts';
import { SurfaceConnectionNodeData } from './SurfaceConnectionNodeData.tsx';
import { WorkspaceNodeRendererBase } from '../../.deps.ts';

export default function SurfaceConnectionNodeRenderer({
  data,
}: NodeProps<SurfaceConnectionNodeData>) {
  const stats = data.useStats();
  const impulses = stats?.ImpulseRates ?? [];
  const latest = impulses.at(-1);

  return (
    <WorkspaceNodeRendererBase
      iconKey='connection'
      label={data.label}
      enabled={data.enabled}
      onDoubleClick={data.onDoubleClick}
      isSelected={data.isSelected}
      pulseIntent={IntentTypes.Info}
      class='data-[state=expanded]:w-[300px] data-[state=expanded]:h-auto data-[state=expanded]:rounded-md'
      postMain={
        <NodeHandle
          type='source'
          position={ReactPosition.Right}
          intentType={IntentTypes.Info}
        />
      }
    >
      {impulses.length > 1
        ? (
          <LinePreviewWithValue
            label='Impulse'
            values={impulses}
            currentValue={latest}
            intent={IntentTypes.Info}
            yMin={5}
            yMax={20}
          />
        )
        : <div class='text-sm text-gray-400 italic p-2'>Awaiting data…</div>}
    </WorkspaceNodeRendererBase>
  );
}
