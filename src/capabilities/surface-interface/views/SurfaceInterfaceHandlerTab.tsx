import {
  Badge,
  CodeMirrorEditor,
  Input,
  IntentTypes,
  IS_BROWSER,
  type JSX,
  ToggleCheckbox,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from '../../../.deps.ts';
import type { EaCInterfaceGeneratedDataSlice } from '../../../.deps.ts';

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
  imports: string[];
  generatedSlices: Array<[string, EaCInterfaceGeneratedDataSlice]>;
  handlerCode: string;
  handlerDescription: string;
  handlerMessages: string;
  steps: SurfaceInterfaceHandlerPlanStep[];
  onStepsChange: (next: SurfaceInterfaceHandlerPlanStep[]) => void;
  onHandlerCodeChange: (next: string) => void;
  onHandlerDescriptionChange: (next: string) => void;
  onHandlerMessagesChange: (next: string) => void;
};

type ImportsSummaryProps = { imports: string[] };
type PlanSummaryProps = { steps: HandlerStep[] };
type HandlerPlannerProps = {
  steps: HandlerStep[];
  onStepChange: (
    id: string,
    updater: (step: HandlerStep) => HandlerStep,
  ) => void;
};
type HandlerStepCardProps = {
  step: HandlerStep;
  stepIndex: number;
  onChange: (updater: (step: HandlerStep) => HandlerStep) => void;
};
type AdvancedHandlerEditorProps = {
  handlerCode: string;
  handlerDescription: string;
  handlerMessages: string;
  onHandlerCodeChange: (next: string) => void;
  onHandlerDescriptionChange: (next: string) => void;
  onHandlerMessagesChange: (next: string) => void;
};
export function SurfaceInterfaceHandlerTab({
  imports,
  generatedSlices,
  handlerCode,
  handlerDescription,
  handlerMessages,
  steps,
  onStepsChange,
  onHandlerCodeChange,
  onHandlerDescriptionChange,
  onHandlerMessagesChange,
}: SurfaceInterfaceHandlerTabProps): JSX.Element {
  useEffect(() => {
    debug('handlerCode prop updated', {
      length: handlerCode.length,
      snippet: handlerCode.slice(0, 80),
    });
  }, [handlerCode]);

  const basePlan = useMemo(
    () => buildBasePlanFromSlices(generatedSlices),
    [generatedSlices],
  );

  useEffect(() => {
    const reconciled = reconcileHandlerPlan(basePlan, steps);
    if (!arePlansEqual(reconciled, steps)) {
      onStepsChange(reconciled);
    }
  }, [basePlan, steps, onStepsChange]);

  const handleStepChange = (
    stepId: string,
    updater: (prev: HandlerStep) => HandlerStep,
  ) => {
    const next = steps.map((step) => step.id === stepId ? updater(step) : step);
    debug('handler step updated', { stepId });
    onStepsChange(next);
  };

  return (
    <div class='flex h-full min-h-0 flex-col gap-4 overflow-y-auto pb-2'>
      <ImportsSummary imports={imports} />

      <HandlerPlanner steps={steps} onStepChange={handleStepChange} />

      <PlanSummary steps={steps} />

      <AdvancedHandlerEditor
        handlerCode={handlerCode}
        handlerDescription={handlerDescription}
        handlerMessages={handlerMessages}
        onHandlerCodeChange={onHandlerCodeChange}
        onHandlerDescriptionChange={onHandlerDescriptionChange}
        onHandlerMessagesChange={onHandlerMessagesChange}
      />
    </div>
  );
}
function ImportsSummary({ imports }: ImportsSummaryProps): JSX.Element {
  const hasImports = imports.length > 0;

  return (
    <section class='rounded-lg border border-neutral-800 bg-neutral-950 text-sm text-neutral-200'>
      <details open class='flex flex-col'>
        <summary class='flex cursor-pointer items-center justify-between gap-3 px-4 py-3'>
          <div class='space-y-1'>
            <h3 class='text-sm font-semibold text-neutral-100'>
              Handler imports
            </h3>
            <p class='text-xs text-neutral-400'>
              Review the module scope provided to the handler. Manage shared imports on the Imports
              tab.
            </p>
          </div>
          <Badge intentType={hasImports ? IntentTypes.Secondary : IntentTypes.Info}>
            {hasImports
              ? `${imports.length} ${imports.length === 1 ? 'import' : 'imports'}`
              : 'None configured'}
          </Badge>
        </summary>

        <div class='flex flex-col gap-2 border-t border-neutral-800 p-4'>
          {hasImports
            ? (
              <ul class='max-h-48 space-y-1 overflow-y-auto pr-1 text-[13px]'>
                {imports.map((line, index) => (
                  <li
                    key={`${index}-${line}`}
                    class='truncate rounded border border-neutral-800 bg-neutral-900/70 px-2 py-1 font-mono text-xs'
                  >
                    {line}
                  </li>
                ))}
              </ul>
            )
            : (
              <p class='text-xs text-neutral-500'>
                No additional imports configured yet. Generated handlers can still call connected
                actions directly.
              </p>
            )}
        </div>
      </details>
    </section>
  );
}

