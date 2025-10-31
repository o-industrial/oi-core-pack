import type {
  EaCInterfaceCodeBlock,
  EaCInterfaceDetails,
  EaCInterfacePageDataType,
  FlowGraphEdge,
  SurfaceInterfaceSettings,
} from '../../../.deps.ts';
import { clonePageDataType } from './interfaceDefaults.ts';

export type InterfaceGraphLookups = {
  schemaLookups: string[];
  warmQueryLookups: string[];
  dataConnectionLookups: string[];
  childInterfaceLookups: string[];
};

export function formatMessages(messages?: string[]): string {
  return (messages ?? []).join('\n');
}

export function parseMessages(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length);
}

export function buildCodeBlock(
  base: EaCInterfaceCodeBlock | undefined,
  code: string,
  description: string,
  messages: string[],
  messageGroups: EaCInterfaceCodeBlock['MessageGroups'] | undefined,
): EaCInterfaceCodeBlock | undefined {
  const trimmedCode = code.trim();
  const trimmedDescription = description.trim();
  const hasMessages = messages.length > 0;
  const hasGroups = messageGroups && messageGroups.length > 0;

  if (!trimmedCode && !trimmedDescription && !hasMessages && !hasGroups) {
    return undefined;
  }

  return {
    ...(base ?? {}),
    ...(trimmedCode ? { Code: code } : { Code: undefined }),
    ...(trimmedDescription ? { Description: description } : { Description: undefined }),
    ...(hasMessages ? { Messages: messages } : { Messages: undefined }),
    ...(hasGroups ? { MessageGroups: messageGroups } : { MessageGroups: undefined }),
  };
}

export function deriveInterfaceLookupsFromGraph(
  graph: { Edges?: FlowGraphEdge[] } | undefined,
  interfaceLookup: string,
): InterfaceGraphLookups {
  if (!graph?.Edges?.length) {
    return {
      schemaLookups: [],
      warmQueryLookups: [],
      dataConnectionLookups: [],
      childInterfaceLookups: [],
    };
  }

  const schema = new Set<string>();
  const warmQueries = new Set<string>();
  const connections = new Set<string>();
  const children = new Set<string>();

  for (const edge of graph.Edges) {
    if (!edge || edge.Target !== interfaceLookup) continue;
    const source = edge.Source?.trim();
    if (!source) continue;

    switch (edge.Label) {
      case 'schema':
        schema.add(source);
        break;
      case 'data':
        warmQueries.add(source);
        break;
      case 'connection':
        connections.add(source);
        break;
      case 'child':
        children.add(source);
        break;
      default:
        break;
    }
  }

  return {
    schemaLookups: Array.from(schema),
    warmQueryLookups: Array.from(warmQueries),
    dataConnectionLookups: Array.from(connections),
    childInterfaceLookups: Array.from(children),
  };
}

export function mergeInterfaceSettingsWithLookups(
  baseSettings: SurfaceInterfaceSettings | undefined,
  lookups: InterfaceGraphLookups,
): SurfaceInterfaceSettings {
  const merged: SurfaceInterfaceSettings = { ...(baseSettings ?? {}) };

  merged.SchemaLookups = mergeLookupLists(
    baseSettings?.SchemaLookups,
    lookups.schemaLookups,
  );
  merged.WarmQueryLookups = mergeLookupLists(
    baseSettings?.WarmQueryLookups,
    lookups.warmQueryLookups,
  );
  merged.DataConnectionLookups = mergeLookupLists(
    baseSettings?.DataConnectionLookups,
    lookups.dataConnectionLookups,
  );
  merged.ChildInterfaceLookups = mergeLookupLists(
    baseSettings?.ChildInterfaceLookups,
    lookups.childInterfaceLookups,
  );

  return merged;
}

export function buildInterfaceDetailsPatch(
  baseHandler: EaCInterfaceCodeBlock | undefined,
  basePage: EaCInterfaceCodeBlock | undefined,
  imports: string[],
  pageDataType: EaCInterfacePageDataType,
  handlerBody: string,
  handlerDescription: string,
  handlerMessages: string,
  handlerMessageGroups: EaCInterfaceCodeBlock['MessageGroups'] | undefined,
  pageBody: string,
  pageDescription: string,
  pageMessages: string,
  pageMessageGroups: EaCInterfaceCodeBlock['MessageGroups'] | undefined,
): Partial<EaCInterfaceDetails> {
  return {
    Imports: imports.length ? imports : undefined,
    PageDataType: clonePageDataType(pageDataType),
    PageHandler: buildCodeBlock(
      baseHandler,
      handlerBody,
      handlerDescription,
      parseMessages(handlerMessages),
      handlerMessageGroups,
    ),
    Page: buildCodeBlock(
      basePage,
      pageBody,
      pageDescription,
      parseMessages(pageMessages),
      pageMessageGroups,
    ),
  };
}

function mergeLookupLists(
  existing?: string[],
  additions?: string[],
): string[] | undefined {
  const normalizedExisting = (existing ?? [])
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  const normalizedAdditions = (additions ?? [])
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  if (normalizedAdditions.length === 0) {
    return existing?.length ? normalizedExisting : existing;
  }

  const merged = new Set<string>(normalizedExisting);
  for (const entry of normalizedAdditions) merged.add(entry);

  return merged.size > 0 ? Array.from(merged) : undefined;
}
