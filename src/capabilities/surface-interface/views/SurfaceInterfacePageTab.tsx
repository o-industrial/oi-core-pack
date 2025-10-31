import { Badge, IntentTypes, type JSX } from '../../../.deps.ts';
import { FramedCodeEditor } from '../../../components/code/FramedCodeEditor.tsx';
import type {
  SurfaceInterfaceModalPageActionDoc,
  SurfaceInterfaceModalPageDocs,
  SurfaceInterfaceModalPageHandlerStepDoc,
  SurfaceInterfaceModalPageSliceDoc,
  SurfaceInterfaceModalPageSliceFieldDoc,
  SurfaceInterfaceModalPageStatusFieldDoc,
} from './state/SurfaceInterfaceModalPageDocs.ts';

type SurfaceInterfacePageTabProps = {
  imports: string[];
  pageDocs: SurfaceInterfaceModalPageDocs;
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
  pageDocs,
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
      <PageApiSummary docs={pageDocs} />
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

function PageApiSummary({ docs }: { docs: SurfaceInterfaceModalPageDocs }): JSX.Element {
  return (
    <section class='rounded-lg border border-neutral-800 bg-neutral-950 text-sm text-neutral-200'>
      <details open class='flex flex-col'>
        <summary class='flex cursor-pointer items-center justify-between gap-3 px-4 py-3'>
          <div class='space-y-1'>
            <h3 class='text-sm font-semibold text-neutral-100'>Page data</h3>
            <p class='text-xs text-neutral-400'>
              Reference for the data, services, status, and refresh helpers available inside the
              page block.
            </p>
          </div>
        </summary>

        <div class='space-y-4 border-t border-neutral-800 p-4 text-xs text-neutral-300'>
          <DataSection slices={docs.dataSlices} />
          <ServicesSection services={docs.services} />
          <StatusRefreshSection
            statusFields={docs.statusFields}
            refreshDescription={docs.refreshDescription}
          />
        </div>
      </details>
    </section>
  );
}

function DataSection({ slices }: { slices: SurfaceInterfaceModalPageSliceDoc[] }): JSX.Element {
  if (slices.length === 0) {
    return (
      <div class='text-xs text-neutral-500'>
        No generated slices yet. Configure data connections to populate data.*.
      </div>
    );
  }

  return (
    <div class='space-y-2'>
      <h4 class='text-[11px] font-semibold uppercase tracking-wide text-neutral-400'>data.*</h4>
      <ul class='space-y-3'>
        {slices.map((slice) => (
          <li
            key={slice.key}
            class='space-y-2 rounded border border-neutral-800 bg-neutral-900/60 p-3'
          >
            <div class='flex flex-wrap items-center gap-2 text-sm text-neutral-100'>
              <span class='font-semibold text-neutral-100'>data.{slice.key}</span>
              <span class='text-[11px] text-neutral-500'>Access: {slice.accessMode ?? 'both'}</span>
              <span class='text-[11px] text-neutral-500'>Hydration: {formatHydration(slice)}</span>
            </div>
            {slice.description && <p class='text-xs text-neutral-400'>{slice.description}</p>}
            {slice.schemaFields.length > 0 && (
              <div class='text-[11px] text-neutral-500'>
                Fields: {slice.schemaFields.map(formatField).join('; ')}
              </div>
            )}
            {slice.actions.length > 0 && (
              <div class='space-y-1 text-[11px] text-neutral-500'>
                <div class='font-semibold uppercase tracking-wide text-neutral-400'>Actions</div>
                <ul class='space-y-1'>
                  {slice.actions.map((action) => <li key={action.key}>{formatAction(action)}</li>)}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ServicesSection(
  { services }: { services: SurfaceInterfaceModalPageDocs['services'] },
): JSX.Element {
  if (services.length === 0) {
    return (
      <div class='text-xs text-neutral-500'>
        No handler services yet. Add handler actions to expose services.*.
      </div>
    );
  }

  return (
    <div class='space-y-2'>
      <h4 class='text-[11px] font-semibold uppercase tracking-wide text-neutral-400'>services.*</h4>
      <ul class='space-y-2 text-xs text-neutral-300'>
        {services.map((service) => (
          <li key={`${service.sliceKey}-${service.actionKey}-${service.methodName}`}>
            <div class='font-semibold text-neutral-100'>
              services.{service.methodName}({service.hasInput ? service.inputType : ''}) =&gt;
              Promise&lt;{service.outputType}&gt;
            </div>
            <div class='text-[11px] text-neutral-500'>
              Targets {service.sliceLabel ?? service.sliceKey} - {service.actionLabel}
            </div>
            <div class='text-[11px] text-neutral-500'>
              Invocation: {service.invocationType ?? 'standard'} |{' '}
              {service.autoExecute ? 'auto' : 'manual'} | {service.includeInResponse
                ? 'stores data.' + service.resultName
                : 'no handler response update'}
            </div>
            {service.notes.length > 0 && (
              <div class='text-[11px] text-neutral-500'>{service.notes.join(' ')}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusRefreshSection(
  { statusFields, refreshDescription }: {
    statusFields: SurfaceInterfaceModalPageStatusFieldDoc[];
    refreshDescription: string;
  },
): JSX.Element {
  return (
    <div class='space-y-2 text-xs text-neutral-300'>
      <h4 class='text-[11px] font-semibold uppercase tracking-wide text-neutral-400'>
        status & refresh
      </h4>
      <ul class='space-y-1'>
        {statusFields.map((field) => (
          <li key={field.key}>
            <span class='font-semibold text-neutral-100'>status.{field.key}</span>
            <span class='text-neutral-500'>- {field.description}</span>
          </li>
        ))}
      </ul>
      <p class='text-neutral-400'>refresh(): Promise&lt;void&gt; - {refreshDescription}</p>
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
            <h3 class='text-sm font-semibold text-neutral-100'>Page imports</h3>
            <p class='text-xs text-neutral-400'>
              Code authored on this tab can reference these modules directly. Manage the list on the
              Imports tab.
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

function formatField(field: SurfaceInterfaceModalPageSliceFieldDoc): string {
  const name = field.required ? field.name : `${field.name}?`;
  const type = field.type ?? 'unknown';
  return field.description ? `${name}: ${type} - ${field.description}` : `${name}: ${type}`;
}

function formatHydration(slice: SurfaceInterfaceModalPageSliceDoc): string {
  const parts: string[] = [];
  if (slice.hydration.server) parts.push('server');
  if (slice.hydration.client) {
    parts.push('client');
    if (typeof slice.hydration.clientRefreshMs === 'number') {
      parts.push(`client refresh ${slice.hydration.clientRefreshMs}ms`);
    }
  }
  return parts.length > 0 ? parts.join(' | ') : 'not configured';
}

function formatInvocation(type: string | undefined, mode: string | null | undefined): string {
  const invocationType = type?.trim() ? type : 'standard';
  const invocationMode = mode ?? 'handler and client';
  return `${invocationType} | ${invocationMode}`;
}

function formatSupport(handler: boolean, client: boolean): string {
  if (handler && client) return 'handler and client';
  if (handler) return 'handler only';
  if (client) return 'client only';
  return 'disabled';
}

function formatHandlerStep(step: SurfaceInterfaceModalPageHandlerStepDoc): string {
  const parts: string[] = [];
  if (step.includeInResponse) {
    parts.push(`stores data.${step.resultName}`);
  } else {
    parts.push(`updates data.${step.resultName}`);
  }
  parts.push(step.autoExecute ? 'auto' : 'manual');
  if (step.serviceMethods.length > 0) {
    parts.push(`calls services.${formatServiceMethods(step.serviceMethods)}`);
  }
  if (step.notes) {
    parts.push(step.notes);
  }
  return parts.join(' | ');
}

function formatAction(action: SurfaceInterfaceModalPageActionDoc): string {
  const parts: string[] = [];
  parts.push(`${action.label} (${formatInvocation(action.invocationType, action.invocationMode)})`);
  if (action.description) parts.push(action.description);
  parts.push(`available in ${formatSupport(action.support.handler, action.support.client)}`);
  if (action.handlerSteps.length > 0) {
    parts.push(action.handlerSteps.map((step) => formatHandlerStep(step)).join(' | '));
  }
  return parts.join(' | ');
}

function formatServiceMethods(methods: string[]): string {
  return methods.map((method) => `${method}()`).join(', ');
}
