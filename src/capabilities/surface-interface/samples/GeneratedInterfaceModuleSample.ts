import {
  buildDefaultInterfaceComponent,
  toPascalCase,
} from '../views/SurfaceInterfaceTemplates.ts';

/**
 * Generated interface module sample.
 * Each entry mirrors a virtual DFS file emitted by the InterfaceApp processor.
 * Keep this map in sync with the generator when adjusting templates.
 */
const sampleLookup = 'sample-interface';
const sampleSafeId = toPascalCase(sampleLookup);
const sampleDisplayName = `${sampleSafeId} interface`;
const sampleDefaultComponent = buildDefaultInterfaceComponent(
  sampleLookup,
  sampleSafeId,
  sampleDisplayName,
);

export const GeneratedInterfaceModuleSample: Record<string, string> = {
  'interfaces/sample-interface/types.ts': `export type InterfacePageData = {
  status?: string | undefined;
  message?: string | undefined;
};

export const defaultInterfacePageData: InterfacePageData = {
  status: undefined,
  message: undefined,
};
`,
  'interfaces/sample-interface/services.ts': `import type { InterfacePageData } from "./types.ts";

export type InterfaceServiceDescriptor<TResult, TInput = void> = {
  sliceKey: string;
  actionKey: string;
  resultName: string;
  autoExecute: boolean;
  includeInResponse: boolean;
};

export type InterfaceServiceInvoke = <TResult, TInput = void>(
  descriptor: InterfaceServiceDescriptor<TResult, TInput>,
  input: TInput,
) => Promise<TResult>;

export type InterfaceServices = {
  ping(): Promise<string>;
};

export function createInterfaceServices(invoke: InterfaceServiceInvoke): InterfaceServices {
  return {
    async ping(): Promise<string> {
      return await invoke<string, void>(
        {
          sliceKey: "sample",
          actionKey: "ping",
          resultName: "status",
          autoExecute: false,
          includeInResponse: false,
        },
        undefined as void,
      );
    },
  };
}

export type InterfaceServerContext = {
  request: Request;
  params: Record<string, string>;
  headers: Headers;
  previous?: Partial<InterfacePageData>;
  services: InterfaceServices;
};

export type InterfaceClientContext = {
  previous?: InterfacePageData;
  services: InterfaceServices;
  signal?: AbortSignal;
};
`,
  'interfaces/sample-interface/module.tsx': `import type {
  InterfaceClientContext,
  InterfaceServerContext,
  InterfaceServices,
} from "./services.ts";
import {
  defaultInterfacePageData,
  type InterfacePageData,
} from "./types.ts";

export async function loadServerData(
  ctx: InterfaceServerContext,
): Promise<InterfacePageData> {
  return {
    ...defaultInterfacePageData,
    status: ctx.previous?.status ?? "ready",
    message: ctx.previous?.message ?? "Author loadServerData for SampleInterface.",
  };
}

export async function loadClientData(
  _ctx: InterfaceClientContext,
): Promise<Partial<InterfacePageData>> {
  return {};
}

${sampleDefaultComponent}

export type InterfacePageProps = {
  data: InterfacePageData;
  services: InterfaceServices;
  status: {
    isLoading: boolean;
    error?: string;
  };
  refresh: () => Promise<void>;
};
`,
  'interfaces/sample-interface/index.tsx': `import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "preact/hooks";
import InterfaceModule, { loadClientData } from "./module.tsx";
import {
  createInterfaceServices,
  type InterfaceClientContext,
} from "./services.ts";
import {
  defaultInterfacePageData,
  type InterfacePageData,
} from "./types.ts";

type InterfaceWrapperProps = {
  data?: InterfacePageData;
  lookup: string;
};

export default function InterfaceWrapper({
  data,
  lookup,
}: InterfaceWrapperProps) {
  const [pageData, setPageData] = useState<InterfacePageData>(
    data ?? defaultInterfacePageData,
  );
  const [status, setStatus] = useState<{ isLoading: boolean; error?: string }>({
    isLoading: false,
    error: undefined,
  });

  const services = useMemo(
    () =>
      createInterfaceServices(async () => {
        throw new Error(
          "Client service invocation not implemented in sample.",
        );
      }),
    [lookup],
  );

  const refresh = useCallback(async () => {
    if (typeof loadClientData !== "function") return;

    setStatus({ isLoading: true, error: undefined });

    try {
      const next = await loadClientData({
        previous: pageData,
        services,
      } satisfies InterfaceClientContext);

      if (next && typeof next === "object") {
        setPageData((prev) => ({ ...prev, ...next }));
      }

      setStatus((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      setStatus({
        isLoading: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [pageData, services]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <InterfaceModule
      data={pageData}
      services={services}
      status={status}
      refresh={refresh}
    />
  );
}
`,
  'interfaces/sample-interface/handler.ts': `import type { InterfaceRequestContext } from "../registry.ts";
import type { InterfacePageData } from "./types.ts";
import {
  defaultInterfacePageData,
} from "./types.ts";
import {
  createInterfaceServices,
  type InterfaceServerContext,
} from "./services.ts";
import * as Module from "./module.tsx";

export async function loadPageData(
  req: Request,
  ctx: InterfaceRequestContext,
): Promise<InterfacePageData> {
  const services = createInterfaceServices(async () => {
    throw new Error(
      "Server service invocation not implemented in sample.",
    );
  });

  if (typeof Module.loadServerData === "function") {
    const result = await Module.loadServerData({
      request: req,
      params: ctx?.Params ?? {},
      headers: req.headers,
      previous: undefined,
      services,
    } satisfies InterfaceServerContext);

    return { ...defaultInterfacePageData, ...result };
  }

  return { ...defaultInterfacePageData };
}
`,
  'interfaces/registry.ts': `import { h } from "preact";
import type { JSX } from "preact";
import render from "preact-render-to-string";

import InterfaceSampleInterface from "./sample-interface/index.tsx";
import * as InterfaceSampleInterfaceHandlers from "./sample-interface/handler.ts";

export type InterfaceRequestContext = {
  Params?: Record<string, string>;
  [key: string]: unknown;
};

export type InterfaceRegistryEntry = {
  lookup: string;
  Component: (props: { data?: unknown }) => JSX.Element;
  handlers: Record<string, unknown>;
  render: (req: Request, ctx: InterfaceRequestContext) => Promise<Response>;
};

function createEntry(
  component: InterfaceRegistryEntry["Component"],
  handlers: InterfaceRegistryEntry["handlers"],
  lookup: string,
): InterfaceRegistryEntry {
  return {
    lookup,
    Component: component,
    handlers,
    render: async (req: Request, ctx: InterfaceRequestContext) => {
      const data = "loadPageData" in handlers && typeof handlers.loadPageData === "function"
        ? await handlers.loadPageData(req, ctx)
        : undefined;

      const html = render(h(component, { data }));

      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-Interface-Lookup": lookup,
        },
      });
    },
  };
}

export const interfaceRegistry: Record<string, InterfaceRegistryEntry> = {
  "sample-interface": createEntry(
    InterfaceSampleInterface,
    InterfaceSampleInterfaceHandlers,
    "sample-interface",
  ),
};
`,
};

export type GeneratedInterfaceModuleSampleKey =
  keyof typeof GeneratedInterfaceModuleSample;
