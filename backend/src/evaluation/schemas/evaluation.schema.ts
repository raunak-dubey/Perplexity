import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EvaluationDocument = HydratedDocument<Evaluation>;

export enum FinalVerdict {
  BUILD = 'BUILD',
  PIVOT = 'PIVOT',
  DROP = 'DROP',
}

export interface MvpPhase {
  phase: string; // e.g. "Day 1-2"
  goal: string; // e.g. "Set up landing page"
  successMetric: string; // e.g. "100 signups"
}

export interface CapitalEstimate {
  development: number;
  marketing: number;
  tools: number;
  miscellaneous: number;
  total: number;
}

@Schema({ timestamps: true })
export class Evaluation {
  @Prop({
    type: Types.ObjectId,
    ref: 'Idea',
    required: true,
    index: true,
  })
  ideaId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    required: true,
    min: 1,
  })
  version!: number;

  // ─── Scores ─────────────────────────────────────────────────────────────
  @Prop({ required: true, min: 0, max: 10 })
  clarityScore!: number; // Is the idea clear and easy to understand?

  @Prop({ required: true, min: 0, max: 10 })
  marketScore!: number; // Is thier a real market in India?

  @Prop({ required: true, min: 0, max: 10 })
  executionScore!: number; // Can a student execute the idea?

  @Prop({ required: true, min: 0, max: 10 })
  overallScore!: number;

  // ─── Risk Analysis ────────────────────────────────────────────────────────
  @Prop({
    type: [String],
    required: true,
  })
  majorRisks!: string[];

  @Prop({
    type: [String],
    required: true,
  })
  unrealisticAssumptions!: string[];

  @Prop({
    type: [String],
    required: true,
  })
  mustFix!: string[];

  @Prop({ type: [String], default: [] })
  indianMarketChallenges!: string[];

  // ─── Action Plan ──────────────────────────────────────────────────────────
  @Prop({
    type: [
      {
        phase: { type: String, required: true },
        goal: { type: String, required: true },
        successMetric: { type: String, required: true },
      },
    ],
    required: true,
  })
  mvpPlan!: MvpPhase[];

  @Prop({
    required: true,
    trim: true,
  })
  first20CustomersStrategy!: string;

  @Prop({ type: [String], default: [] })
  suggestedGrowthChannels!: string[]; // (WhatsApp, college groups, Instagram)

  // ─── Financials ───────────────────────────────────────────────────────────
  @Prop({
    type: {
      development: { type: Number, required: true, min: 0 },
      marketing: { type: Number, required: true, min: 0 },
      tools: { type: Number, required: true, min: 0 },
      miscellaneous: { type: Number, required: true, min: 0 },
      total: { type: Number, required: true, min: 0 },
    },
    required: true,
  })
  capitalEstimate!: CapitalEstimate;

  @Prop({ required: true })
  wouldInvest!: boolean;

  @Prop({
    required: true,
    trim: true,
    maxlength: 1000,
  })
  investmentReason!: string;

  // ─── Verdict ──────────────────────────────────────────────────────────────
  @Prop({
    enum: FinalVerdict,
    required: true,
    index: true,
  })
  finalVerdict!: FinalVerdict;

  @Prop({ required: true, trim: true, maxlength: 200 })
  oneLinerSummary!: string;

  @Prop({ required: true })
  rawAIResponse!: string;

  @Prop({
    type: {
      inputTokens: { type: Number },
      outputTokens: { type: Number },
    },
    default: {},
  })
  tokenUsage!: { inputTokens: number; outputTokens: number };
}

export const EvaluationSchema = SchemaFactory.createForClass(Evaluation);

/**
 * Indexes
 */
EvaluationSchema.index({ ideaId: 1, version: -1 });
EvaluationSchema.index({ userId: 1, createdAt: -1 });
