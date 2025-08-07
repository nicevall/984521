// src/app/services/gemini.service.ts - SOLO MODELOS GRATUITOS
import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Message } from '../models/message.model';

export interface GeminiResponse {
  text: string;
  success: boolean;
  error?: string;
}

export interface GeminiModel {
  id: string;
  name: string;
  description: string;
  parameters: string;
  capabilities: string[];
  isRecommended?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private genAI!: GoogleGenerativeAI;
  private model: any;
  private chatSession: any = null;
  private currentModelId: string = 'gemini-2.0-flash';

  // Subject para manejar el estado de generación
  private isGenerating$ = new BehaviorSubject<boolean>(false);
  public isGenerating = this.isGenerating$.asObservable();

  // Solo modelos que funcionan GRATIS
  readonly availableModels: GeminiModel[] = [
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      description: 'Modelo más equilibrado y moderno (Recomendado)',
      parameters: '~20B',
      capabilities: ['Texto', 'Imágenes', 'Video', 'Audio'],
      isRecommended: true
    },
    {
      id: 'gemini-2.0-flash-lite',
      name: 'Gemini 2.0 Flash Lite',
      description: 'Modelo más pequeño y eficiente para uso masivo',
      parameters: '~8B',
      capabilities: ['Texto', 'Velocidad optimizada']
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      description: 'Modelo anterior estable y confiable',
      parameters: '~8B',
      capabilities: ['Texto', 'Imágenes']
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      description: 'Modelo Pro anterior con contexto 2M tokens',
      parameters: '~20B+',
      capabilities: ['Texto', 'Imágenes', 'Contexto largo']
    }
  ];

  constructor() {
    this.initializeGemini();
  }

  private initializeGemini(): void {
    if (environment.geminiApiKey && environment.geminiApiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
      this.genAI = new GoogleGenerativeAI(environment.geminiApiKey);
      this.model = this.genAI.getGenerativeModel({ model: this.currentModelId });
    }
  }

  // Cambiar modelo activo
  switchModel(modelId: string): boolean {
    const modelExists = this.availableModels.find(m => m.id === modelId);
    if (!modelExists) {
      console.error('Modelo no encontrado:', modelId);
      return false;
    }

    try {
      this.currentModelId = modelId;
      if (this.genAI) {
        this.model = this.genAI.getGenerativeModel({ model: modelId });
        console.log(`Modelo cambiado a: ${modelExists.name}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error cambiando modelo:', error);
      return false;
    }
  }

  // Obtener modelo actual
  getCurrentModel(): GeminiModel {
    return this.availableModels.find(m => m.id === this.currentModelId) || this.availableModels[0];
  }

  // Obtener todos los modelos disponibles
  getAvailableModels(): GeminiModel[] {
    return this.availableModels;
  }

  // Generar respuesta simple
  generateResponse(prompt: string): Observable<GeminiResponse> {
    return from(this._generateResponse(prompt));
  }

  // Generar respuesta con streaming
  generateResponseStream(prompt: string): Observable<GeminiResponse> {
    return from(this._generateResponseStream(prompt));
  }

  private async _generateResponseStream(prompt: string): Promise<GeminiResponse> {
    try {
      if (!this.isConfigured()) {
        return {
          text: 'API key de Gemini no configurada. Por favor configura tu API key en environment.development.ts',
          success: false,
          error: 'API key no configurada'
        };
      }

      if (!this.genAI || !this.model) {
        this.initializeGemini();
      }

      this.isGenerating$.next(true);

      const result = await this.model.generateContentStream(prompt);
      let fullText = '';

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
      }

      this.isGenerating$.next(false);

      return {
        text: fullText || 'Sin respuesta',
        success: true
      };
    } catch (error: any) {
      this.isGenerating$.next(false);
      console.error('Error generating streamed response:', error);
      return this._generateResponse(prompt); // Fallback to normal generation
    }
  }

  private async _generateResponse(prompt: string): Promise<GeminiResponse> {
    try {
      if (!this.isConfigured()) {
        return {
          text: 'API key de Gemini no configurada. Por favor configura tu API key en environment.development.ts',
          success: false,
          error: 'API key no configurada'
        };
      }

      if (!this.genAI || !this.model) {
        this.initializeGemini();
      }

      this.isGenerating$.next(true);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      this.isGenerating$.next(false);

      return {
        text: text || 'Sin respuesta',
        success: true
      };
    } catch (error: any) {
      this.isGenerating$.next(false);
      console.error('Error generating response:', error);

      let errorMessage = 'Lo siento, ocurrió un error al procesar tu mensaje.';

      // Manejar errores específicos
      if (error.message?.includes('API_KEY_INVALID')) {
        errorMessage = 'API key inválida. Verifica tu configuración.';
      } else if (error.message?.includes('PERMISSION_DENIED')) {
        errorMessage = 'Permisos denegados. Verifica tu API key.';
      } else if (error.message?.includes('QUOTA_EXCEEDED')) {
        errorMessage = 'Límite de API excedido. Intenta más tarde.';
      } else if (error.message?.includes('SAFETY')) {
        errorMessage = 'Contenido bloqueado por políticas de seguridad.';
      } else if (error.message?.includes('not found') || error.message?.includes('not available')) {
        errorMessage = `Modelo ${this.currentModelId} no disponible. Intentando con modelo alternativo...`;

        // Auto-fallback solo a modelos gratuitos
        const fallbackModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

        for (const modelName of fallbackModels) {
          if (modelName === this.currentModelId) continue;

          try {
            console.log(`Intentando con modelo de respaldo: ${modelName}`);
            this.switchModel(modelName);
            this.isGenerating$.next(true);
            const retryResult = await this.model.generateContent(prompt);
            const retryResponse = await retryResult.response;
            this.isGenerating$.next(false);
            return {
              text: retryResponse.text() || 'Sin respuesta',
              success: true
            };
          } catch (retryError: any) {
            console.warn(`Modelo ${modelName} tampoco disponible:`, retryError.message);
            continue;
          }
        }
      }

      return {
        text: errorMessage,
        success: false,
        error: error.message
      };
    }
  }

  // Método para detener la generación
  stopGeneration(): void {
    this.isGenerating$.next(false);
    // En una implementación real, aquí cancelarías la request
    console.log('Generación detenida por el usuario');
  }

  // Iniciar chat con historial
  startChat(history: Message[] = []): void {
    try {
      if (!this.isConfigured()) {
        console.warn('Gemini API key no configurada');
        return;
      }

      if (!this.genAI) {
        this.initializeGemini();
      }

      this.model = this.genAI.getGenerativeModel({ model: this.currentModelId });

      if (history.length > 0) {
        console.log('Historial cargado:', history.length, 'mensajes');
      }

      this.chatSession = null; // Reset session
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  }

  // Enviar mensaje con opción de streaming
  sendMessage(message: string, useStreaming: boolean = false): Observable<GeminiResponse> {
    if (useStreaming) {
      return this.generateResponseStream(message);
    }
    return this.generateResponse(message);
  }

  // Procesar archivo de imagen
  generateResponseWithImage(prompt: string, imageFile: File): Observable<GeminiResponse> {
    return from(this._generateResponseWithImage(prompt, imageFile));
  }

  private async _generateResponseWithImage(prompt: string, imageFile: File): Promise<GeminiResponse> {
    try {
      if (!this.isConfigured()) {
        return {
          text: 'API key de Gemini no configurada. Por favor configura tu API key en environment.development.ts',
          success: false,
          error: 'API key no configurada'
        };
      }

      if (!this.genAI) {
        this.initializeGemini();
      }

      // Verificar si el modelo actual soporta imágenes
      const currentModel = this.getCurrentModel();
      if (!currentModel.capabilities.includes('Imágenes')) {
        // Auto-switch a un modelo que soporte imágenes
        const imageCapableModels = this.availableModels.filter(m =>
          m.capabilities.includes('Imágenes')
        );

        if (imageCapableModels.length > 0) {
          this.switchModel(imageCapableModels[0].id);
        }
      }

      this.isGenerating$.next(true);

      const visionModel = this.genAI.getGenerativeModel({ model: this.currentModelId });

      const imageBase64 = await this.fileToBase64(imageFile);
      const imageData = {
        inlineData: {
          data: imageBase64.split(',')[1],
          mimeType: imageFile.type
        }
      };

      const result = await visionModel.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text();

      this.isGenerating$.next(false);

      return {
        text: text || 'Sin respuesta para la imagen',
        success: true
      };
    } catch (error: any) {
      this.isGenerating$.next(false);
      console.error('Error generating response with image:', error);

      let errorMessage = 'Lo siento, ocurrió un error al procesar la imagen.';

      if (error.message?.includes('SAFETY')) {
        errorMessage = 'Imagen bloqueada por políticas de seguridad.';
      } else if (error.message?.includes('QUOTA_EXCEEDED')) {
        errorMessage = 'Límite de API excedido para procesamiento de imágenes.';
      } else if (error.message?.includes('INVALID_ARGUMENT')) {
        errorMessage = 'Formato de imagen no soportado.';
      }

      return {
        text: errorMessage,
        success: false,
        error: error.message
      };
    }
  }

  // Convertir archivo a base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  // Verificar si la API key está configurada
  isConfigured(): boolean {
    return !!environment.geminiApiKey &&
      environment.geminiApiKey !== 'YOUR_GEMINI_API_KEY_HERE' &&
      environment.geminiApiKey.trim().length > 0;
  }

  // Limpiar chat session
  clearChat(): void {
    try {
      this.chatSession = null;
      this.isGenerating$.next(false);
      if (this.isConfigured()) {
        if (!this.genAI) {
          this.initializeGemini();
        }
        this.model = this.genAI.getGenerativeModel({ model: this.currentModelId });
      }
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  }

  // Obtener información del modelo actual
  getModelInfo(): { model: string; configured: boolean; details: GeminiModel } {
    return {
      model: this.currentModelId,
      configured: this.isConfigured(),
      details: this.getCurrentModel()
    };
  }

  // Validar formato de archivo de imagen
  isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return false;
    }

    if (file.size > maxSize) {
      return false;
    }

    return true;
  }

  // Obtener capacidades del modelo actual
  getCurrentModelCapabilities(): string[] {
    return this.getCurrentModel().capabilities;
  }

  // Verificar si el modelo actual soporta una capacidad específica
  supportsCapability(capability: string): boolean {
    return this.getCurrentModelCapabilities().includes(capability);
  }
}