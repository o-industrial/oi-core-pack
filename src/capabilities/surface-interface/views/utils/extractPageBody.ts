import { PAGE_CODE_PREFIX, PAGE_CODE_SUFFIX } from './composePageCode.ts';

export function extractPageBody(
  source: string,
  prefix: string = PAGE_CODE_PREFIX,
  suffix: string = PAGE_CODE_SUFFIX,
): string {
  const value = source ?? '';
  if (!value.trim().length) return '';

  const startIndex = value.indexOf(prefix);
  const scanStart = startIndex === -1 ? 0 : startIndex;

  const length = value.length;
  let parenDepth = 0;
  let bodyOpenIndex = -1;

  let index = scanStart;
  while (index < length) {
    const char = value[index];
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
      index += 1;
      continue;
    }

    if (char === '(') {
      parenDepth += 1;
      index += 1;
      continue;
    }

    if (char === ')') {
      if (parenDepth > 0) parenDepth -= 1;
      index += 1;
      continue;
    }

    if (char === '{' && parenDepth === 0) {
      bodyOpenIndex = index;
      break;
    }
    if (char === '{') {
      index += 1;
      continue;
    }

    index += 1;
  }

  if (bodyOpenIndex === -1) return value.trim();

  let depth = 0;
  for (index = bodyOpenIndex; index < length; index += 1) {
    const char = value[index];
    if (char === '{') {
      depth += 1;
      continue;
    }
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        const body = value.slice(bodyOpenIndex + 1, index);
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
