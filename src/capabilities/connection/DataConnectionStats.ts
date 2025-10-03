import { RuntimeStatsSchema } from '../../.deps.ts';
import { z } from '../../.deps.ts';

/**
 * Stats model for data connections — includes health and last activity timestamp.
 */
export const DataConnectionStatsSchema: z.ZodObject<
  typeof RuntimeStatsSchema.shape & {
    HealthStatus: z.ZodEnum<['Healthy', 'Unreachable', 'Stale', 'Unknown']>;
    LastReceivedTimestamp: z.ZodString;
  }
> = RuntimeStatsSchema.extend({
  /**
   * System health derived from telemetry activity.
   */
  HealthStatus: z
    .enum(['Healthy', 'Unreachable', 'Stale', 'Unknown'])
    .describe('System health derived from telemetry activity'),

  /**
   * Timestamp of last telemetry received, in ISO 8601 UTC format.
   */
  LastReceivedTimestamp: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/,
      'Must be a valid ISO 8601 UTC timestamp',
    )
    .describe('Timestamp of last telemetry received, in ISO 8601 format'),
});

export type DataConnectionStats = z.infer<typeof DataConnectionStatsSchema>;
