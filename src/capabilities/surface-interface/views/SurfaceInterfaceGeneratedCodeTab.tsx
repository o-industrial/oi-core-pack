import {
  Action,
  ActionStyleTypes,
  CodeMirrorEditor,
  IntentTypes,
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
  handlerCode: string,
  handlerDescription: string,
  handlerMessages: string,
  pageCode: string,
  pageDescription: string,
  pageMessages: string,
): string {
  const safeId = toPascalCase(interfaceLookup || 'Interface');
  const importBlock = buildImports(imports, safeId);
  const handlerSection = resolveHandlerSection(handlerPlan, handlerCode, safeId);
  const pageSection = resolvePageSection(pageCode, pageDescription, pageMessages, safeId);
  const notesSection = buildNotes(handlerDescription, handlerMessages);

  return [
    `// Generated interface module preview for "${interfaceLookup}"`,
    importBlock,
    notesSection,
    `export type Interface${safeId}PageData = {
  status: string;
  message?: string;
  data?: Record<string, unknown>;
};`,
    handlerSection,
    pageSection,
    buildRegistrySection(safeId, interfaceLookup),
  ]
    .filter((segment) => segment.trim().length > 0)
    .join('\n\n');
}

function buildImports(imports: string[], safeId: string): string {
  const baseImports = [
    'import { h } from "preact";',
    `import type { Interface${safeId}PageData } from "./types.ts";`,
  ];
  const unique = [
    ...new Set([...baseImports, ...imports.map((line) => line.trim()).filter(Boolean)]),
  ];
  return unique.join('\n');
}

function resolveHandlerSection(
  handlerPlan: SurfaceInterfaceHandlerPlanStep[],
  handlerCode: string,
  safeId: string,
): string {
  const trimmed = handlerCode.trim();
  if (trimmed.length > 0) return trimmed;
  if (handlerPlan.length === 0) {
    return `export async function loadPageData(
  _req: Request,
  _ctx: Record<string, unknown>,
): Promise<Interface${safeId}PageData> {
  return {
    status: "todo",
    message: "Author handler logic for ${safeId}.",
  };
}`;
  }
  return generateHandlerStub(handlerPlan);
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

export default function Interface${safeId}Page({
  data,
}: { data?: Interface${safeId}PageData }) {
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

function buildRegistrySection(safeId: string, lookup: string): string {
  return `export const interfaceRegistry = {
  "${lookup}": {
    lookup: "${lookup}",
    Component: Interface${safeId}Page,
    handlers: {
      loadPageData,
    },
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

function copyToClipboard(text: string): void {
  if (!text.trim().length) return;
  const nav = (globalThis as { navigator?: Navigator }).navigator;
  const clipboard = nav?.clipboard;
  const writer = clipboard?.writeText;
  if (typeof writer === 'function' && clipboard) {
    writer.call(clipboard, text).catch(() => {});
  }
}
