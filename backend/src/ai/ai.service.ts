import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  BaseMessage,
} from '@langchain/core/messages';
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private model!: ChatGoogleGenerativeAI;
  private readonly sessionHistories = new Map<
    string,
    InMemoryChatMessageHistory
  >();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('ai.googleApiKey');
    const modelName = this.configService.get<string>('ai.model');
    const maxOutputTokens = this.configService.get<number>('ai.maxTokens');
    const temperature = this.configService.get<number>('ai.temperature');

    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is not set in environment variables');
    }

    this.model = new ChatGoogleGenerativeAI({
      model: modelName,
      apiKey,
      maxOutputTokens,
      temperature,
    });

    this.logger.log(`AI Service initialized with model: ${modelName}`);
  }

  async chat(
    sessionId: string,
    userMessage: string,
    previousMessages: ChatMessage[] = [],
  ): Promise<string> {
    try {
      const history = this.buildMessageHistory(previousMessages);

      const messages: BaseMessage[] = [
        new SystemMessage(
          'You are a helpful, friendly, and intelligent AI assistant. ' +
            'Provide clear, concise, and accurate responses. ' +
            'Maintain context across the conversation.',
        ),
        ...history,
        new HumanMessage(userMessage),
      ];

      this.logger.debug(
        `Sending ${messages.length} messages for session: ${sessionId}`,
      );

      const response = await this.model.invoke(messages);
      const content = response.content as string;

      return content;
    } catch (error) {
      this.logger.error(`AI chat error for session ${sessionId}:`, error);
      throw error;
    }
  }

  private buildMessageHistory(messages: ChatMessage[]): BaseMessage[] {
    return messages.map((msg) => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content);
      }
      return new AIMessage(msg.content);
    });
  }

  async generateChatTitle(firstMessage: string): Promise<string> {
    try {
      const response = await this.model.invoke([
        new SystemMessage(
          'Generate a very short, concise title (max 5 words) for a chat session ' +
            "based on the user's first message. Return ONLY the title, no quotes or punctuation.",
        ),
        new HumanMessage(firstMessage),
      ]);

      return (response.content as string).trim();
    } catch (error) {
      this.logger.error('Failed to generate chat title:', error);
      return 'New Chat';
    }
  }
}
