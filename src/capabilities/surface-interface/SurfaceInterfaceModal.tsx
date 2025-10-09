import { useEffect, useMemo, useState } from '../../.deps.ts';
import { AziPanel, CodeMirrorEditor, Modal, TabbedPanel } from '../../.deps.ts';
import type {
  EaCInterfaceCodeBlock,
  EaCInterfaceDetails,
  SurfaceInterfaceSettings,
} from '../../.deps.ts';
import { Action, ActionStyleTypes, IntentTypes } from '../../.deps.ts';
import { marked } from 'npm:marked@15.0.1';
import type { JSX } from '../../.deps.ts';
import type { WorkspaceManager } from '../../.deps.ts';
import { ensureInterfaceDetails } from './interfaceDefaults.ts';

type SurfaceInterfaceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  interfaceLookup: string;
  surfaceLookup?: string;
  details: EaCInterfaceDetails;
  settings?: SurfaceInterfaceSettings;
  workspaceMgr: WorkspaceManager;
  onDetailsChange?: (next: Partial<EaCInterfaceDetails>) => void;
};

type SurfaceInterfaceTabKey = 'imports' | 'data' | 'handler' | 'page';

const TAB_IMPORTS: SurfaceInterfaceTabKey = 'imports';
const TAB_DATA: SurfaceInterfaceTabKey = 'data';
const TAB_HANDLER: SurfaceInterfaceTabKey = 'handler';
const TAB_PAGE: SurfaceInterfaceTabKey = 'page';

