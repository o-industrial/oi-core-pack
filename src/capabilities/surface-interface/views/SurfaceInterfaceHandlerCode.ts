import type { EaCInterfaceGeneratedDataSlice } from '../../../.deps.ts';
import { resolveActionSurfaceSupport } from './SurfaceInterfacePageDataTab.tsx';

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

export const HANDLER_PREFIX = `export async function loadPageData(
  request: Request,
  context: Record<string, unknown>,
  services: InterfaceServices,
  seed: InterfacePageData,
): Promise<InterfacePageData> {
`;

export const HANDLER_SUFFIX = `}
`;

export const DEFAULT_HANDLER_BODY = `return seed;`;

export function composeHandlerCode(body: string): string {
  if (!body.trim().length) return '';
  return `${HANDLER_PREFIX}${body}${HANDLER_SUFFIX}`;
}

export function extractHandlerBody(code: string): string {
  const source = code ?? '';
  if (!source.trim().length) return '';
  const openIndex = source.indexOf('{');
  const closeIndex = source.lastIndexOf('}');
  if (openIndex === -1 || closeIndex === -1 || closeIndex <= openIndex) {
    return source;
  }
  return source.slice(openIndex + 1, closeIndex);
}

export function buildBasePlanFromSlices(
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
      const support = resolveActionSurfaceSupport(action);
      if (!support.handler) continue;
      const invocationMode = action.Invocation?.Mode;
      if (!invocationMode || invocationMode === 'client') continue;

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

export function reconcileHandlerPlan(
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

export function arePlansEqual(
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

type HandlerStubOptions = {
  returnType?: string;
};

export function generateHandlerStub(
  steps: SurfaceInterfaceHandlerPlanStep[],
  options: HandlerStubOptions = {},
): string {
  const returnType = options.returnType ?? 'Record<string, unknown>';
  const executableSteps = steps.filter((step) => step.autoExecute);

  const lines: string[] = [
    '/**',
    ' * loadPageData orchestrates interface actions on the server.',
    ' * Keep the export name stable so dynamic loaders can locate it.',
    ' */',
    'export async function loadPageData(',
    '  request: Request,',
    '  context: Record<string, unknown>,',
    '  services: InterfaceServices,',
    `  seed: ${returnType},`,
    `): Promise<${returnType}> {`,
    `  const data: ${returnType} = { ...seed };`,
  ];

  if (executableSteps.length > 0) {
    lines.push(
      '',
      '  const callAction = async (slice: string, action: string, input?: unknown) => {',
      '    const containers = (context as Record<string, unknown>)?.actions ??',
      '      (context as Record<string, unknown>)?.Actions ?? {};',
      '    const handler = (containers as Record<string, Record<string, unknown>>)[slice]?.[action];',
      "    if (typeof handler === 'function') {",
      '      return await (handler as (options: { request: Request; context: Record<string, unknown>; input?: unknown }) => Promise<unknown> | unknown)({',
      '        request,',
      '        context,',
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
