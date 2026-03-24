import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Message,
  MessageDocument,
  MessageRole,
} from './schemas/message.schema';
import { AiService, ChatMessage } from '../ai/ai.service';
import { ChatsService } from '../chats/chats.service';
import { SendMessageDto } from './dto/message.dto';
import { getUserId } from 'src/utils/getUser';
import { FastifyRequest } from 'fastify';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    private readonly aiService: AiService,
    private readonly chatsService: ChatsService,
  ) {}

  /** Get all messages for a given chat session */
  async findByChatId(
    chatId: string,
    req: FastifyRequest,
  ): Promise<MessageDocument[]> {
    this.validateObjectId(chatId);

    // Ensure the chat exists
    await this.chatsService.findOne(chatId, getUserId(req));

    return this.messageModel
      .find({ chatId: new Types.ObjectId(chatId) })
      .sort({ createdAt: 1 })
      .exec();
  }

  /**
   * Send a message in a chat session.
   * 1. Saves the user message
   * 2. Fetches full history from MongoDB
   * 3. Sends to Gemini via LangChain
   * 4. Saves and returns the AI response
   */
  async sendMessage(
    chatId: string,
    sendMessageDto: SendMessageDto,
    req: FastifyRequest,
  ): Promise<{ userMessage: MessageDocument; aiMessage: MessageDocument }> {
    this.validateObjectId(chatId);

    // Validate chat exists
    await this.chatsService.findOne(chatId, getUserId(req));

    const chatObjectId = new Types.ObjectId(chatId);

    // 1. Save user message
    const userMessage = await this.messageModel.create({
      chatId: chatObjectId,
      role: MessageRole.USER,
      content: sendMessageDto.content,
    });

    // 2. Fetch existing message history for context (exclude the just-saved one)
    const historyDocs = await this.messageModel
      .find({ chatId: chatObjectId, _id: { $ne: userMessage._id } })
      .sort({ createdAt: 1 })
      .exec();

    const history: ChatMessage[] = historyDocs.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // 3. Get AI response
    let aiResponse: string;
    try {
      aiResponse = await this.aiService.chat(
        chatId,
        sendMessageDto.content,
        history,
      );
    } catch (error) {
      this.logger.error(`AI error for chat ${chatId}:`, error);
      // Delete the user message if AI fails to keep state clean
      await this.messageModel.findByIdAndDelete(userMessage._id);
      throw error;
    }

    // 4. Save AI response
    const aiMessage = await this.messageModel.create({
      chatId: chatObjectId,
      role: MessageRole.ASSISTANT,
      content: aiResponse,
    });

    // 5. Auto-generate title if this is the first message
    const messageCount = await this.messageModel.countDocuments({
      chatId: chatObjectId,
    });
    if (messageCount <= 2) {
      const title = await this.aiService.generateChatTitle(
        sendMessageDto.content,
      );
      await this.chatsService.updateTitle(chatId, title, getUserId(req));
    }

    return { userMessage, aiMessage };
  }

  /** Delete all messages for a chat (used when deleting a chat) */
  async deleteByChatId(chatId: string): Promise<void> {
    this.validateObjectId(chatId);
    await this.messageModel.deleteMany({ chatId: new Types.ObjectId(chatId) });
    this.logger.log(`Deleted all messages for chat: ${chatId}`);
  }

  private validateObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid ID format: ${id}`);
    }
  }
}
