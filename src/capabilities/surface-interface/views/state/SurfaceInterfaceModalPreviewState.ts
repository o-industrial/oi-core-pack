export type SurfaceInterfaceModalPreviewState = {
  baseOverride: string;
  setBaseOverride: (next: string) => void;
  nonce: number;
  refresh: () => void;
};
