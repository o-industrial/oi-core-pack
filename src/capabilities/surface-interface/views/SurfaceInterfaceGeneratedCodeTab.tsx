import {
  Action,
  ActionStyleTypes,
  type EaCInterfaceGeneratedDataSlice,
  IntentTypes,
  type JSONSchema7,
  type JSX,
  useMemo,
} from '../../../.deps.ts';
import { SurfaceCodeMirror } from '../../../components/code/SurfaceCodeMirror.tsx';
import { type SurfaceInterfaceHandlerPlanStep } from './SurfaceInterfaceHandlerTab.tsx';

type SurfaceInterfaceGeneratedCodeTabProps = {
  interfaceLookup: string;
  imports: string[];
  handlerPlan: SurfaceInterfaceHandlerPlanStep[];
  generatedSlices: Array<[string, EaCInterfaceGeneratedDataSlice]>;
  handlerCode: string;
  handlerDescription: string;
  handlerMessages: string;
  pageCode: string;
  pageDescription: string;
  pageMessages: string;
};

export function SurfaceInterfaceGeneratedCodeTab({
  interfaceLookup,
  imports,
  handlerPlan,
  generatedSlices,
  handlerCode,
  handlerDescription,
  handlerMessages,
  pageCode,
  pageDescription,
  pageMessages,
}: SurfaceInterfaceGeneratedCodeTabProps): JSX.Element {
  const generatedModule = useMemo(
    () =>
      buildGeneratedModulePreview(
        interfaceLookup,
        imports,
        handlerPlan,
        generatedSlices,
        handlerCode,
        handlerDescription,
        handlerMessages,
        pageCode,
        pageDescription,
        pageMessages,
      ),
    [
      handlerCode,
      handlerDescription,
      handlerMessages,
      handlerPlan,
      imports,
      generatedSlices,
      interfaceLookup,
      pageCode,
      pageDescription,
      pageMessages,
    ],
  );

  return (
    <div class='flex h-full min-h-0 flex-col gap-3'>
      <header class='flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3'>
        <div class='space-y-1'>
          <h3 class='text-sm font-semibold text-neutral-100'>Generated interface files preview</h3>
          <p class='text-xs text-neutral-400'>
            Snapshot of the virtual DFS emitted by the InterfaceApp processor. Each section mirrors a
            file that the runtime can load dynamically.
          </p>
        </div>
        <Action
          styleType={ActionStyleTypes.Outline | ActionStyleTypes.Rounded}
          intentType={IntentTypes.Secondary}
          onClick={() => copyToClipboard(generatedModule)}
        >
          Copy snapshot
        </Action>
      </header>

      <div class='flex-1 min-h-0 overflow-auto rounded border border-neutral-800 bg-neutral-950'>
        <SurfaceCodeMirror
          value={generatedModule}
          readOnly
          class='h-full [&_.cm-editor]:h-full [&_.cm-editor]:rounded [&_.cm-editor]:border-none [&_.cm-editor]:bg-transparent'
        />
      </div>
    </div>
  );
}

function buildGeneratedModulePreview(
  interfaceLookup: string,
  imports: string[],
  handlerPlan: SurfaceInterfaceHandlerPlanStep[],
  generatedSlices: Array<[string, EaCInterfaceGeneratedDataSlice]>,
  handlerCode: string,
  handlerDescription: string,
  handlerMessages: string,
  pageCode: string,
  pageDescription: string,
  pageMessages: string,
): string {
  const lookup = interfaceLookup?.trim() || 'sample-interface';
  const safeId = toPascalCase(lookup);

  const files = buildInterfaceFiles({
    lookup,
    safeId,
    imports,
    handlerPlan,
    generatedSlices,
    handlerCode,
    handlerDescription,
    handlerMessages,
    pageCode,
    pageDescription,
    pageMessages,
  });

  return Array.from(files.entries())
    .map(([path, contents]) => {
      const trimmed = contents.trimEnd();
      return `// File: ${path}\n${trimmed}\n`;
    })
    .join('\n');
}

type BuildInterfaceFilesOptions = {
  lookup: string;
  safeId: string;
  imports: string[];
  handlerPlan: SurfaceInterfaceHandlerPlanStep[];
  generatedSlices: Array<[string, EaCInterfaceGeneratedDataSlice]>;
  handlerCode: string;
  handlerDescription: string;
  handlerMessages: string;
  pageCode: string;
  pageDescription: string;
  pageMessages: string;
};

