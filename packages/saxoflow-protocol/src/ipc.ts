
import { z } from 'zod';

export const StartRunRequest = z.object({
  type: z.literal('start_run'),
  run_id: z.string(),
  stages: z.array(z.string()).nonempty(),
  env: z.record(z.string()).optional()
});

export const LogEvent = z.object({
  type: z.literal('log'),
  stage: z.string(),
  level: z.enum(['info', 'warn', 'error']),
  msg: z.string(),
  ts: z.number().optional()
});

export const StageDoneEvent = z.object({
  type: z.literal('stage_done'),
  stage: z.string(),
  status: z.enum(['ok', 'failed', 'skipped'])
});

export const RunDoneEvent = z.object({
  type: z.literal('run_done'),
  status: z.enum(['ok', 'failed', 'canceled'])
});
