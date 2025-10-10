import { CopyInput, JSX } from '../../../.deps.ts';

export type ConnectionInfoPanelProps = {
  connectionInfo?: Record<string, string>;
  healthStatus?: 'Healthy' | 'Unreachable' | 'Stale' | 'Unknown' | string;
  lastReceivedTimestamp?: string;
};

export function ConnectionInfoPanel({
  connectionInfo,
  healthStatus,
  lastReceivedTimestamp,
}: ConnectionInfoPanelProps): JSX.Element {
  if (!connectionInfo || Object.keys(connectionInfo).length === 0) {
    return (
      <p class='text-sm text-neutral-400 italic'>
        No connection details available.
      </p>
    );
  }

  const entries = Object.entries(connectionInfo);

  const byPrefix = (prefix: string) => entries.filter(([k]) => k.startsWith(prefix));
  const withoutPrefixes = (prefixes: string[]) =>
    entries.filter(([k]) => !prefixes.some((p) => k.startsWith(p)));

  const device = byPrefix('Device ');
  const mqtt = byPrefix('MQTT ');
  const amqp = byPrefix('AMQP ');
  const http = byPrefix('HTTP ');
  // Exclude any service-level keys to avoid oversharing in the device panel
  const _service: [string, string][] = [];
  const identity = withoutPrefixes([
    'Device ',
    'MQTT ',
    'AMQP ',
    'HTTP ',
    'Service ',
    'EventHub ',
  ]);

  const Section = ({ title, items }: {
    title: string;
    items: [string, string][];
  }) =>
    items.length
      ? (
        <div class='bg-neutral-800 border border-neutral-700 rounded p-4'>
          <h4 class='text-sm font-semibold text-white mb-3'>{title}</h4>
          <div class='space-y-2'>
            {items.map(([key, val]) => (
              <div key={key} class='grid grid-cols-5 gap-3 items-start'>
                <label class='text-xs text-neutral-400 col-span-1 mt-1'>{key}</label>
                <div class='col-span-4'>
                  <CopyInput value={val} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )
      : null;

  return (
    <div class='space-y-3'>
      {/* Overview */}
      <div class='bg-neutral-800 border border-neutral-700 rounded p-4'>
        <h4 class='text-sm font-semibold text-white mb-3'>Overview</h4>
        <div class='grid grid-cols-3 gap-3 items-center text-xs'>
          <div class='text-neutral-400'>Health</div>
          <div class='col-span-2'>
            <span class='px-2 py-0.5 rounded bg-neutral-700 text-neutral-100'>
              {healthStatus ?? 'Unknown'}
            </span>
          </div>

          <div class='text-neutral-400'>Last Received</div>
          <div class='col-span-2 font-mono'>
            {lastReceivedTimestamp || '—'}
          </div>
        </div>
      </div>

      <Section title='Identity' items={identity} />
      <Section title='Device Access' items={device} />
      <Section title='MQTT' items={mqtt} />
      <Section title='AMQP' items={amqp} />
      <Section title='HTTP' items={http} />
      {/* Intentionally no Service Access section */}
    </div>
  );
}