function buildInterfaceFiles(options: BuildInterfaceFilesOptions): Map<string, string> {
  const {
    lookup,
    safeId,
    imports,
    handlerPlan,
    generatedSlices,
    handlerCode,
    handlerDescription,
    handlerMessages,
    pageCode,
    pageDescription,
    pageMessages,
  } = options;

  const files = new Map<string, string>();
  const sliceMap = new Map<string, EaCInterfaceGeneratedDataSlice>(generatedSlices);

  const dataProps = collectDataProps(handlerPlan, sliceMap);
  const serviceDefs = collectServiceDefinitions(handlerPlan, sliceMap);

  const typesFile = buildTypesFile(safeId, dataProps);
  files.set(`interfaces/${lookup}/types.ts`, typesFile);

  const servicesFile = buildServicesFile(lookup, serviceDefs);
  files.set(`interfaces/${lookup}/services.ts`, servicesFile);

  const moduleFile = buildModuleFile({
    lookup,
    safeId,
    imports,
    pageCode,
    pageDescription,
    pageMessages,
    dataProps,
  });
  files.set(`interfaces/${lookup}/module.tsx`, moduleFile);

  const wrapperFile = buildWrapperFile(lookup);
  files.set(`interfaces/${lookup}/index.tsx`, wrapperFile);

  const handlerFile = buildHandlerFile({
    lookup,
    handlerPlan,
    handlerCode,
    handlerDescription,
    handlerMessages,
  });
  files.set(`interfaces/${lookup}/handler.ts`, handlerFile);

  const registry = buildRegistryFile([{ lookup, safeId }]);
  files.set('interfaces/registry.ts', registry);

  const routePath = buildRoutePath({
    RoutesBase: 'w/:workspace/ui',
  });
  const routeFile = buildRouteFile({
    RoutesBase: 'w/:workspace/ui',
  });
  files.set(routePath, routeFile);

  return files;
}

function buildTypesFile(safeId: string, props: DataProp[]): string {
  const lines: string[] = [
    '/**',
    ` * Strongly-typed page data contract for the ${safeId} interface.`,
    ' * Update via the planner or by editing interface Page Data settings.',
    ' */',
    'export type InterfacePageData = {',
  ];

  props.forEach((prop) => {
    lines.push(...formatDocComment(prop.docLines, 2));
    const key = formatPropertyKey(prop.name);
    const optional = prop.optional ? '?' : '';
    const typeParts = prop.type.trim().split('\n');
    if (typeParts.length === 1) {
      lines.push(`  ${key}${optional}: ${typeParts[0]};`);
    } else {
      lines.push(`  ${key}${optional}: ${typeParts[0]}`);
      typeParts.slice(1).forEach((line, index) => {
        const isLast = index === typeParts.length - 2;
        lines.push(`    ${line}${isLast ? ';' : ''}`);
      });
      if (typeParts.length === 2) {
        lines[lines.length - 1] = `${lines[lines.length - 1]};`;
      }
    }
  });

  lines.push('};', '');
  lines.push('/** Defaults merged into loader results before rendering. */');
  lines.push('export const defaultInterfacePageData: InterfacePageData = {');
  props.forEach((prop) => {
    const key = formatObjectProperty(prop.name);
    const valueParts = prop.defaultValue.trim().split('\n');
    if (valueParts.length === 1) {
      lines.push(`  ${key}: ${valueParts[0]},`);
    } else {
      lines.push(`  ${key}: ${valueParts[0]}`);
      valueParts.slice(1).forEach((line, index) => {
        const isLast = index === valueParts.length - 2;
        lines.push(`    ${line}${isLast ? ',' : ''}`);
      });
      if (valueParts.length === 2) {
        lines[lines.length - 1] = `${lines[lines.length - 1]},`;
      }
    }
  });
  lines.push('};');

  return `${lines.join('\n')}\n`;
}

