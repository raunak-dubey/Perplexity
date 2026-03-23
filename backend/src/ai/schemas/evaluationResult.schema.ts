import { z } from 'zod';
import { FinalVerdict } from '../../evaluation/schemas/evaluation.schema';

export const MvpPhaseSchema = z.object({
  phase: z.string(),
  goal: z.string(),
  successMetric: z.string(),
});

export const CapitalEstimateSchema = z.object({
  development: z.number().min(0),
  marketing: z.number().min(0),
  tools: z.number().min(0),
  miscellaneous: z.number().min(0),
  total: z.number().min(0),
});

export const EvaluationResultSchema = z.object({
  clarityScore: z.number().min(0).max(10),
  marketScore: z.number().min(0).max(10),
  executionScore: z.number().min(0).max(10),
  overallScore: z.number().min(0).max(10),
  majorRisks: z.array(z.string()).min(1),
  unrealisticAssumptions: z.array(z.string()),
  mustFix: z.array(z.string()),
  indianMarketChallenges: z.array(z.string()),
  mvpPlan: z.array(MvpPhaseSchema).min(1),
  first20CustomersStrategy: z.string().min(10),
  suggestedGrowthChannels: z.array(z.string()),
  capitalEstimate: CapitalEstimateSchema,
  wouldInvest: z.boolean(),
  investmentReason: z.string().min(10).max(1000),
  finalVerdict: z.enum(FinalVerdict),
  oneLinerSummary: z.string().max(200),
});

// Infer type from schema — no duplicate interface
export type AiEvaluationResult = z.infer<typeof EvaluationResultSchema>;
