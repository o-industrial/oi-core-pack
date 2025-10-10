export function parseTimeAgoString(ago: string): number {
  const num = parseInt(ago.replace(/[^\d]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}
