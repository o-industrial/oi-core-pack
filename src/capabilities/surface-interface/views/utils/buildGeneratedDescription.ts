import type { SurfaceInterfaceHandlerPlanStep } from '../state/SurfaceInterfaceHandlerPlanStep.ts';

export function buildGeneratedDescription(
  steps: SurfaceInterfaceHandlerPlanStep[],
): string {
  if (steps.length === 0) {
    return 'Author server-side logic that composes interface actions and returns interface data.';
  }

  const actionable = steps.filter((step) => step.autoExecute);
  const manual = steps.length - actionable.length;

  const parts = [`Orchestrates ${actionable.length} action(s)`];

  if (manual > 0) {
    parts.push(`exposes ${manual} helper(s) for custom triggers`);
  }

  return `${parts.join(' and ')} to hydrate interface data.`;
}