export function SurfaceInterfaceModal({
  isOpen,
  onClose,
  interfaceLookup,
  surfaceLookup,
  details,
  workspaceMgr,
  onDetailsChange,
}: SurfaceInterfaceModalProps): JSX.Element | null {
  const resolvedDetails = useMemo(
    () => ensureInterfaceDetails(details, interfaceLookup),
    [details, interfaceLookup],
  );

  const [activeTab, setActiveTab] = useState<SurfaceInterfaceTabKey>(TAB_PAGE);

  const [importsText, setImportsText] = useState(
    formatImports(resolvedDetails.Imports),
  );
  const [pageDataType, setPageDataType] = useState(
    resolvedDetails.PageDataType ?? '{\n  message: string;\n}',
  );

  const [handlerCode, setHandlerCode] = useState(
    resolvedDetails.PageHandler?.Code ?? '',
  );
  const [handlerDescription, setHandlerDescription] = useState(
    resolvedDetails.PageHandler?.Description ?? '',
  );
  const [handlerMessagesText, setHandlerMessagesText] = useState(
    formatMessages(resolvedDetails.PageHandler?.Messages),
  );
  const [handlerMessageGroups] = useState(
    resolvedDetails.PageHandler?.MessageGroups ?? [],
  );

  const [pageCode, setPageCode] = useState(resolvedDetails.Page?.Code ?? '');
  const [pageDescription, setPageDescription] = useState(
    resolvedDetails.Page?.Description ?? '',
  );
  const [pageMessagesText, setPageMessagesText] = useState(
    formatMessages(resolvedDetails.Page?.Messages),
  );
  const [pageMessageGroups] = useState(
    resolvedDetails.Page?.MessageGroups ?? [],
  );

  useEffect(() => {
    setImportsText(formatImports(resolvedDetails.Imports));
    setPageDataType(resolvedDetails.PageDataType ?? '{\n  message: string;\n}');

    setHandlerCode(resolvedDetails.PageHandler?.Code ?? '');
    setHandlerDescription(resolvedDetails.PageHandler?.Description ?? '');
    setHandlerMessagesText(
      formatMessages(resolvedDetails.PageHandler?.Messages),
    );

    setPageCode(resolvedDetails.Page?.Code ?? '');
    setPageDescription(resolvedDetails.Page?.Description ?? '');
    setPageMessagesText(formatMessages(resolvedDetails.Page?.Messages));
  }, [resolvedDetails]);

  const interfaceAzi = workspaceMgr.InterfaceAzis?.[interfaceLookup];
  const enterpriseLookup = workspaceMgr.EaC.GetEaC().EnterpriseLookup ?? 'workspace';

  if (!isOpen) return null;

  const extraInputs = {
    interfaceLookup,
    surfaceLookup,
    enterpriseLookup,
    imports: parseImports(importsText),
    pageDataType,
    handler: {
      code: handlerCode,
      description: handlerDescription,
      messages: parseMessages(handlerMessagesText),
    },
    page: {
      code: pageCode,
      description: pageDescription,
      messages: parseMessages(pageMessagesText),
    },
  };

  const tabData = [
    {
      key: TAB_IMPORTS,
      label: 'Imports',
      content: (
        <div class='flex h-full min-h-0 flex-col gap-2'>
          <CodeMirrorEditor
            fileContent={importsText}
            onContentChange={setImportsText}
            class='flex-1 min-h-0 [&>.cm-editor]:h-full [&>.cm-editor]:min-h-0'
          />
          <p class='text-xs text-neutral-400'>
            One import statement per line. Leave empty to rely on default runtime imports.
          </p>
        </div>
      ),
    },
    {
      key: TAB_DATA,
      label: 'Page Data',
      content: (
        <div class='flex h-full min-h-0 flex-col gap-2'>
          <CodeMirrorEditor
            fileContent={pageDataType}
            onContentChange={setPageDataType}
            class='flex-1 min-h-0 [&>.cm-editor]:h-full [&>.cm-editor]:min-h-0'
          />
          <p class='text-xs text-neutral-400'>
            Provide the structure returned from `loadPageData`. This snippet becomes the
            interface&apos;s TypeScript contract.
          </p>
        </div>
      ),
    },
    {
      key: TAB_HANDLER,
      label: 'Handler',
      content: (
        <div class='flex h-full min-h-0 flex-col'>
          <CodeEditorPanel
            code={handlerCode}
            description={handlerDescription}
            messages={handlerMessagesText}
            onCodeChange={setHandlerCode}
            onDescriptionChange={setHandlerDescription}
            onMessagesChange={setHandlerMessagesText}
            placeholder='export async function loadPageData(...) { ... }'
          />
        </div>
      ),
    },
    {
      key: TAB_PAGE,
      label: 'Page',
      content: (
        <div class='flex h-full min-h-0 flex-col'>
          <CodeEditorPanel
            code={pageCode}
            description={pageDescription}
            messages={pageMessagesText}
            onCodeChange={setPageCode}
            onDescriptionChange={setPageDescription}
            onMessagesChange={setPageMessagesText}
            placeholder='export default function InterfacePage({ data }: { data?: InterfacePageData }) { ... }'
          />
        </div>
      ),
    },
  ];

  const handleSave = () => {
    if (!onDetailsChange) {
      onClose();
      return;
    }

    const nextDetails: Partial<EaCInterfaceDetails> = {
      Imports: parseImports(importsText),
      PageDataType: pageDataType.trim().length ? pageDataType : undefined,
      PageHandler: buildCodeBlock(
        resolvedDetails.PageHandler,
        handlerCode,
        handlerDescription,
        parseMessages(handlerMessagesText),
        handlerMessageGroups,
      ),
      Page: buildCodeBlock(
        resolvedDetails.Page,
        pageCode,
        pageDescription,
        parseMessages(pageMessagesText),
        pageMessageGroups,
      ),
    };

    onDetailsChange(nextDetails);
    onClose();
  };

  return (
    <Modal
      title={`Interface: ${resolvedDetails.Name ?? interfaceLookup}`}
      onClose={onClose}
      class='max-w-[1200px] border border-neutral-700 bg-neutral-900'
      style={{ height: '90vh' }}
    >
      <div
        class='flex h-full min-h-0 flex-row gap-4 bg-neutral-900'
        style={{ height: '75vh' }}
      >
        <div class='w-2/3 flex min-h-0 flex-col gap-3'>
          <TabbedPanel
            tabs={tabData}
            activeTab={activeTab}
            onTabChange={(key) => {
              if (
                key === TAB_IMPORTS ||
                key === TAB_DATA ||
                key === TAB_HANDLER ||
                key === TAB_PAGE
              ) {
                setActiveTab(key as SurfaceInterfaceTabKey);
              }
            }}
            stickyTabs
            scrollableContent
            class='flex-1 min-h-0'
          />

          <div class='flex justify-end gap-2'>
            <Action
              styleType={ActionStyleTypes.Outline | ActionStyleTypes.Rounded}
              intentType={IntentTypes.Secondary}
              onClick={onClose}
            >
              Cancel
            </Action>
            <Action
              styleType={ActionStyleTypes.Solid | ActionStyleTypes.Rounded}
              intentType={IntentTypes.Primary}
              onClick={handleSave}
            >
              Save Changes
            </Action>
          </div>
        </div>

        <div class='w-1/3 min-h-0 border-l border-gray-700 pl-4 overflow-y-auto'>
          {interfaceAzi
            ? (
              <AziPanel
                workspaceMgr={workspaceMgr}
                aziMgr={interfaceAzi}
                renderMessage={(message) => marked.parse(message) as string}
                extraInputs={extraInputs}
              />
            )
            : (
              <div class='flex h-full items-center justify-center text-sm text-neutral-500'>
                Initializing interface collaborator...
              </div>
            )}
        </div>
      </div>
    </Modal>
  );
}