function buildServicesFile(lookup: string, services: ServiceDefinition[]): string {
  const lines: string[] = [
    'import type { InterfacePageData } from "./types.ts";',
    '',
    'export type InterfaceServiceDescriptor<TResult, TInput = void> = {',
    '  sliceKey: string;',
    '  actionKey: string;',
    '  resultName: string;',
    '  autoExecute: boolean;',
    '  includeInResponse: boolean;',
    '};',
    '',
    'export type InterfaceServiceInvoke = <TResult, TInput = void>(',
    '  descriptor: InterfaceServiceDescriptor<TResult, TInput>,',
    '  input: TInput,',
    ') => Promise<TResult>;',
    '',
  ];

  services.forEach((service) => {
    lines.push(wrapTypeAlias(`${service.aliasBase}Output`, service.outputType));
    if (service.hasInput) {
      lines.push(wrapTypeAlias(`${service.aliasBase}Input`, service.inputType));
    }
    lines.push('');
  });

  lines.push('export type InterfaceServices = {');
  services.forEach((service) => {
    const params = service.hasInput
      ? `(input: ${service.aliasBase}Input)`
      : '()';
    const doc = service.docLines.length ? formatDocComment(service.docLines, 2) : [];
    lines.push(...doc);
    lines.push(`  ${service.methodName}${params}: Promise<${service.aliasBase}Output>;`);
  });
  lines.push('};', '');

  lines.push('export function createInterfaceServices(invoke: InterfaceServiceInvoke): InterfaceServices {');
  lines.push('  return {');
  services.forEach((service) => {
    const params = service.hasInput
      ? `input: ${service.aliasBase}Input`
      : '';
    const invokeGeneric = service.hasInput
      ? `${service.aliasBase}Output, ${service.aliasBase}Input`
      : `${service.aliasBase}Output, void`;
    lines.push(`    async ${service.methodName}(${params}): Promise<${service.aliasBase}Output> {`);
    lines.push(`      return await invoke<${invokeGeneric}>({`);
    lines.push(`        sliceKey: ${JSON.stringify(service.descriptor.sliceKey)},`);
    lines.push(`        actionKey: ${JSON.stringify(service.descriptor.actionKey)},`);
    lines.push(`        resultName: ${JSON.stringify(service.descriptor.resultName)},`);
    lines.push(`        autoExecute: ${service.descriptor.autoExecute ? 'true' : 'false'},`);
    lines.push(`        includeInResponse: ${service.descriptor.includeInResponse ? 'true' : 'false'},`);
    lines.push(`      }, ${service.hasInput ? 'input' : 'undefined as void'});`);
    lines.push('    },');
  });
  lines.push('  };');
  lines.push('}', '');

  lines.push('export type InterfaceServerContext = {');
  lines.push('  request: Request;');
  lines.push('  params: Record<string, string>;');
  lines.push('  headers: Headers;');
  lines.push('  previous?: Partial<InterfacePageData>;');
  lines.push('  services: InterfaceServices;');
  lines.push('};', '');

  lines.push('export type InterfaceClientContext = {');
  lines.push('  previous?: InterfacePageData;');
  lines.push('  services: InterfaceServices;');
  lines.push('  signal?: AbortSignal;');
  lines.push('};', '');

  lines.push(`// TODO: Wire runtime-specific invocation for interface "${lookup}".`);

  return `${lines.join('\n')}\n`;
}

type BuildModuleFileOptions = {
  lookup: string;
  safeId: string;
  imports: string[];
  pageCode: string;
  pageDescription: string;
  pageMessages: string;
  dataProps: DataProp[];
};

function buildModuleFile(options: BuildModuleFileOptions): string {
  const { lookup, safeId, imports, pageCode, pageDescription, pageMessages, dataProps } = options;

  const importLines = [
    'import type { InterfaceClientContext, InterfaceServerContext, InterfaceServices } from "./services.ts";',
    'import { defaultInterfacePageData, type InterfacePageData } from "./types.ts";',
    ...new Set(imports.map((line) => line.trim()).filter(Boolean)),
  ];

  const guidance = buildGuidanceComment('Interface module guidance', pageDescription, pageMessages);

  const serverLoader = buildServerLoaderStub(safeId, dataProps);
  const clientLoader = buildClientLoaderStub();

  const component = pageCode.trim().length > 0
    ? pageCode.trim()
    : buildDefaultInterfaceComponent(lookup, safeId);

  const lines: string[] = [
    '// deno-lint-ignore-file no-explicit-any',
    importLines.join('\n'),
  ];
  if (guidance.trim().length > 0) {
    lines.push('', guidance);
  }
  lines.push('', serverLoader, '', clientLoader, '', component);
  lines.push('', 'export type InterfacePageProps = {');
  lines.push('  data: InterfacePageData;');
  lines.push('  services: InterfaceServices;');
  lines.push('  status: {');
  lines.push('    isLoading: boolean;');
  lines.push('    error?: string;');
  lines.push('  };');
  lines.push('  refresh: () => Promise<void>;');
  lines.push('};');

  return `${lines.join('\n')}\n`;
}

function buildWrapperFile(lookup: string): string {
  return `import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "preact/hooks";
import InterfaceModule, { loadClientData } from "./module.tsx";
import {
  createInterfaceServices,
  type InterfaceClientContext,
  type InterfaceServiceDescriptor,
} from "./services.ts";
import {
  defaultInterfacePageData,
  type InterfacePageData,
} from "./types.ts";

type InterfaceWrapperProps = {
  data?: InterfacePageData;
  lookup: string;
};

export default function InterfaceWrapper({
  data,
  lookup,
}: InterfaceWrapperProps) {
  const [pageData, setPageData] = useState<InterfacePageData>(
    data ?? defaultInterfacePageData,
  );
  const [status, setStatus] = useState<{ isLoading: boolean; error?: string }>({
    isLoading: false,
    error: undefined,
  });

  const services = useMemo(
    () =>
      createInterfaceServices(
        createClientInvoker(lookup),
      ),
    [lookup],
  );

  const refresh = useCallback(async () => {
    if (typeof loadClientData !== "function") return;

    const controller = new AbortController();
    setStatus({ isLoading: true, error: undefined });

    try {
      const next = await loadClientData({
        previous: pageData,
        services,
        signal: controller.signal,
      } satisfies InterfaceClientContext);

      if (next && typeof next === "object") {
        setPageData((prev) => ({ ...prev, ...next }));
      }

      setStatus((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      setStatus({
        isLoading: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [pageData, services]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <InterfaceModule
      data={pageData}
      services={services}
      status={status}
      refresh={refresh}
    />
  );
}

function createClientInvoker(
  lookup: string,
): InterfaceServiceInvokeShim {
  return async function invoke<TResult, TInput>(
    descriptor: InterfaceServiceDescriptor<TResult, TInput>,
    _input: TInput,
  ): Promise<TResult> {
    console.warn(
      "Client service invocation not yet wired for",
      lookup,
      descriptor,
    );
    throw new Error(
      \`Client invocation not implemented for \${descriptor.sliceKey}/\${descriptor.actionKey}.\`,
    );
  };
}

type InterfaceServiceInvokeShim = <TResult, TInput>(
  descriptor: InterfaceServiceDescriptor<TResult, TInput>,
  input: TInput,
) => Promise<TResult>;
`;
}

