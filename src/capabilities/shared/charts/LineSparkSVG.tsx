import { classSet, IntentTypes, JSX } from '../../../.deps.ts';
import { buildLinearPath } from './buildLinearPath.ts';
import { buildSmoothPath } from './buildSmoothPath.ts';
import { buildStepPath } from './buildStepPath.ts';

export type LineSeries = {
  values: number[];
  intent?: IntentTypes;
  smoothing?: number;
  mode?: 'smooth' | 'linear' | 'step';
};

type LineSparkSVGProps = {
  lines: LineSeries[];
  width?: number;
  height?: number;
  animate?: boolean;
  yMin?: number;
  yMax?: number;
  yPadding?: number; // percentage like 0.1 for 10%
} & JSX.HTMLAttributes<SVGSVGElement>;

const intentToClass: Record<IntentTypes, string> = {
  [IntentTypes.None]: '',
  [IntentTypes.Primary]: 'text-neon-violet-400',
  [IntentTypes.Secondary]: 'text-neon-indigo-400',
  [IntentTypes.Tertiary]: 'text-neon-blue-400',
  [IntentTypes.Warning]: 'text-neon-yellow-400',
  [IntentTypes.Error]: 'text-neon-red-500',
  [IntentTypes.Info]: 'text-neon-cyan-400',
};

function normalizeAndBuildPath(
  values: number[],
  width: number,
  height: number,
  smoothing: number,
  mode: 'smooth' | 'linear' | 'step',
  yMin?: number,
  yMax?: number,
  yPadding = 0.1,
): string {
  if (values.length < 2) return '';

  const minVal = yMin ?? Math.min(...values);
  const maxVal = yMax ?? Math.max(...values);
  const range = maxVal - minVal || 1;

  const paddedMin = minVal - range * yPadding;
  const paddedMax = maxVal + range * yPadding;
  const paddedRange = paddedMax - paddedMin;

  const scaleY = (v: number) => height - ((v - paddedMin) / paddedRange) * height;

  if (mode === 'smooth') {
    return buildSmoothPath(values, width, height, smoothing, scaleY);
  } else if (mode === 'step') {
    return buildStepPath(values, width, height, scaleY);
  } else {
    return buildLinearPath(values, width, height, scaleY);
  }
}

export function LineSparkSVG({
  lines,
  width = 100,
  height = 40,
  animate = true,
  yMin,
  yMax,
  yPadding = 0.1,
  ...props
}: LineSparkSVGProps): JSX.Element {
  return (
    <svg
      {...props}
      class={classSet([`w-full`], props)}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio='none'
    >
      {lines.map((line, idx) => {
        const {
          values,
          intent = IntentTypes.Primary,
          smoothing = 0.2,
          mode = 'smooth',
        } = line;

        const d = normalizeAndBuildPath(
          values,
          width,
          height,
          smoothing,
          mode,
          yMin,
          yMax,
          yPadding,
        );

        const strokeClass = intentToClass[intent];

        return (
          <path
            key={idx}
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            d={d}
            class={`${strokeClass} ${animate ? 'animate-[pulse_1.5s_ease-in-out_infinite]' : ''}`}
          />
        );
      })}
    </svg>
  );
}
