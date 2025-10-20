import {
  Action,
  ActionStyleTypes,
  CodeMirrorEditor,
  type EaCInterfaceGeneratedDataSlice,
  IntentTypes,
  type JSONSchema7,
  type JSX,
  useMemo,
} from '../../../.deps.ts';
import {
  generateHandlerStub,
  type SurfaceInterfaceHandlerPlanStep,
} from './SurfaceInterfaceHandlerTab.tsx';

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
          <h3 class='text-sm font-semibold text-neutral-100'>Generated module preview</h3>
          <p class='text-xs text-neutral-400'>
            Hard-coded snapshot that illustrates how the final interface bundle can look. We blend
            live configuration with illustrative defaults so we can iterate on formatting before
            wiring real code generation.
          </p>
        </div>
        <Action
          styleType={ActionStyleTypes.Outline | ActionStyleTypes.Rounded}
          intentType={IntentTypes.Secondary}
          onClick={() => copyToClipboard(generatedModule)}
        >
          Copy module
        </Action>
      </header>

      <div class='flex-1 min-h-0 overflow-hidden rounded border border-neutral-800 bg-neutral-950'>
        <CodeMirrorEditor
          fileContent={generatedModule}
          onContentChange={() => {}}
          readOnly
          class='h-full [&>.cm-editor]:h-full [&>.cm-editor]:rounded [&>.cm-editor]:border-none [&>.cm-editor]:bg-transparent'
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
  const safeId = toPascalCase(interfaceLookup || 'Interface');
  const importBlock = buildImports(imports);
  const pageDataSections = buildPageDataSections(handlerPlan, generatedSlices, safeId);
  const servicesSection = buildServicesSection(handlerPlan, generatedSlices);
  const handlerSection = resolveHandlerSection(handlerPlan, handlerCode, safeId);
  const pageSection = resolvePageSection(pageCode, pageDescription, pageMessages, safeId);
  const notesSection = buildNotes(handlerDescription, handlerMessages);

  return [
    `// Generated interface module preview for "${interfaceLookup}"`,
    '// Keep export names stable; the runtime discovers modules dynamically.',
    importBlock,
    pageDataSections,
    servicesSection,
    notesSection,
    handlerSection,
    pageSection,
    buildRegistrySection(interfaceLookup),
  ]
    .filter((segment) => segment.trim().length > 0)
    .join('\n\n');
}

function buildImports(imports: string[]): string {
  const unique = imports.map((line) => line.trim()).filter(Boolean);
  if (unique.length === 0) {
    return '// Imports configured via the Imports tab. Manage shared dependencies there.';
  }
  return [
    '// Imports configured via the Imports tab. Extend this list from that UI.',
    ...new Set(unique),
  ].join('\n');
}

