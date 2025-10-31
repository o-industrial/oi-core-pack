import type { SurfaceInterfaceHandlerPlanStep } from '../state/SurfaceInterfaceHandlerPlanStep.ts';

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
          JSON.stringify(step.sliceKey)
        }, ${JSON.stringify(step.actionKey)}, ${inputExpression});`,
      );

      if (step.includeInResponse && step.resultName.trim().length > 0) {
        lines.push(
          `  data[${
            JSON.stringify(step.resultName.trim())
          }] = ${tempVar} ?? null;`,
        );
      }
    } else {
      lines.push(
        `  // Available helper: callAction(${
          JSON.stringify(step.sliceKey)
        }, ${JSON.stringify(step.actionKey)}, input)`,
      );
    }

    lines.push('');
  });

  lines.push('  return data;', '}', '');

  return lines.join('\n');
}
