import type {
  EaCInterfaceDataConnectionFeatures,
  EaCInterfaceGeneratedDataSlice,
} from '../../../../.deps.ts';
import type { JSONSchema7 } from 'npm:jsonschema7@0.8.0';
import type { SurfaceInterfaceHandlerPlanStep } from './SurfaceInterfaceHandlerPlanStep.ts';
import type {
  SurfaceInterfaceModalPageActionDoc,
  SurfaceInterfaceModalPageDocs,
  SurfaceInterfaceModalPageHandlerResultDoc,
  SurfaceInterfaceModalPageHandlerStepDoc,
  SurfaceInterfaceModalPageServiceDoc,
  SurfaceInterfaceModalPageSliceDoc,
  SurfaceInterfaceModalPageSliceFieldDoc,
  SurfaceInterfaceModalPageStatusFieldDoc,
} from './SurfaceInterfaceModalPageDocs.ts';
import { resolveActionSurfaceSupport } from '../SurfaceInterfaceDataTab.tsx';

export type BuildSurfaceInterfaceModalPageDocsOptions = {
  generatedSlices: Array<[string, EaCInterfaceGeneratedDataSlice]>;
  handlerPlan: SurfaceInterfaceHandlerPlanStep[];
};

export function buildSurfaceInterfaceModalPageDocs(
  options: BuildSurfaceInterfaceModalPageDocsOptions,
): SurfaceInterfaceModalPageDocs {
  const sliceEntries = options.generatedSlices;
  const handlerPlan = options.handlerPlan;
  const sliceMap = new Map<string, EaCInterfaceGeneratedDataSlice>(sliceEntries);

  const slices = sliceEntries.map(([key, slice]) => buildSliceDoc(key, slice, handlerPlan));
  const services = buildServiceDocs(handlerPlan, sliceMap);
  const handlerResults = handlerPlan
    .filter((step) => step.includeInResponse)
    .map((step) => buildHandlerResultDoc(step, sliceMap, services));

  const statusFields: SurfaceInterfaceModalPageStatusFieldDoc[] = [
    { key: 'isLoading', description: 'True while the client refresh promise is pending.' },
    { key: 'error', description: 'Contains the most recent refresh error message, if present.' },
  ];

  return {
    dataSlices: slices,
    handlerResults,
    services,
    statusFields,
    refreshDescription: 'Calls the client loader (if defined) and merges the result into data.*.',
  };
}

function buildSliceDoc(
  key: string,
  slice: EaCInterfaceGeneratedDataSlice,
  handlerPlan: SurfaceInterfaceHandlerPlanStep[],
): SurfaceInterfaceModalPageSliceDoc {
  const actions = (slice.Actions ?? []).map((action) => {
    const actionKey = `${key}::${action.Key}`;
    const support = resolveActionSurfaceSupport(action);
    const steps = handlerPlan
      .filter((step) => `${step.sliceKey}::${step.actionKey}` === actionKey)
      .map((step) => buildHandlerStepDoc(step));

    const actionDoc: SurfaceInterfaceModalPageActionDoc = {
      key: action.Key,
      label: action.Label ?? action.Key,
      description: action.Description,
      invocationMode: action.Invocation?.Mode ?? null,
      invocationType: action.Invocation?.Type,
      support,
      handlerSteps: steps,
    };

    return actionDoc;
  });

  return {
    key,
    label: slice.Label ?? key,
    description: slice.Description,
    accessMode: slice.AccessMode,
    hydration: {
      server: Boolean(slice.Hydration?.Server),
      client: Boolean(slice.Hydration?.Client),
      clientRefreshMs: slice.Hydration?.ClientRefreshMs,
    },
    dataConnectionSummary: summarizeDataConnection(slice.DataConnection),
    schemaFields: summarizeSchema(slice.Schema),
    actions,
  };
}

function buildHandlerStepDoc(
  step: SurfaceInterfaceHandlerPlanStep,
): SurfaceInterfaceModalPageHandlerStepDoc {
  return {
    id: step.id,
    resultName: step.resultName,
    autoExecute: step.autoExecute,
    includeInResponse: step.includeInResponse,
    notes: step.notes?.trim() ? step.notes.trim() : undefined,
    serviceMethods: [],
  };
}

function buildHandlerResultDoc(
  step: SurfaceInterfaceHandlerPlanStep,
  sliceMap: Map<string, EaCInterfaceGeneratedDataSlice>,
  services: SurfaceInterfaceModalPageServiceDoc[],
): SurfaceInterfaceModalPageHandlerResultDoc {
  const slice = sliceMap.get(step.sliceKey);
  const action = slice?.Actions?.find((candidate) => candidate.Key === step.actionKey);
  const serviceNames = services
    .filter((service) => service.sliceKey === step.sliceKey && service.actionKey === step.actionKey)
    .map((service) => service.methodName);

  return {
    resultName: step.resultName,
    sliceKey: step.sliceKey,
    sliceLabel: slice?.Label,
    actionKey: step.actionKey,
    actionLabel: action?.Label ?? step.actionLabel ?? step.actionKey,
    autoExecute: step.autoExecute,
    includeInResponse: step.includeInResponse,
    invocationType: step.invocationType,
    notes: step.notes?.trim() ? step.notes.trim() : undefined,
    serviceMethods: serviceNames,
  };
}

