import type { SurfaceInterfaceSettings } from '../../../../.deps.ts';
import type { InterfaceGraphLookups } from './InterfaceGraphLookups.ts';
import { mergeLookupLists } from './mergeLookupLists.ts';

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