type BuildHandlerFileOptions = {
  lookup: string;
  handlerPlan: SurfaceInterfaceHandlerPlanStep[];
  handlerCode: string;
  handlerDescription: string;
  handlerMessages: string;
};

function buildHandlerFile(options: BuildHandlerFileOptions): string {
  const { lookup, handlerCode, handlerDescription, handlerMessages } = options;

  const guidance = buildGuidanceComment('Server handler guidance', handlerDescription, handlerMessages);
  const customCode = handlerCode.trim();

  if (customCode.length > 0) {
    return `${customCode.trimEnd()}\n`;
  }

  return `import type { InterfaceRequestContext } from "../registry.ts";
import type { InterfacePageData } from "./types.ts";
import {
  defaultInterfacePageData,
} from "./types.ts";
import {
  createInterfaceServices,
  type InterfaceServerContext,
  type InterfaceServiceDescriptor,
} from "./services.ts";
import * as Module from "./module.tsx";

${guidance.trim().length > 0 ? `${guidance}\n\n` : ''}export async function loadPageData(
  req: Request,
  ctx: InterfaceRequestContext,
): Promise<InterfacePageData> {
  const invoke = createServerInvoker(ctx);
  const services = createInterfaceServices(invoke);

  if (typeof Module.loadServerData === "function") {
    const result = await Module.loadServerData({
      request: req,
      params: ctx?.Params ?? {},
      headers: req.headers,
      previous: undefined,
      services,
    } satisfies InterfaceServerContext);

    return { ...defaultInterfacePageData, ...result };
  }

  return { ...defaultInterfacePageData };
}

function createServerInvoker(
  ctx: InterfaceRequestContext,
): InterfaceServiceInvokeShim {
  return async function invoke<TResult, TInput>(
    descriptor: InterfaceServiceDescriptor<TResult, TInput>,
    _input: TInput,
  ): Promise<TResult> {
    console.warn(
      "Server service invocation not yet wired for",
      ${JSON.stringify(lookup)},
      descriptor,
      ctx,
    );
    throw new Error(
      \`Server invocation not implemented for \${descriptor.sliceKey}/\${descriptor.actionKey}.\`,
    );
  };
}

type InterfaceServiceInvokeShim = <TResult, TInput>(
  descriptor: InterfaceServiceDescriptor<TResult, TInput>,
  input: TInput,
) => Promise<TResult>;
`;
}

type DataProp = {
  name: string;
  type: string;
  optional: boolean;
  docLines: string[];
  defaultValue: string;
};

function collectDataProps(
  handlerPlan: SurfaceInterfaceHandlerPlanStep[],
  sliceMap: Map<string, EaCInterfaceGeneratedDataSlice>,
): DataProp[] {
  const props = new Map<string, DataProp>();

  handlerPlan.forEach((step, index) => {
    if (!step.includeInResponse) return;
    const propertyName = step.resultName.trim() || toCamelCase(step.actionKey);
    if (!propertyName) return;

    const slice = sliceMap.get(step.sliceKey);
    const action = slice?.Actions?.find((candidate) => candidate?.Key === step.actionKey);
    const outputSchema = (action?.Output as JSONSchema7 | undefined) ??
      (slice?.Schema as JSONSchema7 | undefined);
    const type = schemaToTsType(outputSchema, 'unknown');
    const optional = !step.autoExecute;
    const defaultValue = schemaToDefaultValue(outputSchema, type, optional);
    const docLines = [
      `Step ${index + 1}: ${step.sliceLabel} -> ${step.actionLabel}`,
      step.autoExecute
        ? 'Runs automatically during load.'
        : 'Invoke manually via InterfaceServices when needed.',
      `Maps to InterfacePageData["${propertyName}"].`,
    ];

    props.set(propertyName, {
      name: propertyName,
      type,
      optional,
      docLines,
      defaultValue,
    });
  });

  const baseProps: DataProp[] = [
    {
      name: 'status',
      type: 'string | undefined',
      optional: true,
      docLines: ['Optional status helper for UI feedback.'],
      defaultValue: 'undefined',
    },
    {
      name: 'message',
      type: 'string | undefined',
      optional: true,
      docLines: ['Optional message provided by server-side handlers.'],
      defaultValue: 'undefined',
    },
  ];

  baseProps.forEach((prop) => {
    if (!props.has(prop.name)) props.set(prop.name, prop);
  });

  return Array.from(props.values());
}

