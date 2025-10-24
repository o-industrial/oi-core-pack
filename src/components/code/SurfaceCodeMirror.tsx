import { EditorState, type Extension, StateEffect } from 'npm:@codemirror/state@6.5.2';
import { EditorView, highlightActiveLine, keymap, lineNumbers } from 'npm:@codemirror/view@6.38.6';
import { defaultHighlightStyle, syntaxHighlighting } from 'npm:@codemirror/language@6.11.3';
import { history, historyKeymap } from 'npm:@codemirror/commands@6.10.0';
import { javascript } from 'npm:@codemirror/lang-javascript@6.2.4';
import { oneDark } from 'npm:@codemirror/theme-one-dark@6.1.3';
import { classSet, type JSX, useEffect, useMemo, useRef } from '../../.deps.ts';

export type SurfaceCodeMirrorProps = {
  value: string;
  onValueChange?: (next: string) => void;
  extensions?: Extension[];
  theme?: Extension | null;
  readOnly?: boolean;
} & JSX.HTMLAttributes<HTMLDivElement>;

export function SurfaceCodeMirror({
  value,
  onValueChange,
  extensions,
  theme = oneDark,
  readOnly = false,
  class: className,
  ...divProps
}: SurfaceCodeMirrorProps): JSX.Element {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const extensionsRef = useRef<Extension[]>([]);

  const baseExtensions = useMemo(() => {
    const base: Extension[] = [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      keymap.of(historyKeymap),
      javascript(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      theme ?? [],
    ];

    if (readOnly) {
      base.push(EditorState.readOnly.of(true));
      base.push(EditorView.editable.of(false));
    }

    if (onValueChange) {
      base.push(
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onValueChange(update.state.doc.toString());
          }
        }),
      );
    }

    if (extensions?.length) {
      base.push(...extensions);
    }

    return base;
  }, [extensions, readOnly, onValueChange, theme]);

  useEffect(() => {
    if (!hostRef.current || viewRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: baseExtensions,
    });

    const view = new EditorView({
      state,
      parent: hostRef.current,
    });

    viewRef.current = view;
    extensionsRef.current = baseExtensions;

    return () => {
      view.destroy();
      viewRef.current = null;
      extensionsRef.current = [];
    };
  }, [baseExtensions, value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentExtensions = extensionsRef.current;
    if (currentExtensions !== baseExtensions) {
      extensionsRef.current = baseExtensions;
      view.dispatch({
        effects: StateEffect.reconfigure.of(baseExtensions),
      });
    }

    const currentValue = view.state.doc.toString();
    if (currentValue !== value) {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value },
      });
    }
  }, [baseExtensions, value]);

  return (
    <div
      {...divProps}
      ref={hostRef}
      class={classSet(
        [
          'relative h-full w-full [&_.cm-editor]:h-full [&_.cm-editor]:w-full [&_.cm-editor]:text-[13px]',
        ],
        { class: className },
      )}
    />
  );
}
