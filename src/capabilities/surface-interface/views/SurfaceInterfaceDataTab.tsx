import { Badge, IntentTypes, ToggleCheckbox, type JSX } from '../../../.deps.ts';
import type {
  EaCInterfaceDataConnectionFeatures,
  EaCInterfaceGeneratedDataSlice,
  EaCInterfaceHistoricAbsoluteRange,
  EaCInterfaceHistoricRange,
  EaCInterfaceHistoricSliceFormat,
  EaCInterfacePageDataAccessMode,
  EaCInterfacePageDataAction,
  EaCInterfacePageDataActionInvocationMode,
  EaCInterfaceRelativeTimeOffset,
  JSONSchema7,
} from '../../../.deps.ts';

type SurfaceInterfaceDataTabProps = {
  generatedSlices: Array<[string, EaCInterfaceGeneratedDataSlice]>;
  onAccessModeChange: (key: string, mode: EaCInterfacePageDataAccessMode) => void;
  onDataConnectionChange: (
    key: string,
    features: EaCInterfaceDataConnectionFeatures | undefined,
  ) => void;
  onActionModeChange: (
    sliceKey: string,
    actionKey: string,
    mode: EaCInterfacePageDataActionInvocationMode | null,
  ) => void;
};

type EnhancedAction = EaCInterfacePageDataAction & {
  ComingSoon?: boolean;
  SurfaceSupport?: {
    handler: boolean;
    client: boolean;
  };
};

type PageDataActionInvocationType =
  EaCInterfacePageDataAction['Invocation'] extends { Type?: infer T } ? T : string;

export function resolveActionSurfaceSupport(
  action: EaCInterfacePageDataAction,
): { handler: boolean; client: boolean } {
  const enhanced = action as EnhancedAction;
  if (enhanced.SurfaceSupport) {
    return enhanced.SurfaceSupport;
  }

  const invocationType: PageDataActionInvocationType | undefined = action.Invocation?.Type;
  switch (invocationType) {
    case 'warmQuery':
    case 'interface':
      return { handler: false, client: true };
    case 'dataConnection':
      return { handler: true, client: false };
    default:
      return { handler: true, client: true };
  }
}

export function SurfaceInterfaceDataTab({
  generatedSlices,
  onAccessModeChange,
  onDataConnectionChange,
  onActionModeChange,
}: SurfaceInterfaceDataTabProps): JSX.Element {
  return (
    <div class='flex h-full min-h-0 flex-col gap-4'>
      <section class='flex flex-1 min-h-0 flex-col gap-3'>
        <header class='flex items-start justify-between gap-3'>
          <div>
            <h3 class='text-sm font-semibold text-neutral-100'>Generated Data Contracts</h3>
            <p class='text-xs text-neutral-400'>
              Review the slices supplied by connected capabilities and tune how each one is exposed
              to your handler or client consumers.
            </p>
          </div>
          <Badge intentType={IntentTypes.Secondary} class='text-[11px] uppercase tracking-wide'>
            {generatedSlices.length} connected
          </Badge>
        </header>

        <div class='flex-1 min-h-0 space-y-2 overflow-y-auto pr-1'>
          {generatedSlices.length === 0
            ? (
              <div class='rounded border border-dashed border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-500'>
                Connect warm queries, data connections, schemas, or child interfaces to
                automatically populate state slices for this interface.
              </div>
            )
            : (
              generatedSlices.map(([key, slice]) => (
                <GeneratedSliceCard
                  key={key}
                  sliceKey={key}
                  slice={slice}
                  onAccessModeChange={onAccessModeChange}
                  onDataConnectionChange={onDataConnectionChange}
                  onActionModeChange={onActionModeChange}
                />
              ))
            )}
        </div>
      </section>
    </div>
  );
}

