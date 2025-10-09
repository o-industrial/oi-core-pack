import { EaCInterfaceCodeBlock, EaCInterfaceDetails } from '../../.deps.ts';

export type InterfaceCodeBlock = EaCInterfaceCodeBlock;

export function mergeCodeBlock(
  fallback: InterfaceCodeBlock | undefined,
  override: InterfaceCodeBlock | undefined,
): InterfaceCodeBlock | undefined {
  if (!fallback && !override) return undefined;

  return {
    ...(fallback ?? {}),
    ...(override ?? {}),
    Messages: override?.Messages ?? fallback?.Messages,
    MessageGroups: override?.MessageGroups ?? fallback?.MessageGroups,
  };
}

export function createDefaultInterfaceDetails(id: string): EaCInterfaceDetails {
  return {
    Name: `Interface ${id}`,
    Description: 'Auto-generated interface stub ready for collaborative authoring.',
    Imports: ['import { h } from "preact";'],
    PageDataType: '{\n  message: string;\n}',
    PageHandler: {
      Messages: [
        'Implement server-side data loading for this interface.',
        'Return the shape defined in `PageDataType` to hydrate the page.',
      ],
    },
    Page: {
      Messages: [
        'Render the interface using the data supplied by the handler.',
        'Consider adding responsive layout wrappers and status indicators.',
      ],
    },
  };
}

export function ensureInterfaceDetails(
  details: Partial<EaCInterfaceDetails> | undefined,
  fallbackId: string,
): EaCInterfaceDetails {
  const defaults = createDefaultInterfaceDetails(fallbackId);
  return {
    ...defaults,
    ...details,
    Imports: details?.Imports ?? defaults.Imports,
    PageDataType: details?.PageDataType ?? defaults.PageDataType,
    PageHandler: mergeCodeBlock(defaults.PageHandler, details?.PageHandler),
    Page: mergeCodeBlock(defaults.Page, details?.Page),
  };
}
