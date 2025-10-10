import {
  Action,
  ActionStyleTypes,
  EaCSurfaceDetails,
  Input,
  IntentTypes,
  JSX,
} from '../../../.deps.ts';

type Props = {
  details: Partial<EaCSurfaceDetails>;
  onChange: (next: Partial<EaCSurfaceDetails>) => void;
  onManage?: () => void;
};

export function SurfaceManagementForm({
  details,
  onChange,
  onManage,
}: Props): JSX.Element {
  const handleLabelInput = (e: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    onChange({ Name: e.currentTarget.value });
  };

  return (
    <div class='space-y-3 pt-2'>
      <Input
        label='Surface Name'
        value={details.Name ?? ''}
        onInput={handleLabelInput}
      />

      <Action
        title='Manage Surface'
        styleType={ActionStyleTypes.Icon}
        intentType={IntentTypes.Info}
        onClick={() => onManage?.()}
      >
        <svg class='w-6 h-6' viewBox='0 0 24 24' fill='none'>
          <path d='M9 18V5l12-2v13' stroke='currentColor' stroke-width='2' />
          <path d='M3 6v13l12 2V8' stroke='currentColor' stroke-width='2' />
        </svg>
      </Action>
    </div>
  );
}
