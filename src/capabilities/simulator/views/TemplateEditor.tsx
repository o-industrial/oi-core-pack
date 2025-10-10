import {
  Action,
  ActionStyleTypes,
  DeleteIcon,
  Input,
  IntentTypes,
  JSX,
  RedoIcon,
  Select,
  UndoIcon,
  useMemo,
  useState,
} from '../../../.deps.ts';

type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
type JSONObject = { [k: string]: JSONValue };
type JSONArray = JSONValue[];

type Props = {
  value?: unknown;
  variables?: unknown;
  onChange: (next: JSONObject) => void;
};

type FieldType = 'string' | 'number' | 'boolean' | 'null' | 'variable' | 'object';

type Field = {
  key: string;
  type: FieldType;
  value: string | number | boolean | null | JSONObject | { ref: string };
};

function isJSONObject(x: unknown): x is JSONObject {
  return !!x && typeof x === 'object' && !Array.isArray(x);
}

function toFields(obj?: unknown): Field[] {
  if (typeof obj === 'string') {
    try {
      const parsed = JSON.parse(obj);
      return toFields(parsed);
    } catch {
      return [];
    }
  }
  if (!isJSONObject(obj)) return [];
  const fields: Field[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      // detect variable reference pattern
      if (v.startsWith('$.')) {
        fields.push({ key: k, type: 'variable', value: { ref: v.substring(2) } });
      } else fields.push({ key: k, type: 'string', value: v });
    } else if (typeof v === 'number') fields.push({ key: k, type: 'number', value: v });
    else if (typeof v === 'boolean') fields.push({ key: k, type: 'boolean', value: v });
    else if (v === null) fields.push({ key: k, type: 'null', value: null });
    else if (isJSONObject(v)) fields.push({ key: k, type: 'object', value: v });
  }
  return fields;
}

function buildObject(fields: Field[]): JSONObject {
  const obj: JSONObject = {};
  for (const f of fields) {
    switch (f.type) {
      case 'string':
      case 'number':
      case 'boolean':
      case 'null':
        obj[f.key] = f.value;
        break;
      case 'variable':
        obj[f.key] = `$.${(f.value as { ref: string }).ref}`;
        break;
      case 'object':
        obj[f.key] = buildObject(toFields(f.value));
        break;
    }
  }
  return obj;
}

const BUILT_INS = ['DeviceId', 'Guid', 'Time', 'LocalTime', 'Ticks', 'Epoch', 'MachineName'];

function parseVariables(value?: unknown): string[] {
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parseVariables(parsed);
    } catch {
      return [];
    }
  }
  if (Array.isArray(value)) {
    return (value as Array<{ name?: string }>).map((v) => v?.name).filter(Boolean) as string[];
  }
  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>);
  }
  return [];
}

