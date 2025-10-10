import {
  Action,
  ActionStyleTypes,
  DeleteIcon,
  Input,
  IntentTypes,
  JSX,
  Select,
  useMemo,
  useState,
} from '../../../.deps.ts';

type VariableDef = {
  name: string;
  random?: boolean;
  randomDouble?: boolean;
  step?: number;
  min?: number;
  max?: number;
  values?: string[];
  sequence?: boolean;
  customlengthstring?: number;
};

type Props = {
  value?: unknown;
  onChange: (next: unknown) => void;
};

function asArray(input?: unknown): VariableDef[] {
  if (!input) return [];
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return asArray(parsed);
    } catch {
      return [];
    }
  }
  if (Array.isArray(input)) {
    // best-effort cast
    return input as VariableDef[];
  }
  if (typeof input === 'object') {
    const entries = Object.entries(input as Record<string, unknown>);
    return entries.map(([name, def]) => ({
      name,
      ...(def as Record<string, unknown>),
    })) as VariableDef[];
  }
  return [];
}

function toOutput(vars: VariableDef[]): unknown {
  // The Azure IoT Telemetry Simulator expects an array of variable objects
  // with fields like name, random, min, max, values, sequence, etc.
  return vars.map((v) => ({
    ...(v.name ? { name: v.name } : {}),
    ...(v.random ? { random: true } : {}),
    ...(v.randomDouble ? { randomDouble: true } : {}),
    ...(v.step !== undefined ? { step: v.step } : {}),
    ...(v.min !== undefined ? { min: v.min } : {}),
    ...(v.max !== undefined ? { max: v.max } : {}),
    ...(v.values && v.values.length ? { values: v.values } : {}),
    ...(v.sequence ? { sequence: true } : {}),
    ...(v.customlengthstring !== undefined ? { customlengthstring: v.customlengthstring } : {}),
  }));
}

type VarKind =
  | 'counter'
  | 'randomInt'
  | 'randomDouble'
  | 'listRandom'
  | 'listSequence'
  | 'randomString';

function inferKind(v: VariableDef): VarKind {
  if (v.randomDouble) return 'randomDouble';
  if (v.random) return 'randomInt';
  if (v.customlengthstring !== undefined) return 'randomString';
  if (v.values && v.values.length) return v.sequence ? 'listSequence' : 'listRandom';
  return 'counter';
}

