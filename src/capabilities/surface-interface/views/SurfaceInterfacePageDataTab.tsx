import { Badge, IntentTypes, type JSX, Select, ToggleCheckbox } from '../../../.deps.ts';
import type {
  EaCInterfaceDataConnectionFeatures,
  EaCInterfaceGeneratedDataSlice,
  EaCInterfaceHistoricAbsoluteRange,
  EaCInterfaceHistoricRange,
  EaCInterfaceHistoricSliceFormat,
  EaCInterfaceHistoricWindowMode,
  EaCInterfacePageDataAccessMode,
  EaCInterfacePageDataAction,
  EaCInterfacePageDataActionInvocationMode,
  EaCInterfaceRelativeTimeOffset,
  JSONSchema7,
} from '../../../.deps.ts';

type SurfaceInterfacePageDataTabProps = {
  generatedSlices: Array<[string, EaCInterfaceGeneratedDataSlice]>;
  onAccessModeChange: (key: string, mode: EaCInterfacePageDataAccessMode) => void;
  onDataConnectionChange: (
    key: string,
    features: EaCInterfaceDataConnectionFeatures | undefined,
  ) => void;
  onActionModeChange: (
    sliceKey: string,
    actionKey: string,
    mode: EaCInterfacePageDataActionInvocationMode,
  ) => void;
};

