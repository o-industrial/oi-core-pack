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

type PageDataAction = EaCInterfacePageDataAction;
type PageDataActionInvocation = NonNullable<PageDataAction['Invocation']>;
type PageDataActionInvocationType = NonNullable<PageDataActionInvocation['Type']>;
type PageDataHydration = NonNullable<EaCInterfaceGeneratedDataSlice['Hydration']>;

const VALID_INVOCATION_TYPES = new Set<PageDataActionInvocationType>([
  'warmQuery',
  'dataConnection',
  'interface',
  'mcpTool',
  'mcpResource',
  'custom',
] as PageDataActionInvocationType[]);

type SanitizeOptions = {
  ensureDefaultSlice?: boolean;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeSchema(value: unknown): JSONSchema7 | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (isPlainObject(value)) return deepClone(value) as JSONSchema7;
  return undefined;
}

function sanitizeHydration(value: unknown): PageDataHydration | undefined {
  if (!isPlainObject(value)) return undefined;

  const source = value as Partial<PageDataHydration>;
  const result: PageDataHydration = {};

  if (typeof source.Server === 'boolean') result.Server = source.Server;
  if (typeof source.Client === 'boolean') result.Client = source.Client;
  if (
    typeof source.ClientRefreshMs === 'number' &&
    Number.isFinite(source.ClientRefreshMs)
  ) {
    result.ClientRefreshMs = source.ClientRefreshMs;
  }

  return Object.keys(result).length ? result : undefined;
}

function sanitizeInvocation(
  value: unknown,
): PageDataActionInvocation | undefined {
  if (!isPlainObject(value)) return undefined;

  const source = value as Record<string, unknown>;
  const result: Partial<PageDataActionInvocation> = {};

  if (
    typeof source.Type === 'string' &&
    VALID_INVOCATION_TYPES.has(source.Type as PageDataActionInvocationType)
  ) {
    result.Type = source.Type as PageDataActionInvocationType;
  }

  if (typeof source.Lookup === 'string' && source.Lookup.trim().length > 0) {
    result.Lookup = source.Lookup;
  }

  if (source.Mode === 'server' || source.Mode === 'client') {
    result.Mode = source.Mode as NonNullable<PageDataActionInvocation['Mode']>;
  }

  return Object.keys(result).length ? result as PageDataActionInvocation : undefined;
}

function sanitizeAction(entry: unknown): PageDataAction | undefined {
  if (!isPlainObject(entry)) return undefined;

  const source = entry as Record<string, unknown>;
  if (typeof source.Key !== 'string' || source.Key.trim().length === 0) {
    return undefined;
  }

  const result: PageDataAction = {
    Key: source.Key,
  };

  if (typeof source.Label === 'string' && source.Label.trim().length > 0) {
    result.Label = source.Label;
  }

  if (
    typeof source.Description === 'string' &&
    source.Description.trim().length > 0
  ) {
    result.Description = source.Description;
  }

  const inputSchema = sanitizeSchema(source.Input);
  if (inputSchema !== undefined) {
    result.Input = inputSchema;
  }

  const outputSchema = sanitizeSchema(source.Output);
  if (outputSchema !== undefined) {
    result.Output = outputSchema;
  }

  const invocation = sanitizeInvocation(source.Invocation);
  if (invocation) {
    result.Invocation = invocation;
  }

  return result;
}

function sanitizeActions(value: unknown): PageDataAction[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const normalized = value
    .map((entry) => sanitizeAction(entry))
    .filter((entry): entry is PageDataAction => entry !== undefined);
  return normalized.length ? normalized : undefined;
}

function sanitizeGeneratedSlice(
  value: unknown,
): EaCInterfaceGeneratedDataSlice {
  if (!isPlainObject(value)) {
    return sanitizeGeneratedSlice(DEFAULT_PAGE_DATA_SLICE);
  }

  const source = value as Record<string, unknown>;
  const schema =
    sanitizeSchema(source.Schema) ??
    sanitizeSchema(DEFAULT_PAGE_DATA_SLICE.Schema)!;

  const result: EaCInterfaceGeneratedDataSlice = {
    Schema: schema,
  };

  if (typeof source.Label === 'string' && source.Label.length > 0) {
    result.Label = source.Label;
  }

  if (
    typeof source.Description === 'string' &&
    source.Description.length > 0
  ) {
    result.Description = source.Description;
  }

  if (
    typeof source.SourceCapability === 'string' &&
    source.SourceCapability.length > 0
  ) {
    result.SourceCapability = source.SourceCapability;
  }

  const hydration = sanitizeHydration(source.Hydration);
  if (hydration) {
    result.Hydration = hydration;
  }

  const actions = sanitizeActions(source.Actions);
  if (actions) {
    result.Actions = actions;
  }

  if (typeof source.Enabled === 'boolean') {
    result.Enabled = source.Enabled;
  } else if (
    source.Enabled === undefined &&
    typeof DEFAULT_PAGE_DATA_SLICE.Enabled === 'boolean'
  ) {
    result.Enabled = DEFAULT_PAGE_DATA_SLICE.Enabled;
  }

  return result;
}

function buildGeneratedSlices(
  value: unknown,
): Record<string, EaCInterfaceGeneratedDataSlice> {
  if (!isPlainObject(value)) return {};

  const result: Record<string, EaCInterfaceGeneratedDataSlice> = {};
  for (const [key, slice] of Object.entries(value)) {
    result[key] = sanitizeGeneratedSlice(slice);
  }

  return result;
}

function sanitizePageDataType(
  value: EaCInterfacePageDataType | undefined,
  options: SanitizeOptions = {},
): EaCInterfacePageDataType | undefined {
  const source = isPlainObject(value) ? value : undefined;
  const generated = buildGeneratedSlices(source?.Generated);
  const custom = sanitizeSchema(source?.Custom);

  if (options.ensureDefaultSlice && !generated[DEFAULT_PAGE_DATA_SLICE_KEY]) {
    generated[DEFAULT_PAGE_DATA_SLICE_KEY] = sanitizeGeneratedSlice(
      DEFAULT_PAGE_DATA_SLICE,
    );
  }

  if (!source && !options.ensureDefaultSlice && !custom) {
    return Object.keys(generated).length
      ? { Generated: generated, Custom: custom }
      : undefined;
  }

  return {
    Generated: generated,
    Custom: custom,
  };
}

export function clonePageDataType(
  value: EaCInterfacePageDataType | undefined,
): EaCInterfacePageDataType | undefined {
  return sanitizePageDataType(value);
}

export function ensurePageDataType(
  value: EaCInterfacePageDataType | undefined,
): EaCInterfacePageDataType {
  return sanitizePageDataType(value, { ensureDefaultSlice: true }) ??
    sanitizePageDataType(DEFAULT_PAGE_DATA_TYPE, {
      ensureDefaultSlice: true,
    })!;
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
