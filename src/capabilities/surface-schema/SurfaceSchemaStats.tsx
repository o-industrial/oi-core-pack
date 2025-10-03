import { RuntimeStatsSchema } from '../../.deps.ts';
import { z } from '../../.deps.ts';

/**
 * Stats model for a schema attached to a surface — impulse rate only.
 */
export const SurfaceSchemaStatsSchema = RuntimeStatsSchema;

export type SurfaceSchemaStats = z.infer<typeof SurfaceSchemaStatsSchema>;
