import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type IdeaDocument = HydratedDocument<Idea>;

export enum IdeaStatus {
  IN_REVIEW = 'IN_REVIEW',
  BUILD = 'BUILD',
  PIVOT = 'PIVOT',
  DROP = 'DROP',
}

@Schema({ timestamps: true })
export class Idea {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ required: true, minlength: 5, maxlength: 120, trim: true })
  title!: string;

  @Prop({ required: true, trim: true, minlength: 20, maxlength: 500 })
  targetCustomer!: string;

  @Prop({ required: true, trim: true, minlength: 20, maxlength: 1000 })
  problemStatement!: string;

  @Prop({ required: true, trim: true, minlength: 10, maxlength: 1000 })
  existingAlternatives!: string;

  @Prop({ required: true, trim: true, minlength: 10, maxlength: 1000 })
  solution!: string;

  @Prop({ required: true, min: 0 })
  pricingINR!: number;

  @Prop({
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000,
  })
  distributionStrategy!: string;

  @Prop({
    required: true,
    min: 0,
  })
  estimatedBudgetINR!: number;

  @Prop({
    enum: IdeaStatus,
    default: IdeaStatus.IN_REVIEW,
    index: true,
  })
  currentStatus!: IdeaStatus;

  @Prop({ min: 0, max: 10, default: null })
  latestClarityScore!: number;

  @Prop({ min: 0, max: 10, default: null })
  latestMarketScore!: number;

  @Prop({ min: 0, max: 10, default: null })
  latestExecutionScore!: number;

  @Prop({ min: 0, max: 10, default: null })
  latestOverallScore!: number;

  @Prop({
    default: 1,
    min: 1,
  })
  version!: number;

  @Prop({ default: 0, min: 0 })
  evaluationCount!: number;
}

export const IdeaSchema = SchemaFactory.createForClass(Idea);

// ? Indexes
IdeaSchema.index({ userId: 1, createdAt: -1 });
