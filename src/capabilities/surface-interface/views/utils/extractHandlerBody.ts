export function extractHandlerBody(code: string): string {
  const source = code ?? '';
  if (!source.trim().length) return '';

  const openIndex = source.indexOf('{');
  const closeIndex = source.lastIndexOf('}');

  if (openIndex === -1 || closeIndex === -1 || closeIndex <= openIndex) {
    return source;
  }

  return source.slice(openIndex + 1, closeIndex);
}
