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
import {
  buildDefaultInterfaceComponent,
  toCamelCase,
  toPascalCase,
} from './SurfaceInterfaceTemplates.ts';

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

  const guidance = buildGuidanceComment("Server handler guidance", handlerDescription, handlerMessages);
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
  type InterfaceServerContext,
  type InterfaceServices,
} from "./services.ts";
import * as Module from "./module.tsx";

${guidance.trim().length > 0 ? `${guidance}\n\n` : ''}export async function loadPageData(
  req: Request,
  ctx: InterfaceRequestContext,
  services: InterfaceServices,
  seed: InterfacePageData,
): Promise<InterfacePageData> {
  const data = { ...seed };
  void services;

  if (typeof Module.loadServerData === "function") {
    const result = await Module.loadServerData({
      request: req,
      params: ctx?.Params ?? {},
      headers: req.headers,
      previous: data,
      services,
    } satisfies InterfaceServerContext);

    return { ...data, ...result };
  }

  return data;
}
`;
}
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
      `import { createInterfaceServices as createInterface${safeId}Services } from "./${lookup}/services.ts";`,
      `import { defaultInterfacePageData as defaultInterface${safeId}PageData } from "./${lookup}/types.ts";`,
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
    services: unknown,
    seed: unknown,
  ) => Promise<unknown> | unknown;
};

export type InterfacePageComponent = (props: { data?: unknown }) => JSX.Element;

export type InterfaceRegistryEntry = {
  lookup: string;
  Component: InterfacePageComponent;
  handlers: InterfaceHandlers;
  render: (req: Request, ctx: InterfaceRequestContext) => Promise<Response>;
};

type RegistryServiceDescriptor = {
  sliceKey: string;
  actionKey: string;
  resultName: string;
  autoExecute: boolean;
  includeInResponse: boolean;
};

type RegistryServiceInvoke = <TResult, TInput>(
  descriptor: RegistryServiceDescriptor,
  input: TInput,
) => Promise<TResult>;

function createServerInvoker(
  lookup: string,
  req: Request,
  ctx: InterfaceRequestContext,
): RegistryServiceInvoke {
  return async <TResult, TInput>(
    descriptor: RegistryServiceDescriptor,
    input: TInput,
  ): Promise<TResult> => {
    const containers = (ctx as Record<string, unknown>)?.actions ??
      (ctx as Record<string, unknown>)?.Actions ?? {};
    const handler = (containers as Record<string, Record<string, unknown>>)[descriptor.sliceKey]?.[descriptor.actionKey];
    if (typeof handler === "function") {
      return await (handler as (
        options: { req: Request; ctx: InterfaceRequestContext; input?: unknown },
      ) => Promise<unknown> | unknown)({
        req,
        ctx,
        input,
      }) as TResult;
    }

    console.warn(
      "No server handler registered for",
      lookup,
      descriptor.sliceKey,
      descriptor.actionKey,
    );
    return undefined as TResult;
  };
}

function createEntry(
  component: InterfacePageComponent,
  handlers: InterfaceHandlers,
  lookup: string,
  buildServices: (req: Request, ctx: InterfaceRequestContext) => unknown,
  buildSeed: () => unknown,
): InterfaceRegistryEntry {
  return {
    lookup,
    Component: component,
    handlers,
    render: async (req: Request, ctx: InterfaceRequestContext) => {
      const seed = buildSeed();
      const services = buildServices(req, ctx);
      const resolved = handlers.loadPageData
        ? await handlers.loadPageData(req, ctx, services, seed)
        : seed;
      const data = resolved ?? seed;

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
      `  "${escapeTemplate(lookup)}": createEntry(
    Interface${safeId},
    Interface${safeId}Handlers,
    "${escapeTemplate(lookup)}",
    (req, ctx) =>
      createInterface${safeId}Services(
        createServerInvoker("${escapeTemplate(lookup)}", req, ctx),
      ),
    () => ({ ...defaultInterface${safeId}PageData }),
  ),`
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


