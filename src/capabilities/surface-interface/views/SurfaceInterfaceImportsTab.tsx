import {
  Action,
  ActionStyleTypes,
  CloseIcon,
  DeleteIcon,
  Input,
  IntentTypes,
  type JSX,
  SaveIcon,
  Select,
  SettingsIcon,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from '../../../.deps.ts';

type SurfaceInterfaceImportsTabProps = {
  imports: string[];
  onChange: (next: string[]) => void;
  onValidityChange?: (hasErrors: boolean) => void;
};

type ImportKind =
  | 'named'
  | 'default'
  | 'default-and-named'
  | 'namespace'
  | 'side-effect';

type ImportEntry = {
  id: string;
  specifier: string;
  importKind: ImportKind;
  namespaceAlias: string;
  defaultAlias: string;
  members: string[];
  memberDraft: string;
  status: 'idle' | 'loading' | 'error' | 'success';
  statusMessage?: string;
  suggestions: string[];
  editing: boolean;
  recommendedKind?: ImportKind | null;
  moduleAnalysis?: ModuleExportSummary;
};

type ImportValidation = {
  hasErrors: boolean;
  messages: string[];
};

type ModuleExportSummary = {
  named: string[];
  hasDefault: boolean;
};

type ModuleFetchResult = {
  exports: string[];
  hasDefault: boolean;
  error?: string;
};

export function SurfaceInterfaceImportsTab({
  imports,
  onChange,
  onValidityChange,
}: SurfaceInterfaceImportsTabProps): JSX.Element {
  const importsRef = useRef<string[]>(imports);
  const entryBackupsRef = useRef<Map<string, ImportEntry>>(new Map());
  const [entries, setEntries] = useState<ImportEntry[]>(() =>
    parseImportLines(imports)
  );

  useEffect(() => {
    if (areStringArraysEqual(importsRef.current, imports)) return;
    importsRef.current = imports;
    setEntries(parseImportLines(imports));
  }, [imports]);

  const propagateChange = useCallback(
    (nextEntries: ImportEntry[]) => {
      const serialized = nextEntries
        .map((entry: ImportEntry) => {
          if (!entry.editing) {
            return stringifyImportEntry(entry);
          }

          const backup = entryBackupsRef.current.get(entry.id);
          return backup ? stringifyImportEntry(backup) : null;
        })
        .filter((value): value is string => Boolean(value));

      if (!areStringArraysEqual(serialized, importsRef.current)) {
        importsRef.current = serialized;
        onChange(serialized);
      }

      const hasErrors = nextEntries.some(
        (entry: ImportEntry) => validateImportEntry(entry).hasErrors
      );

      onValidityChange?.(hasErrors);
    },
    [onChange, onValidityChange]
  );

  useEffect(() => {
    propagateChange(entries);
  }, [entries, propagateChange]);

  const editingEntryId = useMemo(
    () => entries.find((entry: ImportEntry) => entry.editing)?.id ?? null,
    [entries]
  );

  const hasEditingEntry = Boolean(editingEntryId);

  const visibleEntries = useMemo(
    () =>
      editingEntryId
        ? entries.filter((entry: ImportEntry) => entry.id === editingEntryId)
        : entries,
    [entries, editingEntryId]
  );

  const addEntry = () => {
    setEntries((current: ImportEntry[]) => {
      const existingEditing = current.some(
        (entry: ImportEntry) => entry.editing
      );
      if (existingEditing) return current;

      const stabilized = current.map((entry: ImportEntry) =>
        entry.editing ? { ...entry, editing: false } : entry
      );

      return [...stabilized, createEmptyEntry()];
    });
  };

  const removeEntry = (id: string) => {
    entryBackupsRef.current.delete(id);
    setEntries((current: ImportEntry[]) =>
      current.filter((entry: ImportEntry) => entry.id !== id)
    );
  };

  const startEdit = (id: string) => {
    setEntries((current: ImportEntry[]) => {
      const otherEditing = current.some(
        (entry: ImportEntry) => entry.editing && entry.id !== id
      );
      if (otherEditing) return current;

      const target = current.find((entry: ImportEntry) => entry.id === id);
      if (target && !target.editing) {
        entryBackupsRef.current.set(id, snapshotEntry(target));
      }

      return current.map((entry: ImportEntry) => {
        if (entry.id === id) {
          return entry.editing ? entry : { ...entry, editing: true };
        }
        return entry.editing ? { ...entry, editing: false } : entry;
      });
    });
  };

  const cancelEdit = (id: string) => {
    const backup = entryBackupsRef.current.get(id);
    setEntries((current: ImportEntry[]) => {
      if (!backup) {
        return current.filter((entry: ImportEntry) => entry.id !== id);
      }

      return current.map((entry: ImportEntry) => {
        if (entry.id !== id) return entry;
        return { ...snapshotEntry(backup), editing: false };
      });
    });
    entryBackupsRef.current.delete(id);
  };

  const saveEntry = (id: string) => {
    setEntries((current: ImportEntry[]) =>
      current.map((entry: ImportEntry) =>
        entry.id === id ? { ...entry, editing: false } : entry
      )
    );
    entryBackupsRef.current.delete(id);
  };

  const updateEntry = <K extends keyof ImportEntry>(
    id: string,
    key: K,
    value: ImportEntry[K]
  ) => {
    setEntries((current: ImportEntry[]) =>
      current.map((entry: ImportEntry) => {
        if (entry.id !== id) return entry;
        let next: ImportEntry = { ...entry, [key]: value } as ImportEntry;

        if (key === 'importKind') {
          const kind = value as ImportKind;
          next = {
            ...next,
            ...resetEntryForKind(kind),
            importKind: kind,
            recommendedKind: null,
            moduleAnalysis: undefined,
            suggestions: [],
          };
        }

        if (key === 'specifier') {
          next = {
            ...next,
            status: 'idle',
            statusMessage: undefined,
            recommendedKind: null,
            moduleAnalysis: undefined,
            suggestions: [],
          };
        }

        if (key === 'memberDraft') {
          next.memberDraft = (value as string) ?? '';
        }

        return next;
      })
    );
  };

  const addNamedMember = (id: string, rawMember: string) => {
    const member = rawMember.trim();
    if (!member) return;

    setEntries((current: ImportEntry[]) =>
      current.map((entry: ImportEntry) =>
        entry.id === id
          ? {
              ...entry,
              members: dedupeMembers([...entry.members, member]),
              memberDraft: '',
            }
          : entry
      )
    );
  };

  const removeNamedMember = (id: string, member: string) => {
    setEntries((current: ImportEntry[]) =>
      current.map((entry: ImportEntry) =>
        entry.id === id
          ? {
              ...entry,
              members: entry.members.filter((value) => value !== member),
            }
          : entry
      )
    );
  };

  const applyRecommendedKind = (id: string, kind: ImportKind) => {
    setEntries((current: ImportEntry[]) =>
      current.map((entry: ImportEntry) => {
        if (entry.id !== id) return entry;
        const summary: ModuleExportSummary = entry.moduleAnalysis ?? {
          named: entry.members,
          hasDefault:
            entry.importKind === 'default' ||
            entry.importKind === 'default-and-named' ||
            Boolean(entry.defaultAlias.trim()),
        };
        return applyImportKindToEntry(entry, kind, summary, entry.specifier);
      })
    );
  };

  const requestSuggestions = async (id: string) => {
    setEntries((current: ImportEntry[]) =>
      current.map((entry: ImportEntry) =>
        entry.id === id
          ? {
              ...entry,
              status: 'loading',
              statusMessage: 'Analyzing module exports...',
              suggestions: [],
            }
          : entry
      )
    );

    const target = entries.find((entry: ImportEntry) => entry.id === id);
    const specifier = target?.specifier.trim() ?? '';

    if (!specifier) {
      setEntries((current: ImportEntry[]) =>
        current.map((entry: ImportEntry) =>
          entry.id === id
            ? {
                ...entry,
                status: 'error',
                statusMessage:
                  'Provide a module specifier before requesting suggestions.',
              }
            : entry
        )
      );
      return;
    }

    const result = await fetchModuleExports(specifier);

    setEntries((current: ImportEntry[]) =>
      current.map((entry: ImportEntry) =>
        entry.id === id ? applyModuleAnalysis(entry, result, specifier) : entry
      )
    );
  };

  const totalValidImports = useMemo(
    () =>
      entries.filter((entry: ImportEntry) =>
        Boolean(stringifyImportEntry(entry))
      ).length,
    [entries]
  );

  return (
    <div class="flex h-full min-h-0 flex-col gap-4">
      <section class="rounded border border-neutral-800 bg-neutral-950/70 p-4 text-sm text-neutral-200">
        <div class="flex flex-col gap-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="space-y-1">
              <h2 class="text-base font-semibold text-neutral-100">
                Third-party imports
              </h2>
              <p class="text-xs text-neutral-400">
                Runtime essentials (like framework primitives) are provided
                automatically. Add any additional modules your interface relies
                on.
              </p>
            </div>
          </div>
          <p class="text-xs text-neutral-400">
            Compose statements like{' '}
            <code>import Default from 'specifier';</code>,{' '}
            <code>
              import Default, {'{'} members {'}'} from 'specifier';
            </code>
            , or switch to a namespace import when you need <code>*</code>.
          </p>
          <div class="flex flex-row justify-between">
            <p class="text-xs text-neutral-500">
              <span class="font-semibold text-neutral-300">
                {totalValidImports}
              </span>{' '}
              import{totalValidImports === 1 ? '' : 's'} ready for save.
            </p>
            <Action
              type="button"
              title="Add import"
              aria-label="Add import"
              styleType={ActionStyleTypes.Outline | ActionStyleTypes.Rounded}
              intentType={IntentTypes.Secondary}
              class="flex items-center gap-2 px-3 py-2"
              disabled={hasEditingEntry}
              onClick={addEntry}
            >
              <span class="text-base leading-none">+</span>
              <span class="text-sm font-medium">Add import</span>
            </Action>
          </div>
        </div>
      </section>
      <div class="flex-1 min-h-0 space-y-4 overflow-y-auto pr-1">
        {entries.length === 0 && <EmptyImportsState onAdd={addEntry} />}

        {hasEditingEntry && (
          <p class="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            Finish editing or cancel before working on other imports.
          </p>
        )}

        {visibleEntries.map((entry: ImportEntry) => {
          const validation = validateImportEntry(entry);
          const preview = buildImportPreview(entry);
          const serialized = stringifyImportEntry(entry);
          const displayStatement = serialized ?? preview;
          const isDraft = !serialized;
          const listStatusMessage = resolveStatusMessage(
            entry,
            'list',
            validation
          );

          if (!entry.editing) {
            return (
              <article
                key={entry.id}
                class="rounded border border-neutral-800 bg-neutral-950/60 p-4 text-sm text-neutral-100"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <code
                    class={`flex-1 min-w-0 overflow-x-auto whitespace-pre rounded border border-neutral-800 bg-neutral-950/80 px-3 py-2 text-xs ${
                      isDraft ? 'text-neutral-500 italic' : 'text-neutral-200'
                    }`}
                    title={displayStatement}
                  >
                    {displayStatement}
                  </code>
                  <div class="flex flex-wrap items-center gap-2">
                    <Action
                      type="button"
                      title="Edit import"
                      aria-label="Edit import"
                      styleType={
                        ActionStyleTypes.Icon | ActionStyleTypes.Outline
                      }
                      intentType={IntentTypes.Secondary}
                      onClick={() => startEdit(entry.id)}
                    >
                      <SettingsIcon class="h-4 w-4" />
                    </Action>
                    <Action
                      type="button"
                      title="Remove import"
                      aria-label="Remove import"
                      styleType={
                        ActionStyleTypes.Icon | ActionStyleTypes.Outline
                      }
                      intentType={IntentTypes.Error}
                      onClick={() => removeEntry(entry.id)}
                    >
                      <DeleteIcon class="h-4 w-4" />
                    </Action>
                  </div>
                </div>
                {entry.status === 'success' && listStatusMessage && (
                  <p class="mt-2 text-[11px] text-teal-300">
                    {listStatusMessage}
                  </p>
                )}
                {entry.status === 'error' && entry.statusMessage && (
                  <p class="mt-2 text-[11px] text-red-400">
                    {entry.statusMessage}
                  </p>
                )}
              </article>
            );
          }

          const recommendationKind = entry.recommendedKind ?? null;
          const showRecommendation = Boolean(
            recommendationKind && recommendationKind !== entry.importKind
          );
          const recommendationMessage = recommendationKind
            ? buildRecommendationReason(
                recommendationKind,
                entry.moduleAnalysis
              )
            : '';
          const showNamedMembers =
            entry.importKind === 'named' ||
            entry.importKind === 'default-and-named';
          const showDefaultAlias =
            entry.importKind === 'default' ||
            entry.importKind === 'default-and-named';
          const showNamespaceAlias = entry.importKind === 'namespace';
          const editingStatusMessage = resolveStatusMessage(
            entry,
            'edit',
            validation
          );

          return (
            <article
              key={entry.id}
              class="rounded border border-neutral-800 bg-neutral-950/60 p-6 text-sm text-neutral-100"
            >
              <header class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div class="min-w-0 space-y-3 md:max-w-3xl">
                  <code
                    class={`block w-full overflow-x-auto whitespace-pre rounded border border-neutral-800 bg-neutral-950 px-4 py-3 text-xs ${
                      isDraft ? 'text-neutral-500 italic' : 'text-neutral-200'
                    }`}
                    title={preview}
                  >
                    {preview}
                  </code>
                  <p class="text-[11px] text-neutral-400">
                    {isDraft
                      ? 'Fill in the fields below. The statement updates as you go.'
                      : 'Tweaks here update instantly - remember to save when you are happy with it.'}
                  </p>
                </div>
                <div class="flex flex-wrap items-center justify-end gap-2 md:flex-nowrap md:gap-3 md:self-start">
                  <Action
                    type="button"
                    title="Cancel edits"
                    aria-label="Cancel edits"
                    styleType={ActionStyleTypes.Outline | ActionStyleTypes.Icon}
                    intentType={IntentTypes.Secondary}
                    class="h-10 w-10"
                    onClick={() => cancelEdit(entry.id)}
                  >
                    <CloseIcon class="h-4 w-4" />
                  </Action>
                  <Action
                    type="button"
                    title="Remove import"
                    aria-label="Remove import"
                    styleType={ActionStyleTypes.Outline | ActionStyleTypes.Icon}
                    intentType={IntentTypes.Error}
                    class="h-10 w-10"
                    onClick={() => removeEntry(entry.id)}
                  >
                    <DeleteIcon class="h-4 w-4" />
                  </Action>
                  <Action
                    type="button"
                    title="Save import"
                    aria-label="Save import"
                    styleType={ActionStyleTypes.Solid | ActionStyleTypes.Icon}
                    intentType={IntentTypes.Primary}
                    class="h-10 w-10"
                    disabled={validation.hasErrors}
                    onClick={() => saveEntry(entry.id)}
                  >
                    <SaveIcon class="h-4 w-4" />
                  </Action>
                </div>
              </header>

              <div class="mt-6 space-y-6">
                <div class="space-y-2">
                  <Input
                    label="Module specifier"
                    placeholder="https://esm.sh/lodash-es?target=deno"
                    value={entry.specifier}
                    onInput={(
                      event: JSX.TargetedEvent<HTMLInputElement, Event>
                    ) =>
                      updateEntry(
                        entry.id,
                        'specifier',
                        event.currentTarget.value
                      )
                    }
                    intentType={
                      validation.hasErrors &&
                      entry.specifier.trim().length === 0
                        ? IntentTypes.Error
                        : undefined
                    }
                  />
                  <p class="text-xs text-neutral-400">
                    Use a fully-qualified URL for best autocomplete results
                    (e.g. <code>https://esm.sh/[package]</code>).
                  </p>
                </div>

                <div class="mt-6 grid gap-6 md:grid-cols-2">
                  <div class="flex flex-col gap-4">
                    <label class="flex flex-col gap-2 text-xs text-neutral-300">
                      <span class="font-semibold uppercase tracking-wide text-neutral-500">
                        Import style
                      </span>
                      <span class="text-xs text-neutral-400">
                        Choose how this module is consumed. Adjusting the style
                        resets incompatible fields automatically.
                      </span>
                      <Select
                        value={entry.importKind}
                        onInput={(
                          event: JSX.TargetedEvent<HTMLSelectElement, Event>
                        ) =>
                          updateEntry(
                            entry.id,
                            'importKind',
                            event.currentTarget.value as ImportKind
                          )
                        }
                      >
                        <option value="named">
                          Named members {'{ foo }'}
                        </option>
                        <option value="default">Default import</option>
                        <option value="default-and-named">
                          Default + named members
                        </option>
                        <option value="namespace">
                          Namespace import (* as alias)
                        </option>
                        <option value="side-effect">
                          Side effect (import 'specifier')
                        </option>
                      </Select>
                    </label>

                    <div class="flex flex-col items-start gap-2">
                      <Action
                        type="button"
                        styleType={
                          ActionStyleTypes.Outline | ActionStyleTypes.Rounded
                        }
                        intentType={IntentTypes.Secondary}
                        class="w-full md:w-auto md:h-10 md:px-4"
                        onClick={() => requestSuggestions(entry.id)}
                      >
                        Validate &amp; suggest exports
                      </Action>
                      {entry.status !== 'idle' && editingStatusMessage && (
                        <p
                          class={`w-full text-xs md:text-right ${
                            entry.status === 'error'
                              ? 'text-red-400'
                              : entry.status === 'loading'
                              ? 'text-neutral-400'
                              : 'text-teal-300'
                          }`}
                        >
                          {editingStatusMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  <div class="space-y-6">
                    {showNamedMembers && (
                      <div class="space-y-4">
                        <div class="space-y-2">
                          <span class="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            Named members
                          </span>
                          <div class="flex flex-wrap items-center gap-2 rounded border border-neutral-800 bg-neutral-950/80 px-3 py-2">
                            {entry.members.map((member: string) => (
                              <span
                                key={member}
                                class="inline-flex items-center gap-2 rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-200"
                              >
                                {member}
                                <button
                                  type="button"
                                  class="text-[11px] uppercase tracking-wide text-red-300 hover:text-red-200"
                                  onClick={() =>
                                    removeNamedMember(entry.id, member)
                                  }
                                >
                                  remove
                                </button>
                              </span>
                            ))}
                            <input
                              class="h-9 min-w-[200px] flex-1 rounded border border-neutral-700 bg-neutral-950 px-3 text-xs text-neutral-100 outline-none focus:border-teal-400"
                              placeholder="addMember or member as alias"
                              value={entry.memberDraft}
                              onInput={(
                                event: JSX.TargetedEvent<HTMLInputElement, Event>
                              ) =>
                                updateEntry(
                                  entry.id,
                                  'memberDraft',
                                  event.currentTarget.value
                                )
                              }
                              onKeyDown={(
                                event: JSX.TargetedKeyboardEvent<HTMLInputElement>
                              ) => {
                                if (event.key === 'Enter' || event.key === ',') {
                                  event.preventDefault();
                                  addNamedMember(entry.id, entry.memberDraft);
                                }
                              }}
                              onBlur={() =>
                                addNamedMember(entry.id, entry.memberDraft)
                              }
                            />
                          </div>
                          <p class="text-xs text-neutral-400">
                            Members render inside <code>{`{ ... }`}</code>.
                            Press Enter (or comma) to add the value currently in
                            the field.
                          </p>
                        </div>

                        {showRecommendation && recommendationKind && (
                          <div class="rounded border border-teal-500/40 bg-teal-500/10 px-3 py-2 text-xs text-teal-200">
                            <p>{recommendationMessage}</p>
                            <div class="mt-2 flex flex-wrap gap-2">
                              <Action
                                type="button"
                                styleType={
                                  ActionStyleTypes.Outline |
                                  ActionStyleTypes.Rounded
                                }
                                intentType={IntentTypes.Primary}
                                onClick={() =>
                                  applyRecommendedKind(
                                    entry.id,
                                    recommendationKind
                                  )
                                }
                              >
                                Apply {getImportKindLabel(recommendationKind)}
                              </Action>
                            </div>
                          </div>
                        )}

                        {entry.suggestions.length > 0 && (
                          <div class="space-y-2 rounded border border-neutral-800 bg-neutral-950/60 p-3 text-xs text-neutral-200">
                            <div class="flex flex-wrap items-center justify-between gap-2">
                              <p class="font-semibold uppercase tracking-wide text-neutral-400">
                                Suggestions
                              </p>
                              <button
                                type="button"
                                class="text-[11px] uppercase tracking-wide text-teal-300 hover:text-teal-200"
                                onClick={() => {
                                  setEntries((current: ImportEntry[]) =>
                                    current.map((item: ImportEntry) =>
                                      item.id === entry.id
                                        ? {
                                            ...item,
                                            members: mergeMembers(
                                              item.members,
                                              ...entry.suggestions
                                            ),
                                          }
                                        : item
                                    )
                                  );
                                }}
                              >
                                Add all
                              </button>
                            </div>
                            <div class="flex flex-wrap gap-2">
                              {entry.suggestions.map((suggestion: string) => (
                                <button
                                  key={suggestion}
                                  type="button"
                                  class="rounded border border-teal-500/40 bg-teal-500/10 px-2 py-1 text-xs text-teal-200 hover:bg-teal-500/20"
                                  onClick={() =>
                                    addNamedMember(entry.id, suggestion)
                                  }
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {showDefaultAlias && (
                      <div class="space-y-4">
                        <span class="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Default import
                        </span>
                        <div class="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
                          <div class="md:w-72">
                            <Input
                              label="Default import name"
                              placeholder="ModuleDefault"
                              value={entry.defaultAlias}
                              onInput={(
                                event: JSX.TargetedEvent<HTMLInputElement, Event>
                              ) =>
                                updateEntry(
                                  entry.id,
                                  'defaultAlias',
                                  event.currentTarget.value
                                )
                              }
                              intentType={
                                validation.hasErrors &&
                                !entry.defaultAlias.trim() &&
                                (entry.importKind === 'default' ||
                                  entry.importKind === 'default-and-named')
                                  ? IntentTypes.Error
                                  : undefined
                              }
                            />
                          </div>
                          <p class="text-xs text-neutral-400 md:flex-1">
                            Generates{' '}
                            <code>
                              {entry.importKind === 'default-and-named'
                                ? `import ${
                                    entry.defaultAlias || 'DefaultExport'
                                  }, { ... } from '${entry.specifier || 'module'}';`
                                : `import ${
                                    entry.defaultAlias || 'DefaultExport'
                                  } from '${entry.specifier || 'module'}';`}
                            </code>
                          </p>
                        </div>
                      </div>
                    )}

                    {showNamespaceAlias && (
                      <div class="space-y-4">
                        <span class="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Namespace import
                        </span>
                        <div class="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
                          <div class="md:w-64">
                            <Input
                              label="Namespace alias"
                              placeholder="ModuleNamespace"
                              value={entry.namespaceAlias}
                              onInput={(
                                event: JSX.TargetedEvent<HTMLInputElement, Event>
                              ) =>
                                updateEntry(
                                  entry.id,
                                  'namespaceAlias',
                                  event.currentTarget.value
                                )
                              }
                              intentType={
                                validation.hasErrors &&
                                !entry.namespaceAlias.trim()
                                  ? IntentTypes.Error
                                  : undefined
                              }
                            />
                          </div>
                          <p class="text-xs text-neutral-400 md:flex-1">
                            Generates{' '}
                            <code>
                              import * as Alias from '{entry.specifier ||
                                'module'}';
                            </code>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {validation.hasErrors && (
                <ul class="mt-4 list-disc space-y-1 pl-6 text-xs text-red-400">
                  {validation.messages.map((message, idx) => (
                    <li key={`${entry.id}-err-${idx}`}>{message}</li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
function EmptyImportsState({ onAdd }: { onAdd: () => void }): JSX.Element {
  return (
    <div class="rounded border border-dashed border-neutral-800 bg-neutral-950/40 p-6 text-center text-sm text-neutral-300">
      <p class="text-base font-semibold text-neutral-200">
        No third-party imports yet
      </p>
      <p class="mt-2 text-xs text-neutral-400">
        Add an import to get started. You can use default exports, mix default
        with named members, or pull the full module via <code>*</code>.
      </p>
      <Action
        type="button"
        styleType={ActionStyleTypes.Solid | ActionStyleTypes.Rounded}
        intentType={IntentTypes.Primary}
        class="mt-4"
        onClick={onAdd}
      >
        Create first import
      </Action>
    </div>
  );
}
function snapshotEntry(entry: ImportEntry): ImportEntry {
  return {
    ...entry,
    members: [...entry.members],
    suggestions: [...entry.suggestions],
    editing: false,
    recommendedKind: entry.recommendedKind ?? null,
    moduleAnalysis: entry.moduleAnalysis
      ? {
          named: [...entry.moduleAnalysis.named],
          hasDefault: entry.moduleAnalysis.hasDefault,
        }
      : undefined,
  };
}

function createEmptyEntry(): ImportEntry {
  return {
    id: generateId(),
    specifier: '',
    importKind: 'named',
    namespaceAlias: '',
    defaultAlias: '',
    members: [],
    memberDraft: '',
    status: 'idle',
    statusMessage: undefined,
    suggestions: [],
    editing: true,
    recommendedKind: null,
    moduleAnalysis: undefined,
  };
}

function resetEntryForKind(kind: ImportKind): Partial<ImportEntry> {
  switch (kind) {
    case 'named':
      return {
        namespaceAlias: '',
        defaultAlias: '',
        memberDraft: '',
      };
    case 'default':
      return {
        namespaceAlias: '',
        members: [],
        memberDraft: '',
      };
    case 'default-and-named':
      return {
        namespaceAlias: '',
        memberDraft: '',
      };
    case 'namespace':
      return {
        members: [],
        memberDraft: '',
        defaultAlias: '',
      };
    case 'side-effect':
      return {
        namespaceAlias: '',
        members: [],
        memberDraft: '',
        defaultAlias: '',
      };
    default:
      return {};
  }
}

function mergeMembers(existing: string[], ...next: string[]): string[] {
  const normalized = next
    .flat()
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const result = new Set(existing);
  for (const entry of normalized) {
    result.add(entry);
  }

  return Array.from(result);
}

function dedupeMembers(members: string[]): string[] {
  return Array.from(
    new Set(
      members
        .map((member) => member.trim())
        .filter((member) => member.length > 0)
    )
  );
}

function determinePreferredKind(summary: ModuleExportSummary): ImportKind {
  if (summary.hasDefault && summary.named.length > 0) {
    return 'default-and-named';
  }
  if (summary.hasDefault) return 'default';
  if (summary.named.length > 0) return 'named';
  return 'side-effect';
}

function determineRecommendedKind(
  current: ImportKind,
  summary: ModuleExportSummary
): ImportKind | null {
  const preferred = determinePreferredKind(summary);
  if (preferred === 'side-effect' || preferred === current) return null;

  if (preferred === 'default-and-named') {
    if (current !== 'default-and-named') return 'default-and-named';
    return null;
  }

  if (preferred === 'default') {
    return current === 'default' ? null : 'default';
  }

  if (preferred === 'named') {
    return current === 'named' ? null : 'named';
  }

  return null;
}

function shouldAutoApplyImportKind(
  current: ImportKind,
  summary: ModuleExportSummary
): boolean {
  if (summary.hasDefault && summary.named.length === 0 && current === 'named') {
    return true;
  }

  if (
    !summary.hasDefault &&
    summary.named.length > 0 &&
    (current === 'default' || current === 'default-and-named')
  ) {
    return true;
  }

  if (
    summary.hasDefault &&
    summary.named.length === 0 &&
    current === 'default-and-named'
  ) {
    return true;
  }

  return false;
}

function getImportKindLabel(kind: ImportKind): string {
  switch (kind) {
    case 'default':
      return 'default import';
    case 'default-and-named':
      return 'default + named imports';
    case 'namespace':
      return 'namespace import';
    case 'side-effect':
      return 'side-effect import';
    case 'named':
    default:
      return 'named imports';
  }
}

function buildRecommendationReason(
  kind: ImportKind,
  summary?: ModuleExportSummary
): string {
  const hasNamed = summary?.named.length ? summary.named.length > 0 : false;
  const hasDefault = summary?.hasDefault ?? false;

  switch (kind) {
    case 'default':
      return hasDefault && !hasNamed
        ? 'This module exposes only a default export. Switch to a default import.'
        : 'This module provides a default export. Consider using a default import.';
    case 'default-and-named':
      return hasDefault && hasNamed
        ? 'This module includes both a default export and named members. Import both to access everything.'
        : 'Importing both the default export and named members is recommended for this module.';
    case 'named':
      return !hasDefault && hasNamed
        ? 'This module only provides named exports. Switch to named imports.'
        : 'Use named imports to select specific exports from this module.';
    case 'namespace':
      return 'Use a namespace import to access the module as a single object.';
    case 'side-effect':
    default:
      return 'Use a side-effect import when you only need to execute module code.';
  }
}

function describeModuleSummary(summary: ModuleExportSummary): string {
  const hasNamed = summary.named.length > 0;
  if (summary.hasDefault && hasNamed) {
    return `Detected default export and ${summary.named.length} named export${
      summary.named.length === 1 ? '' : 's'
    }.`;
  }
  if (summary.hasDefault) {
    return 'Detected default export.';
  }
  if (hasNamed) {
    return `Detected ${summary.named.length} named export${
      summary.named.length === 1 ? '' : 's'
    }.`;
  }
  return 'Module export shape could not be determined.';
}

function deriveDefaultAlias(specifier: string): string {
  let reference = specifier;
  try {
    const url = new URL(specifier);
    reference = url.pathname || specifier;
  } catch {
    // Not a URL; use as-is.
  }

  reference = reference.split('?')[0];
  reference = reference.split('#')[0];

  const segments = reference.split('/').filter(Boolean);
  let base = segments.length ? segments[segments.length - 1] : reference;
  base = base.replace(/\.[a-zA-Z0-9]+$/, '');

  const parts = base.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (!parts.length) return 'defaultImport';

  const alias = parts
    .map((part, index) =>
      index === 0
        ? part.toLowerCase()
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join('');

  if (!alias) return 'defaultImport';
  return /^[0-9]/.test(alias) ? `_${alias}` : alias;
}

function applyImportKindToEntry(
  entry: ImportEntry,
  kind: ImportKind,
  summary: ModuleExportSummary,
  specifier?: string
): ImportEntry {
  const resets = resetEntryForKind(kind);
  const next: ImportEntry = {
    ...entry,
    ...resets,
    importKind: kind,
    recommendedKind: null,
    moduleAnalysis: summary,
    suggestions: [...summary.named],
  };

  if (
    (kind === 'default' || kind === 'default-and-named') &&
    !next.defaultAlias.trim()
  ) {
    next.defaultAlias = deriveDefaultAlias(specifier ?? entry.specifier);
  }

  if (kind === 'default-and-named') {
    next.members = dedupeMembers([...next.members, ...summary.named]);
  } else if (kind === 'named') {
    if (!next.members.length) {
      next.members = dedupeMembers(summary.named);
    }
  } else if (
    kind === 'default' ||
    kind === 'side-effect' ||
    kind === 'namespace'
  ) {
    next.members = [];
  }

  next.memberDraft = '';
  next.editing = entry.editing;

  return next;
}

function resolveStatusMessage(
  entry: ImportEntry,
  mode: 'list' | 'edit',
  validation?: ImportValidation
): string | undefined {
  if (mode === 'list') {
    if (entry.status === 'error' || entry.status === 'loading') {
      return entry.statusMessage;
    }
    if (validation?.hasErrors) {
      return validation.messages?.[0];
    }
    return undefined;
  }

  if (mode === 'edit') {
    if (validation?.hasErrors) {
      return validation.messages?.[0];
    }
    return entry.statusMessage;
  }

  return entry.statusMessage;
}
function applyModuleAnalysis(
  entry: ImportEntry,
  result: ModuleFetchResult,
  specifier: string
): ImportEntry {
  if (result.error) {
    return {
      ...entry,
      status: 'error',
      statusMessage: result.error,
      suggestions: [],
      recommendedKind: null,
      moduleAnalysis: undefined,
    };
  }

  const summary: ModuleExportSummary = {
    named: result.exports,
    hasDefault: result.hasDefault,
  };

  const preferred = determinePreferredKind(summary);
  const recommendation = determineRecommendedKind(entry.importKind, summary);
  const description = describeModuleSummary(summary);

  let next: ImportEntry = {
    ...entry,
    status: 'success',
    statusMessage: description,
    suggestions: [...summary.named],
    moduleAnalysis: summary,
  };

  if (shouldAutoApplyImportKind(entry.importKind, summary)) {
    const autoKind = preferred === 'side-effect' ? entry.importKind : preferred;
    next = applyImportKindToEntry(next, autoKind, summary, specifier);
    next.status = 'success';
    next.statusMessage = `${description} Updated import kind to ${getImportKindLabel(
      autoKind
    )}.`;
  } else {
    next.recommendedKind = recommendation;
    if (
      (recommendation === 'default' ||
        recommendation === 'default-and-named') &&
      !next.defaultAlias.trim()
    ) {
      next.defaultAlias = deriveDefaultAlias(specifier);
    }
  }

  return next;
}

function validateImportEntry(entry: ImportEntry): ImportValidation {
  const specifier = entry.specifier.trim();
  const isBlank =
    specifier.length === 0 &&
    entry.namespaceAlias.trim().length === 0 &&
    entry.defaultAlias.trim().length === 0 &&
    entry.members.length === 0 &&
    entry.memberDraft.trim().length === 0;

  if (isBlank) {
    return { hasErrors: false, messages: [] };
  }

  const messages: string[] = [];

  if (!specifier) {
    messages.push(
      'Provide the module specifier (e.g. https://cdn.example/mod.js).'
    );
  }

  const hasNamespaceAlias = entry.namespaceAlias.trim().length > 0;
  const hasDefaultAlias = entry.defaultAlias.trim().length > 0;
  const hasMembers = entry.members.length > 0;

  if (entry.importKind === 'named' && !hasMembers) {
    messages.push(
      'Add at least one named import or switch to a different import style.'
    );
  }

  if (entry.importKind === 'default' && !hasDefaultAlias) {
    messages.push('Default imports require a name (e.g. ModuleDefault).');
  }

  if (entry.importKind === 'default-and-named') {
    if (!hasDefaultAlias) {
      messages.push(
        'Provide a name for the default import (e.g. ModuleDefault).'
      );
    }
    if (!hasMembers) {
      messages.push(
        'Add at least one named member to accompany the default import.'
      );
    }
  }

  if (entry.importKind === 'namespace' && !hasNamespaceAlias) {
    messages.push('Namespace imports require an alias (e.g. ModuleHelpers).');
  }

  return { hasErrors: messages.length > 0, messages };
}

function stringifyImportEntry(entry: ImportEntry): string | null {
  const specifier = entry.specifier.trim();
  if (!specifier) return null;

  switch (entry.importKind) {
    case 'side-effect':
      return `import '${specifier}';`;
    case 'namespace': {
      const alias = entry.namespaceAlias.trim();
      if (!alias) return null;
      return `import * as ${alias} from '${specifier}';`;
    }
    case 'default': {
      const alias = entry.defaultAlias.trim();
      if (!alias) return null;
      return `import ${alias} from '${specifier}';`;
    }
    case 'default-and-named': {
      const alias = entry.defaultAlias.trim();
      const members = dedupeMembers(entry.members);
      if (!alias || members.length === 0) return null;
      return `import ${alias}, { ${members.join(', ')} } from '${specifier}';`;
    }
    case 'named':
    default: {
      const members = dedupeMembers(entry.members);
      if (members.length === 0) return null;
      return `import { ${members.join(', ')} } from '${specifier}';`;
    }
  }
}

function buildImportPreview(entry: ImportEntry): string {
  return stringifyImportEntry(entry) ?? placeholderPreview(entry);
}

function placeholderPreview(entry: ImportEntry): string {
  const specifier = entry.specifier.trim() || 'module';
  if (entry.importKind === 'side-effect') {
    return `import '${specifier}';`;
  }
  if (entry.importKind === 'namespace') {
    const alias = entry.namespaceAlias.trim() || 'Alias';
    return `import * as ${alias} from '${specifier}';`;
  }
  if (entry.importKind === 'default') {
    const alias = entry.defaultAlias.trim() || 'DefaultExport';
    return `import ${alias} from '${specifier}';`;
  }
  if (entry.importKind === 'default-and-named') {
    const alias = entry.defaultAlias.trim() || 'DefaultExport';
    const members =
      entry.members.length > 0 ? entry.members.join(', ') : 'member';
    return `import ${alias}, { ${members} } from '${specifier}';`;
  }
  const members =
    entry.members.length > 0 ? entry.members.join(', ') : 'member';
  return `import { ${members} } from '${specifier}';`;
}

function parseImportLines(lines: string[]): ImportEntry[] {
  if (!lines || lines.length === 0) return [];

  return lines
    .map((line) => parseImportLine(line))
    .filter((entry): entry is ImportEntry => Boolean(entry));
}

function parseImportLine(line: string): ImportEntry | null {
  const trimmed = line.trim();
  if (trimmed.length === 0) return null;

  const defaultWithNamedMatch = trimmed.match(
    /^import\s+([A-Za-z0-9_$]+)\s*,\s*\{\s*([^}]*)\s*\}\s*from\s*['"]([^'"]+)['"]\s*;?\s*$/i
  );
  if (defaultWithNamedMatch) {
    const members = defaultWithNamedMatch[2]
      .split(',')
      .map((member) => member.trim())
      .filter((member) => member.length > 0);

    return {
      id: generateId(),
      specifier: defaultWithNamedMatch[3],
      importKind: 'default-and-named',
      namespaceAlias: '',
      defaultAlias: defaultWithNamedMatch[1],
      members,
      memberDraft: '',
      status: 'idle',
      statusMessage: undefined,
      suggestions: [],
      editing: false,
      recommendedKind: null,
      moduleAnalysis: undefined,
    };
  }

  const defaultMatch = trimmed.match(
    /^import\s+([A-Za-z0-9_$]+)\s+from\s*['"]([^'"]+)['"]\s*;?\s*$/i
  );
  if (defaultMatch) {
    return {
      id: generateId(),
      specifier: defaultMatch[2],
      importKind: 'default',
      namespaceAlias: '',
      defaultAlias: defaultMatch[1],
      members: [],
      memberDraft: '',
      status: 'idle',
      statusMessage: undefined,
      suggestions: [],
      editing: false,
      recommendedKind: null,
      moduleAnalysis: undefined,
    };
  }

  const namedMatch = trimmed.match(
    /^import\s*\{\s*([^}]*)\s*\}\s*from\s*['"]([^'"]+)['"]\s*;?\s*$/i
  );
  if (namedMatch) {
    const members = namedMatch[1]
      .split(',')
      .map((member) => member.trim())
      .filter((member) => member.length > 0);

    return {
      id: generateId(),
      specifier: namedMatch[2],
      importKind: 'named',
      namespaceAlias: '',
      defaultAlias: '',
      members,
      memberDraft: '',
      status: 'idle',
      statusMessage: undefined,
      suggestions: [],
      editing: false,
      recommendedKind: null,
      moduleAnalysis: undefined,
    };
  }

  const namespaceMatch = trimmed.match(
    /^import\s*\*\s*as\s*([A-Za-z0-9_$]+)\s*from\s*['"]([^'"]+)['"]\s*;?\s*$/i
  );
  if (namespaceMatch) {
    return {
      id: generateId(),
      specifier: namespaceMatch[2],
      importKind: 'namespace',
      namespaceAlias: namespaceMatch[1],
      defaultAlias: '',
      members: [],
      memberDraft: '',
      status: 'idle',
      statusMessage: undefined,
      suggestions: [],
      editing: false,
      recommendedKind: null,
      moduleAnalysis: undefined,
    };
  }

  const sideEffectMatch = trimmed.match(/^import\s*['"]([^'"]+)['"]\s*;?\s*$/i);
  if (sideEffectMatch) {
    return {
      id: generateId(),
      specifier: sideEffectMatch[1],
      importKind: 'side-effect',
      namespaceAlias: '',
      defaultAlias: '',
      members: [],
      memberDraft: '',
      status: 'idle',
      statusMessage: undefined,
      suggestions: [],
      editing: false,
      recommendedKind: null,
      moduleAnalysis: undefined,
    };
  }

  return {
    id: generateId(),
    specifier: trimmed.replace(/^import\s+/, ''),
    importKind: 'side-effect',
    namespaceAlias: '',
    defaultAlias: '',
    members: [],
    memberDraft: '',
    status: 'idle',
    statusMessage: undefined,
    suggestions: [],
    editing: false,
    recommendedKind: null,
    moduleAnalysis: undefined,
  };
}
function areStringArraysEqual(first: string[], second: string[]): boolean {
  if (first.length !== second.length) return false;
  return first.every((value, index) => value === second[index]);
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      // fall through
    }
  }
  return `import-${Math.random().toString(36).slice(2, 10)}`;
}

async function fetchModuleExports(
  specifier: string
): Promise<ModuleFetchResult> {
  if (!specifier.startsWith('http://') && !specifier.startsWith('https://')) {
    return {
      exports: [],
      hasDefault: false,
      error:
        'Autocomplete is available for fully-qualified http(s) module URLs.',
    };
  }

  try {
    const response = await fetch(specifier);
    if (!response.ok) {
      return {
        exports: [],
        hasDefault: false,
        error: `Unable to load module (${response.status}).`,
      };
    }

    const source = await response.text();
    const summary = extractModuleExports(source);

    return { exports: summary.named, hasDefault: summary.hasDefault };
  } catch (error) {
    return {
      exports: [],
      hasDefault: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch module contents.',
    };
  }
}

function extractModuleExports(source: string): ModuleExportSummary {
  const results = new Set<string>();
  let hasDefault = false;

  const declarationRegex =
    /export\s+(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z0-9_$]+)/g;
  let match: RegExpExecArray | null;
  while ((match = declarationRegex.exec(source)) !== null) {
    results.add(match[1]);
  }

  const bracesRegex = /export\s*\{([^}]+)\}/g;
  while ((match = bracesRegex.exec(source)) !== null) {
    const parts = match[1]
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    for (const part of parts) {
      const normalized = part.replace(/\s+/g, ' ').trim();
      if (!normalized) continue;

      const [rawName, rawAlias] = normalized.split(/\s+as\s+/i);
      const name = rawName?.trim();
      const alias = rawAlias?.trim();

      if (name?.toLowerCase() === 'default') {
        hasDefault = true;
        if (alias && alias.toLowerCase() !== 'default') {
          results.add(alias);
        }
        continue;
      }

      if (alias?.toLowerCase() === 'default') {
        hasDefault = true;
      }

      if (name && name.length > 0) {
        results.add(name);
      }

      if (alias && alias.length > 0 && alias.toLowerCase() !== 'default') {
        results.add(alias);
      }
    }

    if (/\bdefault\b/.test(match[1])) {
      hasDefault = true;
    }
  }

  if (/\bexport\s+default\b/.test(source)) {
    hasDefault = true;
  }

  return {
    named: Array.from(results).slice(0, 30),
    hasDefault,
  };
}
