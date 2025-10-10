import { type EaCAzureDockerSimulatorDetails, Input, JSX } from '../../../.deps.ts';

type Props = {
  details: EaCAzureDockerSimulatorDetails;
  onChange: (next: Partial<EaCAzureDockerSimulatorDetails>) => void;
};

export function SimulatorManagementForm({
  details,
  onChange,
}: Props): JSX.Element {
  const handleStringChange =
    (key: keyof EaCAzureDockerSimulatorDetails) =>
    (e: JSX.TargetedEvent<HTMLInputElement, Event>) => onChange({ [key]: e.currentTarget.value });

  const handleNumberChange =
    (key: keyof EaCAzureDockerSimulatorDetails) =>
    (e: JSX.TargetedEvent<HTMLInputElement, Event>) => {
      const v = e.currentTarget.value;
      onChange({ [key]: v === '' ? undefined : Number(v) });
    };

  const _handleJsonChange =
    (key: keyof EaCAzureDockerSimulatorDetails) =>
    (e: JSX.TargetedEvent<HTMLTextAreaElement, Event>) => {
      const raw = e.currentTarget.value;
      if (!raw) return onChange({ [key]: undefined });
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          onChange({ [key]: parsed });
        }
      } catch {
        /* ignore invalid JSON */
      }
    };

  return (
    <div class='space-y-4'>
      <Input
        label='Name'
        value={details.Name ?? ''}
        onInput={handleStringChange('Name')}
      />
      <Input
        label='Message Interval (ms)'
        type='number'
        min='0'
        value={details.MessageIntervalMS ?? ''}
        onInput={handleNumberChange('MessageIntervalMS')}
      />
      <Input
        label='Messages per Device (0 = infinite)'
        type='number'
        min='0'
        value={details.MessageCountPerDevice ?? ''}
        onInput={handleNumberChange('MessageCountPerDevice')}
      />
    </div>
  );
}
