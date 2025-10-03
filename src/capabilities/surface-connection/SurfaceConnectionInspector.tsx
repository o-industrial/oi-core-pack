import { InspectorBase, JSX, SurfaceConnectionManagementForm, TabbedPanel } from '../../.deps.ts';
import { EaCSurfaceDetails } from '../../.deps.ts';
import { InspectorCommonProps } from '../../.deps.ts';
import { SurfaceConnectionStats } from './SurfaceConnectionStats.tsx';

type SurfaceConnectionInspectorProps = InspectorCommonProps<
  EaCSurfaceDetails,
  SurfaceConnectionStats
>;

function SurfaceConnectionAnalyticsTab() {
  return (
    <p class='text-sm text-neutral-300'>
      📈 Surface connection level analytics will appear here.
    </p>
  );
}

function SurfaceConnectionStreamTab() {
  return (
    <p class='text-sm text-neutral-300'>
      📡 Impulses received and routed on this surface connection.
    </p>
  );
}

export function SurfaceConnectionInspector({
  details,
  enabled,
  useStats,
  onDelete,
  onDetailsChanged,
  onToggleEnabled,
}: SurfaceConnectionInspectorProps): JSX.Element {
  const stats = useStats();

  return (
    <InspectorBase
      iconKey='connection'
      label={details.Name}
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
              <SurfaceConnectionManagementForm
                details={details}
                onChange={onDetailsChanged}
              />
            ),
          },
          {
            key: 'analytics',
            label: 'Analytics',
            content: <SurfaceConnectionAnalyticsTab />,
          },
          {
            key: 'stream',
            label: 'Impulse Stream',
            content: <SurfaceConnectionStreamTab />,
          },
        ]}
      />
    </InspectorBase>
  );
}