type ServiceDefinition = {
  methodName: string;
  inputType: string;
  hasInput: boolean;
  outputType: string;
  descriptor: {
    sliceKey: string;
    actionKey: string;
    resultName: string;
    autoExecute: boolean;
    includeInResponse: boolean;
  };
  docLines: string[];
  aliasBase: string;
};

function collectServiceDefinitions(
  handlerPlan: SurfaceInterfaceHandlerPlanStep[],
  sliceMap: Map<string, EaCInterfaceGeneratedDataSlice>,
): ServiceDefinition[] {
  const services: ServiceDefinition[] = [];
  const usedNames = new Set<string>();

  handlerPlan.forEach((step, index) => {
    const slice = sliceMap.get(step.sliceKey);
    const action = slice?.Actions?.find((candidate) => candidate?.Key === step.actionKey);

    const outputSchema = (action?.Output as JSONSchema7 | undefined) ??
      (slice?.Schema as JSONSchema7 | undefined);
    const outputType = schemaToTsType(outputSchema, 'unknown');

    const inputSchema = action?.Input as JSONSchema7 | undefined;
    const hasInput = Boolean(inputSchema);
    const inputType = hasInput ? schemaToTsType(inputSchema, 'Record<string, unknown>') : 'void';

    const methodBase = step.actionLabel.trim() || step.actionKey || `service${index + 1}`;
    const methodName = createIdentifier(methodBase, usedNames, `service${index + 1}`);
    const aliasBase = toPascalCase(methodName);

    const docLines = [
      `Invokes ${step.sliceLabel} -> ${step.actionLabel}.`,
      hasInput ? 'Accepts input derived from the action schema.' : 'No input required.',
      step.includeInResponse
        ? `Upon auto-execution maps to InterfacePageData["${step.resultName || methodName}"].`
        : 'Does not automatically populate InterfacePageData.',
    ];

    services.push({
      methodName,
      inputType,
      hasInput,
      outputType,
      descriptor: {
        sliceKey: step.sliceKey,
        actionKey: step.actionKey,
        resultName: step.resultName || methodName,
        autoExecute: step.autoExecute,
        includeInResponse: step.includeInResponse,
      },
      docLines,
      aliasBase,
    });
  });

  if (services.length === 0) {
    services.push({
      methodName: 'ping',
      inputType: 'void',
      hasInput: false,
      outputType: 'string',
      descriptor: {
        sliceKey: 'sample',
        actionKey: 'ping',
        resultName: 'status',
        autoExecute: false,
        includeInResponse: false,
      },
      docLines: ['Placeholder service. Configure handler actions to replace this stub.'],
      aliasBase: 'Ping',
    });
  }

  return services;
}

function buildServerLoaderStub(safeId: string, props: DataProp[]): string {
  const statusProp = props.find((prop) => prop.name === 'status');
  const messageProp = props.find((prop) => prop.name === 'message');
  const statusFallback = statusProp ? '"ready"' : '"ready"';
  const messageFallback = messageProp
    ? `"Author loadServerData for ${safeId}."`
    : `"Author loadServerData for ${safeId}."`;

  return `export async function loadServerData(
  ctx: InterfaceServerContext,
): Promise<InterfacePageData> {
  return {
    ...defaultInterfacePageData,
    status: ctx.previous?.status ?? ${statusFallback},
    message: ctx.previous?.message ?? ${messageFallback},
  };
}`;
}

function buildClientLoaderStub(): string {
  return `export async function loadClientData(
  _ctx: InterfaceClientContext,
): Promise<Partial<InterfacePageData>> {
  return {};
}`;
}

function buildDefaultInterfaceComponent(lookup: string, safeId: string): string {
  return `export default function InterfacePage({
  data,
  services,
  status,
  refresh,
}: InterfacePageProps) {
  return (
    <section class="oi-interface-splash">
      <header>
        <h1>${safeId} interface</h1>
        <p>Lookup: ${lookup}</p>
      </header>
      <button type="button" class="oi-interface-splash__refresh" onClick={() => refresh()} disabled={status.isLoading}>
        Refresh data
      </button>
      {status.error && <p class="oi-interface-splash__error">{status.error}</p>}
      <pre>{JSON.stringify(data ?? {}, null, 2)}</pre>
    </section>
  );
}`;
}

