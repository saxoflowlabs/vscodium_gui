import { z } from 'zod';

export const ProjectSchema = z.object({
  project: z.object({
    name: z.string(),
    top: z.string(),
    language: z.enum(['verilog', 'systemverilog']).default('systemverilog'),
    pdk: z.string(),
    clock: z.object({
      name: z.string(),
      period_ns: z.number()
    })
  }),
  paths: z.object({
    rtl: z.string(),
    tb: z.string().optional(),
    constraints: z.string().optional(),
    build: z.string()
  }),
  flow: z.object({
    profile: z.string(),
    stages: z.array(z.string())
  }),
  ai: z.object({
    enable: z.boolean().default(false),
    provider: z.string().optional()
  })  
});

export type ProjectConfig = z.infer<typeof ProjectSchema>;
