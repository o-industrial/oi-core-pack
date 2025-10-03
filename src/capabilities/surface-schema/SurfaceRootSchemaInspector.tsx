// deno-lint-ignore-file no-explicit-any
import { InspectorBase, JSX, NodeStatTile, TabbedPanel } from '../../.deps.ts';
import { EaCRootSchemaDetails } from '../../.deps.ts';
import { InspectorCommonProps } from '../../.deps.ts';
import { SurfaceStats } from '../surface/SurfaceStats.ts';

type SurfaceRootSchemaInspectorProps = InspectorCommonProps<
  EaCRootSchemaDetails,
  SurfaceStats
>;

function SchemaDefinitionTab({ details }: { details: EaCRootSchemaDetails }) {
  const fallbackSchema = {
    schema: 'SensorReading',
    description:
      'A structured representation of raw environmental telemetry data for HVAC, safety, and energy optimization.',
    purpose:
      'This schema allows AI and reflex agents to reason about environmental comfort, detect anomalies, and trigger building automations.',
    fields: {
      temperature: {
        type: 'number',
        description: 'Ambient temperature in Celsius.',
      },
      humidity: {
        type: 'number',
        description: 'Relative humidity percentage.',
      },
      co2: {
        type: 'number',
        description: 'Carbon dioxide concentration in ppm.',
      },
      location: {
        type: 'string',
        description: 'Sensor location (zone, room, or label).',
      },
    },
  };

  const schema = details.Schema ?? fallbackSchema;

  return (
    <div class='space-y-3 text-sm mt-2'>
      <div>
        <div class='text-neutral-400'>Name</div>
        <div class='font-medium'>{details.Name ?? 'SensorReading'}</div>
      </div>

      <div>
        <div class='text-neutral-400'>Description</div>
        <div>{details.Description ?? fallbackSchema.description}</div>
      </div>

      <div>
        <div class='text-neutral-400'>Purpose</div>
        <div>{(schema as any).purpose ?? fallbackSchema.purpose}</div>
      </div>

      <div>
        <div class='text-neutral-400'>Version</div>
        <div>{details.Version ?? '1.0.0'}</div>
      </div>

      <div>
        <div class='text-neutral-400 mb-1'>JSON Schema</div>
        <pre class='text-xs bg-neutral-900 p-3 rounded-lg overflow-auto max-h-64'>
          {JSON.stringify(schema, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function FieldMappingTab({ details }: { details: EaCRootSchemaDetails }) {
  const defaultMap = {
    temperature: {
      Source: 'impulse.payload.tempC',
      Required: true,
      Description: 'Extracted from incoming telemetry payload (tempC)',
    },
    humidity: {
      Source: 'impulse.payload.humidityRaw',
      Expression: 'value * 0.01',
      Description: 'Convert raw humidity to percentage',
    },
    co2: {
      Source: 'impulse.payload.air.CO2',
      Default: 400,
      Description: 'Fallback to 400ppm if not present',
    },
    location: {
      Source: 'surface.metadata.zoneId',
      Required: true,
    },
  };

  const jsonMap = details.DataConnectionSchemaMap ?? defaultMap;

  return (
    <div class='mt-2 text-sm space-y-4'>
      {Object.entries(jsonMap).map(([targetField, rule]) => (
        <div
          key={targetField}
          class='bg-neutral-900 p-4 rounded-xl border border-border text-xs'
        >
          <div class='flex justify-between items-center mb-1'>
            <strong class='text-white'>{targetField}</strong>
            <span class='text-neutral-500'>
              ← {typeof rule.Source === 'string' ? rule.Source : '[compound source]'}
            </span>
          </div>
          {rule.Expression && (
            <div class='text-neutral-400 mb-1'>
              Expression: <code>{rule.Expression}</code>
            </div>
          )}
          {rule.Default !== undefined && (
            <div class='text-neutral-400 mb-1'>
              Default: <code>{JSON.stringify(rule.Default)}</code>
            </div>
          )}
          {rule.Description && <div class='text-neutral-400'>{rule.Description}</div>}
        </div>
      ))}
    </div>
  );
}

function RootSchemaAnalyticsTab() {
  return (
    <div class='grid grid-cols-3 gap-2 mt-2'>
      <NodeStatTile label='Status' value='✅' />
      <NodeStatTile label='Version' value='Live' />
      <NodeStatTile label='Linked Input' value='✔︎' />
    </div>
  );
}

function RootSchemaStreamTab() {
  return (
    <p class='text-sm text-neutral-300 mt-2'>
      📡 Streamed impulse logs will appear here when the schema is live.
    </p>
  );
}

export function SurfaceRootSchemaInspector({
  details,
  enabled,
  useStats,
  onDelete,
  onDetailsChanged: _,
  onToggleEnabled,
}: SurfaceRootSchemaInspectorProps): JSX.Element {
  const stats = useStats();

  return (
    <InspectorBase
      iconKey='schema'
      label={details.Name ?? 'Root Schema'}
      enabled={enabled}
      impulseRates={stats?.ImpulseRates ?? []}
      onToggleEnabled={onToggleEnabled}
      onDelete={onDelete}
    >
      <TabbedPanel
        initialTab='schema'
        class='mt-2'
        tabs={[
          {
            key: 'schema',
            label: 'Schema',
            content: <SchemaDefinitionTab details={details as EaCRootSchemaDetails} />,
          },
          {
            key: 'mapping',
            label: 'Field Mapping',
            content: <FieldMappingTab details={details as EaCRootSchemaDetails} />,
          },
          {
            key: 'analytics',
            label: 'Analytics',
            content: <RootSchemaAnalyticsTab />,
          },
          {
            key: 'stream',
            label: 'Impulse Stream',
            content: <RootSchemaStreamTab />,
          },
        ]}
      />
    </InspectorBase>
  );
}
