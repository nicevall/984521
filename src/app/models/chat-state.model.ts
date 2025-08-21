// src/app/models/chat-state.model.ts
import { Conversation, ConversationSummary } from './conversation.model';

export interface ChatState {
    currentConversation: Conversation | null;
    conversations: ConversationSummary[];
    isLoading: boolean;
    isTyping: boolean;
    error: string | null;
    sidebarOpen: boolean;
    detectedCareer: DetectedCareer | null;
    studentInfo: StudentInfo | null;
}

export interface DetectedCareer {
    code: string;
    name: string;
    confidence: number; // 0-1
    detection_method: 'cedula' | 'context' | 'manual';
}

export interface StudentInfo {
    cedula: string;
    nombre: string;
    carrera: string;
    email?: string;
    telefono?: string;
    semestre?: number;
}

export interface ConversationContext {
    mentionedCareers: string[];
    topicKeywords: string[];
    intent: 'book_search' | 'loan_request' | 'general_info';
    detectedCedula?: string;
    sessionId?: string;
}