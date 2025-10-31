export const HANDLER_PREFIX = `export async function loadPageData(
  request: Request,
  context: Record<string, unknown>,
  services: InterfaceServices,
  seed: InterfacePageData,
): Promise<InterfacePageData> {
`;

export const HANDLER_SUFFIX = `}
`;

export const DEFAULT_HANDLER_BODY = `return seed;`;

export function composeHandlerCode(body: string): string {
  if (!body.trim().length) return '';
  return `${HANDLER_PREFIX}${body}${HANDLER_SUFFIX}`;
}