function buildGuidanceComment(label: string, description: string, messages: string): string {
  const lines = [
    description.trim(),
    ...messages.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
  ].filter(Boolean);

  if (lines.length === 0) return '';

  const formatted = lines.map((line) => `// ${line}`).join('\n');
  return `${formatted}\n// (${label})`;
}

type RegistryEntry = {
  lookup: string;
  safeId: string;
};

function buildRegistryFile(entries: RegistryEntry[]): string {
  const importLines = [
    'import { h } from "preact";',
    'import type { JSX } from "preact";',
    'import render from "preact-render-to-string";',
  ];

  const moduleImports = entries
    .map(({ lookup, safeId }) => [
      `import Interface${safeId} from "./${lookup}/index.tsx";`,
      `import * as Interface${safeId}Handlers from "./${lookup}/handler.ts";`,
    ])
    .flat();

  const createEntryFunction =
    `type InterfaceHandlerFn = (req: Request, ctx: InterfaceRequestContext) => Promise<Response> | Response;

export type InterfaceRequestContext = {
  Params?: Record<string, string>;
  [key: string]: unknown;
};

export type InterfaceHandlers = {
  default?: InterfaceHandlerFn;
  DELETE?: InterfaceHandlerFn;
  GET?: InterfaceHandlerFn;
  HEAD?: InterfaceHandlerFn;
  OPTIONS?: InterfaceHandlerFn;
  PATCH?: InterfaceHandlerFn;
  POST?: InterfaceHandlerFn;
  PUT?: InterfaceHandlerFn;
  loadPageData?: (
    req: Request,
    ctx: InterfaceRequestContext,
  ) => Promise<unknown> | unknown;
};

export type InterfacePageComponent = (props: { data?: unknown }) => JSX.Element;

export type InterfaceRegistryEntry = {
  lookup: string;
  Component: InterfacePageComponent;
  handlers: InterfaceHandlers;
  render: (req: Request, ctx: InterfaceRequestContext) => Promise<Response>;
};

function createEntry(
  component: InterfacePageComponent,
  handlers: InterfaceHandlers,
  lookup: string,
): InterfaceRegistryEntry {
  return {
    lookup,
    Component: component,
    handlers,
    render: async (req: Request, ctx: InterfaceRequestContext) => {
      const data = handlers.loadPageData
        ? await handlers.loadPageData(req, ctx)
        : undefined;

      const html = render(h(component, { data }));

      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-Interface-Lookup": lookup,
        },
      });
    },
  };
}`;

  const registryEntries = entries
    .map(({ lookup, safeId }) =>
      `  "${escapeTemplate(lookup)}": createEntry(Interface${safeId}, Interface${safeId}Handlers, "${escapeTemplate(lookup)}"),`
    )
    .join('\n');

  const registryObject = `export const interfaceRegistry: Record<string, InterfaceRegistryEntry> = {
${registryEntries}
};`;

  const segments = [
    '// deno-lint-ignore-file no-explicit-any',
    importLines.join('\n'),
    moduleImports.join('\n'),
    createEntryFunction,
    registryObject,
  ].filter((segment) => segment && segment.trim().length > 0);

  if (!entries.length) {
    segments.splice(
      segments.length - 1,
      1,
      'export const interfaceRegistry: Record<string, InterfaceRegistryEntry> = {};',
    );
  }

  return `${segments.join('\n\n')}\n`;
}

type RouteOptions = {
  RoutesBase?: string;
};

function buildRoutePath(processor: RouteOptions): string {
  const baseSegments = (processor.RoutesBase ?? 'w/:workspace/ui')
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length)
    .map((segment) => segment.startsWith(':') ? `[${segment.slice(1)}]` : segment);

  return ['routes', ...baseSegments, '[interfaceLookup]', 'index.tsx'].join('/');
}

