import { RuntimeStatsSchema } from '../../.deps.ts';
import { z } from '../../.deps.ts';

/**
 * Stats model for surface components — includes agent and signal telemetry.
 */
export const SurfaceStatsSchema: z.ZodObject<
  typeof RuntimeStatsSchema.shape & {
    InputCount: z.ZodOptional<z.ZodNumber>;
    AgentCount: z.ZodOptional<z.ZodNumber>;
    LastSignalAt: z.ZodOptional<z.ZodString>;
  }
> = RuntimeStatsSchema.extend({
  /**
   * Number of data-producing inputs connected to this surface.
   */
  InputCount: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe('Number of connected data inputs (e.g. devices, simulators)'),

  /**
   * Number of deployed agents running on this surface.
   */
  AgentCount: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe('Number of agents actively deployed on this surface'),

  /**
   * Timestamp of the last signal emitted by any agent on this surface.
   */
  LastSignalAt: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/,
      'Must be a valid ISO 8601 UTC timestamp',
    )
    .optional()
    .describe(
      'Timestamp of last signal emitted on this surface (ISO 8601 UTC)',
    ),
});

export type SurfaceStats = z.infer<typeof SurfaceStatsSchema>;
