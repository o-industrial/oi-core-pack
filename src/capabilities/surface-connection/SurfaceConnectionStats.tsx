import { RuntimeStatsSchema } from '../../.deps.ts';
import { z } from '../../.deps.ts';

/**
 * Stats model for a data connection inside a surface — impulse rate only.
 */
export const SurfaceConnectionStatsSchema = RuntimeStatsSchema;

export type SurfaceConnectionStats = z.infer<
  typeof SurfaceConnectionStatsSchema
>;
