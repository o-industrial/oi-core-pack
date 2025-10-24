/**
 * Sample interface module used by the Surface Interface code preview.
 * Mirrors the baseline output from the code generator for the lookup "sample-interface".
 * Keep this file in sync with the generator when making showcase adjustments.
 */

// Generated interface module preview for "interface-1760985057629"

// Keep export names stable; the runtime discovers modules dynamically.

// Imports configured via the Imports tab. Extend this list from that UI.
import _ from 'https://esm.sh/lodash-es?target=deno';

/**
 * Strongly-typed page data contract for the Interface1760985057629 interface.
 * Keep the export name `InterfacePageData` stable for dynamic consumers.
 */
export type InterfacePageData = {
  /**
   * Step 1: Data Connection - surface-1759499258005->connection-1759499253677 -> Download history
   * Auto executes during initial load.
   * Maps to PageData property "dataConnectionSurface1759499258005Connection1759499253677History".
   */
  dataConnectionSurface1759499258005Connection1759499253677History: Record<string, unknown>;
  /**
   * Optional status helper for UI feedback.
   */
  status?: string | undefined;
  /**
   * Optional message provided by server-side handlers.
   */
  message?: string | undefined;
};

/** Baseline defaults for InterfacePageData. */
export const defaultInterfacePageData: InterfacePageData = {
  dataConnectionSurface1759499258005Connection1759499253677History: {} as Record<string, unknown>,
  status: undefined,
  message: undefined,
};

/**
 * Helper that binds the generated PageData contract to component state.
 * Pass your preferred `useState` implementation (for example, from Preact hooks).
 */
export type PageStateHook = <Value>(initial: Value) => [Value, (next: Value) => void];
export function createInterfacePageState(
  useState: PageStateHook,
  initial: Partial<InterfacePageData> = {},
): {
  data: InterfacePageData;
  setters: { [Key in keyof InterfacePageData]: (value: InterfacePageData[Key]) => void };
  snapshot(): InterfacePageData;
} {
  const base = { ...defaultInterfacePageData, ...initial } as InterfacePageData;
  const [dataconnectionsurface1759499258005connection1759499253677history, setDataconnectionsurface1759499258005connection1759499253677history] = useState(base.dataConnectionSurface1759499258005Connection1759499253677History);
  const [status, setStatus] = useState(base.status);
  const [message, setMessage] = useState(base.message);
  return {
    data: {
      dataConnectionSurface1759499258005Connection1759499253677History: dataconnectionsurface1759499258005connection1759499253677history,
      status: status,
      message: message,
    },
    setters: {
      dataConnectionSurface1759499258005Connection1759499253677History: setDataconnectionsurface1759499258005connection1759499253677history,
      status: setStatus,
      message: setMessage,
    },
    snapshot(): InterfacePageData {
      return {
        ...base,
        dataConnectionSurface1759499258005Connection1759499253677History: dataconnectionsurface1759499258005connection1759499253677history,
        status: status,
        message: message,
      };
    },
  };
}

/**
 * Client-side service stubs for invoking configured interface actions.
 * Replace the placeholder bodies with runtime-specific requests.
 */
export const Services = {
  /**
   * Slice "Data Connection - surface-1759499258005->connection-1759499253677" (dataConnection:surface-1759499258005->connection-1759499253677)
   * Action "Download history" (dataConnection:surface-1759499258005->connection-1759499253677:history)
   * Maps to PageData property "dataConnectionSurface1759499258005Connection1759499253677History".
   * Also runs during initial server-side load.
   */
  async downloadHistory(): Promise<Record<string, unknown>> {
    // TODO: Replace with runtime invocation for slice "dataConnection:surface-1759499258005->connection-1759499253677" action "dataConnection:surface-1759499258005->connection-1759499253677:history".
    throw new Error("Implement service call before shipping to production.");
  },
};

// Orchestrates 1 action(s) to hydrate interface data.
// Step 1: Data Connection - surface-1759499258005->connection-1759499253677 -> Download history (maps result to `dataConnectionSurface1759499258005Connection1759499253677History`).


/**
 * loadPageData orchestrates interface actions on the server.
 * Keep the export name stable so dynamic loaders can locate it.
 */
export async function loadPageData(
  req: Request,
  ctx: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {};

  const callAction = async (slice: string, action: string, input?: unknown) => {
    const containers = (ctx as Record<string, unknown>)?.actions ??
      (ctx as Record<string, unknown>)?.Actions ?? {};
    const handler = (containers as Record<string, Record<string, unknown>>)[slice]?.[action];
    if (typeof handler === 'function') {
      return await (handler as (options: { req: Request; ctx: Record<string, unknown>; input?: unknown }) => Promise<unknown> | unknown)({
        req,
        ctx,
        input,
      });
    }
    return undefined;
  };

  // 1. Data Connection - surface-1759499258005->connection-1759499253677 -> Download history
  const result1 = await callAction("dataConnection:surface-1759499258005->connection-1759499253677", "dataConnection:surface-1759499258005->connection-1759499253677:history", undefined);
  data["dataConnectionSurface1759499258005Connection1759499253677History"] = result1 ?? null;

  return data;
}

/**
 * Registry entry consumed by the runtime loader.
 * The keys and export names must remain stable for dynamic resolution.
 */
export const interfaceRegistry = {
  "interface-1760985057629": {
    lookup: "interface-1760985057629",
    Component: InterfacePage,
    data: {
      defaults: defaultInterfacePageData,
      createState: createInterfacePageState,
    },
    handlers: {
      loadPageData,
    },
    services: Services,
  },
};