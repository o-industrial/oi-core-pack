import {
  buildDefaultInterfacePageBody,
  PAGE_COMPONENT_PREFIX,
  PAGE_COMPONENT_SUFFIX,
} from './SurfaceInterfaceTemplates.ts';

export const PAGE_CODE_PREFIX = PAGE_COMPONENT_PREFIX;
export const PAGE_CODE_SUFFIX = PAGE_COMPONENT_SUFFIX;

export type PageScaffoldOptions = {
  lookup: string;
  safeId: string;
  displayName: string;
};

export type PageScaffold = {
  body: string;
  description: string;
  messages: string[];
};

export function composePageCode(body: string): string {
  return `${PAGE_CODE_PREFIX}${body}${PAGE_CODE_SUFFIX}`;
}

export function extractPageBody(
  source: string,
  prefix: string = PAGE_CODE_PREFIX,
  suffix: string = PAGE_CODE_SUFFIX,
): string {
  const value = source ?? '';
  if (!value.trim().length) return '';

  const startIndex = value.indexOf(prefix);
  const openBraceIndex = value.indexOf('{', startIndex === -1 ? 0 : startIndex);
  if (openBraceIndex === -1) return value.trim();

  let depth = 0;
  const length = value.length;
  for (let index = openBraceIndex; index < length; index += 1) {
    const char = value[index];
    if (char === '{') {
      depth += 1;
      continue;
    }
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        const body = value.slice(openBraceIndex + 1, index);
        return body.trim().length ? body : '';
      }
    }

    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      index += 1;
      while (index < length) {
        const current = value[index];
        if (current === '\\') {
          index += 2;
          continue;
        }
        if (current === quote) break;
        if (quote === '`' && current === '$' && value[index + 1] === '{') {
          index += 2;
          let tplDepth = 1;
          while (index < length && tplDepth > 0) {
            const inner = value[index];
            if (inner === '{') tplDepth += 1;
            else if (inner === '}') tplDepth -= 1;
            else if (inner === '\\') index += 1;
            index += 1;
          }
          continue;
        }
        index += 1;
      }
    }
  }

  if (value.endsWith(suffix.trim())) {
    return value
      .slice(prefix.length, value.length - suffix.length)
      .trim();
  }

  return value.trim();
}

export function buildPageScaffold({
  lookup,
  safeId,
  displayName,
}: PageScaffoldOptions): PageScaffold {
  const body = buildDefaultInterfacePageBody(lookup, safeId, displayName);
  const title = displayName || `${safeId} interface`;

  return {
    body,
    description:
      `Render the ${title} interface using server-provided data and refresh affordances.`,
    messages: [
      'Update this layout to reflect the intended collaborative interface experience.',
      'Reference the generated page data shape and imports exposed on this tab.',
      'Use the `refresh` helper to re-run interface actions when the user needs fresh data.',
    ],
  };
}