function buildRouteFile(processor: RouteOptions): string {
  const depth = (processor.RoutesBase?.split('/')
    .filter((segment) => segment.trim().length).length ?? 0) + 2;
  const prefix = '../'.repeat(depth);
  const registryImportPath = `${prefix}interfaces/registry.ts`;

  const methodExports = HTTP_METHODS.map((method) =>
    `export async function ${method}(
  req: Request,
  ctx: InterfaceRequestContext,
): Promise<Response> {
  return await resolveInterface("${method}", req, ctx);
}`
  ).join('\n\n');

  return `import { interfaceRegistry } from "${registryImportPath}";
import type { InterfaceRequestContext } from "${registryImportPath}";

type HandlerFn = (req: Request, ctx: InterfaceRequestContext) => Promise<Response> | Response;

const SUPPORTED_METHODS = ${JSON.stringify(HTTP_METHODS)} as const;

type SupportedMethod = (typeof SUPPORTED_METHODS)[number];

function normalizeMethod(method: string | undefined): SupportedMethod {
  const candidate = (method ?? "GET").toUpperCase();
  return (SUPPORTED_METHODS as readonly string[]).includes(candidate)
    ? candidate as SupportedMethod
    : "GET";
}

async function resolveInterface(
  method: SupportedMethod | string,
  req: Request,
  ctx: InterfaceRequestContext,
): Promise<Response> {
  const lookup = ctx?.Params?.interfaceLookup ?? "";
  const entry = interfaceRegistry[lookup as keyof typeof interfaceRegistry];

  if (!entry) {
    return new Response("Interface not found.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const normalized = normalizeMethod(
    typeof method === "string" ? method : method,
  );

  const handlers = entry.handlers as Record<string, unknown> & {
    default?: HandlerFn;
    GET?: HandlerFn;
  };

  const direct = handlers[normalized] as HandlerFn | undefined;

  if (typeof direct === "function") {
    return await direct(req, ctx);
  }

  if (normalized === "HEAD" && typeof handlers.GET === "function") {
    const response = await handlers.GET(req, ctx);
    return new Response(null, {
      status: response.status,
      headers: response.headers,
    });
  }

  if (typeof handlers.default === "function") {
    return await handlers.default(req, ctx);
  }

  return await entry.render(req, ctx);
}

export default async function handler(
  req: Request,
  ctx: InterfaceRequestContext,
): Promise<Response> {
  const method = normalizeMethod(req?.method);
  return await resolveInterface(method, req, ctx);
}

${methodExports}
`;
}

const HTTP_METHODS = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'] as const;

function wrapTypeAlias(name: string, typeString: string): string {
  const parts = typeString.trim().split('\n');
  if (parts.length === 1) {
    return `export type ${name} = ${parts[0]};`;
  }
  const lines = [`export type ${name} = ${parts[0]}`];
  for (let index = 1; index < parts.length - 1; index += 1) {
    lines.push(`  ${parts[index]}`);
  }
  const last = parts[parts.length - 1];
  lines.push(`  ${last};`);
  return lines.join('\n');
}

function formatDocComment(lines: string[], indentSpaces = 0): string[] {
  const trimmed = lines.map((line) => line.trim()).filter((line) => line.length > 0);
  if (trimmed.length === 0) return [];
  const pad = ' '.repeat(indentSpaces);
  return [
    `${pad}/**`,
    ...trimmed.map((line) => `${pad} * ${line}`),
    `${pad} */`,
  ];
}

function formatPropertyKey(name: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : JSON.stringify(name);
}

function formatObjectProperty(name: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : JSON.stringify(name);
}

