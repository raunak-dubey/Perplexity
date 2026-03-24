import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Chat', required: true, index: true })
  chatId!: Types.ObjectId;

  @Prop({ type: String, enum: MessageRole, required: true })
  role!: MessageRole;

  @Prop({ required: true, type: String })
  content!: string;

  @Prop({ type: Number })
  tokenCount?: number;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Index for efficient message retrieval by chat
MessageSchema.index({ chatId: 1, createdAt: 1 });
