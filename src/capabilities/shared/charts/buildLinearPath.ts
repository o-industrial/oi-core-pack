export function buildLinearPath(
  values: number[],
  width: number,
  height: number,
  scaleY?: (v: number) => number,
): string {
  if (values.length < 2) return '';

  const max = Math.max(...values, 1);
  const localScaleY = scaleY ?? ((v) => height - (v / max) * height);
  const stepX = width / (values.length - 1);

  return values
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX},${localScaleY(v)}`)
    .join(' ');
}
