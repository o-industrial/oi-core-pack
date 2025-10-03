import { IntentTypes } from '../../.deps.ts';
import { JSX, useEffect, useMemo, useRef, useState } from '../../.deps.ts';
import { Action, ActionStyleTypes, Input, InspectorBase } from '../../.deps.ts';
import { InspectorCommonProps } from '../../.deps.ts';
import type { EaCInterfaceDetails, InterfaceSpec, SurfaceInterfaceSettings } from '../../.deps.ts';
import type { SurfaceInterfaceStats } from './SurfaceInterfaceStats.tsx';
import { SurfaceInterfaceModal } from './SurfaceInterfaceModal.tsx';

type SurfaceInterfaceInspectorProps = InspectorCommonProps<
  EaCInterfaceDetails & SurfaceInterfaceSettings,
  SurfaceInterfaceStats
>;

const NAME_MAX_LENGTH = 30;
const DESCRIPTION_MAX_LENGTH = 200;
const WEB_PATH_MAX_LENGTH = 30;

export function SurfaceInterfaceInspector({
  lookup,
  surfaceLookup,
  details,
  enabled,
  onDelete,
  onDetailsChanged,
  onToggleEnabled,
  useStats,
  workspaceMgr,
}: SurfaceInterfaceInspectorProps): JSX.Element {
  const stats = useStats();
  const [isModalOpen, setModalOpen] = useState(false);

  const resolvedDetails = useMemo(
    () => ensureInterfaceDetails(details, lookup),
    [details, lookup],
  );
  const resolvedSpec = resolvedDetails.Spec;

  const [name, setName] = useState(details.Name ?? '');
  const [description, setDescription] = useState(details.Description ?? '');
  const [webPath, setWebPath] = useState(details.WebPath ?? '');

  const userEditedRef = useRef(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => setName(details.Name ?? ''), [details.Name]);
  useEffect(
    () => setDescription(details.Description ?? ''),
    [details.Description],
  );
  useEffect(
    () => setWebPath(details.WebPath ? sanitizeWebPath(details.WebPath) : ''),
    [details.WebPath],
  );

  useEffect(() => {
    workspaceMgr.CreateInterfaceAziIfNotExist?.(lookup);
  }, [workspaceMgr, lookup]);

  useEffect(() => {
    if (!onDetailsChanged || !userEditedRef.current) {
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = globalThis.setTimeout(() => {
      onDetailsChanged({
        Name: name,
        Description: description,
        WebPath: webPath,
      });
      debounceRef.current = null;
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [name, description, webPath, onDetailsChanged]);

  const nameInvalid = name.trim().length === 0;
  const descriptionInvalid = description.trim().length === 0;
  const webPathInvalid = webPath.trim().length === 0;
  const lastPublished = stats?.LastPublishedAt
    ? new Date(stats.LastPublishedAt).toLocaleString()
    : 'Never';

  return (
    <>
      <InspectorBase
        iconKey='interface'
        label={name || 'Interface Node'}
        enabled={enabled}
        impulseRates={[]}
        onToggleEnabled={onToggleEnabled}
        onDelete={onDelete}
      >
        <div class='space-y-4 text-sm text-slate-200'>
          <section class='space-y-2'>
            <Input
              label='Name'
              value={name}
              maxLength={NAME_MAX_LENGTH}
              intentType={nameInvalid ? IntentTypes.Error : undefined}
              placeholder='interface-your-node'
              onInput={(event: JSX.TargetedEvent<HTMLInputElement, Event>) => {
                userEditedRef.current = true;
                setName((event.currentTarget as HTMLInputElement).value);
              }}
            />
          </section>

          <section class='space-y-2'>
            <Input
              label='Description'
              multiline
              rows={3}
              value={description}
              maxLength={DESCRIPTION_MAX_LENGTH}
              intentType={descriptionInvalid ? IntentTypes.Error : undefined}
              placeholder='Describe the purpose of this HMI page'
              onInput={(
                event: JSX.TargetedEvent<HTMLTextAreaElement, Event>,
              ) => {
                userEditedRef.current = true;
                setDescription(
                  (event.currentTarget as HTMLTextAreaElement).value,
                );
              }}
            />
          </section>

          <section class='space-y-2'>
            <Input
              label='Web Path'
              value={webPath}
              maxLength={WEB_PATH_MAX_LENGTH}
              intentType={webPathInvalid ? IntentTypes.Error : undefined}
              placeholder='/w/:workspace/ui/:interface'
              onInput={(event: JSX.TargetedEvent<HTMLInputElement, Event>) => {
                userEditedRef.current = true;
                const input = event.currentTarget as HTMLInputElement;
                const filtered = sanitizeWebPath(input.value).slice(
                  0,
                  WEB_PATH_MAX_LENGTH,
                );
                input.value = filtered;
                setWebPath(filtered);
              }}
              onKeyDown={(
                event: JSX.TargetedKeyboardEvent<HTMLInputElement>,
              ) => {
                const allowed = [
                  'Backspace',
                  'Delete',
                  'ArrowLeft',
                  'ArrowRight',
                  'ArrowUp',
                  'ArrowDown',
                  'Tab',
                  'Home',
                  'End',
                ];
                const key = event.key;
                const ctrl = event.ctrlKey || event.metaKey;
                if (
                  !/^[a-z0-9-]$/.test(key) &&
                  !ctrl &&
                  !allowed.includes(key)
                ) {
                  event.preventDefault();
                }
              }}
            />
          </section>

          <section class='rounded border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400'>
            <p class='font-semibold text-slate-300'>Publish Summary</p>
            <ul class='mt-2 space-y-1'>
              <li>
                Published Version:{' '}
                <span class='font-semibold text-slate-100'>
                  v{details.Version ?? 1}
                </span>
              </li>
              <li>
                Last Published:{' '}
                <span class='font-semibold text-slate-100'>
                  {lastPublished}
                </span>
              </li>
              <li>
                Draft Path:{' '}
                <span class='font-semibold text-slate-100'>
                  {details.DraftState?.SpecPath ?? 'N/A'}
                </span>
              </li>
            </ul>
          </section>

          <div class='flex flex-col gap-2'>
            {resolvedDetails.WebPath && !webPathInvalid && (
              <Action
                href={resolvedDetails.WebPath}
                target='_blank'
                rel='noreferrer'
                styleType={ActionStyleTypes.Outline | ActionStyleTypes.Rounded}
                intentType={IntentTypes.Secondary}
              >
                Open Interface
              </Action>
            )}
            <Action
              type='button'
              styleType={ActionStyleTypes.Solid | ActionStyleTypes.Rounded}
              intentType={IntentTypes.Primary}
              disabled={nameInvalid || descriptionInvalid || webPathInvalid}
              onClick={() => setModalOpen(true)}
            >
              Manage Interface
            </Action>
          </div>
        </div>
      </InspectorBase>

      {isModalOpen && (
        <SurfaceInterfaceModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          interfaceLookup={lookup}
          surfaceLookup={surfaceLookup}
          details={resolvedDetails}
          settings={details as SurfaceInterfaceSettings}
          spec={resolvedSpec}
          draftSpec={undefined}
          workspaceMgr={workspaceMgr}
          onSpecChange={(next) => onDetailsChanged({ Spec: next })}
        />
      )}
    </>
  );
}

function sanitizeWebPath(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, '');
}

function ensureInterfaceDetails(
  details: Partial<EaCInterfaceDetails>,
  fallbackLookup: string,
): EaCInterfaceDetails {
  const fallbackName = details.Name?.trim()?.length ? details.Name : fallbackLookup;
  const fallbackVersion = details.Version ?? 1;

  return {
    Name: fallbackName,
    Description: details.Description,
    Version: fallbackVersion,
    WebPath: details.WebPath,
    Spec: ensureInterfaceSpec(details.Spec, fallbackName, fallbackVersion),
    ComponentTag: details.ComponentTag,
    EmbedOptions: details.EmbedOptions,
    Assets: details.Assets,
    DraftState: details.DraftState,
    Thumbnails: details.Thumbnails,
  };
}

function ensureInterfaceSpec(
  spec: InterfaceSpec | undefined,
  fallbackName: string,
  fallbackVersion: number,
): InterfaceSpec {
  const defaultSpec: InterfaceSpec = {
    Meta: {
      Name: fallbackName,
      Version: fallbackVersion,
      Theme: 'default',
    },
    Data: { Providers: [], Bindings: {} },
    Layout: [
      {
        ID: 'root',
        Type: 'Container',
        IsContainer: true,
        Props: {
          className:
            'flex min-h-[320px] flex-col gap-4 bg-slate-950/80 p-6 rounded-xl border border-slate-800',
        },
        Children: [
          {
            ID: 'headline',
            Type: 'Text',
            Props: {
              value: 'Interface title',
              className: 'text-2xl font-semibold text-slate-100',
            },
          },
          {
            ID: 'subtitle',
            Type: 'Text',
            Props: {
              value: 'Describe the purpose of this HMI page',
              className: 'text-sm text-slate-400',
            },
          },
        ],
      },
    ],
    Actions: [],
  };

  if (!spec) {
    return defaultSpec;
  }

  const meta = spec.Meta ?? {
    Name: fallbackName,
    Version: fallbackVersion,
  };

  const layout = spec.Layout?.length ? spec.Layout : defaultSpec.Layout;

  return {
    ...spec,
    Meta: {
      ...meta,
      Name: meta.Name ?? fallbackName,
      Version: meta.Version ?? fallbackVersion,
      Theme: meta.Theme ?? defaultSpec.Meta.Theme,
    },
    Data: spec.Data ?? defaultSpec.Data,
    Layout: layout,
    Actions: spec.Actions ?? defaultSpec.Actions,
  };
}
