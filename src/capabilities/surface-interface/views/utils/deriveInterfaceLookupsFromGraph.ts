import type { FlowGraphEdge } from '../../../.deps.ts';
import type { InterfaceGraphLookups } from './InterfaceGraphLookups.ts';

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
