// src/app/models/conversation.model.ts
import { Message } from './message.model';

export interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
    isActive?: boolean;
}

export interface ConversationSummary {
    id: string;
    title: string;
    lastMessage: string;
    messageCount: number;
    updatedAt: Date;
}