function PlanSummary({ steps }: PlanSummaryProps): JSX.Element {
  const hasSteps = steps.length > 0;

  return (
    <section class='rounded-lg border border-neutral-800 bg-neutral-950 text-sm text-neutral-200'>
      <details open class='flex flex-col'>
        <summary class='flex cursor-pointer items-center justify-between gap-3 px-4 py-3'>
          <div class='space-y-1'>
            <h3 class='text-sm font-semibold text-neutral-100'>
              Configured handler actions
            </h3>
            <p class='text-xs text-neutral-400'>
              Documentation snapshot of the actions currently available to the handler plan.
            </p>
          </div>
          <Badge intentType={hasSteps ? IntentTypes.Primary : IntentTypes.Secondary}>
            {hasSteps ? `${steps.length} configured` : 'None configured'}
          </Badge>
        </summary>

        <div class='flex flex-col gap-3 border-t border-neutral-800 p-4'>
          {hasSteps
            ? (
              <ul class='space-y-3'>
                {steps.map((step, index) => {
                  const trimmedNotes = step.notes.trim();
                  return (
                    <li
                      key={step.id}
                      class='space-y-3 rounded border border-neutral-800 bg-neutral-900/60 p-3 text-xs text-neutral-300'
                    >
                      <header class='flex flex-wrap items-baseline justify-between gap-2'>
                        <div class='space-y-1'>
                          <p class='text-sm font-semibold text-neutral-100'>
                            {index + 1}. {step.sliceLabel} → {step.actionLabel}
                          </p>
                          <p class='font-mono text-[11px] text-neutral-500'>
                            slice: {step.sliceKey} • action: {step.actionKey}
                          </p>
                        </div>
                        <div class='flex flex-wrap items-center gap-2'>
                          <Badge
                            intentType={step.autoExecute
                              ? IntentTypes.Primary
                              : IntentTypes.Secondary}
                          >
                            {step.autoExecute ? 'Auto during load' : 'Manual trigger'}
                          </Badge>
                          {step.includeInResponse && (
                            <Badge intentType={IntentTypes.Secondary}>
                              Maps to `{step.resultName || 'result'}`
                            </Badge>
                          )}
                        </div>
                      </header>

                      <dl class='grid gap-2 text-[11px] md:grid-cols-2'>
                        <div>
                          <dt class='uppercase tracking-wide text-neutral-500'>
                            Invocation type
                          </dt>
                          <dd class='text-neutral-200'>
                            {step.invocationType ?? 'default'}
                          </dd>
                        </div>
                        <div>
                          <dt class='uppercase tracking-wide text-neutral-500'>
                            Result key
                          </dt>
                          <dd class='text-neutral-200'>
                            {step.includeInResponse && step.resultName.trim().length > 0
                              ? step.resultName
                              : 'Not mapped to response'}
                          </dd>
                        </div>
                        <div class='md:col-span-2'>
                          <dt class='uppercase tracking-wide text-neutral-500'>
                            Input expression
                          </dt>
                          <dd class='font-mono text-[11px] text-neutral-200'>
                            {step.inputExpression.trim() || 'undefined'}
                          </dd>
                        </div>
                      </dl>

                      {trimmedNotes.length > 0 && (
                        <div class='rounded border border-neutral-800 bg-neutral-950/70 p-3 text-[11px] text-neutral-200'>
                          {trimmedNotes.split(/\r?\n/).map((line, noteIndex) => (
                            <p key={`${step.id}-note-${noteIndex}`} class='leading-relaxed'>
                              {line}
                            </p>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )
            : (
              <div class='rounded border border-dashed border-neutral-800 bg-neutral-900/40 p-4 text-xs text-neutral-500'>
                No handler-capable actions are configured. Enable server execution from the Page
                Data tab to document them here.
              </div>
            )}
        </div>
      </details>
    </section>
  );
}

function HandlerPlanner({
  steps,
  onStepChange,
}: HandlerPlannerProps): JSX.Element {
  return (
    <section class='rounded-lg border border-neutral-800 bg-neutral-950 text-sm text-neutral-200'>
      <details open class='flex flex-col'>
        <summary class='flex cursor-pointer items-start justify-between gap-3 px-4 py-3'>
          <div>
            <h3 class='text-sm font-semibold text-neutral-100'>Handler flow</h3>
            <p class='text-xs text-neutral-400'>
              Adjust the orchestration order, runtime inputs, and response mapping for each
              server-capable action.
            </p>
          </div>
          <Badge intentType={IntentTypes.Secondary}>
            {steps.length} {steps.length === 1 ? 'step' : 'steps'}
          </Badge>
        </summary>

        <div class='flex flex-col gap-3 border-t border-neutral-800 p-4'>
          {steps.length === 0
            ? (
              <div class='rounded border border-dashed border-neutral-800 bg-neutral-950/70 p-4 text-xs text-neutral-500'>
                No handler-capable actions detected. Enable handler access from Page Data to
                orchestrate backend logic.
              </div>
            )
            : (
              steps.map((step, index) => (
                <HandlerStepCard
                  key={step.id}
                  step={step}
                  stepIndex={index}
                  onChange={(updater) => onStepChange(step.id, updater)}
                />
              ))
            )}

          <p class='text-[11px] text-neutral-500'>
            Preview the generated handler source and export-ready modules on the Code tab.
          </p>
        </div>
      </details>
    </section>
  );
}

function HandlerStepCard({
  step,
  stepIndex,
  onChange,
}: HandlerStepCardProps): JSX.Element {
  return (
    <div class='space-y-3 rounded border border-neutral-800 bg-neutral-950/80 p-3'>
      <div class='flex flex-wrap items-center justify-between gap-2'>
        <div>
          <p class='text-sm font-semibold text-neutral-100'>
            Step {stepIndex + 1}: {step.actionLabel}
          </p>
          <p class='text-xs text-neutral-400'>
            Slice: {step.sliceLabel}
            {step.invocationType ? ` � ${step.invocationType}` : ''}
          </p>
        </div>
      </div>

      <div class='grid gap-3 md:grid-cols-2'>
        <Input
          label='Result key'
          value={step.resultName}
          placeholder='resultKey'
          onInput={(event: JSX.TargetedEvent<HTMLInputElement, Event>) =>
            onChange((s) => ({ ...s, resultName: event.currentTarget.value }))}
        />
        <Input
          label='Input payload (JS expression)'
          value={step.inputExpression}
          placeholder='undefined'
          onInput={(event: JSX.TargetedEvent<HTMLInputElement, Event>) =>
            onChange((s) => ({
              ...s,
              inputExpression: event.currentTarget.value,
            }))}
        />
      </div>

      <div class='flex flex-wrap gap-4 text-xs justify-end text-neutral-200'>
        <label class='flex items-center gap-2'>
          <ToggleCheckbox
            checked={step.autoExecute}
            onToggle={(checked) => onChange((s) => ({ ...s, autoExecute: checked }))}
            title='Toggle auto execution'
            checkedIntentType={IntentTypes.Primary}
            uncheckedIntentType={IntentTypes.Secondary}
          />
          Run during <span class='font-mono text-neutral-100'>loadPageData</span>
        </label>
        <label class='flex items-center gap-2'>
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

      <textarea
        class='h-20 w-full resize-none rounded border border-neutral-800 bg-neutral-950 p-2 text-xs text-neutral-300 outline-none focus:border-teal-400'
        placeholder='Optional notes for collaborators or follow-up tasks.'
        value={step.notes}
        onInput={(event: JSX.TargetedEvent<HTMLTextAreaElement, Event>) =>
          onChange((s) => ({ ...s, notes: event.currentTarget.value }))}
      />
    </div>
  );
}

function AdvancedHandlerEditor({
  handlerCode,
  handlerDescription,
  handlerMessages,
  onHandlerCodeChange,
  onHandlerDescriptionChange,
  onHandlerMessagesChange,
}: AdvancedHandlerEditorProps): JSX.Element {
  const [localCode, setLocalCode] = useState(handlerCode);

  useEffect(() => {
    debug('sync local code from props', {
      length: handlerCode.length,
      snippet: handlerCode.slice(0, 80),
    });
    setLocalCode(handlerCode);
  }, [handlerCode]);

  useEffect(() => {
    if (localCode === handlerCode) return;
    const handle = setTimeout(() => onHandlerCodeChange(localCode), 150);
    debug('debounced handler code dispatch scheduled', {
      length: localCode.length,
    });
    return () => clearTimeout(handle);
  }, [localCode, handlerCode, onHandlerCodeChange]);

  const handleCodeChange = useCallback((value: string) => {
    debug('CodeMirror content change', {
      length: value.length,
    });
    setLocalCode((current) => (current === value ? current : value));
  }, []);

  const flushLocalCode = useCallback(() => {
    if (localCode !== handlerCode) {
      debug('flushing local code buffer');
      onHandlerCodeChange(localCode);
    }
  }, [localCode, handlerCode, onHandlerCodeChange]);

  const handleDescriptionChange = useCallback(
    (value: string) => {
      if (value !== handlerDescription) {
        onHandlerDescriptionChange(value);
      }
    },
    [handlerDescription, onHandlerDescriptionChange],
  );

  const handleMessagesChange = useCallback(
    (value: string) => {
      if (value !== handlerMessages) {
        onHandlerMessagesChange(value);
      }
    },
    [handlerMessages, onHandlerMessagesChange],
  );

  return (
    <section class='rounded-lg border border-neutral-800 bg-neutral-950 text-sm text-neutral-200'>
      <details open class='flex flex-col'>
        <summary class='cursor-pointer px-4 py-3 text-sm font-semibold text-neutral-100'>
          Advanced handler source
        </summary>
        <div class='flex flex-col gap-3 border-t border-neutral-800 p-4'>
          {IS_BROWSER
            ? (
              <CodeMirrorEditor
                fileContent={localCode}
                // onContentChange={handleCodeChange}
                placeholder='export async function loadPageData(...) { ... }'
                class='flex-1 min-h-[320px] [&>.cm-editor]:rounded [&>.cm-editor]:border [&>.cm-editor]:border-neutral-800 [&>.cm-editor]:bg-neutral-950'
                onBlur={flushLocalCode}
              />
            )
            : (
              <div class='rounded border border-dashed border-neutral-800 bg-neutral-900/40 p-3 text-xs text-neutral-500'>
                Code editor available in browser runtime only.
              </div>
            )}
          <textarea
            class='h-16 w-full resize-none rounded border border-neutral-700 bg-neutral-950 p-2 text-sm text-neutral-200 outline-none focus:border-teal-400'
            placeholder='Optional description for this code block'
            value={handlerDescription}
            onInput={(event: JSX.TargetedEvent<HTMLTextAreaElement, Event>) =>
              handleDescriptionChange(event.currentTarget.value)}
          />
          <textarea
            class='h-24 w-full resize-none rounded border border-neutral-800 bg-neutral-950 p-2 text-xs text-neutral-300 outline-none focus:border-teal-400'
            placeholder='Guidance messages (one per line) to share with AI collaborators'
            value={handlerMessages}
            onInput={(event: JSX.TargetedEvent<HTMLTextAreaElement, Event>) =>
              handleMessagesChange(event.currentTarget.value)}
          />
        </div>
      </details>
    </section>
  );
}
function buildBasePlanFromSlices(
  generatedSlices: Array<[string, EaCInterfaceGeneratedDataSlice]>,
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
  currentPlan: SurfaceInterfaceHandlerPlanStep[],
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
  second: SurfaceInterfaceHandlerPlanStep[],
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

export function generateHandlerStub(
  steps: SurfaceInterfaceHandlerPlanStep[],
): string {
  const executableSteps = steps.filter((step) => step.autoExecute);

  const lines: string[] = [
    'export async function loadPageData(',
    '  req: Request,',
    '  ctx: Record<string, unknown>,',
    '): Promise<Record<string, unknown>> {',
    '  const data: Record<string, unknown> = {};',
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
      '',
    );
  } else {
    lines.push(
      '',
      '  // Define handler steps with the planner or author your own logic below.',
      '',
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
        `  const ${tempVar} = await callAction(${
          JSON.stringify(
            step.sliceKey,
          )
        }, ${JSON.stringify(step.actionKey)}, ${inputExpression});`,
      );

      if (step.includeInResponse && step.resultName.trim().length > 0) {
        lines.push(
          `  data[${
            JSON.stringify(
              step.resultName.trim(),
            )
          }] = ${tempVar} ?? null;`,
        );
      }
    } else {
      lines.push(
        `  // Available helper: callAction(${
          JSON.stringify(
            step.sliceKey,
          )
        }, ${JSON.stringify(step.actionKey)}, input)`,
      );
    }

    lines.push('');
  });

  lines.push('  return data;', '}', '');

  return lines.join('\n');
}

export function buildGeneratedDescription(
  steps: SurfaceInterfaceHandlerPlanStep[],
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
  steps: SurfaceInterfaceHandlerPlanStep[],
): string {
  if (steps.length === 0) return '';
  const messages = steps.map((step, index) => {
    const prefix = `Step ${index + 1}: ${step.sliceLabel} -> ${step.actionLabel}`;
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

const isDebugEnabled = typeof globalThis !== 'undefined' &&
  (
    (globalThis as { __OI_DEBUG__?: boolean }).__OI_DEBUG__ === true ||
    ((globalThis as { location?: { hostname?: string } }).location?.hostname ??
        '') === 'localhost'
  );

function debug(...args: unknown[]): void {
  if (!isDebugEnabled || typeof console?.debug !== 'function') return;
  console.debug('[SurfaceInterfaceHandlerTab]', ...args);
}
