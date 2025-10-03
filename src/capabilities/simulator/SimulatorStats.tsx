import { RuntimeStatsSchema } from '../../.deps.ts';
import { z } from '../../.deps.ts';

/**
 * Stats model for simulator components — includes deployment and startup metrics.
 */
export const SimulatorStatsSchema: z.ZodObject<
  typeof RuntimeStatsSchema.shape & {
    InstanceCount: z.ZodOptional<z.ZodNumber>;
    AvgStartupMs: z.ZodOptional<z.ZodNumber>;
    LastDeploymentAt: z.ZodOptional<z.ZodString>;
  }
> = RuntimeStatsSchema.extend({
  /**
   * Number of active simulator instances running.
   */
  InstanceCount: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe('Number of active simulator instances'),

  /**
   * Average startup time in milliseconds across instances.
   */
  AvgStartupMs: z
    .number()
    .nonnegative()
    .optional()
    .describe('Average simulator startup time in milliseconds'),

  /**
   * Timestamp of the most recent deployment, in ISO 8601 format.
   */
  LastDeploymentAt: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/,
      'Must be a valid ISO 8601 UTC timestamp',
    )
    .optional()
    .describe('Timestamp of last simulator deployment (ISO 8601 UTC)'),
});

export type SimulatorStats = z.infer<typeof SimulatorStatsSchema>;
