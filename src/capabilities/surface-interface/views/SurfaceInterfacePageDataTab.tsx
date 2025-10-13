import {
  Badge,
  CodeMirrorEditor,
  IntentTypes,
  JSONSchema7,
  type JSX,
  ToggleCheckbox,
} from '../../../.deps.ts';
import type { EaCInterfaceGeneratedDataSlice, EaCInterfacePageDataAction } from '../../../.deps.ts';

type SurfaceInterfacePageDataTabProps = {
  generatedSlices: Array<[string, EaCInterfaceGeneratedDataSlice]>;
  customSchemaText: string;
  customSchemaError?: string;
  onToggleSlice: (key: string, enabled: boolean) => void;
  onCustomSchemaTextChange: (value: string) => void;
};

export function SurfaceInterfacePageDataTab({
  generatedSlices,
  customSchemaText,
  customSchemaError,
  onToggleSlice,
  onCustomSchemaTextChange,
}: SurfaceInterfacePageDataTabProps): JSX.Element {
  const enabledCount = generatedSlices.filter(([, slice]) => slice.Enabled !== false).length;

  return (
    <div class='flex h-full min-h-0 flex-col gap-4'>
      <section class='flex flex-col gap-3'>
        <header class='flex items-start justify-between gap-3'>
          <div>
            <h3 class='text-sm font-semibold text-neutral-100'>Generated State</h3>
            <p class='text-xs text-neutral-400'>
              Automatically contributed fields from connected capabilities. Disable items to exclude
              them from the page data contract.
            </p>
          </div>
          <Badge intentType={IntentTypes.Secondary} class='text-[11px] uppercase tracking-wide'>
            {enabledCount} enabled
          </Badge>
        </header>

        <div class='space-y-2 max-h-72 overflow-y-auto pr-1'>
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
                  onToggle={onToggleSlice}
                />
              ))
            )}
        </div>
      </section>

      <section class='flex flex-1 min-h-0 flex-col gap-2'>
        <header class='flex items-center justify-between'>
          <div>
            <h3 class='text-sm font-semibold text-neutral-100'>Custom Schema</h3>
            <p class='text-xs text-neutral-400'>
              Extend or override generated fields with bespoke JSON Schema. Leave empty to rely
              solely on generated slices.
            </p>
          </div>
        </header>
        <CodeMirrorEditor
          fileContent={customSchemaText}
          onContentChange={onCustomSchemaTextChange}
          class='flex-1 min-h-[180px] [&>.cm-editor]:h-full [&>.cm-editor]:min-h-0'
        />
        <div class='space-y-1 text-xs'>
          {customSchemaError && <p class='text-rose-400'>{customSchemaError}</p>}
          <p class='text-neutral-400'>
            The custom schema merges with enabled generated slices to form the final contract
            returned from
            <code>loadPageData</code>.
          </p>
        </div>
      </section>
    </div>
  );
}

type GeneratedSliceCardProps = {
  sliceKey: string;
  slice: EaCInterfaceGeneratedDataSlice;
  onToggle: (key: string, enabled: boolean) => void;
};

function GeneratedSliceCard({
  sliceKey,
  slice,
  onToggle,
}: GeneratedSliceCardProps): JSX.Element {
  const enabled = slice.Enabled !== false;
  const hydrationSummary = describeHydration(slice.Hydration);
  const schemaSummary = summarizeSchema(slice.Schema);

  return (
    <div
      class={`rounded-lg border bg-neutral-950 px-3 py-3 transition-colors ${
        enabled ? 'border-teal-500/40' : 'border-neutral-800'
      }`}
    >
      <div class='flex items-start justify-between gap-3'>
        <div class='space-y-1'>
          <p class='text-sm font-semibold text-neutral-50'>
            {slice.Label ?? sliceKey}
          </p>
          {slice.Description && <p class='text-xs text-neutral-400'>{slice.Description}</p>}
          <div class='flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-neutral-500'>
            {slice.SourceCapability && <span>{slice.SourceCapability}</span>}
            {hydrationSummary && <span>{hydrationSummary}</span>}
          </div>
          {schemaSummary && <p class='text-[11px] text-neutral-500'>Fields: {schemaSummary}</p>}
        </div>
        <ToggleCheckbox
          checked={enabled}
          onToggle={(checked) => onToggle(sliceKey, checked)}
          title={enabled ? 'Disable slice' : 'Enable slice'}
          checkedIntentType={IntentTypes.Secondary}
          uncheckedIntentType={IntentTypes.Error}
        />
      </div>

      {slice.Actions && slice.Actions.length > 0 && (
        <div class='mt-3 space-y-1 text-xs text-neutral-300'>
          <p class='font-semibold text-neutral-200'>Actions</p>
          <ul class='space-y-1'>
            {slice.Actions.map((action: EaCInterfacePageDataAction) => (
              <li
                key={action.Key}
                class='flex items-start justify-between gap-2 rounded border border-neutral-900 bg-neutral-950/70 px-2 py-1'
              >
                <div class='flex-1'>
                  <p class='font-medium text-neutral-100'>
                    {action.Label ?? action.Key}
                  </p>
                  {action.Description && (
                    <p class='text-[11px] text-neutral-500'>{action.Description}</p>
                  )}
                </div>
                <div class='flex flex-col items-end gap-1'>
                  {action.Invocation?.Type && (
                    <Badge
                      intentType={IntentTypes.Info}
                      class='text-[10px] uppercase tracking-wide'
                    >
                      {action.Invocation.Type}
                      {action.Invocation.Lookup ? ` · ${action.Invocation.Lookup}` : ''}
                    </Badge>
                  )}
                  {action.Invocation?.Mode && (
                    <span class='text-[10px] uppercase tracking-wide text-neutral-500'>
                      {action.Invocation.Mode} call
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
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
