import { RuntimeStatsSchema } from '../../.deps.ts';
import { z } from '../../.deps.ts';

/**
 * Stats model for a single surface-bound agent — includes match rate and latency.
 */
export const SurfaceAgentStatsSchema: z.ZodObject<
  typeof RuntimeStatsSchema.shape & {
    MatchesHandled: z.ZodOptional<z.ZodNumber>;
    AvgLatencyMs: z.ZodOptional<z.ZodNumber>;
    LastRunAgo: z.ZodOptional<z.ZodString>;
  }
> = RuntimeStatsSchema.extend({
  /**
   * Total number of matched impulses handled by the agent.
   */
  MatchesHandled: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe('Total number of matched impulses processed by this agent'),

  /**
   * Average execution latency in milliseconds per match.
   */
  AvgLatencyMs: z
    .number()
    .nonnegative()
    .optional()
    .describe(
      'Average latency (ms) between impulse match and action execution',
    ),

  /**
   * Duration since the agent was last triggered, expressed as a human-readable string.
   */
  LastRunAgo: z
    .string()
    .optional()
    .describe('Duration since last agent execution (e.g., "5s", "2m", "1h")'),
});

export type SurfaceAgentStats = z.infer<typeof SurfaceAgentStatsSchema>;