type CodeEditorPanelProps = {
  code: string;
  description: string;
  messages: string;
  onCodeChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onMessagesChange: (value: string) => void;
  placeholder: string;
};

function CodeEditorPanel({
  code,
  description,
  messages,
  onCodeChange,
  onDescriptionChange,
  onMessagesChange,
  placeholder,
}: CodeEditorPanelProps) {
  return (
    <div class='flex flex-1 min-h-0 flex-col gap-3'>
      <CodeMirrorEditor
        fileContent={code}
        onContentChange={onCodeChange}
        placeholder={placeholder}
        class='flex-1 min-h-[320px] [&>.cm-editor]:h-full [&>.cm-editor]:min-h-0'
      />
      <textarea
        class='h-16 w-full resize-none rounded border border-neutral-700 bg-neutral-950 p-2 text-sm text-neutral-200 outline-none focus:border-teal-400'
        placeholder='Optional description for this code block'
        value={description}
        onInput={(event) => onDescriptionChange((event.target as HTMLTextAreaElement).value)}
      />
      <textarea
        class='h-24 w-full resize-none rounded border border-neutral-800 bg-neutral-950 p-2 text-xs text-neutral-300 outline-none focus:border-teal-400'
        placeholder='Guidance messages (one per line) to share with AI collaborators'
        value={messages}
        onInput={(event) => onMessagesChange((event.target as HTMLTextAreaElement).value)}
      />
    </div>
  );
}

function formatImports(imports?: string[]): string {
  return (imports ?? []).join('\n');
}

function parseImports(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length);
}

function formatMessages(messages?: string[]): string {
  return (messages ?? []).join('\n');
}

function parseMessages(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length);
}

function buildCodeBlock(
  base: EaCInterfaceCodeBlock | undefined,
  code: string,
  description: string,
  messages: string[],
  messageGroups: EaCInterfaceCodeBlock['MessageGroups'] | undefined,
): EaCInterfaceCodeBlock | undefined {
  const trimmedCode = code.trim();
  const trimmedDescription = description.trim();
  const hasMessages = messages.length > 0;
  const hasGroups = messageGroups && messageGroups.length > 0;

  if (!trimmedCode && !trimmedDescription && !hasMessages && !hasGroups) {
    return undefined;
  }

  return {
    ...(base ?? {}),
    ...(trimmedCode ? { Code: trimmedCode } : { Code: undefined }),
    ...(trimmedDescription ? { Description: trimmedDescription } : { Description: undefined }),
    ...(hasMessages ? { Messages: messages } : { Messages: undefined }),
    ...(hasGroups ? { MessageGroups: messageGroups } : { MessageGroups: undefined }),
  };
}
