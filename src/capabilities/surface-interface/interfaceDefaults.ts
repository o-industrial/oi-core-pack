// deno-lint-ignore-file no-explicit-any
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
  AccessMode: 'server',
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

type PageDataAccessMode = NonNullable<EaCInterfaceGeneratedDataSlice['AccessMode']>;
type DataConnectionFeatures = NonNullable<EaCInterfaceGeneratedDataSlice['DataConnection']>;
type DataConnectionHistoricSlice = NonNullable<
  NonNullable<
    EaCInterfaceGeneratedDataSlice['DataConnection']
  >['PrefetchHistoricSlice']
>;
type HistoricRange = NonNullable<DataConnectionHistoricSlice['Range']>;
type HistoricFormat = NonNullable<
  NonNullable<EaCInterfaceGeneratedDataSlice['DataConnection']>['HistoricDownloadFormats']
>[number];
type TimeUnit = HistoricRange['Unit'];

const VALID_ACCESS_MODES = new Set<PageDataAccessMode>(['server', 'client', 'both']);
const VALID_HISTORIC_FORMATS = new Set<HistoricFormat>(['json', 'csv']);
const VALID_TIME_UNITS = new Set<TimeUnit>(['minutes', 'hours', 'days']);
const VALID_WINDOW_MODES = new Set<DataConnectionHistoricSlice['Mode']>(['relative', 'absolute']);

type SanitizeOptions = {
  ensureDefaultSlice?: boolean;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeSchema(value: unknown): JSONSchema7 | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return undefined;
  if (isPlainObject(value)) return deepClone(value as any) as JSONSchema7;
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

function sanitizeAccessMode(value: unknown): PageDataAccessMode | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.toLowerCase() as PageDataAccessMode;
  return VALID_ACCESS_MODES.has(normalized) ? normalized : undefined;
}

function sanitizeHistoricFormat(value: unknown): HistoricFormat | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.toLowerCase() as HistoricFormat;
  return VALID_HISTORIC_FORMATS.has(normalized) ? normalized : undefined;
}

function sanitizeHistoricDownloadFormats(value: unknown): HistoricFormat[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const unique = new Set<HistoricFormat>();
  for (const entry of value) {
    const format = sanitizeHistoricFormat(entry);
    if (format) unique.add(format);
  }
  return unique.size > 0 ? Array.from(unique) : undefined;
}

function sanitizeTimeUnit(value: unknown): TimeUnit | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.toLowerCase() as TimeUnit;
  return VALID_TIME_UNITS.has(normalized) ? normalized : undefined;
}

function sanitizeWindowMode(value: unknown): DataConnectionHistoricSlice['Mode'] | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.toLowerCase() as DataConnectionHistoricSlice['Mode'];
  return VALID_WINDOW_MODES.has(normalized) ? normalized : undefined;
}

function sanitizeAbsoluteRange(
  value: unknown,
): NonNullable<DataConnectionHistoricSlice['AbsoluteRange']> | undefined {
  if (!isPlainObject(value)) return undefined;
  const source = value as Record<string, unknown>;
  const start = typeof source.Start === 'string' && isValidIsoDate(source.Start)
    ? source.Start
    : undefined;
  if (!start) return undefined;

  const absolute: NonNullable<DataConnectionHistoricSlice['AbsoluteRange']> = {
    Start: start,
  };

  const end = typeof source.End === 'string' && isValidIsoDate(source.End) ? source.End : undefined;
  if (end) {
    absolute.End = end;
  }

  return absolute;
}