export function SurfaceInterfacePageDataTab({
  generatedSlices,
  onAccessModeChange,
  onDataConnectionChange,
  onActionModeChange,
}: SurfaceInterfacePageDataTabProps): JSX.Element {
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
    mode: EaCInterfacePageDataActionInvocationMode,
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

  return (
    <div class='rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-4 text-sm text-neutral-100'>
      <div class='space-y-2'>
      <div class='flex flex-wrap items-center gap-2'>
        <p class='text-base font-semibold text-neutral-100'>
          {slice.Label ?? sliceKey}
        </p>
      </div>
        {slice.Description && <p class='text-xs text-neutral-400'>{slice.Description}</p>}
        <div class='flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-neutral-500'>
          {hydrationSummary && <span>{hydrationSummary}</span>}
          {schemaSummary && <span>Fields: {schemaSummary}</span>}
        </div>
      </div>

      <div class='mt-3 space-y-3 text-xs text-neutral-200'>
        <div>
          <p class='font-semibold text-neutral-200'>Availability</p>
          <div class='mt-2 flex flex-wrap gap-2'>
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
          <p class='mt-1 text-[11px] text-neutral-500'>
            Choose where this slice hydrates data for your interface.
          </p>
        </div>

        {isDataConnection && (
          <DataConnectionSettings
            features={slice.DataConnection}
            handleFeaturesUpdate={handleFeaturesUpdate}
          />
        )}

        {slice.Actions && slice.Actions.length > 0 && (
          <div class='space-y-2 text-xs text-neutral-200'>
            <p class='font-semibold text-neutral-200'>Actions</p>
            <ul class='space-y-2'>
              {slice.Actions.map((action: EaCInterfacePageDataAction) => {
                const invocationMode = action.Invocation?.Mode ?? 'both';

                const supportsHandler = invocationMode !== 'client';
                const supportsClient = invocationMode !== 'server';

                const handlerSelectable = supportsHandler && sliceAllowsHandler;
                const clientSelectable = supportsClient && sliceAllowsClient;

                const handlerSelected = invocationMode === 'server' || invocationMode === 'both';
                const clientSelected = invocationMode === 'client' || invocationMode === 'both';

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

                const actionUnavailable = !handlerSelectable && !clientSelectable;

                return (
                  <li
                    key={action.Key}
                    class='rounded border border-neutral-900 bg-neutral-950/70 px-3 py-2 text-neutral-200'
                  >
                    <div class='flex flex-col gap-2'>
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
                      {action.Description && (
                        <p class='text-[11px] text-neutral-500'>{action.Description}</p>
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
                          This action is unavailable with the current availability settings.
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
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
  const prefetch = features?.PrefetchHistoricSlice;
  const prefetchEnabled = prefetch?.Enabled ?? false;
  const windowMode: EaCInterfaceHistoricWindowMode = prefetch?.Mode ?? 'relative';

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

  const createPrefetchSlice = (
    mode: EaCInterfaceHistoricWindowMode,
    existing?: NonNullable<EaCInterfaceDataConnectionFeatures['PrefetchHistoricSlice']>,
  ): NonNullable<EaCInterfaceDataConnectionFeatures['PrefetchHistoricSlice']> => {
    const slice: NonNullable<EaCInterfaceDataConnectionFeatures['PrefetchHistoricSlice']> = {
      Enabled: existing?.Enabled ?? true,
      Format: existing?.Format ?? 'json',
      Mode: mode,
    };

    if (mode === 'absolute') {
      const existingAbsolute = existing?.AbsoluteRange;
      slice.AbsoluteRange = existingAbsolute && isValidAbsoluteRange(existingAbsolute)
        ? { ...existingAbsolute }
        : { Start: new Date().toISOString() };
    } else {
      const existingRange = existing?.Range;
      slice.Range = existingRange && isValidRange(existingRange)
        ? { ...existingRange }
        : { Amount: 7, Unit: 'days' };
    }

    if (mode === 'absolute') {
      delete slice.Range;
    } else {
      delete slice.AbsoluteRange;
    }

    return slice;
  };

  const updatePrefetchSlice = (
    mode: EaCInterfaceHistoricWindowMode,
    mutate: (
      slice: NonNullable<EaCInterfaceDataConnectionFeatures['PrefetchHistoricSlice']>,
    ) => void,
  ) => {
    handleFeaturesUpdate((prev) => {
      const next: EaCInterfaceDataConnectionFeatures = { ...(prev ?? {}) };
      const baseSlice = createPrefetchSlice(mode, prev?.PrefetchHistoricSlice);
      mutate(baseSlice);
      next.PrefetchHistoricSlice = baseSlice;
      return next;
    });
  };

  return (
    <div class='space-y-3 rounded border border-neutral-800 bg-neutral-950/80 p-3'>
      <p class='font-semibold text-neutral-200'>Data connection settings</p>

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

      <div class='space-y-2 text-neutral-300'>
        <div class='flex items-center justify-between'>
          <p class='text-[11px] uppercase tracking-wide text-neutral-500'>Prefetch window</p>
          <ToggleCheckbox
            checked={prefetchEnabled}
            onToggle={(checked) => {
              updatePrefetchSlice(windowMode, (slice) => {
                slice.Enabled = checked;
              });
            }}
            title='Toggle prefetch window'
            checkedIntentType={IntentTypes.Primary}
            uncheckedIntentType={IntentTypes.Secondary}
          />
        </div>
        <p class='text-[11px] text-neutral-500'>
          Prefetch a historic slice on load. Useful when the page needs initial historical context.
        </p>

        {prefetchEnabled && (
          <div class='space-y-3 rounded border border-neutral-800 bg-neutral-950/60 p-3'>
            <div class='flex flex-wrap items-center gap-2 text-xs text-neutral-300'>
              <span class='text-[11px] uppercase tracking-wide text-neutral-500'>Window type</span>
              {(['relative', 'absolute'] as EaCInterfaceHistoricWindowMode[]).map((mode) => (
                <button
                  key={mode}
                  type='button'
                  class={`rounded border px-2 py-1 transition ${
                    windowMode === mode
                      ? 'border-teal-400 bg-teal-500/10 text-teal-200'
                      : 'border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500'
                  }`}
                  onClick={() => {
                    updatePrefetchSlice(mode, (slice) => {
                      slice.Enabled = slice.Enabled ?? true;
                      slice.Mode = mode;
                    });
                  }}
                >
                  {mode === 'relative' ? 'Recent records' : 'Specific dates'}
                </button>
              ))}
            </div>

            <div class='flex flex-wrap gap-3 text-xs text-neutral-200'>
              <label class='flex flex-col gap-1'>
                <span class='text-[11px] uppercase tracking-wide text-neutral-500'>Format</span>
                <Select
                  // class='h-8 rounded border border-neutral-700 bg-neutral-900 px-2 outline-none focus:border-teal-400'
                  value={prefetch?.Format ?? 'json'}
                  onChange={(event) => {
                    const value = event.currentTarget.value as EaCInterfaceHistoricSliceFormat;
                    updatePrefetchSlice(windowMode, (slice) => {
                      slice.Enabled = true;
                      slice.Format = value;
                    });
                  }}
                >
                  <option value='json'>JSON</option>
                  <option value='csv'>CSV</option>
                </Select>
              </label>
            </div>

            {windowMode === 'relative' && (
              <div class='grid gap-3 text-xs text-neutral-200 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
                <label class='flex flex-col gap-1'>
                  <span class='text-[11px] uppercase tracking-wide text-neutral-500'>
                    Range amount
                  </span>
                  <input
                    type='number'
                    min={1}
                    class='h-8 rounded border border-neutral-700 bg-neutral-900 px-2 outline-none focus:border-teal-400'
                    value={prefetch?.Range?.Amount ?? 7}
                    onChange={(event) => {
                      const amount = clampPositiveInteger(
                        event.currentTarget.value,
                        prefetch?.Range?.Amount ?? 7,
                      );
                      updatePrefetchSlice('relative', (slice) => {
                        slice.Enabled = true;
                        slice.Mode = 'relative';
                        slice.Range = {
                          Amount: amount,
                          Unit: slice.Range?.Unit ?? 'days',
                        };
                      });
                    }}
                  />
                </label>

                <label class='flex flex-col gap-1'>
                  <span class='text-[11px] uppercase tracking-wide text-neutral-500'>
                    Range unit
                  </span>
                  <Select
                    // class='h-8 rounded border border-neutral-700 bg-neutral-900 px-2 outline-none focus:border-teal-400'
                    value={prefetch?.Range?.Unit ?? 'days'}
                    onChange={(event) => {
                      const unit = event.currentTarget.value as EaCInterfaceHistoricRange['Unit'];
                      updatePrefetchSlice('relative', (slice) => {
                        slice.Enabled = true;
                        slice.Mode = 'relative';
                        slice.Range = {
                          Amount: slice.Range?.Amount ?? 7,
                          Unit: unit,
                        };
                      });
                    }}
                  >
                    <option value='minutes'>Minutes</option>
                    <option value='hours'>Hours</option>
                    <option value='days'>Days</option>
                  </Select>
                </label>
                <p class='md:col-span-2 text-[11px] text-neutral-500'>
                  Fetch the most recent records using a rolling window (e.g. last 30 minutes or last
                  7 days).
                </p>
              </div>
            )}

            {windowMode === 'absolute' && (
              <div class='grid gap-3 text-xs text-neutral-200 md:grid-cols-[repeat(2,minmax(0,1fr))]'>
                <label class='flex flex-col gap-1'>
                  <span class='text-[11px] uppercase tracking-wide text-neutral-500'>
                    Start date/time
                  </span>
                  <input
                    type='datetime-local'
                    class='h-8 rounded border border-neutral-700 bg-neutral-900 px-2 outline-none focus:border-teal-400'
                    value={isoToLocalInput(prefetch?.AbsoluteRange?.Start)}
                    onChange={(event) => {
                      const iso = localInputToIso(event.currentTarget.value);
                      if (!iso) return;
                      updatePrefetchSlice('absolute', (slice) => {
                        slice.Enabled = true;
                        slice.Mode = 'absolute';
                        const current = slice.AbsoluteRange ?? { Start: iso };
                        slice.AbsoluteRange = { ...current, Start: iso };
                      });
                    }}
                  />
                </label>

                <label class='flex flex-col gap-1'>
                  <span class='text-[11px] uppercase tracking-wide text-neutral-500'>
                    End date/time
                  </span>
                  <input
                    type='datetime-local'
                    class='h-8 rounded border border-neutral-700 bg-neutral-900 px-2 outline-none focus:border-teal-400'
                    value={isoToLocalInput(prefetch?.AbsoluteRange?.End)}
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      updatePrefetchSlice('absolute', (slice) => {
                        slice.Enabled = true;
                        slice.Mode = 'absolute';
                        if (!value) {
                          if (slice.AbsoluteRange) {
                            delete slice.AbsoluteRange.End;
                          }
                          return;
                        }
                        const iso = localInputToIso(value);
                        if (!iso) return;
                        const current = slice.AbsoluteRange ?? { Start: new Date().toISOString() };
                        slice.AbsoluteRange = { ...current, End: iso };
                      });
                    }}
                  />
                  <span class='text-[10px] text-neutral-500'>
                    Leave blank to fetch everything from the start onward.
                  </span>
                </label>

                <p class='md:col-span-2 text-[11px] text-neutral-500'>
                  Fetch a fixed historical window using explicit timestamps (UTC). Useful for
                  investigations or reproducible reports.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
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

function normalizeDataConnectionFeatures(
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

function clampPositiveInteger(value: string, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.round(parsed);
}

function isValidAbsoluteRange(range: EaCInterfaceHistoricAbsoluteRange): boolean {
  if (!range || !isValidIsoDate(range.Start)) return false;
  if (range.End !== undefined && !isValidIsoDate(range.End)) return false;
  return true;
}

function isoToLocalInput(iso?: string): string {
  if (!iso || !isValidIsoDate(iso)) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function localInputToIso(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function isValidIsoDate(value: string | undefined): boolean {
  if (!value) return false;
  return Number.isFinite(Date.parse(value));
}
