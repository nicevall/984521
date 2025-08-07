// src/app/config/chat.config.ts
export const ChatConfig = {
    // Límites de archivos
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,

    // Tipos de archivo permitidos
    allowedImageTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ],

    allowedDocumentTypes: [
        'application/pdf',
        'text/plain',
        'text/markdown'
    ],

    // Configuración de mensajes
    maxMessageLength: 4000,
    typingDelay: 500,

    // Configuración de la UI
    messagesPerPage: 50,
    autoSaveInterval: 5000, // 5 segundos

    // Configuración de Gemini
    geminiConfig: {
        model: 'gemini-1.5-flash',
        fallbackModel: 'gemini-1.5-pro',
        maxRetries: 3,
        timeout: 30000 // 30 segundos
    },

    // Mensajes de error
    errorMessages: {
        apiKeyNotConfigured: 'API key de Gemini no configurada. Configura tu API key en environment.development.ts',
        fileTooLarge: 'El archivo es demasiado grande. Máximo 10MB.',
        invalidFileType: 'Tipo de archivo no soportado.',
        tooManyFiles: 'Máximo 5 archivos por mensaje.',
        messageEmpty: 'El mensaje no puede estar vacío.',
        networkError: 'Error de conexión. Verifica tu conexión a internet.',
        quotaExceeded: 'Límite de API excedido. Intenta más tarde.',
        safety: 'Contenido bloqueado por políticas de seguridad.',
        unknown: 'Error desconocido. Intenta de nuevo.'
    },

    // Configuración de validación
    validation: {
        minMessageLength: 1,
        maxMessageLength: 4000,
        allowEmptyFiles: false,
        requireMessageWithFiles: false
    }
};