function toPascalCase(value: string): string {
  return value
    .split(/[^A-Za-z0-9]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('') || 'Interface';
}

function toCamelCase(value: string): string {
  const segments = value
    .split(/[^A-Za-z0-9]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.toLowerCase());
  if (segments.length === 0) return '';
  return segments
    .map((segment, index) =>
      index === 0 ? segment : segment.charAt(0).toUpperCase() + segment.slice(1)
    )
    .join('');
}

function createIdentifier(source: string, used: Set<string>, fallback: string): string {
  let candidate = toCamelCase(source);
  if (!candidate) candidate = fallback;
  if (!/^[A-Za-z_$]/.test(candidate)) {
    candidate = `${fallback}${candidate}`;
  }
  let proposal = candidate;
  let counter = 1;
  while (used.has(proposal)) {
    proposal = `${candidate}${counter}`;
    counter += 1;
  }
  used.add(proposal);
  return proposal;
}

type JsonSchemaObject = Exclude<JSONSchema7, boolean>;

function isJsonSchemaObject(schema: JSONSchema7 | undefined): schema is JsonSchemaObject {
  return typeof schema === 'object' && schema !== null && !Array.isArray(schema);
}

function schemaToTsType(schema: JSONSchema7 | undefined, fallback: string): string {
  if (schema === undefined) return fallback;
  if (!isJsonSchemaObject(schema)) {
    return schema ? 'unknown' : 'never';
  }
  const schemaObj = schema as unknown as Record<string, unknown>;
  const constant = schemaObj.const;
  if (constant !== undefined) {
    return JSON.stringify(constant);
  }
  const enumValues = schemaObj.enum as unknown[] | undefined;
  if (Array.isArray(enumValues) && enumValues.length > 0) {
    return enumValues.map((value) => JSON.stringify(value)).join(' | ');
  }
  const anyOf = schemaObj.anyOf as unknown[] | undefined;
  if (Array.isArray(anyOf) && anyOf.length > 0) {
    const fragments = anyOf.map((sub) => schemaToTsType(sub as JSONSchema7, 'unknown'));
    return fragments.join(' | ');
  }
  const oneOf = schemaObj.oneOf as unknown[] | undefined;
  if (Array.isArray(oneOf) && oneOf.length > 0) {
    const fragments = oneOf.map((sub) => schemaToTsType(sub as JSONSchema7, 'unknown'));
    return fragments.join(' | ');
  }
  const allOf = schemaObj.allOf as unknown[] | undefined;
  if (Array.isArray(allOf) && allOf.length > 0) {
    const fragments = allOf.map((sub) => schemaToTsType(sub as JSONSchema7, 'unknown'));
    return fragments.join(' & ');
  }

  const primary = getPrimarySchemaType(schemaObj);
  switch (primary) {
    case 'string':
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'null';
    case 'array': {
      const itemsValue = schemaObj.items as JSONSchema7 | JSONSchema7[] | undefined;
      const items = Array.isArray(itemsValue) ? itemsValue[0] : itemsValue;
      const itemType = schemaToTsType(items as JSONSchema7 | undefined, 'unknown');
      return `Array<${itemType}>`;
    }
    case 'object': {
      const additionalProps = schemaObj.additionalProperties as boolean | JSONSchema7 | undefined;
      if (additionalProps === true) {
        return 'Record<string, unknown>';
      }
      if (additionalProps && typeof additionalProps === 'object') {
        const additional = schemaToTsType(additionalProps, 'unknown');
        return `Record<string, ${additional}>`;
      }
      const properties = (schemaObj.properties as Record<string, JSONSchema7> | undefined) ?? {};
      const required = new Set(schemaObj.required as string[] | undefined ?? []);
      const entries = Object.entries(properties);
      if (entries.length === 0) {
        return 'Record<string, unknown>';
      }
      const resultLines = ['{'];
      entries.forEach(([key, value]) => {
        const keyToken = formatPropertyKey(key);
        const optional = required.has(key) ? '' : '?';
        const valueType = schemaToTsType(value as JSONSchema7 | undefined, 'unknown');
        const valueParts = valueType.trim().split('\n');
        if (valueParts.length === 1) {
          resultLines.push(`  ${keyToken}${optional}: ${valueParts[0]};`);
        } else {
          resultLines.push(`  ${keyToken}${optional}: ${valueParts[0]}`);
          valueParts.slice(1).forEach((line) => {
            resultLines.push(`    ${line}`);
          });
          const lastIndex = resultLines.length - 1;
          resultLines[lastIndex] = `${resultLines[lastIndex]};`;
        }
      });
      resultLines.push('}');
      return resultLines.join('\n');
    }
    default:
      return fallback;
  }
}

function schemaToDefaultValue(
  schema: JSONSchema7 | undefined,
  typeString: string,
  optional: boolean,
): string {
  if (schema === undefined) {
    return optional ? 'undefined' : `undefined as unknown as ${typeString}`;
  }
  if (!isJsonSchemaObject(schema)) {
    return optional ? 'undefined' : `undefined as unknown as ${typeString}`;
  }
  const schemaObj = schema as unknown as Record<string, unknown>;
  if (schemaObj.default !== undefined) {
    return formatSchemaDefault(schemaObj.default);
  }
  const primary = getPrimarySchemaType(schemaObj);
  switch (primary) {
    case 'string':
      return optional ? 'undefined' : "''";
    case 'number':
    case 'integer':
      return optional ? 'undefined' : '0';
    case 'boolean':
      return optional ? 'undefined' : 'false';
    case 'array':
      return '[]';
    case 'object':
      return typeString.trim().startsWith('{') ? '{}' : `{} as ${typeString}`;
    case 'null':
      return 'null';
    default:
      return optional ? 'undefined' : `undefined as unknown as ${typeString}`;
  }
}

function getPrimarySchemaType(schema: Record<string, unknown>): JSONSchema7['type'] | undefined {
  const typeValue = schema.type as JSONSchema7['type'] | JSONSchema7['type'][] | undefined;
  if (!typeValue) {
    if (schema.properties) return 'object';
    if (schema.items) return 'array';
    return undefined;
  }
  return Array.isArray(typeValue) ? typeValue[0] : typeValue;
}

function formatSchemaDefault(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return `[${value.map((entry) => formatSchemaDefault(entry)).join(', ')}]`;
  }
  if (typeof value === 'object' && value) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    const parts = entries.map(([key, val]) =>
      `${formatObjectProperty(key)}: ${formatSchemaDefault(val)}`
    );
    return `{ ${parts.join(', ')} }`;
  }
  return 'undefined';
}

function escapeTemplate(value: string): string {
  return value.replace(/`/g, '\\`');
}

function copyToClipboard(text: string): void {
  if (!text.trim().length) return;
  const nav = (globalThis as { navigator?: Navigator }).navigator;
  const clipboard = nav?.clipboard;
  const writer = clipboard?.writeText;
  if (typeof writer === 'function' && clipboard) {
    writer.call(clipboard, text).catch(() => {});
  }
}
