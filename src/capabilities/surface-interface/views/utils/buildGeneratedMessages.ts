import type { SurfaceInterfaceHandlerPlanStep } from '../state/SurfaceInterfaceHandlerPlanStep.ts';

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
