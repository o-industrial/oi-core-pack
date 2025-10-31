import { buildDefaultInterfacePageBody } from '../SurfaceInterfaceTemplates.ts';
import type { PageScaffoldOptions } from '../state/PageScaffoldOptions.ts';
import type { PageScaffold } from '../state/PageScaffold.ts';

export function buildPageScaffold({
  lookup,
  safeId,
  displayName,
}: PageScaffoldOptions): PageScaffold {
  const body = buildDefaultInterfacePageBody(lookup, safeId, displayName);
  const title = displayName || `${safeId} interface`;

  return {
    body,
    description:
      `Render the ${title} interface using server-provided data and refresh affordances.`,
    messages: [
      'Update this layout to reflect the intended collaborative interface experience.',
      'Reference the generated data shape and imports exposed on this tab.',
      'Use the `refresh` helper to re-run interface actions when the user needs fresh data.',
    ],
  };
}
