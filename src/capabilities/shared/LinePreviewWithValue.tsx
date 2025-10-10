import { IntentTypes, JSX } from '../../.deps.ts';
import { LineSparkSVG } from './charts/LineSparkSVG.tsx';

type LinePreviewWithValueProps = {
  label?: string;
  values: number[];
  currentValue?: number | null;
  intent?: IntentTypes;
  animate?: boolean;
  height?: number;
  yMin?: number;
  yMax?: number;
  yPadding?: number;
  class?: string;
};

export function LinePreviewWithValue({
  label = 'Rate',
  values,
  currentValue,
  intent = IntentTypes.Primary,
  animate = true,
  height = 40,
  yMin,
  yMax,
  yPadding,
  class: className = '',
}: LinePreviewWithValueProps): JSX.Element {
  const last = currentValue ?? values.at(-1) ?? null;

  const valueClass = intent === IntentTypes.None ? 'text-white' : {
    [IntentTypes.Primary]: 'text-neon-violet-400',
    [IntentTypes.Secondary]: 'text-neon-indigo-400',
    [IntentTypes.Tertiary]: 'text-neon-blue-400',
    [IntentTypes.Warning]: 'text-neon-yellow-400',
    [IntentTypes.Error]: 'text-neon-red-500',
    [IntentTypes.Info]: 'text-neon-cyan-400',
  }[intent];

  return (
    <div
      class={`flex flex-row items-center justify-between w-full gap-2 px-2 ${className}`}
    >
      <div class='flex flex-col text-left text-sm text-gray-400'>
        <span class='leading-tight'>{label}</span>
        <span class={`text-3xl font-bold ${valueClass}`}>
          {last != null ? last.toFixed(1) : '—'}
        </span>
      </div>

      <div class='flex-grow h-full'>
        <LineSparkSVG
          lines={[{ values, intent }]}
          height={height}
          yMin={yMin}
          yMax={yMax}
          yPadding={yPadding}
          animate={animate}
        />
      </div>
    </div>
  );
}
