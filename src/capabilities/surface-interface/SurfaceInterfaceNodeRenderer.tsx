import {
  Action,
  ActionStyleTypes,
  EaCInterfaceCodeBlock,
  EaCInterfaceGeneratedDataSlice,
  IntentTypes,
  interfacePageDataToSchema,
  JSONSchema7,
  NodeHandle,
  NodeProps,
  ReactPosition,
  WorkspaceNodeRendererBase,
} from '../../.deps.ts';
import { SurfaceInterfaceNodeData } from './SurfaceInterfaceNodeData.ts';

export default function SurfaceInterfaceNodeRenderer({
  data,
}: NodeProps<SurfaceInterfaceNodeData>) {
  const importCount = data.details?.Imports?.length ?? 0;
  const handlerSummary = summarizeCodeBlock(data.details?.PageHandler);
  const pageSummary = summarizeCodeBlock(data.details?.Page);
  const combinedSchema = interfacePageDataToSchema(data.details?.PageDataType);
  const dataShapePreview = summarizeSchema(combinedSchema);
  const generatedSlices: EaCInterfaceGeneratedDataSlice[] = data.details?.PageDataType?.Generated
    ? Object.values(data.details.PageDataType.Generated)
    : [];
  const activeSliceCount = generatedSlices.filter((slice) => slice.Enabled !== false).length;

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
      <div class='flex w-full flex-col gap-3 px-3 pb-3 pt-2 text-xs text-slate-200'>
        <div class='rounded border border-slate-800 bg-slate-900/70 px-3 py-2 text-[11px] text-slate-300'>
          <p class='font-semibold text-slate-100'>Data Contract</p>
          <p class='mt-1 font-mono text-teal-200'>{dataShapePreview}</p>
        </div>

        <div class='grid grid-cols-4 gap-2'>
          <MetricTile label='Imports' value={importCount.toString()} />
          <MetricTile label='Handler' value={handlerSummary} />
          <MetricTile label='Data Slices' value={activeSliceCount.toString()} />
          <MetricTile label='Page' value={pageSummary} />
        </div>

        <div class='flex justify-end'>
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

type MetricTileProps = {
  label: string;
  value: string;
};

function MetricTile({ label, value }: MetricTileProps) {
  return (
    <div class='rounded border border-slate-800/70 bg-slate-900/60 p-2 text-center'>
      <p class='text-[10px] uppercase tracking-wide text-slate-500'>{label}</p>
      <p class='text-lg font-semibold text-slate-100'>{value}</p>
    </div>
  );
}

function summarizeCodeBlock(block?: EaCInterfaceCodeBlock): string {
  if (!block) return 'Guided';
  const hasCode = block.Code?.trim()?.length ?? 0;
  const messageCount = block.Messages?.length ?? 0;
  const groupCount = block.MessageGroups?.length ?? 0;

  if (hasCode) {
    return 'Code';
  }

  const totalGuidance = messageCount + groupCount;
  return totalGuidance > 0 ? `${totalGuidance} cues` : 'Pending';
}

function summarizeSchema(schema?: JSONSchema7): string {
  if (!schema) return 'Schema pending';

  const schemaObj = schema as {
    title?: unknown;
    type?: unknown;
    properties?: Record<string, JSONSchema7>;
  };

  const title = typeof schemaObj.title === 'string' && schemaObj.title.trim().length > 0
    ? schemaObj.title.trim()
    : undefined;
  if (title) return title;

  const type = schemaObj.type;
  const properties = schemaObj.properties;
  if (type === 'object' && properties && typeof properties === 'object') {
    const keys = Object.keys(properties);
    if (keys.length > 0) {
      const preview = keys.slice(0, 3).join(', ');
      return `{ ${preview}${keys.length > 3 ? ', ...' : ''} }`;
    }
    return 'object';
  }

  if (typeof type === 'string') return type;

  return 'JSON Schema';
}
