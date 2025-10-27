import {
  Badge,
  IntentTypes,
  type JSX,
  ToggleCheckbox,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from '../../../.deps.ts';
import type {
  EaCInterfaceDataConnectionFeatures,
  EaCInterfaceGeneratedDataSlice,
  EaCInterfaceHistoricRange,
  EaCInterfaceHistoricSliceFormat,
  EaCInterfaceHistoricWindowMode,
} from '../../../.deps.ts';
import { normalizeDataConnectionFeatures } from './SurfaceInterfacePageDataTab.tsx';
import { SurfaceCodeMirror } from '../../../components/code/SurfaceCodeMirror.tsx';

export type SurfaceInterfaceHandlerPlanStep = {
  id: string;
  sliceKey: string;
  sliceLabel: string;
  sliceDescription?: string;
  actionKey: string;
  actionLabel: string;
  invocationType?: string;
  resultName: string;
  inputExpression: string;
  notes: string;
  autoExecute: boolean;
  includeInResponse: boolean;
};

type HandlerStep = SurfaceInterfaceHandlerPlanStep;

type SurfaceInterfaceHandlerTabProps = {
  generatedSlices: Array<[string, EaCInterfaceGeneratedDataSlice]>;
  steps: SurfaceInterfaceHandlerPlanStep[];
  onStepsChange: (next: SurfaceInterfaceHandlerPlanStep[]) => void;
  onDataConnectionChange: (
    key: string,
    features: EaCInterfaceDataConnectionFeatures | undefined
  ) => void;
  handlerCode: string;
  handlerEnabled: boolean;
  handlerDescription: string;
  handlerMessages: string;
  onHandlerCodeChange: (next: string) => void;
  onHandlerEnabledChange: (next: boolean) => void;
  onHandlerDescriptionChange: (next: string) => void;
  onHandlerMessagesChange: (next: string) => void;
};

type PlanSummaryProps = { steps: HandlerStep[] };
type HandlerPlannerProps = {
  steps: HandlerStep[];
  slicesByKey: Map<string, EaCInterfaceGeneratedDataSlice>;
  onStepChange: (
    id: string,
    updater: (step: HandlerStep) => HandlerStep
  ) => void;
  onDataConnectionChange: (
    key: string,
    features: EaCInterfaceDataConnectionFeatures | undefined
  ) => void;
  handlerCode: string;
  handlerEnabled: boolean;
  handlerDescription: string;
  handlerMessages: string;
  onHandlerCodeChange: (next: string) => void;
  onHandlerEnabledChange: (next: boolean) => void;
  onHandlerDescriptionChange: (next: string) => void;
  onHandlerMessagesChange: (next: string) => void;
};
type HandlerStepCardProps = {
  step: HandlerStep;
  stepIndex: number;
  onChange: (updater: (step: HandlerStep) => HandlerStep) => void;
  slice?: EaCInterfaceGeneratedDataSlice;
  onDataConnectionChange: (
    key: string,
    features: EaCInterfaceDataConnectionFeatures | undefined
  ) => void;
};
export function SurfaceInterfaceHandlerTab({
  generatedSlices,
  steps,
  onStepsChange,
  onDataConnectionChange,
  handlerCode,
  handlerEnabled,
  handlerDescription,
  handlerMessages,
  onHandlerCodeChange,
  onHandlerEnabledChange,
  onHandlerDescriptionChange,
  onHandlerMessagesChange,
}: SurfaceInterfaceHandlerTabProps): JSX.Element {
  const basePlan = useMemo(
    () => buildBasePlanFromSlices(generatedSlices),
    [generatedSlices]
  );
  const slicesByKey = useMemo(
    () => new Map<string, EaCInterfaceGeneratedDataSlice>(generatedSlices),
    [generatedSlices]
  );

  useEffect(() => {
    const reconciled = reconcileHandlerPlan(basePlan, steps);
    if (!arePlansEqual(reconciled, steps)) {
      console.debug('[SurfaceInterfaceHandlerTab] plan reconciliation', {
        previousLength: steps.length,
        nextLength: reconciled.length,
      });
      onStepsChange(reconciled);
    }
  }, [basePlan, steps, onStepsChange]);

  const handleStepChange = (
    stepId: string,
    updater: (prev: HandlerStep) => HandlerStep
  ) => {
    const next = steps.map((step) =>
      step.id === stepId ? updater(step) : step
    );
    console.debug('[SurfaceInterfaceHandlerTab] handler step updated', {
      stepId,
    });
    onStepsChange(next);
  };

  return (
    <div class="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pb-2">
      <HandlerPlanner
        steps={steps}
        slicesByKey={slicesByKey}
        onStepChange={handleStepChange}
        onDataConnectionChange={onDataConnectionChange}
        handlerCode={handlerCode}
        handlerEnabled={handlerEnabled}
        handlerDescription={handlerDescription}
        handlerMessages={handlerMessages}
        onHandlerCodeChange={onHandlerCodeChange}
        onHandlerEnabledChange={onHandlerEnabledChange}
        onHandlerDescriptionChange={onHandlerDescriptionChange}
        onHandlerMessagesChange={onHandlerMessagesChange}
      />

      <PlanSummary steps={steps} />
    </div>
  );
}

function PlanSummary({ steps }: PlanSummaryProps): JSX.Element {
  const hasSteps = steps.length > 0;

  return (
    <section class="rounded-lg border border-neutral-800 bg-neutral-950 text-sm text-neutral-200">
      <details open class="flex flex-col">
        <summary class="flex cursor-pointer items-center justify-between gap-3 px-4 py-3">
          <div class="space-y-1">
            <h3 class="text-sm font-semibold text-neutral-100">
              Configured handler actions
            </h3>
            <p class="text-xs text-neutral-400">
              Documentation snapshot of the actions currently available to the
              handler plan.
            </p>
          </div>
          <Badge
            intentType={hasSteps ? IntentTypes.Primary : IntentTypes.Secondary}
          >
            {hasSteps ? `${steps.length} configured` : 'None configured'}
          </Badge>
        </summary>

        <div class="flex flex-col gap-3 border-t border-neutral-800 p-4">
          {hasSteps ? (
            <ul class="space-y-3">
              {steps.map((step, index) => {
                const trimmedNotes = step.notes.trim();
                return (
                  <li
                    key={step.id}
                    class="space-y-3 rounded border border-neutral-800 bg-neutral-900/60 p-3 text-xs text-neutral-300"
                  >
                    <header class="flex flex-wrap items-baseline justify-between gap-2">
                      <div class="space-y-1">
                        <p class="text-sm font-semibold text-neutral-100">
                          {index + 1}. {step.sliceLabel} → {step.actionLabel}
                        </p>
                        <p class="font-mono text-[11px] text-neutral-500">
                          slice: {step.sliceKey} • action: {step.actionKey}
                        </p>
                      </div>
                      <div class="flex flex-wrap items-center gap-2">
                        <Badge
                          intentType={
                            step.autoExecute
                              ? IntentTypes.Primary
                              : IntentTypes.Secondary
                          }
                        >
                          {step.autoExecute
                            ? 'Auto during load'
                            : 'Manual trigger'}
                        </Badge>
                        {step.includeInResponse && (
                          <Badge intentType={IntentTypes.Secondary}>
                            Maps to `{step.resultName || 'result'}`
                          </Badge>
                        )}
                      </div>
                    </header>

                    <dl class="grid gap-2 text-[11px] md:grid-cols-2">
                      <div>
                        <dt class="uppercase tracking-wide text-neutral-500">
                          Invocation type
                        </dt>
                        <dd class="text-neutral-200">
                          {step.invocationType ?? 'default'}
                        </dd>
                      </div>
                      <div>
                        <dt class="uppercase tracking-wide text-neutral-500">
                          Result key
                        </dt>
                        <dd class="text-neutral-200">
                          {step.includeInResponse &&
                          step.resultName.trim().length > 0
                            ? step.resultName
                            : 'Not mapped to response'}
                        </dd>
                      </div>
                      <div class="md:col-span-2">
                        <dt class="uppercase tracking-wide text-neutral-500">
                          Input expression
                        </dt>
                        <dd class="font-mono text-[11px] text-neutral-200">
                          {step.inputExpression.trim() || 'undefined'}
                        </dd>
                      </div>
                    </dl>

                    {trimmedNotes.length > 0 && (
                      <div class="rounded border border-neutral-800 bg-neutral-950/70 p-3 text-[11px] text-neutral-200">
                        {trimmedNotes.split(/\r?\n/).map((line, noteIndex) => (
                          <p
                            key={`${step.id}-note-${noteIndex}`}
                            class="leading-relaxed"
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div class="rounded border border-dashed border-neutral-800 bg-neutral-900/40 p-4 text-xs text-neutral-500">
              No handler-capable actions are configured. Enable server execution
              from the Page Data tab to document them here.
            </div>
          )}
        </div>
      </details>
    </section>
  );
}

function HandlerPlanner({
  steps,
  slicesByKey,
  onStepChange,
  onDataConnectionChange,
  handlerCode,
  handlerEnabled,
  handlerDescription,
  handlerMessages,
  onHandlerCodeChange,
  onHandlerEnabledChange,
  onHandlerDescriptionChange,
  onHandlerMessagesChange,
}: HandlerPlannerProps): JSX.Element {
  const defaultHandlerDescription = useMemo(
    () => buildGeneratedDescription(steps),
    [steps],
  );
  const defaultHandlerMessages = useMemo(
    () => buildGeneratedMessages(steps),
    [steps],
  );
  return (
    <section class="rounded-lg border border-neutral-800 bg-neutral-950 text-sm text-neutral-200">
      <details open class="flex flex-col">
        <summary class="flex cursor-pointer items-start justify-between gap-3 px-4 py-3">
          <div>
            <h3 class="text-sm font-semibold text-neutral-100">Handler flow</h3>
            <p class="text-xs text-neutral-400">
              Adjust the orchestration order, runtime inputs, and response
              mapping for each server-capable action.
            </p>
          </div>
          <Badge intentType={IntentTypes.Secondary}>
            {steps.length} {steps.length === 1 ? 'step' : 'steps'}
          </Badge>
        </summary>

        <div class="flex flex-col gap-3 border-t border-neutral-800 p-4">
          {steps.length === 0 ? (
            <div class="rounded border border-dashed border-neutral-800 bg-neutral-950/70 p-4 text-xs text-neutral-500">
              No handler-capable actions detected. Enable handler access from
              Page Data to orchestrate backend logic.
            </div>
          ) : (
            steps.map((step, index) => {
              const slice = slicesByKey.get(step.sliceKey);
              return (
                <HandlerStepCard
                  key={step.id}
                  step={step}
                  stepIndex={index}
                  slice={slice}
                  onChange={(updater) => onStepChange(step.id, updater)}
                  onDataConnectionChange={onDataConnectionChange}
                />
              );
            })
          )}

          <CustomHandlerStep
            stepIndex={steps.length}
            code={handlerCode}
            enabled={handlerEnabled}
            description={handlerDescription}
            messages={handlerMessages}
            defaultDescription={defaultHandlerDescription}
            defaultMessages={defaultHandlerMessages}
            onCodeChange={onHandlerCodeChange}
            onEnabledChange={onHandlerEnabledChange}
            onDescriptionChange={onHandlerDescriptionChange}
            onMessagesChange={onHandlerMessagesChange}
          />

          <p class="text-[11px] text-neutral-500">
            Preview the generated handler source and export-ready modules on the
            Code tab.
          </p>
        </div>
      </details>
    </section>
  );
}

function HandlerStepCard({
  step,
  stepIndex,
  slice,
  onChange,
  onDataConnectionChange,
}: HandlerStepCardProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(true);
  const isDataConnection = (slice?.SourceCapability ?? '').startsWith('dataConnection:');
  const features = slice?.DataConnection;
  const allowedFormats = Array.from(
    new Set(
      (features?.HistoricDownloadFormats ?? []).filter(
        (format): format is EaCInterfaceHistoricSliceFormat =>
          format === 'json' || format === 'csv',
      ),
    ),
  );
  const availableFormats: EaCInterfaceHistoricSliceFormat[] = allowedFormats.length > 0
    ? allowedFormats
    : ['json'];
  const autoExecuteLabel = isDataConnection ? 'Prefetch during' : 'Run during';

  const applyDataConnectionUpdate = (
    updater: (
      prev: EaCInterfaceDataConnectionFeatures | undefined,
    ) => EaCInterfaceDataConnectionFeatures | undefined,
  ) => {
    const clone = cloneDataConnectionFeatures(features);
    const next = updater(clone);
    const normalized = normalizeDataConnectionFeatures(next);
    onDataConnectionChange(step.sliceKey, normalized);
  };

  const ensurePrefetchEnabled = (enabled: boolean) => {
    if (!isDataConnection) return;
    applyDataConnectionUpdate((prev) => {
      const next: EaCInterfaceDataConnectionFeatures = { ...(prev ?? {}) };
      const baseSlice = createPrefetchSlice(
        prev?.PrefetchHistoricSlice?.Mode ?? 'relative',
        prev?.PrefetchHistoricSlice,
        availableFormats,
      );
      baseSlice.Enabled = enabled;
      next.PrefetchHistoricSlice = baseSlice;
      return next;
    });
  };

  const handleAutoExecuteToggle = (checked: boolean) => {
    onChange((s) => ({ ...s, autoExecute: checked }));
    ensurePrefetchEnabled(checked);
  };

  const summaryBadges = (
    <div class='flex flex-wrap items-center gap-2 text-[11px] text-neutral-400'>
      <span class='rounded border border-neutral-700 bg-neutral-900/60 px-2 py-0.5 text-neutral-300'>
        Slice: {step.sliceLabel}
      </span>
      <span
        class={`rounded border px-2 py-0.5 ${
          step.autoExecute
            ? 'border-teal-500/40 bg-teal-500/10 text-teal-200'
            : 'border-neutral-700 bg-neutral-900/60 text-neutral-400'
        }`}
      >
        {step.autoExecute ? 'Auto executes' : 'Manual trigger'}
      </span>
      <span
        class={`rounded border px-2 py-0.5 ${
          step.includeInResponse
            ? 'border-sky-500/40 bg-sky-500/10 text-sky-200'
            : 'border-neutral-700 bg-neutral-900/60 text-neutral-400'
        }`}
      >
        {step.includeInResponse ? 'Maps to response' : 'No response mapping'}
      </span>
      {step.invocationType && (
        <span class='rounded border border-neutral-700 bg-neutral-900/60 px-2 py-0.5 text-neutral-300'>
          {step.invocationType}
        </span>
      )}
    </div>
  );

  return (
    <div class='rounded border border-neutral-800 bg-neutral-950/80'>
      <header class='flex flex-wrap items-center justify-between gap-2 px-3 py-2'>
        <button
          type='button'
          class='flex items-center gap-2 text-left text-sm font-semibold text-neutral-100 focus:outline-none'
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span class='font-mono text-xs text-neutral-500'>{isOpen ? 'v' : '>'}</span>
          <span>
            Step {stepIndex + 1}: {step.actionLabel}
          </span>
        </button>
        {summaryBadges}
      </header>

      {isOpen && (
        <div class='space-y-4 border-t border-neutral-800 p-3'>
          <FormRow
            label='Result key'
            description='Identifier applied to the handler response when this step returns data.'
          >
            <input
              class='h-9 w-full rounded border border-neutral-700 bg-neutral-900 px-3 text-sm text-neutral-100 outline-none focus:border-teal-400'
              value={step.resultName}
              placeholder='statusMessage'
              onInput={(event: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                onChange((s) => ({ ...s, resultName: event.currentTarget.value }))}
            />
          </FormRow>

          <FormRow
            label='Input payload'
            description='Optional JavaScript expression evaluated and passed to the action.'
          >
            <input
              class='h-9 w-full rounded border border-neutral-700 bg-neutral-900 px-3 text-sm text-neutral-100 outline-none focus:border-teal-400'
              value={step.inputExpression}
              placeholder='undefined'
              onInput={(event: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                onChange((s) => ({ ...s, inputExpression: event.currentTarget.value }))}
            />
          </FormRow>

          <FormRow
            label='Execution'
            description={isDataConnection
              ? 'Control when the data connection prefetches and whether results populate the page response.'
              : 'Control whether this step runs automatically and contributes to the page response.'}
          >
            <div class='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6'>
              <label class='flex items-center gap-2 text-sm text-neutral-200'>
                <ToggleCheckbox
                  checked={step.autoExecute}
                  onToggle={handleAutoExecuteToggle}
                  title={isDataConnection ? 'Toggle data prefetch' : 'Toggle auto execution'}
                  checkedIntentType={IntentTypes.Primary}
                  uncheckedIntentType={IntentTypes.Secondary}
                />
                {autoExecuteLabel} <span class='font-mono text-neutral-100'>loadPageData</span>
              </label>
              <label class='flex items-center gap-2 text-sm text-neutral-200'>
                <ToggleCheckbox
                  checked={step.includeInResponse}
                  onToggle={(checked) => onChange((s) => ({ ...s, includeInResponse: checked }))}
                  title='Toggle response projection'
                  checkedIntentType={IntentTypes.Primary}
                  uncheckedIntentType={IntentTypes.Secondary}
                />
                Attach to returned data
              </label>
            </div>
          </FormRow>

          {isDataConnection && step.autoExecute && slice && (
            <FormRow
              label='Prefetch window'
              description='Fine-tune the historic slice fetched before the handler executes.'
            >
              <DataConnectionPrefetchSettings
                sliceKey={step.sliceKey}
                slice={slice}
                onFeaturesChange={onDataConnectionChange}
              />
            </FormRow>
          )}

          <FormRow
            label='Notes'
            description='Optional comments or follow-up tasks for collaborators.'
          >
            <textarea
              class='h-20 w-full resize-none rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-teal-400'
              placeholder='e.g. Replace with production query once API stabilises.'
              value={step.notes}
              onInput={(event: JSX.TargetedEvent<HTMLTextAreaElement, Event>) =>
                onChange((s) => ({ ...s, notes: event.currentTarget.value }))}
            />
          </FormRow>
        </div>
      )}
    </div>
  );
}
type FormRowProps = {
  label: string;
  description?: string;
  disabled?: boolean;
  children: JSX.Element | JSX.Element[];
};

function FormRow({ label, description, disabled = false, children }: FormRowProps): JSX.Element {
  const labelClasses = `text-sm font-semibold ${disabled ? 'text-neutral-500' : 'text-neutral-100'}`;
  const descriptionClasses = `text-xs ${disabled ? 'text-neutral-700' : 'text-neutral-400'}`;
  const ariaDisabled = disabled ? 'true' : undefined;

  return (
    <div class='flex flex-col gap-3 py-1' aria-disabled={ariaDisabled}>
      <div class='space-y-1'>
        <p class={labelClasses}>{label}</p>
        {description && <p class={descriptionClasses}>{description}</p>}
      </div>
      <div class='flex-1 min-w-0'>{children}</div>
    </div>
  );
}
type CustomHandlerStepProps = {
  stepIndex: number;
  code: string;
  enabled: boolean;
  description: string;
  messages: string;
  defaultDescription: string;
  defaultMessages: string;
  onCodeChange: (next: string) => void;
  onEnabledChange: (next: boolean) => void;
  onDescriptionChange: (next: string) => void;
  onMessagesChange: (next: string) => void;
};

function CustomHandlerStep({
  stepIndex,
  code,
  enabled,
  description,
  messages,
  defaultDescription,
  defaultMessages,
  onCodeChange,
  onEnabledChange,
  onDescriptionChange,
  onMessagesChange,
}: CustomHandlerStepProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(enabled);

  useEffect(() => {
    if (enabled) setIsOpen(true);
  }, [enabled]);

  const segments = useMemo(() => splitHandlerCode(code), [code]);

  const handleBodyChange = useCallback(
    (next: string) => {
      onCodeChange(`${segments.prefix}${next}${segments.suffix}`);
    },
    [onCodeChange, segments.prefix, segments.suffix],
  );

  const handleToggle = (checked: boolean) => {
    if (checked) {
      if (!enabled) {
        if (code.trim().length === 0) {
          onCodeChange(buildCustomHandlerSkeleton());
        }
        if (description.trim().length === 0 && defaultDescription.trim().length > 0) {
          onDescriptionChange(defaultDescription);
        }
        if (messages.trim().length === 0 && defaultMessages.trim().length > 0) {
          onMessagesChange(defaultMessages);
        }
      }
      onEnabledChange(true);
      setIsOpen(true);
    } else {
      onCodeChange('');
      onDescriptionChange('');
      onMessagesChange('');
      onEnabledChange(false);
    }
  };

  return (
    <div class='rounded border border-neutral-800 bg-neutral-950/80'>
      <header class='flex flex-wrap items-center justify-between gap-2 px-3 py-2'>
        <button
          type='button'
          class='flex items-center gap-2 text-left text-sm font-semibold text-neutral-100 focus:outline-none'
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span class='font-mono text-xs text-neutral-500'>{isOpen ? 'v' : '>'}</span>
          <span>Step {stepIndex + 1}: Custom handler logic (optional)</span>
        </button>
        <label class='flex items-center gap-2 text-xs text-neutral-300'>
          <ToggleCheckbox
            checked={enabled}
            onToggle={handleToggle}
            title='Toggle custom handler logic'
            checkedIntentType={IntentTypes.Primary}
            uncheckedIntentType={IntentTypes.Secondary}
          />
          Enable
        </label>
      </header>

      {isOpen && (
        <div class='space-y-4 border-t border-neutral-800 p-3'>
          <p class='text-xs text-neutral-400'>
            Extend or override the generated handler before it returns data. When disabled, the default orchestration built from the steps above is used.
          </p>

          {enabled ? (
            <>
              <div class='flex flex-col gap-2'>
                <div class='space-y-1'>
                  <p class='text-sm font-semibold text-neutral-100'>Custom handler code</p>
                  <p class='text-xs text-neutral-400'>
                    Returns an updated InterfacePageData object. The generated data is provided as the seed argument.
                  </p>
                </div>
                <div class='overflow-hidden rounded border border-neutral-800'>
                  {segments.prefix.trim().length > 0 && (
                    <pre class='m-0 border-b border-neutral-800 bg-neutral-900/80 px-3 py-2 font-mono text-[12px] text-neutral-300'>
                      {segments.prefix.replace(/\s+$/, '')}
                    </pre>
                  )}
                  <SurfaceCodeMirror
                    value={segments.body}
                    onValueChange={handleBodyChange}
                    class='min-h-[240px] [&_.cm-editor]:rounded-none [&_.cm-editor]:border-none [&_.cm-editor]:bg-neutral-950'
                  />
                  {segments.suffix.trim().length > 0 && (
                    <pre class='m-0 border-t border-neutral-800 bg-neutral-900/80 px-3 py-2 font-mono text-[12px] text-neutral-300'>
                      {segments.suffix.replace(/^\s+/, '')}
                    </pre>
                  )}
                </div>
              </div>

              <FormRow label='Description'>
                <textarea
                  class='h-16 w-full resize-none rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-teal-400'
                  placeholder='Optional description for this handler override.'
                  value={description}
                  onInput={(event: JSX.TargetedEvent<HTMLTextAreaElement, Event>) =>
                    onDescriptionChange(event.currentTarget.value)}
                />
              </FormRow>

              <FormRow label='Guidance messages'>
                <textarea
                  class='h-20 w-full resize-none rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-teal-400'
                  placeholder='Optional guidance messages (one per line).'
                  value={messages}
                  onInput={(event: JSX.TargetedEvent<HTMLTextAreaElement, Event>) =>
                    onMessagesChange(event.currentTarget.value)}
                />
              </FormRow>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
type DataConnectionPrefetchSettingsProps = {
  sliceKey: string;
  slice: EaCInterfaceGeneratedDataSlice;
  onFeaturesChange: (
    key: string,
    features: EaCInterfaceDataConnectionFeatures | undefined
  ) => void;
};

function DataConnectionPrefetchSettings({
  sliceKey,
  slice,
  onFeaturesChange,
}: DataConnectionPrefetchSettingsProps): JSX.Element {
  const features = slice.DataConnection;
  const allowedFormats = Array.from(
    new Set(
      (features?.HistoricDownloadFormats ?? []).filter(
        (format): format is EaCInterfaceHistoricSliceFormat =>
          format === 'json' || format === 'csv'
      )
    )
  );
  const availableFormats: EaCInterfaceHistoricSliceFormat[] =
    allowedFormats.length > 0 ? allowedFormats : ['json'];
  const prefetch = features?.PrefetchHistoricSlice;
  const defaultMode: EaCInterfaceHistoricWindowMode =
    prefetch?.Mode ?? 'relative';
  const effectivePrefetch =
    prefetch ?? createPrefetchSlice(defaultMode, undefined, availableFormats);

  const handleFeaturesUpdate = (
    updater: (
      current: EaCInterfaceDataConnectionFeatures | undefined
    ) => EaCInterfaceDataConnectionFeatures | undefined
  ) => {
    const clone = cloneDataConnectionFeatures(features);
    const next = updater(clone);
    const normalized = normalizeDataConnectionFeatures(next);
    onFeaturesChange(sliceKey, normalized);
  };

  const updatePrefetchSlice = (
    mode: EaCInterfaceHistoricWindowMode,
    mutate: (
      slice: NonNullable<
        EaCInterfaceDataConnectionFeatures['PrefetchHistoricSlice']
      >
    ) => void
  ) => {
    handleFeaturesUpdate((prev) => {
      const next: EaCInterfaceDataConnectionFeatures = { ...(prev ?? {}) };
      const baseSlice = createPrefetchSlice(
        mode,
        prev?.PrefetchHistoricSlice,
        availableFormats
      );
      mutate(baseSlice);
      baseSlice.Enabled = true;
      next.PrefetchHistoricSlice = baseSlice;
      return next;
    });
  };

  const inputClass = 'h-9 w-full rounded border border-neutral-700 bg-neutral-900 px-3 text-sm text-neutral-100 outline-none focus:border-teal-400';

  return (
    <div class='flex flex-col gap-3 text-sm text-neutral-200'>
      <div class='flex flex-wrap items-center gap-2'>
        {(['relative', 'absolute'] as EaCInterfaceHistoricWindowMode[]).map((mode) => (
          <button
            key={mode}
            type='button'
            class={`rounded border px-2 py-1 text-xs transition ${
              (effectivePrefetch.Mode ?? 'relative') === mode
                ? 'border-teal-400 bg-teal-400/10 text-teal-200'
                : 'border-neutral-700 text-neutral-400 hover-border-neutral-500'
            }`}
            onClick={() => {
              updatePrefetchSlice(mode, (slice) => {
                slice.Mode = mode;
              });
            }}
          >
            {mode === 'relative' ? 'Rolling window' : 'Specific dates'}
          </button>
        ))}
      </div>

      <div class='flex flex-wrap gap-3'>
        <div class='w-full max-w-xs'>
          <select
            class={inputClass}
            value={resolvePrefetchFormat(
              effectivePrefetch.Format,
              availableFormats,
            )}
            onChange={(event) => {
              const value = event.currentTarget.value as EaCInterfaceHistoricSliceFormat;
              updatePrefetchSlice(effectivePrefetch.Mode ?? 'relative', (slice) => {
                slice.Format = value;
              });
            }}
          >
            {availableFormats.map((format) => (
              <option key={format} value={format}>
                {format.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {effectivePrefetch.Mode !== 'absolute' && (
        <div class='grid gap-3 md:grid-cols-2'>
          <div class='flex flex-col gap-1'>
            <input
              type='number'
              min={1}
              class={inputClass}
              value={effectivePrefetch.Range?.Amount ?? 7}
              onChange={(event) => {
                const amount = clampPositiveInteger(
                  event.currentTarget.value,
                  effectivePrefetch.Range?.Amount ?? 7,
                );
                updatePrefetchSlice('relative', (slice) => {
                  slice.Mode = 'relative';
                  slice.Range = {
                    Amount: amount,
                    Unit: slice.Range?.Unit ?? 'days',
                  };
                });
              }}
            />
            <span class='text-xs text-neutral-400'>Range amount</span>
          </div>
          <div class='flex flex-col gap-1'>
            <select
              class={inputClass}
              value={effectivePrefetch.Range?.Unit ?? 'days'}
              onChange={(event) => {
                const unit = event.currentTarget.value as EaCInterfaceHistoricRange['Unit'];
                updatePrefetchSlice('relative', (slice) => {
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
            </select>
            <span class='text-xs text-neutral-400'>Range unit</span>
          </div>
          <p class='md:col-span-2 text-xs text-neutral-500'>
            Pull a rolling window relative to the request time (for example, the last 30 minutes or 7 days).
          </p>
        </div>
      )}

      {effectivePrefetch.Mode === 'absolute' && (
        <div class='grid gap-3 md:grid-cols-2'>
          <div class='flex flex-col gap-1'>
            <input
              type='datetime-local'
              class={inputClass}
              value={isoToLocalInput(effectivePrefetch.AbsoluteRange?.Start)}
              onChange={(event) => {
                const iso = localInputToIso(event.currentTarget.value);
                if (!iso) return;
                updatePrefetchSlice('absolute', (slice) => {
                  slice.Mode = 'absolute';
                  const current = slice.AbsoluteRange ?? { Start: iso };
                  slice.AbsoluteRange = { ...current, Start: iso };
                });
              }}
            />
            <span class='text-xs text-neutral-400'>Start date/time (UTC)</span>
          </div>
          <div class='flex flex-col gap-1'>
            <input
              type='datetime-local'
              class={inputClass}
              value={isoToLocalInput(effectivePrefetch.AbsoluteRange?.End)}
              onChange={(event) => {
                const value = event.currentTarget.value;
                updatePrefetchSlice('absolute', (slice) => {
                  slice.Mode = 'absolute';
                  if (!value) {
                    if (slice.AbsoluteRange) delete slice.AbsoluteRange.End;
                    return;
                  }
                  const iso = localInputToIso(value);
                  if (!iso) return;
                  const current = slice.AbsoluteRange ?? { Start: new Date().toISOString() };
                  slice.AbsoluteRange = { ...current, End: iso };
                });
              }}
            />
            <span class='text-xs text-neutral-400'>End date/time (optional)</span>
          </div>
          <p class='md:col-span-2 text-xs text-neutral-500'>
            Use fixed timestamps to prefetch a reproducible historic window.
          </p>
        </div>
      )}
    </div>
  );
}
function cloneDataConnectionFeatures(
  features: EaCInterfaceDataConnectionFeatures | undefined
): EaCInterfaceDataConnectionFeatures | undefined {
  return features
    ? (JSON.parse(
        JSON.stringify(features)
      ) as EaCInterfaceDataConnectionFeatures)
    : undefined;
}

function resolvePrefetchFormat(
  current: string | undefined,
  available: EaCInterfaceHistoricSliceFormat[]
): EaCInterfaceHistoricSliceFormat {
  const sanitized = available.filter(
    (format) => format === 'json' || format === 'csv'
  );
  const fallback = sanitized[0] ?? 'json';
  if (
    current &&
    sanitized.includes(current as EaCInterfaceHistoricSliceFormat)
  ) {
    return current as EaCInterfaceHistoricSliceFormat;
  }
  return fallback;
}

function createPrefetchSlice(
  mode: EaCInterfaceHistoricWindowMode,
  existing:
    | NonNullable<EaCInterfaceDataConnectionFeatures['PrefetchHistoricSlice']>
    | undefined,
  availableFormats: EaCInterfaceHistoricSliceFormat[]
): NonNullable<EaCInterfaceDataConnectionFeatures['PrefetchHistoricSlice']> {
  const slice: NonNullable<
    EaCInterfaceDataConnectionFeatures['PrefetchHistoricSlice']
  > = {
    Enabled: existing?.Enabled ?? true,
    Format: resolvePrefetchFormat(existing?.Format, availableFormats),
    Mode: mode,
  };

  if (mode === 'absolute') {
    const absolute = existing?.AbsoluteRange;
    slice.AbsoluteRange =
      absolute && isValidIsoDate(absolute.Start)
        ? { ...absolute }
        : { Start: new Date().toISOString() };
    delete slice.Range;
  } else {
    const range = existing?.Range;
    slice.Range =
      range && typeof range.Amount === 'number' && range.Amount > 0
        ? { ...range }
        : { Amount: 7, Unit: 'days' };
    delete slice.AbsoluteRange;
  }

  return slice;
}

function clampPositiveInteger(value: string, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.round(parsed);
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

function buildBasePlanFromSlices(
  generatedSlices: Array<[string, EaCInterfaceGeneratedDataSlice]>
): SurfaceInterfaceHandlerPlanStep[] {
  const steps: SurfaceInterfaceHandlerPlanStep[] = [];

  for (const [sliceKey, slice] of generatedSlices) {
    if (!slice || slice.Enabled === false) continue;

    const accessMode = slice.AccessMode ?? 'both';
    if (accessMode === 'client') continue;

    const sliceLabel = slice.Label ?? sliceKey;

    for (const action of slice.Actions ?? []) {
      if (!action?.Key) continue;
      const invocationMode = action.Invocation?.Mode ?? 'both';
      if (invocationMode === 'client') continue;

      steps.push({
        id: `${sliceKey}:${action.Key}`,
        sliceKey,
        sliceLabel,
        sliceDescription: slice.Description,
        actionKey: action.Key,
        actionLabel: action.Label ?? action.Key,
        invocationType: action.Invocation?.Type,
        resultName: toCamelCase(action.Key),
        inputExpression: 'undefined',
        notes: '',
        autoExecute: true,
        includeInResponse: true,
      });
    }
  }

  return steps;
}

function reconcileHandlerPlan(
  basePlan: SurfaceInterfaceHandlerPlanStep[],
  currentPlan: SurfaceInterfaceHandlerPlanStep[]
): SurfaceInterfaceHandlerPlanStep[] {
  const currentMap = new Map(currentPlan.map((step) => [step.id, step]));
  return basePlan.map((base) => {
    const existing = currentMap.get(base.id);
    if (!existing) return base;
    return {
      ...base,
      resultName: existing.resultName ?? base.resultName,
      inputExpression: existing.inputExpression ?? base.inputExpression,
      notes: existing.notes ?? base.notes,
      autoExecute: existing.autoExecute ?? base.autoExecute,
      includeInResponse: existing.includeInResponse ?? base.includeInResponse,
    };
  });
}

function arePlansEqual(
  first: SurfaceInterfaceHandlerPlanStep[],
  second: SurfaceInterfaceHandlerPlanStep[]
): boolean {
  if (first.length !== second.length) return false;
  for (let index = 0; index < first.length; index += 1) {
    const a = first[index];
    const b = second[index];
    if (
      a.id !== b.id ||
      a.resultName !== b.resultName ||
      a.inputExpression !== b.inputExpression ||
      a.notes !== b.notes ||
      a.autoExecute !== b.autoExecute ||
      a.includeInResponse !== b.includeInResponse
    ) {
      return false;
    }
  }
  return true;
}

type HandlerStubOptions = {
  returnType?: string;
};

function buildCustomHandlerSkeleton(): string {
  return `export async function loadPageData(
  _req: Request,
  _ctx: Record<string, unknown>,
  _services: InterfaceServices,
  seed: InterfacePageData,
): Promise<InterfacePageData> {
  return seed;
}
`;
}

function splitHandlerCode(code: string): { prefix: string; body: string; suffix: string } {
  const source = code ?? '';
  if (!source.trim().length) {
    return { prefix: '', body: source, suffix: '' };
  }
  const openIndex = source.indexOf('{');
  const closeIndex = source.lastIndexOf('}');
  if (openIndex === -1 || closeIndex === -1 || closeIndex <= openIndex) {
    return { prefix: '', body: source, suffix: '' };
  }

  let prefix = source.slice(0, openIndex + 1);
  let suffix = source.slice(closeIndex);
  let body = source.slice(openIndex + 1, closeIndex);

  let leading = '';
  if (body.startsWith('\r\n')) {
    leading = '\r\n';
    body = body.slice(2);
  } else if (body.startsWith('\n')) {
    leading = '\n';
    body = body.slice(1);
  }

  let trailing = '';
  if (body.endsWith('\r\n')) {
    trailing = '\r\n';
    body = body.slice(0, -2);
  } else if (body.endsWith('\n')) {
    trailing = '\n';
    body = body.slice(0, -1);
  }

  prefix = `${prefix}${leading}`;
  suffix = `${trailing}${suffix}`;

  return { prefix, body, suffix };
}

export function generateHandlerStub(
  steps: SurfaceInterfaceHandlerPlanStep[],
  options: HandlerStubOptions = {}
): string {
  const returnType = options.returnType ?? 'Record<string, unknown>';
  const executableSteps = steps.filter((step) => step.autoExecute);

  const lines: string[] = [
    '/**',
    ' * loadPageData orchestrates interface actions on the server.',
    ' * Keep the export name stable so dynamic loaders can locate it.',
    ' */',
    'export async function loadPageData(',
    '  req: Request,',
    '  ctx: Record<string, unknown>,',
    '  services: InterfaceServices,',
    `  seed: ${returnType},`,
    `): Promise<${returnType}> {`,
    `  const data: ${returnType} = { ...seed };`,
    '  void services;',
  ];

  if (executableSteps.length > 0) {
    lines.push(
      '',
      '  const callAction = async (slice: string, action: string, input?: unknown) => {',
      '    const containers = (ctx as Record<string, unknown>)?.actions ??',
      '      (ctx as Record<string, unknown>)?.Actions ?? {};',
      '    const handler = (containers as Record<string, Record<string, unknown>>)[slice]?.[action];',
      "    if (typeof handler === 'function') {",
      '      return await (handler as (options: { req: Request; ctx: Record<string, unknown>; input?: unknown }) => Promise<unknown> | unknown)({',
      '        req,',
      '        ctx,',
      '        input,',
      '      });',
      '    }',
      '    return undefined;',
      '  };',
      ''
    );
  } else {
    lines.push(
      '',
      '  // Define handler steps with the planner or author your own logic below.',
      ''
    );
  }

  steps.forEach((step, index) => {
    lines.push(`  // ${index + 1}. ${step.sliceLabel} -> ${step.actionLabel}`);
    if (step.notes.trim().length > 0) {
      step.notes.split(/\r?\n/).forEach((note) => {
        const trimmed = note.trim();
        if (trimmed.length > 0) {
          lines.push(`  //    ${trimmed}`);
        }
      });
    }

    if (step.autoExecute) {
      const inputExpression = step.inputExpression.trim() || 'undefined';
      const tempVar = `result${index + 1}`;
      lines.push(
        `  const ${tempVar} = await callAction(${JSON.stringify(
          step.sliceKey
        )}, ${JSON.stringify(step.actionKey)}, ${inputExpression});`
      );

      if (step.includeInResponse && step.resultName.trim().length > 0) {
        lines.push(
          `  data[${JSON.stringify(
            step.resultName.trim()
          )}] = ${tempVar} ?? null;`
        );
      }
    } else {
      lines.push(
        `  // Available helper: callAction(${JSON.stringify(
          step.sliceKey
        )}, ${JSON.stringify(step.actionKey)}, input)`
      );
    }

    lines.push('');
  });

  lines.push('  return data;', '}', '');

  return lines.join('\n');
}

export function buildGeneratedDescription(
  steps: SurfaceInterfaceHandlerPlanStep[]
): string {
  if (steps.length === 0) {
    return 'Author server-side logic that composes interface actions and returns page data.';
  }

  const actionable = steps.filter((step) => step.autoExecute);
  const manual = steps.length - actionable.length;
  const parts = [`Orchestrates ${actionable.length} action(s)`];
  if (manual > 0) {
    parts.push(`exposes ${manual} helper(s) for custom triggers`);
  }
  return `${parts.join(' and ')} to hydrate interface data.`;
}

export function buildGeneratedMessages(
  steps: SurfaceInterfaceHandlerPlanStep[]
): string {
  if (steps.length === 0) return '';
  const messages = steps.map((step, index) => {
    const prefix = `Step ${index + 1}: ${step.sliceLabel} -> ${
      step.actionLabel
    }`;
    if (step.autoExecute && step.includeInResponse) {
      return `${prefix} (maps result to \`${step.resultName || 'result'}\`).`;
    }
    if (step.autoExecute) {
      return `${prefix} executes during load without mapping the result.`;
    }
    return `${prefix} remains available for manual invocation via the handler context.`;
  });
  return messages.join('\n');
}

function toCamelCase(value: string): string {
  return (
    value
      .split(/[^A-Za-z0-9]+/)
      .filter((segment) => segment.length > 0)
      .map((segment, index) =>
        index === 0
          ? segment.charAt(0).toLowerCase() + segment.slice(1)
          : segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
      )
      .join('') || value
  );
}







