import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { IdeaDocument } from '../idea/schemas/idea.schema';
import {
  EvaluationResultSchema,
  type AiEvaluationResult,
} from './schemas/evaluationResult.schema';
import { ZodError } from 'zod';

export type { AiEvaluationResult };

// ─── Prompt ───────────────────────────────────────────────────────────────────
// Defined at module level — not recreated on every call

const EVALUATION_PROMPT = PromptTemplate.fromTemplate(`
You are a brutally honest startup validator specialized in the Indian market.
Your job is to evaluate startup ideas submitted by Indian students aged 17-28.
Be direct and specific to India (mention UPI, WhatsApp, Tier-2/3 cities, college networks where relevant).
Do NOT be encouraging just for the sake of it. If an idea is bad, say DROP clearly.

## IDEA SUBMITTED

Title: {title}
Target Customer: {targetCustomer}
Problem: {problemStatement}
Existing Alternatives: {existingAlternatives}
Proposed Solution: {solution}
Pricing (INR): {pricingINR}
Distribution Strategy: {distributionStrategy}
Estimated Budget (INR): {estimatedBudgetINR}

## YOUR TASK

Return a JSON object with EXACTLY this structure (no markdown, no extra fields):

{{
  "clarityScore": <0-10>,
  "marketScore": <0-10>,
  "executionScore": <0-10>,
  "overallScore": <0-10, weighted average of above three>,
  "majorRisks": ["<risk>", "<risk>", "<risk>"],
  "unrealisticAssumptions": ["<assumption>"],
  "mustFix": ["<blocker before building>"],
  "indianMarketChallenges": ["<India-specific challenge>"],
  "mvpPlan": [
    {{ "phase": "Week 1", "goal": "<what to build>", "successMetric": "<how to measure>" }},
    {{ "phase": "Week 2", "goal": "<what to validate>", "successMetric": "<metric>" }}
  ],
  "first20CustomersStrategy": "<specific actionable strategy for first 20 paying Indian customers>",
  "suggestedGrowthChannels": ["<channel 1>", "<channel 2>"],
  "capitalEstimate": {{
    "development": <INR>,
    "marketing": <INR>,
    "tools": <INR>,
    "miscellaneous": <INR>,
    "total": <sum of all>
  }},
  "wouldInvest": <true or false>,
  "investmentReason": "<2-3 sentences>",
  "finalVerdict": "<BUILD | PIVOT | DROP>",
  "oneLinerSummary": "<max 200 chars honest assessment>"
}}

SCORING GUIDE:
- clarityScore 8+: problem and solution are crystal clear with no ambiguity
- marketScore 8+: you can name real Indian customers who would pay today
- executionScore 8+: a single student can launch MVP in 2 weeks under Rs.10000

Return ONLY valid JSON. No explanation, no markdown, no preamble.
`);

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class AiService {
  private readonly chain: RunnableSequence;

  constructor(private readonly config: ConfigService) {
    const model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash-lite',
      apiKey: this.config.get<string>('google.apiKey') ?? '',
      temperature: 0.3,
      maxRetries: 2,
      streaming: false,
    });

    this.chain = RunnableSequence.from([
      EVALUATION_PROMPT,
      model,
      new JsonOutputParser(),
    ]);
  }

  async evaluateIdea(idea: IdeaDocument): Promise<{
    result: AiEvaluationResult;
    rawResponse: string;
    tokenUsage: { inputTokens: number; outputTokens: number };
  }> {
    const input: Record<string, string> = {
      title: idea.title,
      targetCustomer: idea.targetCustomer,
      problemStatement: idea.problemStatement,
      existingAlternatives: idea.existingAlternatives,
      solution: idea.solution,
      pricingINR: String(idea.pricingINR),
      distributionStrategy: idea.distributionStrategy,
      estimatedBudgetINR: String(idea.estimatedBudgetINR),
    };

    // LangChain handles retries internally via maxRetries
    let rawJson: unknown;
    try {
      rawJson = (await this.chain.invoke(input)) as unknown;
    } catch {
      throw new InternalServerErrorException(
        'AI evaluation failed. Please try again later.',
      );
    }

    const parsed = EvaluationResultSchema.safeParse(rawJson);

    if (!parsed.success) {
      const issues = this.formatZodError(parsed.error);
      throw new InternalServerErrorException(
        `AI returned invalid data (${issues}). Please try again.`,
      );
    }

    return {
      result: parsed.data,
      rawResponse: JSON.stringify(rawJson),
      tokenUsage: { inputTokens: 0, outputTokens: 0 },
    };
  }

  private formatZodError(error: ZodError): string {
    return error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
  }
}
