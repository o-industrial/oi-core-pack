export function mergeLookupLists(
  existing?: string[],
  additions?: string[],
): string[] | undefined {
  const normalizedExisting = (existing ?? [])
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  const normalizedAdditions = (additions ?? [])
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  if (normalizedAdditions.length === 0) {
    return existing?.length ? normalizedExisting : existing;
  }

  const merged = new Set<string>(normalizedExisting);
  for (const entry of normalizedAdditions) merged.add(entry);

  return merged.size > 0 ? Array.from(merged) : undefined;
}
