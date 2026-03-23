import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Evaluation, EvaluationDocument } from './schemas/evaluation.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Idea, IdeaDocument } from 'src/idea/schemas/idea.schema';

@Injectable()
export class EvaluationService {
  constructor(
    @InjectModel(Evaluation.name)
    private evaluationModel: Model<EvaluationDocument>,
    @InjectModel(Idea.name) private ideaModel: Model<IdeaDocument>,
  ) {}

  async getLatest(ideaId: string, userId: string): Promise<EvaluationDocument> {
    this.validateObjectId(ideaId);
    await this.assertOwnership(ideaId, userId);

    const evaluation = await this.evaluationModel
      .findOne({ ideaId: new Types.ObjectId(ideaId) })
      .sort({ version: -1 });

    if (!evaluation) {
      throw new NotFoundException('No evaluation found for this idea.');
    }

    return evaluation;
  }

  async getHistory(
    ideaId: string,
    userId: string,
  ): Promise<EvaluationDocument[]> {
    this.validateObjectId(ideaId);
    await this.assertOwnership(ideaId, userId);

    return this.evaluationModel
      .find({ ideaId: new Types.ObjectId(ideaId) })
      .sort({ version: -1 });
  }

  // ─── Private Helpers ────────────────────────────────────────────────────
  private validateObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid idea ID');
    }
  }

  private async assertOwnership(
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
}