export function TemplateEditor({ value, variables, onChange }: Props): JSX.Element {
  const initialFields = useMemo(() => toFields(value), [JSON.stringify(value ?? null)]);
  const [fields, setFields] = useState<Field[]>(initialFields);
  const varOptions = useMemo(() => [...BUILT_INS, ...parseVariables(variables)], [
    JSON.stringify(variables ?? null),
  ]);

  const update = (next: Field[]) => {
    setFields(next);
    onChange(buildObject(next));
  };

  const addField = () => {
    update([
      ...fields,
      { key: `field${fields.length + 1}`, type: 'string', value: '' },
    ]);
  };

  const removeField = (idx: number) => {
    const next = fields.slice();
    next.splice(idx, 1);
    update(next);
  };

  const moveField = (idx: number, dir: -1 | 1) => {
    const next = fields.slice();
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    const [item] = next.splice(idx, 1);
    next.splice(j, 0, item);
    update(next);
  };

  const setKey = (idx: number, key: string) => {
    const next = fields.slice();
    next[idx] = { ...next[idx], key };
    update(next);
  };

  const setType = (idx: number, type: FieldType) => {
    const next = fields.slice();
    const cur = next[idx];
    let value: Field['value'] = '';
    switch (type) {
      case 'string':
        value = '';
        break;
      case 'number':
        value = 0;
        break;
      case 'boolean':
        value = true;
        break;
      case 'null':
        value = null;
        break;
      case 'variable':
        value = { ref: '' };
        break;
      case 'object':
        value = {};
        break;
    }
    next[idx] = { ...cur, type, value };
    update(next);
  };

  const setValue = (idx: number, value: Field['value']) => {
    const next = fields.slice();
    next[idx] = { ...next[idx], value };
    update(next);
  };

  return (
    <div class='space-y-3'>
      <div class='flex items-center justify-between gap-2'>
        <div class='text-xs leading-snug text-neutral-300'>
          Define your message template. Use Variable type to insert $.Variable references.
        </div>
        <Action
          title='Add Field'
          onClick={addField}
          styleType={ActionStyleTypes.Outline | ActionStyleTypes.UltraThin}
          intentType={IntentTypes.Primary}
          class='-:text-xs'
        >
          + Add Field
        </Action>
      </div>

      {fields.length === 0 && (
        <div class='text-neutral-400 text-sm'>No fields yet. Click "Add Field" to create one.</div>
      )}

      <div class='space-y-2'>
        {fields.map((f, idx) => (
          <div key={idx} class='border border-neutral-700 rounded-md p-2 bg-neutral-900'>
            <div class='space-y-2'>
              <Input
                label='Key'
                value={f.key}
                onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                  setKey(idx, (e.currentTarget as HTMLInputElement).value)}
                class='-:text-xs -:px-2 -:py-1'
              />
              <Select
                label='Type'
                value={f.type}
                onChange={(e: JSX.TargetedEvent<HTMLSelectElement, Event>) =>
                  setType(
                    idx,
                    (e.currentTarget as HTMLSelectElement).value as FieldType,
                  )}
              >
                <option value='string'>String</option>
                <option value='number'>Number</option>
                <option value='boolean'>Boolean</option>
                <option value='null'>Null</option>
                <option value='variable'>Variable</option>
                <option value='object'>Object</option>
              </Select>

              {f.type === 'string' && (
                <Input
                  label='Value'
                  value={String(f.value ?? '')}
                  onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                    setValue(idx, (e.currentTarget as HTMLInputElement).value)}
                  class='-:text-xs -:px-2 -:py-1'
                />
              )}
              {f.type === 'number' && (
                <Input
                  label='Value'
                  type='number'
                  value={Number(f.value ?? 0)}
                  onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                    setValue(
                      idx,
                      Number((e.currentTarget as HTMLInputElement).value),
                    )}
                  class='-:text-xs -:px-2 -:py-1'
                />
              )}
              {f.type === 'boolean' && (
                <Select
                  label='Value'
                  value={String(Boolean(f.value))}
                  onChange={(e: JSX.TargetedEvent<HTMLSelectElement, Event>) =>
                    setValue(
                      idx,
                      (e.currentTarget as HTMLSelectElement).value === 'true',
                    )}
                >
                  <option value='true'>true</option>
                  <option value='false'>false</option>
                </Select>
              )}
              {f.type === 'null' && (
                <div class='text-xs text-neutral-400 mt-6'>Will render null</div>
              )}
              {f.type === 'variable' && (
                <Select
                  label='Variable'
                  value={((f.value as { ref: string })?.ref) ?? ''}
                  onChange={(e: JSX.TargetedEvent<HTMLSelectElement, Event>) =>
                    setValue(idx, {
                      ref: (e.currentTarget as HTMLSelectElement).value,
                    })}
                >
                  <option value=''>- select -</option>
                  {varOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                </Select>
              )}
              {f.type === 'object' && (
                <div>
                  <SubObjectEditor
                    value={isJSONObject(f.value) ? f.value : {}}
                    variables={varOptions}
                    onChange={(obj) => setValue(idx, obj)}
                  />
                </div>
              )}

              <div class='flex items-center gap-1 mt-1 justify-end'>
                <Action
                  title='Up'
                  onClick={() => moveField(idx, -1)}
                  styleType={ActionStyleTypes.Outline | ActionStyleTypes.Icon}
                  intentType={IntentTypes.Tertiary}
                  class='-:p-1'
                >
                  <UndoIcon class='w-4 h-4' />
                </Action>
                <Action
                  title='Down'
                  onClick={() => moveField(idx, +1)}
                  styleType={ActionStyleTypes.Outline | ActionStyleTypes.Icon}
                  intentType={IntentTypes.Tertiary}
                  class='-:p-1'
                >
                  <RedoIcon class='w-4 h-4' />
                </Action>
                <Action
                  title='Remove'
                  onClick={() => removeField(idx)}
                  styleType={ActionStyleTypes.Outline | ActionStyleTypes.Icon}
                  intentType={IntentTypes.Error}
                  class='-:p-1'
                >
                  <DeleteIcon class='w-4 h-4' />
                </Action>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <label class='block text-xs font-semibold text-neutral-300 mb-1'>JSON Preview</label>
        <pre class='bg-neutral-900 border border-neutral-700 rounded-md p-2 text-[11px] text-neutral-200 overflow-auto max-h-48'>
{JSON.stringify(buildObject(fields), null, 2)}
        </pre>
      </div>
    </div>
  );
}

function SubObjectEditor(
  { value, variables, onChange }: {
    value: JSONObject;
    variables: string[];
    onChange: (next: JSONObject) => void;
  },
) {
  const [fields, setFields] = useState<Field[]>(toFields(value));

  const update = (next: Field[]) => {
    setFields(next);
    const obj = (next || []).reduce((acc, f) => {
      switch (f.type) {
        case 'string':
        case 'number':
        case 'boolean':
        case 'null':
          acc[f.key] = f.value;
          break;
        case 'variable':
          acc[f.key] = `$.${(f.value as { ref: string }).ref}`;
          break;
        case 'object':
          acc[f.key] = f.value as JSONObject;
          break;
      }
      return acc;
    }, {} as JSONObject);
    onChange(obj);
  };

  const add = () =>
    update([...fields, { key: `field${fields.length + 1}`, type: 'string', value: '' }]);
  const rm = (idx: number) => {
    const next = fields.slice();
    next.splice(idx, 1);
    update(next);
  };
  const setKey = (idx: number, key: string) => {
    const next = fields.slice();
    next[idx] = { ...next[idx], key };
    update(next);
  };
  const setType = (idx: number, type: FieldType) => {
    const next = fields.slice();
    const cur = next[idx];
    let value: Field['value'] = '';
    switch (type) {
      case 'string':
        value = '';
        break;
      case 'number':
        value = 0;
        break;
      case 'boolean':
        value = true;
        break;
      case 'null':
        value = null;
        break;
      case 'variable':
        value = { ref: '' };
        break;
      case 'object':
        value = {};
        break;
    }
    next[idx] = { ...cur, type, value };
    update(next);
  };
  const setVal = (idx: number, value: Field['value']) => {
    const next = fields.slice();
    next[idx] = { ...next[idx], value };
    update(next);
  };

  return (
    <div class='space-y-2'>
      {fields.map((f, i) => (
        <div class='grid grid-cols-4 gap-2' key={i}>
          <Input
            label='Key'
            value={f.key}
            onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
              setKey(i, (e.currentTarget as HTMLInputElement).value)}
            class='-:text-xs -:px-2 -:py-1'
          />
          <Select
            label='Type'
            value={f.type}
            onChange={(e: JSX.TargetedEvent<HTMLSelectElement, Event>) =>
              setType(i, (e.currentTarget as HTMLSelectElement).value as FieldType)}
          >
            <option value='string'>String</option>
            <option value='number'>Number</option>
            <option value='boolean'>Boolean</option>
            <option value='null'>Null</option>
            <option value='variable'>Variable</option>
            <option value='object'>Object</option>
          </Select>
          {f.type === 'string' && (
            <Input
              label='Value'
              value={String(f.value ?? '')}
              onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                setVal(i, (e.currentTarget as HTMLInputElement).value)}
              class='-:text-xs -:px-2 -:py-1'
            />
          )}
          {f.type === 'number' && (
            <Input
              label='Value'
              type='number'
              value={Number(f.value ?? 0)}
              onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                setVal(i, Number((e.currentTarget as HTMLInputElement).value))}
              class='-:text-xs -:px-2 -:py-1'
            />
          )}
          {f.type === 'boolean' && (
            <Select
              label='Value'
              value={String(Boolean(f.value))}
              onChange={(e: JSX.TargetedEvent<HTMLSelectElement, Event>) =>
                setVal(i, (e.currentTarget as HTMLSelectElement).value === 'true')}
            >
              <option value='true'>true</option>
              <option value='false'>false</option>
            </Select>
          )}
          {f.type === 'null' && <div class='text-xs text-neutral-400 mt-6'>null</div>}
          {f.type === 'variable' && (
            <Select
              label='Variable'
              value={((f.value as { ref: string })?.ref) ?? ''}
              onChange={(e: JSX.TargetedEvent<HTMLSelectElement, Event>) =>
                setVal(i, { ref: (e.currentTarget as HTMLSelectElement).value })}
            >
              <option value=''>- select -</option>
              {variables.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          )}
          {f.type === 'object' && (
            <div class='col-span-2 text-xs text-neutral-400 mt-6'>
              Nested objects are supported in the main editor; inline editing is simplified.
            </div>
          )}
          <div class='flex items-center gap-2 mt-6'>
            <Action
              title='Remove'
              onClick={() => rm(i)}
              styleType={ActionStyleTypes.Outline | ActionStyleTypes.Icon}
              intentType={IntentTypes.Error}
              class='-:p-1'
            >
              <DeleteIcon class='w-4 h-4' />
            </Action>
          </div>
        </div>
      ))}
      <Action
        title='Add field'
        onClick={add}
        styleType={ActionStyleTypes.Outline | ActionStyleTypes.UltraThin}
        intentType={IntentTypes.Secondary}
        class='-:text-xs'
      >
        + Add
      </Action>
    </div>
  );
}
