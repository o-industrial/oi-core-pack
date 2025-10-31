export type SurfaceInterfaceModalPageDocs = {
  dataSlices: SurfaceInterfaceModalPageSliceDoc[];
  handlerResults: SurfaceInterfaceModalPageHandlerResultDoc[];
  services: SurfaceInterfaceModalPageServiceDoc[];
  statusFields: SurfaceInterfaceModalPageStatusFieldDoc[];
  refreshDescription: string;
};

export type SurfaceInterfaceModalPageSliceDoc = {
  key: string;
  label: string;
  description?: string;
  accessMode?: string;
  hydration: {
    server: boolean;
    client: boolean;
    clientRefreshMs?: number;
  };
  dataConnectionSummary: string[];
  schemaFields: SurfaceInterfaceModalPageSliceFieldDoc[];
  actions: SurfaceInterfaceModalPageActionDoc[];
};

export type SurfaceInterfaceModalPageSliceFieldDoc = {
  name: string;
  type?: string;
  required: boolean;
  description?: string;
};

export type SurfaceInterfaceModalPageActionDoc = {
  key: string;
  label: string;
  description?: string;
  invocationMode?: string | null;
  invocationType?: string;
  support: {
    handler: boolean;
    client: boolean;
  };
  handlerSteps: SurfaceInterfaceModalPageHandlerStepDoc[];
};

export type SurfaceInterfaceModalPageHandlerStepDoc = {
  id: string;
  resultName: string;
  autoExecute: boolean;
  includeInResponse: boolean;
  notes?: string;
  serviceMethods: string[];
};

export type SurfaceInterfaceModalPageHandlerResultDoc = {
  resultName: string;
  sliceKey: string;
  sliceLabel?: string;
  actionKey: string;
  actionLabel?: string;
  autoExecute: boolean;
  includeInResponse: boolean;
  invocationType?: string;
  notes?: string;
  serviceMethods: string[];
};

export type SurfaceInterfaceModalPageServiceDoc = {
  methodName: string;
  sliceKey: string;
  sliceLabel?: string;
  actionKey: string;
  actionLabel?: string;
  invocationType?: string;
  hasInput: boolean;
  inputType: string;
  outputType: string;
  autoExecute: boolean;
  includeInResponse: boolean;
  resultName: string;
  notes: string[];
};

export type SurfaceInterfaceModalPageStatusFieldDoc = {
  key: string;
  description: string;
};
