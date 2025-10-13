import {
  EaCInterfaceCodeBlock,
  EaCInterfaceDetails,
  EaCInterfaceGeneratedDataSlice,
  EaCInterfacePageDataAction,
  EaCInterfacePageDataType,
  JSONSchema7,
} from '../../.deps.ts';

export type InterfaceCodeBlock = EaCInterfaceCodeBlock;

const DEFAULT_PAGE_DATA_SCHEMA_SHAPE = {
  type: 'object',
  description:
    'Base schema for interface data returned from loadPageData and consumed by the page component.',
  properties: {
    message: {
      type: 'string',
      description: 'Short guidance or status message for collaborators.',
      default: 'Implement loadPageData to supply interface-specific data.',
    },
  },
  required: ['message'],
  additionalProperties: true,
};

const DEFAULT_PAGE_DATA_SCHEMA = DEFAULT_PAGE_DATA_SCHEMA_SHAPE as unknown as JSONSchema7;

export const DEFAULT_PAGE_DATA_SLICE_KEY = 'base';

export const DEFAULT_PAGE_DATA_SLICE: EaCInterfaceGeneratedDataSlice = {
  Label: 'Interface scaffolding',
  Description:
    'Shared state generated for new interfaces. Replace or extend this slice by connecting capabilities.',
  SourceCapability: 'interface:core',
  Schema: DEFAULT_PAGE_DATA_SCHEMA,
  Hydration: {
    Server: true,
  },
  Enabled: true,
};

export const DEFAULT_PAGE_DATA_TYPE: EaCInterfacePageDataType = {
  Generated: {
    [DEFAULT_PAGE_DATA_SLICE_KEY]: DEFAULT_PAGE_DATA_SLICE,
  },
};

function deepClone<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

export function clonePageDataType(
  value: EaCInterfacePageDataType | undefined,
): EaCInterfacePageDataType | undefined {
  if (!value) return undefined;
  return deepClone(value) as EaCInterfacePageDataType;
}

export function ensurePageDataType(
  value: EaCInterfacePageDataType | undefined,
): EaCInterfacePageDataType {
  const next =
    (value ? deepClone(value) : deepClone(DEFAULT_PAGE_DATA_TYPE)) as EaCInterfacePageDataType;

  if (!next.Generated) next.Generated = {};
  if (!next.Generated[DEFAULT_PAGE_DATA_SLICE_KEY]) {
    next.Generated[DEFAULT_PAGE_DATA_SLICE_KEY] = deepClone(DEFAULT_PAGE_DATA_SLICE);
  }

  // Ensure schemas are cloned to prevent shared references.
  for (const [key, slice] of Object.entries(next.Generated)) {
    next.Generated[key] = {
      ...slice,
      Schema: deepClone(slice.Schema) as JSONSchema7,
      Hydration: slice.Hydration ? { ...slice.Hydration } : undefined,
      Actions: slice.Actions
        ? slice.Actions.map((action) => deepClone(action) as EaCInterfacePageDataAction)
        : undefined,
    };
  }

  if (next.Custom) {
    next.Custom = deepClone(next.Custom) as JSONSchema7;
  }

  return next;
}

export function createDefaultPageDataType(): EaCInterfacePageDataType {
  return ensurePageDataType(undefined);
}

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
    WebPath: `/${id}`,
    Description: 'Auto-generated interface stub ready for collaborative authoring.',
    Imports: [],
    PageDataType: createDefaultPageDataType(),
    PageHandler: {
      Messages: [
        'Implement server-side data loading for this interface.',
        'Return data that matches the `PageDataType` schema to hydrate the page.',
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
  details: EaCInterfaceDetails | Partial<EaCInterfaceDetails> | undefined,
  fallbackId: string,
): EaCInterfaceDetails {
  const defaults = createDefaultInterfaceDetails(fallbackId);
  return {
    ...defaults,
    ...details,
    WebPath: details?.WebPath ?? defaults.WebPath,
    Imports: details?.Imports ?? defaults.Imports,
    PageDataType: ensurePageDataType(details?.PageDataType),
    PageHandler: mergeCodeBlock(defaults.PageHandler, details?.PageHandler),
    Page: mergeCodeBlock(defaults.Page, details?.Page),
  };
}
