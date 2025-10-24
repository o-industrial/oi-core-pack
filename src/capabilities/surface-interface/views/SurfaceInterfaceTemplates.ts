export function toPascalCase(value: string): string {
  return value
    .split(/[^A-Za-z0-9]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('') || 'Interface';
}

export function toCamelCase(value: string): string {
  const segments = value
    .split(/[^A-Za-z0-9]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.toLowerCase());
  if (segments.length === 0) return '';
  return segments
    .map((segment, index) =>
      index === 0 ? segment : segment.charAt(0).toUpperCase() + segment.slice(1)
    )
    .join('');
}

export function buildDefaultInterfaceComponent(
  lookup: string,
  safeId?: string,
  displayName?: string,
): string {
  const resolvedSafeId = (safeId ?? toPascalCase(lookup)) || 'Interface';
  const resolvedDisplayName = displayName?.trim()?.length
    ? displayName.trim()
    : `${resolvedSafeId} interface`;

  return `export default function InterfacePage({
  data,
  services,
  status,
  refresh,
}: InterfacePageProps) {
  return (
    <section class="oi-interface-splash">
      <header>
        <h1>${escapeTemplate(resolvedDisplayName)}</h1>
        <p>Lookup: ${escapeTemplate(lookup)}</p>
      </header>
      <p>{data.message ?? "Replace this placeholder once the page view is authored."}</p>
      <button type="button" onClick={() => refresh()} disabled={status.isLoading}>
        Refresh data
      </button>
      {status.error && <p class="oi-interface-splash__error">{status.error}</p>}
      <pre>{JSON.stringify(data ?? {}, null, 2)}</pre>
    </section>
  );
}`;
}

function escapeTemplate(value: string): string {
  return value.replace(/`/g, '\\`');
}
