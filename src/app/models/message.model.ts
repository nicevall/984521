// src/app/models/message.model.ts
import { FileAttachment } from './file-upload.model';

export interface Message {
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
    isTyping?: boolean;
    hasError?: boolean;
    attachments?: FileAttachment[];
    isStreaming?: boolean;
}