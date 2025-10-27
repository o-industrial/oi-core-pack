import { EditorState, type Extension, StateEffect } from 'npm:@codemirror/state@6.5.2';
import { EditorView, highlightActiveLine, keymap, lineNumbers } from 'npm:@codemirror/view@6.38.6';
import { defaultHighlightStyle, syntaxHighlighting } from 'npm:@codemirror/language@6.11.3';
import { history, historyKeymap, indentWithTab } from 'npm:@codemirror/commands@6.10.0';
import { javascript } from 'npm:@codemirror/lang-javascript@6.2.4';
import { oneDark } from 'npm:@codemirror/theme-one-dark@6.1.3';
import { classSet, type JSX, useEffect, useMemo, useRef } from '../../.deps.ts';

export type SurfaceCodeMirrorProps = {
  value: string;
  onValueChange?: (next: string) => void;
  extensions?: Extension[];
  theme?: Extension | null;
  readOnly?: boolean;
  lockedLineNumbers?: number[];
} & JSX.HTMLAttributes<HTMLDivElement>;

export function SurfaceCodeMirror({
  value,
  onValueChange,
  extensions,
  theme = oneDark,
  readOnly = false,
  lockedLineNumbers,
  class: className,
  ...divProps
}: SurfaceCodeMirrorProps): JSX.Element {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const extensionsRef = useRef<Extension[]>([]);
  const shouldRestoreFocusRef = useRef(false);
  const lastSelectionRef = useRef<{ anchor: number; head: number } | null>(null);
  const lastPropValueRef = useRef<string>(value);

  const lockedLinesKey = lockedLineNumbers && lockedLineNumbers.length > 0
    ? lockedLineNumbers.join(',')
    : null;

  const lockedLinesSet = useMemo(() => {
    if (!lockedLineNumbers || !lockedLinesKey) return null;
    return new Set(lockedLineNumbers);
  }, [lockedLinesKey, lockedLineNumbers]);

  const baseExtensions = useMemo(() => {
    const base: Extension[] = [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      keymap.of([...historyKeymap, indentWithTab]),
      javascript(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      theme ?? [],
    ];

    if (readOnly) {
      base.push(EditorState.readOnly.of(true));
      base.push(EditorView.editable.of(false));
    }

    if (lockedLinesSet && lockedLinesSet.size > 0) {
      base.push(
        EditorState.transactionFilter.of((tr) => {
          if (!tr.docChanged) return tr;
          let blocked = false;
          tr.changes.iterChanges((fromA, toA) => {
            if (blocked) return;
            const fromLine = tr.startState.doc.lineAt(fromA).number;
            const toLine = tr.startState.doc.lineAt(toA).number;
            for (let line = fromLine; line <= toLine; line += 1) {
              if (lockedLinesSet.has(line)) {
                blocked = true;
                break;
              }
            }
          });
          if (blocked) return [];
          return tr;
        }),
      );
    }

    if (onValueChange) {
      base.push(
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            if (update.view.hasFocus) {
              shouldRestoreFocusRef.current = true;
            }
            onValueChange(update.state.doc.toString());
          }

          if (update.selectionSet) {
            const main = update.state.selection.main;
            lastSelectionRef.current = {
              anchor: main.anchor,
              head: main.head,
            };
          }
        }),
      );
    }

    if (extensions?.length) {
      base.push(...extensions);
    }

    return base;
  }, [extensions, lockedLinesSet, readOnly, onValueChange, theme]);

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
    const main = view.state.selection.main;
    lastSelectionRef.current = { anchor: main.anchor, head: main.head };
    lastPropValueRef.current = value;

    return () => {
      view.destroy();
      viewRef.current = null;
      extensionsRef.current = [];
    };
  }, [baseExtensions]);

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

    if (lastPropValueRef.current !== value) {
      const currentValue = view.state.doc.toString();
      if (currentValue !== value) {
        const selection = lastSelectionRef.current ?? {
          anchor: view.state.selection.main.anchor,
          head: view.state.selection.main.head,
        };
        const clamp = (position: number) =>
          Math.max(0, Math.min(value.length, position));

        const nextSelection = {
          anchor: clamp(selection.anchor),
          head: clamp(selection.head),
        };

        view.dispatch({
          changes: { from: 0, to: currentValue.length, insert: value },
          selection: nextSelection,
        });
        lastSelectionRef.current = nextSelection;
      }
      lastPropValueRef.current = value;
    }

    if (shouldRestoreFocusRef.current) {
      shouldRestoreFocusRef.current = false;
      if (!view.hasFocus) {
        view.focus();
      }
    }
  }, [baseExtensions, value]);

  return (
    <div
      {...divProps}
      ref={hostRef}
      class={classSet(
        [
          'relative h-full w-full overflow-auto [&_.cm-editor]:h-full [&_.cm-editor]:w-full [&_.cm-editor]:text-[13px]',
        ],
        { class: className },
      )}
    />
  );
}
