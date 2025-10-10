import { IntentTypes } from '../../.deps.ts';
import { JSX, useEffect, useMemo, useRef, useState } from '../../.deps.ts';
import { Action, ActionStyleTypes, Input, InspectorBase } from '../../.deps.ts';
import { InspectorCommonProps } from '../../.deps.ts';
import type { EaCInterfaceDetails, SurfaceInterfaceSettings } from '../../.deps.ts';
import type { SurfaceInterfaceStats } from './SurfaceInterfaceStats.tsx';
import { SurfaceInterfaceModal } from './SurfaceInterfaceModal.tsx';
import { ensureInterfaceDetails, type InterfaceCodeBlock } from './interfaceDefaults.ts';

type SurfaceInterfaceInspectorProps = InspectorCommonProps<
  EaCInterfaceDetails & SurfaceInterfaceSettings,
  SurfaceInterfaceStats
>;

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

  const [name, setName] = useState(resolvedDetails.Name ?? '');
  const [description, setDescription] = useState(resolvedDetails.Description ?? '');
  const [webPath, setWebPath] = useState(resolvedDetails.WebPath ?? '');

  const userEditedRef = useRef(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => setName(resolvedDetails.Name ?? ''), [resolvedDetails.Name]);
  useEffect(
    () => setDescription(resolvedDetails.Description ?? ''),
    [resolvedDetails.Description],
  );
  useEffect(() => setWebPath(resolvedDetails.WebPath ?? ''), [resolvedDetails.WebPath]);

  const normalizedWebPath = normalizeWebPath(webPath);

  useEffect(() => {
    workspaceMgr.CreateInterfaceAziIfNotExist?.(lookup);
  }, [workspaceMgr, lookup]);

  useEffect(() => {
    if (!onDetailsChanged || !userEditedRef.current) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = globalThis.setTimeout(() => {
      onDetailsChanged({
        Name: name,
        Description: description,
        WebPath: normalizedWebPath,
      });
      debounceRef.current = null;
    }, 250);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [name, description, normalizedWebPath, onDetailsChanged]);

  const nameInvalid = name.trim().length === 0;
  const descriptionInvalid = description.trim().length === 0;
  const webPathInvalid = !normalizedWebPath;

  const importsCount = resolvedDetails.Imports?.length ?? 0;
  const handlerSummary = summarizeBlock(resolvedDetails.PageHandler);
  const pageSummary = summarizeBlock(resolvedDetails.Page);

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
              maxLength={60}
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
              label='Web Path'
              value={webPath}
              maxLength={200}
              intentType={webPathInvalid ? IntentTypes.Error : undefined}
              placeholder='/path/to/interface'
              helperText='Provide the route where this interface responds (leading slash required).'
              onInput={(event: JSX.TargetedEvent<HTMLInputElement, Event>) => {
                userEditedRef.current = true;
                setWebPath((event.currentTarget as HTMLInputElement).value);
              }}
              onBlur={() => {
                setWebPath((current) => normalizeWebPath(current) ?? '');
              }}
            />
          </section>

          <section class='space-y-2'>
            <Input
              label='Description'
              multiline
              rows={3}
              value={description}
              maxLength={200}
              intentType={descriptionInvalid ? IntentTypes.Error : undefined}
              placeholder='Describe the intent of this interface'
              onInput={(
                event: JSX.TargetedEvent<HTMLTextAreaElement, Event>,
              ) => {
                userEditedRef.current = true;
                setDescription((event.currentTarget as HTMLTextAreaElement).value);
              }}
            />
          </section>

          <section class='rounded border border-slate-800/70 bg-slate-900/60 p-3'>
            <h3 class='text-xs font-semibold uppercase tracking-wide text-slate-400'>
              Authoring Snapshot
            </h3>
            <div class='mt-2 grid grid-cols-3 gap-2 text-center text-[13px]'>
              <StatTile label='Imports' value={importsCount.toString()} />
              <StatTile label='Handler' value={handlerSummary} />
              <StatTile label='Page' value={pageSummary} />
            </div>
          </section>

          <section class='flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400'>
            <span>Last Published: {lastPublished}</span>
            <Action
              type='button'
              styleType={ActionStyleTypes.Solid | ActionStyleTypes.Rounded}
              intentType={IntentTypes.Primary}
              onClick={() => setModalOpen(true)}
            >
              Manage Interface
            </Action>
          </section>
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
          workspaceMgr={workspaceMgr}
          onDetailsChange={(next) => onDetailsChanged?.(next)}
        />
      )}
    </>
  );
}

type StatTileProps = {
  label: string;
  value: string;
};

function StatTile({ label, value }: StatTileProps) {
  return (
    <div class='rounded border border-slate-800 bg-slate-900/70 px-2 py-3'>
      <p class='text-[10px] uppercase tracking-wide text-slate-500'>{label}</p>
      <p class='mt-1 text-base font-semibold text-slate-100'>{value}</p>
    </div>
  );
}

function normalizeWebPath(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function summarizeBlock(block?: InterfaceCodeBlock): string {
  if (!block) return 'Pending';
  if (block.Code?.trim()?.length) return 'Code';

  const messageCount = block.Messages?.length ?? 0;
  const groupCount = block.MessageGroups?.length ?? 0;
  const total = messageCount + groupCount;

  return total > 0 ? `${total} cues` : 'Pending';
}
