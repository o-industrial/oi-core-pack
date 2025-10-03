import { IntentTypes, ReactPosition } from '../../.deps.ts';
import { Action, ActionStyleTypes } from '../../.deps.ts';
import { NodeHandle } from '../../.deps.ts';
import { WorkspaceNodeRendererBase } from '../../.deps.ts';
import { NodeProps } from '../../.deps.ts';
import { SurfaceInterfaceNodeData } from './SurfaceInterfaceNodeData.ts';

export default function SurfaceInterfaceNodeRenderer({
  id,
  data,
}: NodeProps<SurfaceInterfaceNodeData>) {
  const providers = data.details?.Spec?.Data?.Providers?.length ?? 0;
  const bindings = Object.keys(data.details?.Spec?.Data?.Bindings ?? {}).length;
  const actions = data.details?.Spec?.Actions?.length ?? 0;
  const layoutNodes = data.details?.Spec?.Layout?.length ?? 0;
  const webPath = data.details.WebPath ?? '/w/:workspace/ui/:interface';
  const editorRoute = `/workspace/interface/${id}`;
  const modeShortcuts: Array<{
    key: 'overview' | 'visual' | 'code' | 'preview';
    label: string;
    href: string;
    intent: IntentTypes;
  }> = [
    { key: 'overview', label: 'Overview', href: editorRoute, intent: IntentTypes.Tertiary },
    {
      key: 'visual',
      label: 'Visual',
      href: `${editorRoute}?mode=visual`,
      intent: IntentTypes.Primary,
    },
    { key: 'code', label: 'Code', href: `${editorRoute}?mode=code`, intent: IntentTypes.Secondary },
    {
      key: 'preview',
      label: 'Preview',
      href: `${editorRoute}?mode=preview`,
      intent: IntentTypes.Info,
    },
  ];

  return (
    <WorkspaceNodeRendererBase
      iconKey='interface'
      label={data.label ?? data.details.Name ?? data.type}
      enabled={data.enabled}
      onDoubleClick={data.onDoubleClick}
      isSelected={data.isSelected}
      preMain={
        <NodeHandle
          type='target'
          position={ReactPosition.Left}
          intentType={IntentTypes.Secondary}
        />
      }
      postMain={
        <NodeHandle
          type='source'
          position={ReactPosition.Right}
          intentType={IntentTypes.Primary}
        />
      }
      class='transition-[width,height] data-[state=expanded]:w-[320px] data-[state=expanded]:h-auto'
    >
      <div class='flex w-full flex-col gap-2 px-3 pb-3 pt-2 text-xs text-slate-200'>
        <div class='rounded border border-slate-800 bg-slate-900/70 px-3 py-2 text-[11px] text-slate-300'>
          <span class='font-semibold text-slate-100'>Route:</span>
          <span class='ml-2 font-mono text-teal-200'>{webPath}</span>
        </div>

        <div class='grid grid-cols-2 gap-2'>
          <div class='rounded border border-slate-800/70 bg-slate-900/60 p-2 text-center'>
            <p class='text-[10px] uppercase tracking-wide text-slate-500'>Providers</p>
            <p class='text-lg font-semibold text-slate-100'>{providers}</p>
          </div>
          <div class='rounded border border-slate-800/70 bg-slate-900/60 p-2 text-center'>
            <p class='text-[10px] uppercase tracking-wide text-slate-500'>Bindings</p>
            <p class='text-lg font-semibold text-slate-100'>{bindings}</p>
          </div>
          <div class='rounded border border-slate-800/70 bg-slate-900/60 p-2 text-center'>
            <p class='text-[10px] uppercase tracking-wide text-slate-500'>Actions</p>
            <p class='text-lg font-semibold text-slate-100'>{actions}</p>
          </div>
          <div class='rounded border border-slate-800/70 bg-slate-900/60 p-2 text-center'>
            <p class='text-[10px] uppercase tracking-wide text-slate-500'>Layout Nodes</p>
            <p class='text-lg font-semibold text-slate-100'>{layoutNodes}</p>
          </div>
        </div>

        <div class='flex flex-wrap items-center justify-between gap-2'>
          <div class='flex flex-wrap gap-2'>
            {modeShortcuts.map((shortcut) => (
              <Action
                key={`interface-node-shortcut-${id}-${shortcut.key}`}
                href={shortcut.href}
                target='_blank'
                rel='noreferrer'
                styleType={ActionStyleTypes.Outline |
                  ActionStyleTypes.UltraThin |
                  ActionStyleTypes.Rounded}
                intentType={shortcut.intent}
              >
                {shortcut.label}
              </Action>
            ))}
          </div>
          <Action
            title='Open Interface Inspector'
            styleType={ActionStyleTypes.Solid | ActionStyleTypes.Rounded}
            intentType={IntentTypes.Primary}
            onClick={() => data.onDoubleClick?.()}
          >
            Manage
          </Action>
        </div>
      </div>
    </WorkspaceNodeRendererBase>
  );
}
