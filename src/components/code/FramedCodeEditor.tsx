import { classSet, type JSX } from '../../.deps.ts';
import { SurfaceCodeMirror, type SurfaceCodeMirrorProps } from './SurfaceCodeMirror.tsx';

type FramedCodeEditorProps = {
  prefix: string;
  suffix: string;
  value: string;
  onChange: (next: string) => void;
  minHeight?: number;
  maxHeight?: number;
  class?: string;
  editorClass?: string;
  readOnly?: boolean;
  extensions?: SurfaceCodeMirrorProps['extensions'];
  theme?: SurfaceCodeMirrorProps['theme'];
  lockedLineNumbers?: number[];
};

export function FramedCodeEditor({
  prefix,
  suffix,
  value,
  onChange,
  minHeight,
  maxHeight,
  class: className,
  editorClass,
  readOnly,
  extensions,
  theme,
  lockedLineNumbers,
}: FramedCodeEditorProps): JSX.Element {
  const normalizedPrefix = prefix.replace(/\s+$/, '');
  const normalizedSuffix = (suffix ?? '').trimStart() || '}';
  const editorStyle: JSX.CSSProperties = {
    height: 'auto',
  };

  if (typeof minHeight === 'number' && Number.isFinite(minHeight)) {
    editorStyle.minHeight = `${minHeight}px`;
  }

  if (typeof maxHeight === 'number' && Number.isFinite(maxHeight)) {
    editorStyle.maxHeight = `${maxHeight}px`;
  }

  return (
    <div
      class={classSet(['rounded-lg border border-neutral-800 bg-neutral-950/70'], {
        class: className,
      })}
    >
      <pre class='m-0 rounded-t-lg border-b border-neutral-800 bg-neutral-900/80 px-3 py-2 font-mono text-[12px] text-neutral-300'>
        {normalizedPrefix}
      </pre>
      <SurfaceCodeMirror
        value={value}
        onValueChange={onChange}
        readOnly={readOnly}
        extensions={extensions}
        theme={theme}
        lockedLineNumbers={lockedLineNumbers}
        class={classSet(
          [
            'w-full [&_.cm-editor]:rounded-none [&_.cm-editor]:border-none [&_.cm-editor]:bg-neutral-950',
          ],
          { class: editorClass },
        )}
        style={editorStyle}
      />
      <pre class='m-0 rounded-b-lg border-t border-neutral-800 bg-neutral-900/80 px-3 py-2 font-mono text-[12px] text-neutral-300'>
        {normalizedSuffix}
      </pre>
    </div>
  );
}