function buildPageDataSections(
  handlerPlan: SurfaceInterfaceHandlerPlanStep[],
  generatedSlices: Array<[string, EaCInterfaceGeneratedDataSlice]>,
  safeId: string,
): string {
  type DataProp = {
    name: string;
    type: string;
    optional: boolean;
    docLines: string[];
    defaultValue: string;
  };

  const sliceByKey = new Map<string, EaCInterfaceGeneratedDataSlice>(generatedSlices);
  const props = new Map<string, DataProp>();

  handlerPlan.forEach((step, index) => {
    if (!step.includeInResponse) return;
    const propertyName = step.resultName.trim() || toCamelCase(step.actionKey);
    if (!propertyName) return;
    const slice = sliceByKey.get(step.sliceKey);
    const action = slice?.Actions?.find((candidate) => candidate?.Key === step.actionKey);
    const outputSchema = (action?.Output as JSONSchema7 | undefined) ??
      (slice?.Schema as JSONSchema7 | undefined);
    const type = schemaToTsType(outputSchema, 'unknown');
    const optional = !step.autoExecute;
    const defaultValue = schemaToDefaultValue(outputSchema, type, optional);
    const docLines = [
      `Step ${index + 1}: ${step.sliceLabel} -> ${step.actionLabel}`,
      step.autoExecute
        ? 'Auto executes during initial load.'
        : 'Populate after manual invocation via Services.',
      `Maps to PageData property "${propertyName}".`,
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

  const orderedProps = Array.from(props.values());

  const typeLines: string[] = [
    '/**',
    ` * Strongly-typed page data contract for the ${safeId} interface.`,
    ' * Keep the export name `InterfacePageData` stable for dynamic consumers.',
    ' */',
    'export type InterfacePageData = {',
  ];

  orderedProps.forEach((prop) => {
    typeLines.push(...formatDocComment(prop.docLines, 2));
    const key = formatPropertyKey(prop.name);
    const optionalFlag = prop.optional ? '?' : '';
    const typeParts = prop.type.trim().split('\n');
    if (typeParts.length === 1) {
      typeLines.push(`  ${key}${optionalFlag}: ${typeParts[0]};`);
    } else {
      typeLines.push(`  ${key}${optionalFlag}: ${typeParts[0]}`);
      typeParts.slice(1).forEach((line) => {
        typeLines.push(`    ${line}`);
      });
      const lastIndex = typeLines.length - 1;
      typeLines[lastIndex] = `${typeLines[lastIndex]};`;
    }
  });
  typeLines.push('};');

  const defaultsLines: string[] = [
    '/** Baseline defaults for InterfacePageData. */',
    'export const defaultInterfacePageData: InterfacePageData = {',
  ];
  orderedProps.forEach((prop) => {
    const key = formatObjectProperty(prop.name);
    const valueParts = prop.defaultValue.trim().split('\n');
    if (valueParts.length === 1) {
      defaultsLines.push(`  ${key}: ${valueParts[0]},`);
    } else {
      defaultsLines.push(`  ${key}: ${valueParts[0]}`);
      valueParts.slice(1).forEach((line) => {
        defaultsLines.push(`    ${line}`);
      });
      const lastIndex = defaultsLines.length - 1;
      defaultsLines[lastIndex] = `${defaultsLines[lastIndex]},`;
    }
  });
  defaultsLines.push('};');

  const hookLines: string[] = [
    '/**',
    ' * Helper that binds the generated PageData contract to component state.',
    ' * Pass your preferred `useState` implementation (for example, from Preact hooks).',
    ' */',
    'export type PageStateHook = <Value>(initial: Value) => [Value, (next: Value) => void];',
    'export function createInterfacePageState(',
    '  useState: PageStateHook,',
    '  initial: Partial<InterfacePageData> = {},',
    '): {',
    '  data: InterfacePageData;',
    '  setters: { [Key in keyof InterfacePageData]: (value: InterfacePageData[Key]) => void };',
    '  snapshot(): InterfacePageData;',
    '} {',
    '  const base = { ...defaultInterfacePageData, ...initial } as InterfacePageData;',
  ];

  const stateNames = new Set<string>();
  const setterNames = new Set<string>();
  const dataLines: string[] = [];
  const setterLines: string[] = [];
  const snapshotLines: string[] = [];

  orderedProps.forEach((prop) => {
    const stateName = createIdentifier(prop.name, stateNames, 'value');
    const setterName = createSetterName(stateName, setterNames);
    const accessor = `base${formatAccessor(prop.name)}`;
    hookLines.push(`  const [${stateName}, ${setterName}] = useState(${accessor});`);
    dataLines.push(`      ${formatObjectProperty(prop.name)}: ${stateName},`);
    setterLines.push(`      ${formatObjectProperty(prop.name)}: ${setterName},`);
    snapshotLines.push(`        ${formatObjectProperty(prop.name)}: ${stateName},`);
  });

  hookLines.push('  return {');
  hookLines.push('    data: {');
  if (dataLines.length === 0) {
    hookLines.push('      // No handler-backed data fields configured yet.');
  } else {
    hookLines.push(...dataLines);
  }
  hookLines.push('    },');
  hookLines.push('    setters: {');
  if (setterLines.length === 0) {
    hookLines.push('      // Configure handler actions to expose setters.');
  } else {
    hookLines.push(...setterLines);
  }
  hookLines.push('    },');
  hookLines.push('    snapshot(): InterfacePageData {');
  hookLines.push('      return {');
  hookLines.push('        ...base,');
  if (snapshotLines.length > 0) {
    hookLines.push(...snapshotLines);
  }
  hookLines.push('      };');
  hookLines.push('    },');
  hookLines.push('  };');
  hookLines.push('}');

  return [
    typeLines.join('\n'),
    defaultsLines.join('\n'),
    hookLines.join('\n'),
  ].join('\n\n');
}

function buildServicesSection(
  handlerPlan: SurfaceInterfaceHandlerPlanStep[],
  generatedSlices: Array<[string, EaCInterfaceGeneratedDataSlice]>,
): string {
  if (handlerPlan.length === 0) {
    return `/**
 * Services derived from handler configuration.
 * Add actions on the Handler tab to populate this scaffold.
 */
export const Services = {};`;
  }

  const sliceByKey = new Map<string, EaCInterfaceGeneratedDataSlice>(generatedSlices);
  const usedNames = new Set<string>();
  const lines: string[] = [
    '/**',
    ' * Client-side service stubs for invoking configured interface actions.',
    ' * Replace the placeholder bodies with runtime-specific requests.',
    ' */',
    'export const Services = {',
  ];

  handlerPlan.forEach((step, index) => {
    const slice = sliceByKey.get(step.sliceKey);
    const action = slice?.Actions?.find((candidate) => candidate?.Key === step.actionKey);
    const outputType = schemaToTsType(action?.Output as JSONSchema7 | undefined, 'unknown');
    const inputSchema = action?.Input as JSONSchema7 | undefined;
    const hasInput = Boolean(inputSchema);
    const inputType = hasInput ? schemaToTsType(inputSchema, 'unknown') : 'void';
    const methodBase = step.actionLabel.trim() || step.actionKey || `service${index + 1}`;
    const methodName = createIdentifier(methodBase, usedNames, `service${index + 1}`);
    const pageDataTarget = step.resultName.trim() || toCamelCase(step.actionKey) || methodName;
    const docLines = [
      `Slice "${step.sliceLabel}" (${step.sliceKey})`,
      `Action "${step.actionLabel}" (${step.actionKey})`,
    ];
    if (step.includeInResponse) {
      docLines.push(`Maps to PageData property "${pageDataTarget}".`);
    } else {
      docLines.push('No direct PageData mapping; use returned value as needed.');
    }
    if (step.autoExecute) {
      docLines.push('Also runs during initial server-side load.');
    }

    lines.push(...formatDocComment(docLines, 2));
    const params = hasInput ? `input: ${inputType}` : '';
    lines.push(
      hasInput
        ? `  async ${methodName}(${params}): Promise<${outputType}> {`
        : `  async ${methodName}(): Promise<${outputType}> {`,
    );
    lines.push(
      `    // TODO: Replace with runtime invocation for slice "${step.sliceKey}" action "${step.actionKey}".`,
    );
    lines.push('    throw new Error("Implement service call before shipping to production.");');
    lines.push('  },');
  });

  lines.push('};');
  return lines.join('\n');
}

function resolveHandlerSection(
  handlerPlan: SurfaceInterfaceHandlerPlanStep[],
  handlerCode: string,
  safeId: string,
): string {
  const trimmed = handlerCode.trim();
  if (trimmed.length > 0) return trimmed;
  if (handlerPlan.length === 0) {
    return `/**
 * loadPageData composes server-side data for the interface.
 * Keep the export name stable so runtime wiring can locate it.
 */
export async function loadPageData(
  _req: Request,
  _ctx: Record<string, unknown>,
): Promise<InterfacePageData> {
  return {
    status: "todo",
    message: "Author handler logic for ${safeId}.",
  };
}`;
  }
  return generateHandlerStub(handlerPlan, { returnType: 'InterfacePageData' });
}

function resolvePageSection(
  pageCode: string,
  description: string,
  messages: string,
  safeId: string,
): string {
  const trimmed = pageCode.trim();
  if (trimmed.length > 0) return trimmed;

  const summary = [
    description.trim(),
    ...messages.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
  ]
    .map((line) => `// ${line}`)
    .join('\n');

  return `${summary}

/**
 * Primary interface view. Keep the export name \`InterfacePage\` stable for runtime discovery.
 */
export default function InterfacePage({
  data,
}: { data?: InterfacePageData }) {
  return (
    <section class="oi-interface-splash">
      <header>
        <h1>${safeId} interface</h1>
        <p>Replace this placeholder once the page view is authored.</p>
      </header>
      <pre>{JSON.stringify(data ?? {}, null, 2)}</pre>
    </section>
  );
}`;
}

function buildNotes(description: string, messages: string): string {
  const lines = [
    description.trim(),
    ...messages.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
  ].filter(Boolean);

  if (lines.length === 0) return '';

  const formatted = lines.map((line) => `// ${line}`).join('\n');
  return `${formatted}\n`;
}

function buildRegistrySection(lookup: string): string {
  return `/**
 * Registry entry consumed by the runtime loader.
 * The keys and export names must remain stable for dynamic resolution.
 */
export const interfaceRegistry = {
  "${lookup}": {
    lookup: "${lookup}",
    Component: InterfacePage,
    data: {
      defaults: defaultInterfacePageData,
      createState: createInterfacePageState,
    },
    handlers: {
      loadPageData,
    },
    services: Services,
  },
};`;
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

function createSetterName(base: string, used: Set<string>): string {
  let proposal = `set${capitalize(base)}`;
  let counter = 1;
  while (used.has(proposal)) {
    proposal = `set${capitalize(base)}${counter}`;
    counter += 1;
  }
  used.add(proposal);
  return proposal;
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
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

function formatAccessor(property: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(property)
    ? `.${property}`
    : `[${JSON.stringify(property)}]`;
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
      const lines = ['{'];
      entries.forEach(([key, value]) => {
        const keyToken = formatPropertyKey(key);
        const optional = required.has(key) ? '' : '?';
        const valueType = schemaToTsType(value as JSONSchema7 | undefined, 'unknown');
        const valueParts = valueType.trim().split('\n');
        if (valueParts.length === 1) {
          lines.push(`  ${keyToken}${optional}: ${valueParts[0]};`);
        } else {
          lines.push(`  ${keyToken}${optional}: ${valueParts[0]}`);
          valueParts.slice(1).forEach((line) => {
            lines.push(`    ${line}`);
          });
          const lastIndex = lines.length - 1;
          lines[lastIndex] = `${lines[lastIndex]};`;
        }
      });
      lines.push('}');
      return lines.join('\n');
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
function copyToClipboard(text: string): void {
  if (!text.trim().length) return;
  const nav = (globalThis as { navigator?: Navigator }).navigator;
  const clipboard = nav?.clipboard;
  const writer = clipboard?.writeText;
  if (typeof writer === 'function' && clipboard) {
    writer.call(clipboard, text).catch(() => {});
  }
}
