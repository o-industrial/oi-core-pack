export function buildSmoothPath(
  values: number[],
  width: number,
  height: number,
  smoothing = 0.2,
  scaleY?: (v: number) => number,
): string {
  if (values.length < 2) return '';

  const max = Math.max(...values, 1);
  const localScaleY = scaleY ?? ((v) => height - (v / max) * height);
  const stepX = width / (values.length - 1);

  const getPoint = (i: number) => ({
    x: i * stepX,
    y: localScaleY(values[i]),
  });

  let d = `M 0 ${localScaleY(values[0]).toFixed(2)}`;

  for (let i = 1; i < values.length; i++) {
    const prev = getPoint(i - 1);
    const curr = getPoint(i);
    const cpX = prev.x + stepX * smoothing;

    d += ` C ${cpX.toFixed(2)} ${prev.y.toFixed(2)}, ${cpX.toFixed(2)} ${curr.y.toFixed(2)}, ${
      curr.x.toFixed(2)
    } ${curr.y.toFixed(2)}`;
  }

  return d;
}
