import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatDocument = Chat & Document;

@Schema({ timestamps: true })
export class Chat {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ default: false })
  isArchived!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user!: Types.ObjectId;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

// Index for sorting by recent activity
ChatSchema.index({ updatedAt: -1 });
ChatSchema.index({ createdAt: -1 });
