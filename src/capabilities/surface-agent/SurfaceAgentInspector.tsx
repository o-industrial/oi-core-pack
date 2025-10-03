// deno-lint-ignore-file no-explicit-any
import { Input, InspectorBase, JSX, NodeStatTile, TabbedPanel } from '../../.deps.ts';
import { EaCAgentDetails } from '../../.deps.ts';
import { InspectorCommonProps } from '../../.deps.ts';
import { useState } from '../../.deps.ts';
import { SurfaceAgentStats } from './SurfaceAgentStats.tsx';

type SurfaceAgentInspectorProps = InspectorCommonProps<EaCAgentDetails, SurfaceAgentStats>;

function AgentAnalyticsTab({ stats }: { stats?: SurfaceAgentStats }) {
  const { MatchesHandled: matchesHandled = 0, AvgLatencyMs: avgLatencyMs = 0 } = stats ?? {};

  return (
    <div class='grid grid-cols-3 gap-2 mt-2'>
      <NodeStatTile label='Matches' value={matchesHandled} />
      <NodeStatTile label='Avg Latency' value={`${avgLatencyMs}ms`} />
    </div>
  );
}

function AgentStreamTab() {
  return (
    <p class='text-sm text-neutral-300'>
      📡 Streamed impulses and reflex logs will appear here.
    </p>
  );
}

function OpenAIAgentConfigForm({
  apiKey,
  systemPrompt,
  promptTemplate,
  onChange,
}: {
  apiKey: string;
  systemPrompt: string;
  promptTemplate: string;
  onChange: (updated: {
    apiKey: string;
    systemPrompt: string;
    promptTemplate: string;
  }) => void;
}) {
  return (
    <div class='space-y-4'>
      <div>
        <label class='text-sm font-medium'>OpenAI API Key</label>
        <Input
          placeholder='sk-...'
          value={apiKey}
          onChange={(e: any) => onChange({ apiKey: e.target.value, systemPrompt, promptTemplate })}
        />
      </div>

      <div>
        <label class='text-sm font-medium'>System Prompt</label>
        <Input
          multiline
          rows={4}
          placeholder='You are a helpful industrial agent that reasons using structured schema input...'
          value={systemPrompt}
          onChange={(e: any) => onChange({ apiKey, systemPrompt: e.target.value, promptTemplate })}
        />
      </div>

      <div>
        <label class='text-sm font-medium'>Prompt Template (Handlebars)</label>
        <Input
          multiline
          rows={6}
          placeholder='Use the schema fields to build a response...'
          value={promptTemplate}
          onChange={(e: any) => onChange({ apiKey, systemPrompt, promptTemplate: e.target.value })}
        />
      </div>

      <div>
        <label class='text-sm font-medium'>Schema Context</label>
        <pre class='text-xs text-neutral-400 bg-neutral-900 p-3 rounded-lg mt-1 overflow-auto max-h-64 whitespace-pre-wrap leading-snug'>
          {`{
  "schema": "SensorReading",
  "description": "A periodic environmental reading captured by a room or zone sensor array. Used to evaluate comfort, safety, and energy conditions in real-time.",
  "purpose": "To support reflex logic, alerting, and energy optimization by providing normalized environmental data points.",
  "fields": {
    "temperature": {
      "type": "number",
      "units": "celsius",
      "description": "The ambient temperature at the time of reading."
    },
    "humidity": {
      "type": "number",
      "units": "percent",
      "description": "Relative humidity level detected in the environment."
    },
    "unit": {
      "type": "string",
      "description": "Identifier of the reporting device or sensor zone (e.g. 'lab-west')."
    }
  }
}`}
        </pre>
      </div>
    </div>
  );
}

export function SurfaceAgentInspector({
  details,
  enabled,
  useStats,
  onDelete,
  onDetailsChanged,
  onToggleEnabled,
}: SurfaceAgentInspectorProps): JSX.Element {
  const stats = useStats();

  const [apiKey, setApiKey] = useState((details as any).OpenAIKey ?? '');
  const [systemPrompt, setSystemPrompt] = useState(
    (details as any).OpenAIPrompt ??
      'You are an industrial agent that responds using structured schema data.',
  );
  const [promptTemplate, setPromptTemplate] = useState(
    (details as any).OpenAIPromptTemplate ??
      `The current reading is {{temperature}}{{unit}} degrees with {{humidity}}% humidity.\nPlease respond in JSON format with a status and recommendation.`,
  );

  const handleSettingsChange = (updated: {
    apiKey: string;
    systemPrompt: string;
    promptTemplate: string;
  }) => {
    setApiKey(updated.apiKey);
    setSystemPrompt(updated.systemPrompt);
    setPromptTemplate(updated.promptTemplate);

    onDetailsChanged?.({
      ...details,
      OpenAIKey: updated.apiKey,
      OpenAIPrompt: updated.systemPrompt,
      OpenAIPromptTemplate: updated.promptTemplate,
    } as any);
  };

  return (
    <InspectorBase
      iconKey='agent'
      label={details.Name ?? 'OpenAI Agent'}
      enabled={enabled}
      impulseRates={stats?.ImpulseRates ?? []}
      onToggleEnabled={onToggleEnabled}
      onDelete={onDelete}
    >
      <TabbedPanel
        initialTab='settings'
        class='mt-2'
        tabs={[
          {
            key: 'settings',
            label: 'Settings',
            content: (
              <OpenAIAgentConfigForm
                apiKey={apiKey}
                systemPrompt={systemPrompt}
                promptTemplate={promptTemplate}
                onChange={handleSettingsChange}
              />
            ),
          },
          {
            key: 'analytics',
            label: 'Analytics',
            content: <AgentAnalyticsTab stats={stats} />,
          },
          {
            key: 'stream',
            label: 'Impulse Stream',
            content: <AgentStreamTab />,
          },
        ]}
      />
    </InspectorBase>
  );
}
