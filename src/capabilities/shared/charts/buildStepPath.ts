export function buildStepPath(
  values: number[],
  width: number,
  height: number,
  scaleY?: (v: number) => number,
): string {
  if (values.length < 2) return '';

  const max = Math.max(...values, 1);
  const localScaleY = scaleY ?? ((v) => height - (v / max) * height);
  const stepX = width / (values.length - 1);

  let d = `M 0 ${localScaleY(values[0])}`;
  for (let i = 1; i < values.length; i++) {
    const x = i * stepX;
    const y = localScaleY(values[i]);
    d += ` H ${x} V ${y}`;
  }

  return d;
}
