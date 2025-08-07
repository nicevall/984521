// src/app/models/chat-state.model.ts
import { Conversation, ConversationSummary } from './conversation.model';

export interface ChatState {
    currentConversation: Conversation | null;
    conversations: ConversationSummary[];
    isLoading: boolean;
    isTyping: boolean;
    error: string | null;
    sidebarOpen: boolean;
}