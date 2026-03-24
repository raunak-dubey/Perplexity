import {
  Injectable,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument } from './schemas/chat.schema';
import { CreateChatDto, UpdateChatDto } from './dto/chat.dto';

@Injectable()
export class ChatsService {
  private readonly logger = new Logger(ChatsService.name);

  constructor(
    @InjectModel(Chat.name) private readonly chatModel: Model<ChatDocument>,
  ) {}

  async create(
    user: string,
    createChatDto: CreateChatDto,
  ): Promise<ChatDocument> {
    const chat = new this.chatModel({
      user: new Types.ObjectId(user),
      title: createChatDto.title || 'New Chat',
    });

    const saved = await chat.save();
    this.logger.log(`Created new chat: ${saved._id}`);
    return saved;
  }

  async findAll(user: string): Promise<ChatDocument[]> {
    return this.chatModel
      .find({ isArchived: false, user: new Types.ObjectId(user) })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findOne(id: string, user: string): Promise<ChatDocument> {
    this.validateObjectId(id);

    return this.findOwnedChat(id, user);
  }

  async update(
    id: string,
    updateChatDto: UpdateChatDto,
    user: string,
  ): Promise<ChatDocument> {
    this.validateObjectId(id);
    await this.findOwnedChat(id, user);

    const updated = await this.chatModel.findByIdAndUpdate(
      id,
      { $set: updateChatDto },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException(`Chat with ID ${id} not found`);
    }
    return updated;
  }

  async updateTitle(
    id: string,
    title: string,
    user: string,
  ): Promise<ChatDocument> {
    return this.update(id, { title }, user);
  }

  async archive(id: string): Promise<ChatDocument> {
    this.validateObjectId(id);

    const chat = await this.chatModel
      .findByIdAndUpdate(id, { isArchived: true }, { new: true })
      .exec();

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${id} not found`);
    }

    return chat;
  }

  async remove(id: string, user: string): Promise<void> {
    this.validateObjectId(id);

    await this.findOwnedChat(id, user);
    await this.chatModel.findByIdAndDelete(id);
    this.logger.log(`Deleted chat: ${id}`);
  }

  private validateObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid ID format: ${id}`);
    }
  }

  // ---- Private Helper --------------------------------------
  private async findOwnedChat(
    chatId: string,
    userId: string,
  ): Promise<ChatDocument> {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) throw new NotFoundException('Chat not found.');

    if (chat.user.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this Chat.');
    }

    return chat;
  }
}