function buildServiceDocs(
  handlerPlan: SurfaceInterfaceHandlerPlanStep[],
  sliceMap: Map<string, EaCInterfaceGeneratedDataSlice>,
): SurfaceInterfaceModalPageServiceDoc[] {
  return handlerPlan.map((step) => {
    const slice = sliceMap.get(step.sliceKey);
    const action = slice?.Actions?.find((candidate) => candidate.Key === step.actionKey);

    return {
      methodName: toCamel(
        step.actionLabel ?? action?.Label ?? step.resultName ?? step.actionKey ?? 'invokeAction',
      ),
      sliceKey: step.sliceKey,
      sliceLabel: slice?.Label,
      actionKey: step.actionKey,
      actionLabel: action?.Label ?? step.actionLabel ?? step.actionKey,
      invocationType: step.invocationType ?? action?.Invocation?.Type,
      hasInput: action?.Input !== undefined,
      inputType: describeSchemaType(action?.Input, 'Record<string, unknown>'),
      outputType: describeSchemaType(action?.Output, 'unknown'),
      autoExecute: step.autoExecute,
      includeInResponse: step.includeInResponse,
      resultName: step.resultName,
      notes: buildServiceNotes(slice, action, step),
    };
  });
}

function buildServiceNotes(
  slice: EaCInterfaceGeneratedDataSlice | undefined,
  action: EaCInterfaceGeneratedDataSlice['Actions'][number] | undefined,
  step: SurfaceInterfaceHandlerPlanStep,
): string[] {
  const notes: string[] = [];
  if (slice?.Label) notes.push(`Slice: ${slice.Label}`);
  if (action?.Description) notes.push(action.Description);
  if (step.notes) notes.push(step.notes);
  return notes;
}

function summarizeSchema(schema: unknown): SurfaceInterfaceModalPageSliceFieldDoc[] {
  if (!schema || typeof schema === 'boolean') return [];
  const objectSchema = schema as JSONSchema7;
  if (!objectSchema.properties || typeof objectSchema.properties !== 'object') return [];

  const requiredSet = new Set<string>(
    Array.isArray(objectSchema.required) ? objectSchema.required.map((value) => String(value)) : [],
  );

  return Object.entries(objectSchema.properties).map(([name, definition]) => {
    if (typeof definition === 'boolean') {
      return {
        name,
        type: definition ? 'unknown' : 'never',
        required: requiredSet.has(name),
      };
    }

    const value = definition as JSONSchema7;
    return {
      name,
      type: describeSchemaType(value, 'unknown'),
      required: requiredSet.has(name),
      description: value.description,
    };
  });
}

function summarizeDataConnection(
  features: EaCInterfaceDataConnectionFeatures | undefined,
): string[] {
  if (!features) return [];
  const summary: string[] = [];

  if (features.AllowHistoricDownload) {
    const formats = features.HistoricDownloadFormats ?? [];
    summary.push(
      formats.length > 0
        ? `Historic download enabled (${formats.join(', ')}).`
        : 'Historic download enabled.',
    );
  }

  const prefetch = features.PrefetchHistoricSlice;
  if (prefetch) {
    if (prefetch.Mode === 'relative' && prefetch.Range) {
      summary.push(
        `Prefetch ${prefetch.Range.Amount} ${prefetch.Range.Unit}${
          prefetch.Range.Amount === 1 ? '' : 's'
        } of historic data (${prefetch.Format ?? 'json'}).`,
      );
    } else if (prefetch.Mode === 'absolute' && prefetch.AbsoluteRange) {
      const endText = prefetch.AbsoluteRange.End ? ` to ${prefetch.AbsoluteRange.End}` : '';
      summary.push(
        `Prefetch historic window starting ${prefetch.AbsoluteRange.Start}${endText} (${
          prefetch.Format ?? 'json'
        }).`,
      );
    } else {
      summary.push(`Prefetch historic slice (${prefetch.Format ?? 'json'}).`);
    }
  }

  return summary;
}

function describeSchemaType(schema: unknown, fallback: string): string {
  if (!schema) return fallback;
  if (typeof schema === 'boolean') return schema ? 'unknown' : 'never';
  const value = schema as JSONSchema7;

  if (typeof value.title === 'string' && value.title.trim().length > 0) return value.title.trim();
  if (typeof value.type === 'string') return value.type;
  if (Array.isArray(value.type) && value.type.length > 0) return value.type.join(' | ');
  if (value.enum && value.enum.length > 0) return 'enum';
  if (value.const !== undefined) return 'const';
  if (value.properties) return 'object';
  if (value.items) return 'array';
  if (value.format) return value.format;
  return fallback;
}

function toCamel(value: string | undefined): string {
  if (!value) return 'invokeAction';
  const parts = value
    .split(/[^A-Za-z0-9]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.toLowerCase());
  if (parts.length === 0) return 'invokeAction';
  return parts
    .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}