export function VariablesEditor({ value, onChange }: Props): JSX.Element {
  const initial = useMemo(() => asArray(value), [JSON.stringify(value ?? null)]);
  const [vars, setVars] = useState<VariableDef[]>(initial);

  const update = (next: VariableDef[]) => {
    setVars(next);
    onChange(toOutput(next));
  };

  const addVar = () => {
    update([
      ...vars,
      { name: `Var${vars.length + 1}`, random: true, min: 0, max: 100 },
    ]);
  };

  const removeVar = (idx: number) => {
    const next = vars.slice();
    next.splice(idx, 1);
    update(next);
  };

  const _moveVar = (idx: number, dir: -1 | 1) => {
    const next = vars.slice();
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    const [item] = next.splice(idx, 1);
    next.splice(j, 0, item);
    update(next);
  };

  const setField = <K extends keyof VariableDef>(idx: number, key: K, val: VariableDef[K]) => {
    const next = vars.slice();
    next[idx] = { ...next[idx], [key]: val } as VariableDef;
    // normalize when switching types
    next[idx] = normalize(next[idx]);
    update(next);
  };

  const normalize = (v: VariableDef): VariableDef => {
    // ensure mutually exclusive flags based on inferred kind
    const kind = inferKind(v);
    const base: VariableDef = { name: v.name };
    switch (kind) {
      case 'counter':
        return { ...base, min: v.min ?? 0, max: v.max, step: v.step ?? 1 };
      case 'randomInt':
        return { ...base, random: true, min: v.min ?? 0, max: v.max ?? 100 };
      case 'randomDouble':
        return { ...base, randomDouble: true, min: v.min ?? 0, max: v.max ?? 1 };
      case 'randomString':
        return { ...base, customlengthstring: v.customlengthstring ?? 8 };
      case 'listRandom':
        return { ...base, values: v.values ?? ['on', 'off'] };
      case 'listSequence':
        return { ...base, values: v.values ?? ['A', 'B'], sequence: true };
    }
  };

  const setKind = (idx: number, kind: VarKind) => {
    const cur = vars[idx];
    let v: VariableDef = { name: cur.name };
    switch (kind) {
      case 'counter':
        v = { name: cur.name, min: 0, max: 100, step: 1 };
        break;
      case 'randomInt':
        v = { name: cur.name, random: true, min: 0, max: 100 };
        break;
      case 'randomDouble':
        v = { name: cur.name, randomDouble: true, min: 0, max: 1 };
        break;
      case 'listRandom':
        v = { name: cur.name, values: ['on', 'off'] };
        break;
      case 'listSequence':
        v = { name: cur.name, values: ['A', 'B'], sequence: true };
        break;
      case 'randomString':
        v = { name: cur.name, customlengthstring: 8 };
        break;
    }
    const next = vars.slice();
    next[idx] = v;
    update(next);
  };

  return (
    <div class='space-y-3'>
      <div class='flex items-center justify-between gap-2'>
        <div class='text-xs leading-snug text-neutral-300'>
          Define variables for your telemetry template. Built-ins like DeviceId, Time, and Ticks are
          always available.
        </div>
        <Action
          title='Add Variable'
          onClick={addVar}
          styleType={ActionStyleTypes.Outline | ActionStyleTypes.UltraThin}
          intentType={IntentTypes.Primary}
          class='-:text-xs'
        >
          + Add Variable
        </Action>
      </div>

      {vars.length === 0 && (
        <div class='text-neutral-400 text-sm'>
          No variables yet. Click "Add Variable" to create one.
        </div>
      )}

      {vars.map((v, idx) => {
        const kind = inferKind(v);
        return (
          <div key={idx} class='border border-neutral-700 rounded-md p-2 bg-neutral-900'>
            <div class='flex items-start gap-2'>
              <div class='flex-1 space-y-2'>
                <Input
                  label='Name'
                  value={v.name}
                  onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                    setField(
                      idx,
                      'name',
                      (e.currentTarget as HTMLInputElement).value,
                    )}
                  class='-:text-xs -:px-2 -:py-1'
                />
                <Select
                  label='Type'
                  value={kind}
                  onChange={(e: JSX.TargetedEvent<HTMLSelectElement, Event>) =>
                    setKind(
                      idx,
                      (e.currentTarget as HTMLSelectElement).value as VarKind,
                    )}
                >
                  <option value='counter'>Counter (min..max, step)</option>
                  <option value='randomInt'>Random Integer (min..max)</option>
                  <option value='randomDouble'>Random Double (min..max)</option>
                  <option value='listRandom'>List (Random)</option>
                  <option value='listSequence'>List (Sequence)</option>
                  <option value='randomString'>Random String (length)</option>
                </Select>

                {(kind === 'counter' || kind === 'randomInt' || kind === 'randomDouble') && (
                  <div class='space-y-2'>
                    <Input
                      label='Min'
                      type='number'
                      value={v.min ?? ''}
                      onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                        setField(
                          idx,
                          'min',
                          Number((e.currentTarget as HTMLInputElement).value),
                        )}
                      class='-:text-xs -:px-2 -:py-1'
                    />
                    <Input
                      label='Max'
                      type='number'
                      value={v.max ?? ''}
                      onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                        setField(
                          idx,
                          'max',
                          Number((e.currentTarget as HTMLInputElement).value),
                        )}
                      class='-:text-xs -:px-2 -:py-1'
                    />
                  </div>
                )}

                {kind === 'counter' && (
                  <Input
                    label='Step'
                    type='number'
                    value={v.step ?? 1}
                    onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                      setField(
                        idx,
                        'step',
                        Number((e.currentTarget as HTMLInputElement).value),
                      )}
                    class='-:text-xs -:px-2 -:py-1'
                  />
                )}

                {kind === 'randomString' && (
                  <Input
                    label='Length (bytes)'
                    type='number'
                    value={v.customlengthstring ?? 8}
                    onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                      setField(
                        idx,
                        'customlengthstring',
                        Number((e.currentTarget as HTMLInputElement).value),
                      )}
                    class='-:text-xs -:px-2 -:py-1'
                  />
                )}
              </div>

              <div class='flex flex-col items-center gap-1 self-start'>
                {
                  /* <Action
                  title="Move up"
                  onClick={() => moveVar(idx, -1)}
                  styleType={ActionStyleTypes.Outline | ActionStyleTypes.Icon}
                  intentType={IntentTypes.Tertiary}
                  class="-:p-1"
                >
                  <UndoIcon class="w-4 h-4" />
                </Action>
                <Action
                  title="Move down"
                  onClick={() => moveVar(idx, +1)}
                  styleType={ActionStyleTypes.Outline | ActionStyleTypes.Icon}
                  intentType={IntentTypes.Tertiary}
                  class="-:p-1"
                >
                  <RedoIcon class="w-4 h-4" />
                </Action> */
                }
                <Action
                  title='Remove'
                  onClick={() => removeVar(idx)}
                  styleType={ActionStyleTypes.Outline | ActionStyleTypes.Icon}
                  intentType={IntentTypes.Error}
                  class='-:p-1'
                >
                  <DeleteIcon class='w-4 h-4' />
                </Action>
              </div>
            </div>

            {(kind === 'listRandom' || kind === 'listSequence') && (
              <div class='mt-2'>
                <label class='block text-xs font-semibold text-neutral-300 mb-1'>Values</label>
                <div class='space-y-2'>
                  {(v.values ?? []).map((val, vidx) => (
                    <div class='flex gap-2' key={vidx}>
                      <Input
                        value={val}
                        placeholder='e.g. on, off, $.Counter, 42, true'
                        onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) => {
                          const next = vars.slice();
                          const arr = [...(next[idx].values ?? [])];
                          arr[vidx] = (e.currentTarget as HTMLInputElement).value;
                          next[idx] = { ...next[idx], values: arr };
                          update(next);
                        }}
                        class='-:text-xs -:px-2 -:py-1'
                      />
                      <Action
                        title='Remove value'
                        onClick={() => {
                          const next = vars.slice();
                          const arr = [...(next[idx].values ?? [])];
                          arr.splice(vidx, 1);
                          next[idx] = { ...next[idx], values: arr };
                          update(next);
                        }}
                        styleType={ActionStyleTypes.Outline | ActionStyleTypes.Icon}
                        intentType={IntentTypes.Error}
                        class='-:p-1'
                      >
                        <DeleteIcon class='w-4 h-4' />
                      </Action>
                    </div>
                  ))}
                  <Action
                    title='Add value'
                    onClick={() => {
                      const next = vars.slice();
                      const arr = [...(next[idx].values ?? [])];
                      arr.push('');
                      next[idx] = { ...next[idx], values: arr };
                      update(next);
                    }}
                    styleType={ActionStyleTypes.Outline | ActionStyleTypes.UltraThin}
                    intentType={IntentTypes.Primary}
                    class='-:text-xs'
                  >
                    + Add Value
                  </Action>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
