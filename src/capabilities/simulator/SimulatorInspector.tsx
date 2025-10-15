import {
  EaCAzureDockerSimulatorDetails,
  InspectorBase,
  InspectorCommonProps,
  JSX,
  TabbedPanel,
} from '../../.deps.ts';
import { SimulatorManagementForm } from './views/SimulatorManagementForm.tsx';
import { TemplateEditor } from './views/TemplateEditor.tsx';
import { VariablesEditor } from './views/VariablesEditor.tsx';

type SimulatorStats = {
  impulseRates?: number[];
  instanceCount?: number;
  avgStartupMs?: number;
  lastDeploymentAt?: string;
};

type SimulatorInspectorProps = InspectorCommonProps<
  EaCAzureDockerSimulatorDetails,
  SimulatorStats
>;

export function SimulatorInspector({
  details,
  enabled,
  useStats,
  onDelete,
  onDetailsChanged,
  onToggleEnabled,
}: SimulatorInspectorProps): JSX.Element {
  const stats = useStats();
  return (
    <InspectorBase
      iconKey='simulator'
      label={details.Name}
      enabled={enabled}
      impulseRates={stats?.impulseRates ?? []}
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
              <SimulatorManagementForm
                details={details as EaCAzureDockerSimulatorDetails}
                onChange={onDetailsChanged}
              />
            ),
          },
          {
            key: 'variables',
            label: 'Variables',
            content: (
              <VariablesEditor
                value={(details as EaCAzureDockerSimulatorDetails).Variables}
                onChange={(vars) => {
                  try {
                    const serialized = JSON.stringify(vars);
                    onDetailsChanged({
                      Variables: serialized,
                    });
                  } catch {
                    // ignore serialization issues
                  }
                }}
              />
            ),
          },
          {
            key: 'template',
            label: 'Template',
            content: (
              <TemplateEditor
                value={(details as EaCAzureDockerSimulatorDetails).MessageTemplate}
                variables={(details as EaCAzureDockerSimulatorDetails).Variables}
                onChange={(tmpl) => {
                  try {
                    const serialized = JSON.stringify(tmpl);
                    onDetailsChanged({
                      MessageTemplate: serialized,
                    });
                  } catch {
                    // ignore serialization issues
                  }
                }}
              />
            ),
          },
        ]}
      />
    </InspectorBase>
  );
}
