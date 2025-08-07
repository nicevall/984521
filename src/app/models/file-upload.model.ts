// src/app/models/file-upload.model.ts
export interface FileAttachment {
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
    base64?: string;
    uploadedAt: Date;
}

export interface FileUpload {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
    preview?: string;
}

export interface SupportedFileTypes {
    images: string[];
    documents: string[];
    maxSizeBytes: number;
}

export const SUPPORTED_FILE_TYPES: SupportedFileTypes = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    documents: ['text/plain', 'application/pdf'],
    maxSizeBytes: 10 * 1024 * 1024 // 10MB
};