function sanitizeHistoricRange(value: unknown): HistoricRange | undefined {
  if (!isPlainObject(value)) return undefined;

  const source = value as Record<string, unknown>;
  const amount = typeof source.Amount === 'number' && Number.isFinite(source.Amount)
    ? Math.abs(source.Amount)
    : undefined;
  const unit = sanitizeTimeUnit(source.Unit);

  if (!amount || amount === 0 || !unit) return undefined;

  const range: HistoricRange = {
    Amount: amount,
    Unit: unit,
  };

  const offsetSource = source.Offset;
  if (isPlainObject(offsetSource)) {
    const offsetAmount =
      typeof offsetSource.Amount === 'number' && Number.isFinite(offsetSource.Amount)
        ? Math.abs(offsetSource.Amount)
        : undefined;
    const offsetUnit = sanitizeTimeUnit(offsetSource.Unit);
    if (offsetAmount && offsetAmount !== 0 && offsetUnit) {
      range.Offset = {
        Amount: offsetAmount,
        Unit: offsetUnit,
      };
    }
  }

  return range;
}

function sanitizeHistoricSlice(value: unknown): DataConnectionHistoricSlice | undefined {
  if (!isPlainObject(value)) return undefined;

  const source = value as Record<string, unknown>;
  const result: DataConnectionHistoricSlice = {};

  if (typeof source.Enabled === 'boolean') {
    result.Enabled = source.Enabled;
  }

  const format = sanitizeHistoricFormat(source.Format);
  if (format) {
    result.Format = format;
  }

  const range = sanitizeHistoricRange(source.Range);
  if (range) {
    result.Range = range;
  }

  const mode = sanitizeWindowMode(source.Mode);
  const absolute = sanitizeAbsoluteRange(source.AbsoluteRange);
  if (mode) {
    result.Mode = mode;
  }

  if (absolute) {
    result.AbsoluteRange = absolute;
  }

  if (result.Mode === 'absolute') {
    delete result.Range;
    if (!result.AbsoluteRange) {
      delete result.Mode;
    }
  }

  if (result.Mode === 'relative') {
    delete result.AbsoluteRange;
    if (!result.Range) {
      delete result.Mode;
    }
  }

  if (!result.Mode) {
    if (result.AbsoluteRange) {
      result.Mode = 'absolute';
      delete result.Range;
    } else if (result.Range) {
      result.Mode = 'relative';
    }
  }

  return Object.keys(result).length ? result : undefined;
}

function sanitizeDataConnectionFeatures(value: unknown): DataConnectionFeatures | undefined {
  if (!isPlainObject(value)) return undefined;

  const source = value as Record<string, unknown>;
  const result: DataConnectionFeatures = {};

  if (typeof source.AllowHistoricDownload === 'boolean') {
    result.AllowHistoricDownload = source.AllowHistoricDownload;
  }

  const formats = sanitizeHistoricDownloadFormats(source.HistoricDownloadFormats);
  if (formats) {
    result.HistoricDownloadFormats = formats;
  }

  const slice = sanitizeHistoricSlice(source.PrefetchHistoricSlice);
  if (slice) {
    result.PrefetchHistoricSlice = slice;
  }

  return Object.keys(result).length ? result : undefined;
}

function isValidIsoDate(value: string): boolean {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
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

  if (
    source.Mode === 'server' ||
    source.Mode === 'client' ||
    source.Mode === 'both'
  ) {
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
  const schema = sanitizeSchema(source.Schema) ??
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

  const accessMode = sanitizeAccessMode(source.AccessMode);
  if (accessMode) {
    result.AccessMode = accessMode;
  } else if (
    source.AccessMode === undefined &&
    typeof DEFAULT_PAGE_DATA_SLICE.AccessMode === 'string'
  ) {
    result.AccessMode = DEFAULT_PAGE_DATA_SLICE.AccessMode;
  }

  const dataConnection = sanitizeDataConnectionFeatures(source.DataConnection);
  if (dataConnection) {
    result.DataConnection = dataConnection;
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

  if (options.ensureDefaultSlice && !generated[DEFAULT_PAGE_DATA_SLICE_KEY]) {
    generated[DEFAULT_PAGE_DATA_SLICE_KEY] = sanitizeGeneratedSlice(
      DEFAULT_PAGE_DATA_SLICE,
    );
  }

  if (
    !source &&
    !options.ensureDefaultSlice &&
    Object.keys(generated).length === 0
  ) {
    return undefined;
  }

  const result: EaCInterfacePageDataType = {
    Generated: generated,
  };

  return result;
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
