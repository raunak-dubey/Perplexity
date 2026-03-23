import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateIdeaDto } from './dto/createIdea.dto';
import { UpdateIdeaDto } from './dto/updateIdea.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Idea, IdeaDocument, IdeaStatus } from './schemas/idea.schema';
import { Model, Types } from 'mongoose';
import {
  Evaluation,
  EvaluationDocument,
  FinalVerdict,
} from 'src/evaluation/schemas/evaluation.schema';
import { AiService } from 'src/ai/ai.service';

@Injectable()
export class IdeaService {
  constructor(
    @InjectModel(Idea.name) private ideaModel: Model<IdeaDocument>,
    @InjectModel(Evaluation.name)
    private evaluationModel: Model<EvaluationDocument>,
    private readonly aiService: AiService,
  ) {}

  private readonly verdictToStatusMap: Record<FinalVerdict, IdeaStatus> = {
    [FinalVerdict.BUILD]: IdeaStatus.BUILD,
    [FinalVerdict.PIVOT]: IdeaStatus.PIVOT,
    [FinalVerdict.DROP]: IdeaStatus.DROP,
  };

  // ─── Submit & Evaluate ────────────────────────────────────────────────────
  async submit(
    userId: string,
    createIdeaDto: CreateIdeaDto,
  ): Promise<{ idea: IdeaDocument; evaluation: EvaluationDocument }> {
    const idea = await this.ideaModel.create({
      ...createIdeaDto,
      userId: new Types.ObjectId(userId),
      currentStatus: IdeaStatus.IN_REVIEW,
      version: 1,
      evaluationCount: 0,
    });

    const evaluation = await this.runEvaluation(idea, userId);
    return { idea, evaluation };
  }

  async reEvaluate(
    ideaId: string,
    userId: string,
    updateIdeaDto: UpdateIdeaDto,
  ): Promise<{ idea: IdeaDocument; evaluation: EvaluationDocument }> {
    const idea = await this.findOwnedIdea(ideaId, userId);

    Object.assign(idea, updateIdeaDto);
    idea.version += 1;
    idea.currentStatus = IdeaStatus.IN_REVIEW;
    await idea.save();

    const evaluation = await this.runEvaluation(idea, userId);
    return { idea, evaluation };
  }

  // ─── List all ideas for user ──────────────────────────────────────────────
  async findAll(userId: string): Promise<Idea[]> {
    return this.ideaModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean<Idea[]>();
  }

  // ─── Get single idea ──────────────────────────────────────────────────────
  async findOne(ideaId: string, userId: string): Promise<IdeaDocument> {
    return this.findOwnedIdea(ideaId, userId);
  }

  // ─── Update idea fields only (no re-evaluation) ───────────────────────────
  async update(
    ideaId: string,
    updateIdeaDto: UpdateIdeaDto,
    userId: string,
  ): Promise<IdeaDocument> {
    await this.findOwnedIdea(ideaId, userId); // verify ownership first

    const updated = await this.ideaModel.findByIdAndUpdate(
      ideaId,
      { $set: updateIdeaDto },
      { new: true },
    );

    if (!updated) throw new NotFoundException('Idea not found.');
    return updated;
  }

  // ─── Delete idea ───────────────────────────────────────────────────────
  async remove(ideaId: string, userId: string): Promise<{ message: string }> {
    await this.findOwnedIdea(ideaId, userId);
    await this.ideaModel.findByIdAndDelete(ideaId);
    return { message: 'Idea deleted successfully.' };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────
  private async findOwnedIdea(
    ideaId: string,
    userId: string,
  ): Promise<IdeaDocument> {
    const idea = await this.ideaModel.findById(ideaId);
    if (!idea) throw new NotFoundException('Idea not found.');

    if (idea.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this idea.');
    }

    return idea;
  }

  private async runEvaluation(
    idea: IdeaDocument,
    userId: string,
  ): Promise<EvaluationDocument> {
    const { result, rawResponse, tokenUsage } =
      await this.aiService.evaluateIdea(idea);

    // Save evaluation
    const evaluation = await this.evaluationModel.create({
      ideaId: idea._id,
      userId: new Types.ObjectId(userId),
      version: idea.version,
      ...result,
      rawAIResponse: rawResponse,
      tokenUsage,
    });
    await this.ideaModel.findByIdAndUpdate(idea._id, {
      latestClarityScore: result.clarityScore,
      latestMarketScore: result.marketScore,
      latestExecutionScore: result.executionScore,
      latestOverallScore: result.overallScore,
      currentStatus: this.verdictToStatusMap[result.finalVerdict],
      $inc: { evaluationCount: 1 },
    });

    return evaluation;
  }
}
