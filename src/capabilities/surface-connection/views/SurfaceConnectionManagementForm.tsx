import { Input, JSX, type SurfaceDataConnectionSettings } from '../../../.deps.ts';

type Props = {
  details: Partial<SurfaceDataConnectionSettings>;
  onChange: (next: Partial<SurfaceDataConnectionSettings>) => void;
};

export function SurfaceConnectionManagementForm({
  details,
  onChange,
}: Props): JSX.Element {
  const handleTumblingWindowSecondsInput = (
    e: JSX.TargetedEvent<HTMLInputElement, Event>,
  ) => {
    onChange({ TumblingWindowSeconds: parseInt(e.currentTarget.value) });
  };

  return (
    <div class='space-y-3 pt-2'>
      <Input
        label='Tumbling Window Seconds'
        value={details.TumblingWindowSeconds ?? ''}
        onInput={handleTumblingWindowSecondsInput}
      />
    </div>
  );
}