type GeneratedSliceCardProps = {
  sliceKey: string;
  slice: EaCInterfaceGeneratedDataSlice;
  onAccessModeChange: (key: string, mode: EaCInterfacePageDataAccessMode) => void;
  onDataConnectionChange: (
    key: string,
    features: EaCInterfaceDataConnectionFeatures | undefined,
  ) => void;
  onActionModeChange: (
    sliceKey: string,
    actionKey: string,
    mode: EaCInterfacePageDataActionInvocationMode | null,
  ) => void;
};

function GeneratedSliceCard({
  sliceKey,
  slice,
  onAccessModeChange,
  onDataConnectionChange,
  onActionModeChange,
}: GeneratedSliceCardProps): JSX.Element {
  const hydrationSummary = describeHydration(slice.Hydration);
  const schemaSummary = summarizeSchema(slice.Schema);
  const accessMode = slice.AccessMode ?? 'both';
  const sliceAllowsHandler = accessMode !== 'client';
  const sliceAllowsClient = accessMode !== 'server';
  const isDataConnection = (slice.SourceCapability ?? '').startsWith('dataConnection:');

  const handleAccessModeSelect = (mode: EaCInterfacePageDataAccessMode) => {
    onAccessModeChange(sliceKey, mode);
  };

  const handleFeaturesUpdate = (
    updater: (
      prev: EaCInterfaceDataConnectionFeatures | undefined,
    ) => EaCInterfaceDataConnectionFeatures | undefined,
  ) => {
    const next = updater(slice.DataConnection);
    onDataConnectionChange(sliceKey, normalizeDataConnectionFeatures(next));
  };

  const rawSource = slice.SourceCapability?.trim() ?? '';
  const [sourceType, ...sourceRest] = rawSource.split(':');
  const sourceIdentifier = sourceRest.join(':').trim() || slice.SourceLookup?.trim() || '';

  const availabilityLabel =
    accessMode === 'both'
      ? 'Handler & client'
      : accessMode === 'server'
      ? 'Handler only'
      : 'Client only';
  const availabilityIntent =
    accessMode === 'both' ? IntentTypes.Primary : IntentTypes.Secondary;
  const actionsCount = slice.Actions?.length ?? 0;

  return (
    <details open class='rounded-lg border border-neutral-800 bg-neutral-950 text-sm text-neutral-200'>
      <summary class='flex cursor-pointer items-start justify-between gap-3 px-4 py-3'>
        <div class='space-y-1'>
          <p class='text-sm font-semibold text-neutral-100'>
            {slice.Label ?? sliceKey}
          </p>
          <div class='flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-neutral-500'>
            {sourceType?.trim() && <span>Source: {sourceType.trim()}</span>}
            {sourceIdentifier && <span>{sourceIdentifier}</span>}
            {hydrationSummary && <span>{hydrationSummary}</span>}
            {schemaSummary && <span>Fields: {schemaSummary}</span>}
          </div>
        </div>
        <div class='flex flex-wrap items-center gap-2'>
          <Badge intentType={availabilityIntent}>{availabilityLabel}</Badge>
          <Badge intentType={IntentTypes.Secondary}>
            {actionsCount} {actionsCount === 1 ? 'action' : 'actions'}
          </Badge>
          {isDataConnection && (
            <Badge intentType={IntentTypes.Secondary}>Data connection</Badge>
          )}
        </div>
      </summary>

      <div class='flex flex-col gap-6 border-t border-neutral-800 p-4 text-xs text-neutral-200'>
        {slice.Description && (
          <p class='text-[11px] text-neutral-400'>{slice.Description}</p>
        )}

        <section class='space-y-2'>
          <h4 class='text-xs font-semibold uppercase tracking-wide text-neutral-500'>
            Exposure
          </h4>
          <div class='flex flex-wrap gap-2'>
            {([
              ['server', 'Handler only'],
              ['client', 'Client only'],
              ['both', 'Handler & client'],
            ] as Array<[EaCInterfacePageDataAccessMode, string]>).map(([mode, label]) => (
              <button
                key={mode}
                type='button'
                class={`rounded border px-2 py-1 text-xs transition ${
                  accessMode === mode
                    ? 'border-teal-400 bg-teal-500/10 text-teal-200'
                    : 'border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500'
                }`}
                onClick={() => handleAccessModeSelect(mode)}
              >
                {label}
              </button>
            ))}
          </div>
          <p class='text-[11px] text-neutral-500'>
            Choose the surfaces that can hydrate or consume this slice. Access also impacts which
            actions remain available.
          </p>
        </section>

        {isDataConnection && (
          <section class='space-y-3'>
            <h4 class='text-xs font-semibold uppercase tracking-wide text-neutral-500'>
              Historic downloads
            </h4>
            <DataConnectionSettings
              features={slice.DataConnection}
              handleFeaturesUpdate={handleFeaturesUpdate}
            />
          </section>
        )}

        <section class='space-y-3'>
          <h4 class='text-xs font-semibold uppercase tracking-wide text-neutral-500'>
            Actions
          </h4>
          {slice.Actions && slice.Actions.length > 0
            ? (
              <ul class='grid gap-3 text-neutral-200 sm:grid-cols-2'>
                {slice.Actions.map((rawAction: EaCInterfacePageDataAction) => {
                  const action = rawAction as EnhancedAction;
                  const rawInvocationMode = action.Invocation?.Mode ?? null;
                  const isEnabled = rawInvocationMode !== null;
                  const { handler: baseHandlerSupport, client: baseClientSupport } =
                    resolveActionSurfaceSupport(action);

                  const handlerPossible = baseHandlerSupport && sliceAllowsHandler;
                  const clientPossible = baseClientSupport && sliceAllowsClient;

                  const defaultMode: EaCInterfacePageDataActionInvocationMode | null =
                    handlerPossible && clientPossible
                      ? 'both'
                      : handlerPossible
                      ? 'server'
                      : clientPossible
                      ? 'client'
                      : null;

                  const invocationMode: EaCInterfacePageDataActionInvocationMode =
                    rawInvocationMode ?? defaultMode ?? 'both';

                  const handlerSelectable = isEnabled && handlerPossible;
                  const clientSelectable = isEnabled && clientPossible;

                  const handlerSelected =
                    isEnabled && (invocationMode === 'server' || invocationMode === 'both');
                  const clientSelected =
                    isEnabled && (invocationMode === 'client' || invocationMode === 'both');

                  const handlerActive = handlerSelectable && handlerSelected;
                  const clientActive = clientSelectable && clientSelected;

                  const chipClass = (active: boolean, disabled: boolean) =>
                    `rounded border px-2 py-1 text-xs transition ${
                      disabled
                        ? 'border-neutral-800 bg-neutral-900 text-neutral-500 opacity-60 cursor-not-allowed'
                        : active
                        ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200'
                        : 'border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500'
                  }`;

                  const toggleSurface = (surface: 'server' | 'client') => {
                    if (!isEnabled) return;
                    const isHandler = surface === 'server';
                    const selectable = isHandler ? handlerSelectable : clientSelectable;
                    if (!selectable) return;

                    if (accessMode === 'server') {
                      if (isHandler) onActionModeChange(sliceKey, action.Key, 'server');
                      return;
                    }

                    if (accessMode === 'client') {
                      if (!isHandler) onActionModeChange(sliceKey, action.Key, 'client');
                      return;
                    }

                    let nextHandler = handlerSelected;
                    let nextClient = clientSelected;

                    if (isHandler) {
                      nextHandler = !nextHandler;
                    } else {
                      nextClient = !nextClient;
                    }

                    if (!nextHandler && !nextClient) {
                      return;
                    }

                    let nextMode: EaCInterfacePageDataActionInvocationMode;
                    if (nextHandler && nextClient) nextMode = 'both';
                    else if (nextHandler) nextMode = 'server';
                    else nextMode = 'client';

                    onActionModeChange(sliceKey, action.Key, nextMode);
                  };

                  const actionUnavailable = !handlerPossible && !clientPossible;
                  const actionCardClass = `h-full rounded border ${
                    isEnabled
                      ? 'border-emerald-400 shadow-[0_0_0_1px_rgba(45,212,191,0.25)]'
                      : 'border-neutral-900'
                  } ${isEnabled ? 'bg-neutral-950/70' : 'bg-neutral-950/40'} p-3 transition`;

                  const comingSoon = action.ComingSoon ?? false;
                  const toggleDisabled = comingSoon || (!handlerPossible && !clientPossible);

                  const handleEnabledToggle = (checked: boolean) => {
                    if (checked) {
                      if (defaultMode) {
                        onActionModeChange(sliceKey, action.Key, defaultMode);
                      } else {
                        onActionModeChange(sliceKey, action.Key, null);
                      }
                    } else {
                      onActionModeChange(sliceKey, action.Key, null);
                    }
                  };

                  return (
                    <li
                      key={action.Key}
                      class={actionCardClass}
                    >
                      <div class='flex flex-col gap-2'>
                        <div class='flex flex-wrap items-start justify-between gap-2'>
                          <div class='flex flex-wrap items-center gap-2'>
                            <span class='font-medium text-neutral-100'>
                              {action.Label ?? action.Key}
                            </span>
                            {action.Invocation?.Type && (
                              <span class='rounded border border-blue-500/30 bg-blue-500/10 px-2 py-[1px] text-[10px] uppercase tracking-wide text-blue-200'>
                                {action.Invocation.Type}
                              </span>
                            )}
                          </div>
                          <ToggleCheckbox
                            checked={isEnabled}
                            onToggle={handleEnabledToggle}
                            title={isEnabled ? 'Disable action' : 'Enable action'}
                            checkedIntentType={IntentTypes.Primary}
                            uncheckedIntentType={IntentTypes.Secondary}
                            disabled={toggleDisabled}
                          />
                        </div>
                        {action.Description && (
                          <p class='text-[11px] text-neutral-500'>{action.Description}</p>
                        )}
                        {comingSoon && (
                          <p class='rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[11px] uppercase tracking-wide text-amber-300'>
                            Coming soon
                          </p>
                        )}
                        <div class='flex flex-wrap gap-2'>
                          <button
                            type='button'
                            class={chipClass(handlerActive, !handlerSelectable)}
                            disabled={!handlerSelectable}
                            onClick={() => toggleSurface('server')}
                          >
                            Handler
                          </button>
                          <button
                            type='button'
                            class={chipClass(clientActive, !clientSelectable)}
                            disabled={!clientSelectable}
                            onClick={() => toggleSurface('client')}
                          >
                            Client
                          </button>
                        </div>
                        {actionUnavailable && (
                          <p class='text-[11px] text-amber-400'>
                            This action cannot run with the current exposure. Adjust surfaces or
                            keep it disabled.
                          </p>
                        )}
                        {!isEnabled && (
                          <p class='text-[11px] text-neutral-500'>
                            Enable this action to configure handler or client execution.
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )
            : (
              <p class='rounded border border-dashed border-neutral-800 bg-neutral-950/50 p-3 text-[11px] text-neutral-500'>
                No actions are exposed for this slice.
              </p>
            )}
        </section>

        <section class='space-y-2'>
          <h4 class='text-xs font-semibold uppercase tracking-wide text-neutral-500'>
            Schema
          </h4>
          <p class='text-[11px] text-neutral-400'>
            {schemaSummary ? `Fields: ${schemaSummary}` : 'Schema information unavailable.'}
          </p>
        </section>
      </div>
    </details>
  );
}

type DataConnectionSettingsProps = {
  features: EaCInterfaceDataConnectionFeatures | undefined;
  handleFeaturesUpdate: (
    updater: (
      prev: EaCInterfaceDataConnectionFeatures | undefined,
    ) => EaCInterfaceDataConnectionFeatures | undefined,
  ) => void;
};

function DataConnectionSettings({
  features,
  handleFeaturesUpdate,
}: DataConnectionSettingsProps): JSX.Element {
  const allowHistoric = features?.AllowHistoricDownload ?? false;
  const formatSet = new Set(features?.HistoricDownloadFormats ?? []);

  const updateHistoricFormats = (format: EaCInterfaceHistoricSliceFormat, checked: boolean) => {
    handleFeaturesUpdate((prev) => {
      const next: EaCInterfaceDataConnectionFeatures = { ...(prev ?? {}) };
      const current = new Set(next.HistoricDownloadFormats ?? []);
      if (checked) {
        current.add(format);
      } else {
        current.delete(format);
      }
      next.HistoricDownloadFormats = Array.from(current);
      if (next.HistoricDownloadFormats.length === 0) {
        delete next.HistoricDownloadFormats;
      }
      return next;
    });
  };

  return (
    <div class='space-y-3 rounded border border-neutral-800 bg-neutral-950/80 p-3'>
      <label class='flex items-start gap-3 text-xs text-neutral-300'>
        <input
          type='checkbox'
          class='mt-[2px] h-4 w-4 accent-teal-500'
          checked={allowHistoric}
          onChange={(event) => {
            const checked = event.currentTarget.checked;
            handleFeaturesUpdate((prev) => {
              const next: EaCInterfaceDataConnectionFeatures = { ...(prev ?? {}) };
              next.AllowHistoricDownload = checked;
              if (!checked) {
                delete next.HistoricDownloadFormats;
              } else if (
                !next.HistoricDownloadFormats || next.HistoricDownloadFormats.length === 0
              ) {
                next.HistoricDownloadFormats = ['json'];
              }
              return next;
            });
          }}
        />
        <span>
          <span class='font-semibold text-neutral-100'>Allow historic downloads</span>
          <span class='block text-[11px] text-neutral-500'>
            Generate signed URLs for bulk downloads. Choose permitted formats when enabled.
          </span>
        </span>
      </label>

      {allowHistoric && (
        <div class='ml-6 space-y-2 text-neutral-300'>
          <p class='text-[11px] uppercase tracking-wide text-neutral-500'>Permitted formats</p>
          <div class='flex flex-wrap gap-3 text-xs'>
            {(['json', 'csv'] as EaCInterfaceHistoricSliceFormat[]).map((format) => (
              <label key={format} class='flex items-center gap-2'>
                <input
                  type='checkbox'
                  class='h-4 w-4 accent-teal-500'
                  checked={formatSet.has(format)}
                  onChange={(event) =>
                    updateHistoricFormats(format, event.currentTarget.checked)}
                />
                <span class='text-neutral-200'>{format.toUpperCase()}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function describeHydration(
  hydration: EaCInterfaceGeneratedDataSlice['Hydration'],
): string {
  if (!hydration) return '';

  const flags: string[] = [];
  if (hydration.Server) flags.push('server preload');
  if (hydration.Client) flags.push('client hydrate');
  if (typeof hydration.ClientRefreshMs === 'number') {
    const seconds = Math.round(hydration.ClientRefreshMs / 1000);
    flags.push(`refresh ~${seconds}s`);
  }

  return flags.join(' | ');
}

function summarizeSchema(schema: JSONSchema7 | undefined): string {
  if (!schema) return '';

  const schemaObj = schema as {
    title?: unknown;
    type?: unknown;
    properties?: Record<string, JSONSchema7>;
  };

  const title = typeof schemaObj.title === 'string' && schemaObj.title.trim().length > 0
    ? schemaObj.title.trim()
    : undefined;
  if (title) return title;

  const type = schemaObj.type;
  const properties = schemaObj.properties;
  if (type === 'object' && properties && typeof properties === 'object') {
    const keys = Object.keys(properties);
    if (keys.length === 0) return 'object';
    const preview = keys.slice(0, 3).join(', ');
    return `{ ${preview}${keys.length > 3 ? ', ...' : ''} }`;
  }

  if (typeof type === 'string') return type;

  return 'schema';
}

export function normalizeDataConnectionFeatures(
  features: EaCInterfaceDataConnectionFeatures | undefined,
): EaCInterfaceDataConnectionFeatures | undefined {
  if (!features) return undefined;

  const result: EaCInterfaceDataConnectionFeatures = {};

  if (typeof features.AllowHistoricDownload === 'boolean') {
    result.AllowHistoricDownload = features.AllowHistoricDownload;
  }

  if (features.HistoricDownloadFormats && features.HistoricDownloadFormats.length > 0) {
    const formats = Array.from(
      new Set<EaCInterfaceHistoricSliceFormat>(
        features.HistoricDownloadFormats.filter((format) => format === 'json' || format === 'csv'),
      ),
    );
    if (formats.length > 0) {
      result.HistoricDownloadFormats = formats;
    }
  }

  if (features.PrefetchHistoricSlice) {
    const slice = features.PrefetchHistoricSlice;
    const normalizedSlice: NonNullable<
      EaCInterfaceDataConnectionFeatures['PrefetchHistoricSlice']
    > = {};
    if (typeof slice.Enabled === 'boolean') normalizedSlice.Enabled = slice.Enabled;
    if (slice.Format === 'json' || slice.Format === 'csv') normalizedSlice.Format = slice.Format;

    if (slice.Mode === 'relative' || slice.Mode === 'absolute') {
      normalizedSlice.Mode = slice.Mode;
    }

    if (slice.Range) {
      const range = slice.Range;
      if (isValidRange(range)) {
        normalizedSlice.Range = {
          Amount: Math.round(range.Amount),
          Unit: range.Unit,
          ...(range.Offset && isValidOffset(range.Offset)
            ? { Offset: { Amount: Math.round(range.Offset.Amount), Unit: range.Offset.Unit } }
            : {}),
        };
      }
    }

    if (slice.AbsoluteRange && isValidAbsoluteRange(slice.AbsoluteRange)) {
      normalizedSlice.AbsoluteRange = {
        Start: slice.AbsoluteRange.Start,
        ...(slice.AbsoluteRange.End ? { End: slice.AbsoluteRange.End } : {}),
      };
    }

    if (!normalizedSlice.Mode) {
      if (normalizedSlice.AbsoluteRange) {
        normalizedSlice.Mode = 'absolute';
        delete normalizedSlice.Range;
      } else if (normalizedSlice.Range) {
        normalizedSlice.Mode = 'relative';
      }
    }

    if (normalizedSlice.Mode === 'absolute') {
      delete normalizedSlice.Range;
      if (!normalizedSlice.AbsoluteRange) {
        delete normalizedSlice.Mode;
      }
    }

    if (normalizedSlice.Mode === 'relative') {
      delete normalizedSlice.AbsoluteRange;
      if (!normalizedSlice.Range) {
        delete normalizedSlice.Mode;
      }
    }

    if (Object.keys(normalizedSlice).length > 0) {
      result.PrefetchHistoricSlice = normalizedSlice;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function isValidRange(range: EaCInterfaceHistoricRange): boolean {
  return (
    typeof range.Amount === 'number' &&
    range.Amount > 0 &&
    (range.Unit === 'minutes' || range.Unit === 'hours' || range.Unit === 'days')
  );
}

function isValidOffset(offset: EaCInterfaceRelativeTimeOffset): boolean {
  return (
    typeof offset.Amount === 'number' &&
    offset.Amount > 0 &&
    (offset.Unit === 'minutes' || offset.Unit === 'hours' || offset.Unit === 'days')
  );
}

function isValidAbsoluteRange(range: EaCInterfaceHistoricAbsoluteRange): boolean {
  if (!range || !isValidIsoDate(range.Start)) return false;
  if (range.End !== undefined && !isValidIsoDate(range.End)) return false;
  return true;
}

function isValidIsoDate(value: string | undefined): boolean {
  if (!value) return false;
  return Number.isFinite(Date.parse(value));
}
