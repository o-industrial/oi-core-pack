import {
  PAGE_COMPONENT_PREFIX,
  PAGE_COMPONENT_SUFFIX,
} from '../SurfaceInterfaceTemplates.ts';

export const PAGE_CODE_PREFIX = PAGE_COMPONENT_PREFIX;
export const PAGE_CODE_SUFFIX = PAGE_COMPONENT_SUFFIX;

export function composePageCode(body: string): string {
  return `${PAGE_CODE_PREFIX}${body}${PAGE_CODE_SUFFIX}`;
}
