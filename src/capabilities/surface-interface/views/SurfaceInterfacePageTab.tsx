import {
  Badge,
  IntentTypes,
  type JSX,
} from '../../../.deps.ts';
import { FramedCodeEditor } from '../../../components/code/FramedCodeEditor.tsx';

type SurfaceInterfacePageTabProps = {
  imports: string[];
  prefix: string;
  body: string;
  suffix: string;
  description: string;
  messages: string;
  onBodyChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onMessagesChange: (value: string) => void;
};

export function SurfaceInterfacePageTab({
  imports,
  prefix,
  body,
  suffix,
  description,
  messages,
  onBodyChange,
  onDescriptionChange,
  onMessagesChange,
}: SurfaceInterfacePageTabProps): JSX.Element {
  return (
    <div class='flex h-full min-h-0 flex-col gap-4'>
      <PageImportsSummary imports={imports} />
      <CodeEditorPanel
        prefix={prefix}
        body={body}
        suffix={suffix}
        description={description}
        messages={messages}
        onBodyChange={onBodyChange}
        onDescriptionChange={onDescriptionChange}
        onMessagesChange={onMessagesChange}
      />
    </div>
  );
}

function PageImportsSummary({ imports }: { imports: string[] }): JSX.Element {
  const hasImports = imports.length > 0;

  return (
    <section class='rounded-lg border border-neutral-800 bg-neutral-950 text-sm text-neutral-200'>
      <details open class='flex flex-col'>
        <summary class='flex cursor-pointer items-center justify-between gap-3 px-4 py-3'>
          <div class='space-y-1'>
            <h3 class='text-sm font-semibold text-neutral-100'>
              Page imports
            </h3>
            <p class='text-xs text-neutral-400'>
              Code authored on this tab can reference these modules directly. Manage the list from
              the Imports tab.
            </p>
          </div>
          <Badge intentType={hasImports ? IntentTypes.Secondary : IntentTypes.Info}>
            {hasImports
              ? `${imports.length} ${imports.length === 1 ? 'import' : 'imports'}`
              : 'None configured'}
          </Badge>
        </summary>

        <div class='flex flex-col gap-2 border-t border-neutral-800 p-4'>
          {hasImports
            ? (
              <ul class='max-h-48 space-y-1 overflow-y-auto pr-1 text-[13px]'>
                {imports.map((line, index) => (
                  <li
                    key={`${index}-${line}`}
                    class='truncate rounded border border-neutral-800 bg-neutral-900/70 px-2 py-1 font-mono text-xs'
                  >
                    {line}
                  </li>
                ))}
              </ul>
            )
            : (
              <p class='text-xs text-neutral-500'>
                No additional imports configured yet. Add shared dependencies on the Imports tab.
              </p>
            )}
        </div>
      </details>
    </section>
  );
}

type CodeEditorPanelProps = {
  prefix: string;
  body: string;
  suffix: string;
  description: string;
  messages: string;
  onBodyChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onMessagesChange: (value: string) => void;
};

function CodeEditorPanel({
  prefix,
  body,
  suffix,
  description,
  messages,
  onBodyChange,
  onDescriptionChange,
  onMessagesChange,
}: CodeEditorPanelProps): JSX.Element {
  return (
    <div class='flex flex-1 min-h-0 flex-col gap-3'>
      <FramedCodeEditor
        prefix={prefix}
        suffix={suffix}
        value={body}
        onChange={onBodyChange}
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
