import { Action, ActionStyleTypes, IntentTypes, type JSX, useMemo } from '../../../.deps.ts';

type SurfaceInterfacePreviewTabProps = {
  interfaceLookup: string;
  surfaceLookup?: string;
  previewNonce: number;
  onRefreshPreview: () => void;
};

export function SurfaceInterfacePreviewTab({
  interfaceLookup,
  surfaceLookup,
  previewNonce,
  onRefreshPreview,
}: SurfaceInterfacePreviewTabProps): JSX.Element {
  const globalLocation = (globalThis as { location?: Location }).location;
  const globalOpen = (globalThis as { open?: typeof open }).open;

  const defaultHost = globalLocation?.origin ?? '';
  const globalBase = (globalThis as { __OI_INTERFACE_PREVIEW_BASE__?: string })
    .__OI_INTERFACE_PREVIEW_BASE__ ??
    (globalThis as { __INTERFACE_PREVIEW_BASE__?: string }).__INTERFACE_PREVIEW_BASE__ ??
    '';

  const effectivePreviewBase = useMemo(() => {
    const trimmedGlobal = globalBase?.trim();
    if (trimmedGlobal) return trimmedGlobal;

    return defaultHost;
  }, [globalBase, defaultHost]);

  const previewUrl = useMemo(() => {
    if (!effectivePreviewBase) return undefined;

    const previewPath = surfaceLookup
      ? `/surfaces/${encodeURIComponent(surfaceLookup)}/interfaces/${
        encodeURIComponent(interfaceLookup)
      }`
      : `/interfaces/${encodeURIComponent(interfaceLookup)}`;

    try {
      const baseUrl = new URL(
        effectivePreviewBase,
        defaultHost || 'http://localhost',
      );
      const prefix = baseUrl.pathname.endsWith('/')
        ? baseUrl.pathname.slice(0, -1)
        : baseUrl.pathname;
      baseUrl.pathname = `${prefix}${previewPath}`;
      return baseUrl.toString();
    } catch {
      if (!globalLocation) return undefined;
      try {
        return new URL(previewPath, globalLocation.origin).toString();
      } catch {
        return undefined;
      }
    }
  }, [defaultHost, effectivePreviewBase, globalLocation, interfaceLookup, surfaceLookup]);

  return (
    <div class='flex h-full min-h-0 flex-col gap-3'>
      <div class='flex items-center justify-between'>
        <div class='flex flex-col text-xs text-neutral-400'>
          <span>Surface: {surfaceLookup ?? '(workspace default)'}</span>
          <span>Interface: {interfaceLookup}</span>
          {previewUrl && (
            <span class='truncate text-neutral-500'>
              Preview URL: {previewUrl}
            </span>
          )}
        </div>
        <div class='flex items-center gap-2'>
          <Action
            styleType={ActionStyleTypes.Outline | ActionStyleTypes.Rounded}
            intentType={IntentTypes.Secondary}
            disabled={!previewUrl}
            onClick={() => onRefreshPreview()}
          >
            Refresh
          </Action>
          <Action
            styleType={ActionStyleTypes.Solid | ActionStyleTypes.Rounded}
            intentType={IntentTypes.Primary}
            disabled={!previewUrl}
            onClick={() => {
              if (previewUrl && globalOpen) {
                globalOpen(previewUrl, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            Open in new tab
          </Action>
        </div>
      </div>

      <div class='flex-1 min-h-0 rounded border border-neutral-800 bg-neutral-950 overflow-hidden'>
        {previewUrl
          ? (
            <iframe
              key={previewNonce}
              src={previewUrl}
              title='Interface Preview'
              loading='lazy'
              class='h-full w-full border-0'
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
              sandbox='allow-scripts allow-same-origin allow-popups allow-forms'
            />
          )
          : (
            <div class='flex h-full items-center justify-center p-6 text-center text-sm text-neutral-400'>
              Unable to determine a preview URL. Provide a preview host or verify your runtime
              configuration.
            </div>
          )}
      </div>
    </div>
  );
}
