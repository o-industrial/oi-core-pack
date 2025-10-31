export function formatMessages(messages?: string[]): string {
  return (messages ?? []).join('\n');
}
