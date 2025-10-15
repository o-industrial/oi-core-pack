import { InspectorBase, JSX, TabbedPanel } from '../../.deps.ts';
import { EaCSurfaceDetails } from '../../.deps.ts';
import { InspectorCommonProps } from '../../.deps.ts';
import { SurfaceStats } from './SurfaceStats.ts';
import { SurfaceManagementForm } from './views/SurfaceManagementForm.tsx';

type SurfaceInspectorProps = InspectorCommonProps<
  EaCSurfaceDetails,
  SurfaceStats
>;

export function SurfaceInspector({
  details,
  lookup: surfaceLookup,
  enabled,
  useStats,
  onDelete,
  onDetailsChanged,
  onNodeEvent,
  onToggleEnabled,
}: SurfaceInspectorProps): JSX.Element {
  const stats = useStats();

  return (
    <InspectorBase
      iconKey='surface'
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
              <SurfaceManagementForm
                details={details}
                onChange={onDetailsChanged}
                onManage={() => onNodeEvent?.({ Type: 'manage', NodeID: surfaceLookup })}
              />
            ),
          },
          // {
          //   key: 'analytics',
          //   label: 'Analytics',
          //   content: <SurfaceAnalyticsTab />,
          // },
          // {
          //   key: 'stream',
          //   label: 'Impulse Stream',
          //   content: <SurfaceStreamTab />,
          // },
        ]}
      />
    </InspectorBase>
  );
}
