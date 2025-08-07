// src/app/services/gemini-info.service.ts
import { Injectable } from '@angular/core';
import { GeminiService } from './gemini.service';

export interface GeminiInfo {
    isConfigured: boolean;
    model: string;
    version: string;
    libraryVersion: string;
    capabilities: string[];
}

export interface TestResult {
    success: boolean;
    response?: string;
    error?: string;
}

@Injectable({
    providedIn: 'root'
})
export class GeminiInfoService {

    constructor(private geminiService: GeminiService) { }

    async getGeminiInfo(): Promise<GeminiInfo> {
        const modelInfo = this.geminiService.getModelInfo();
        const currentModel = this.geminiService.getCurrentModel();

        return {
            isConfigured: modelInfo.configured,
            model: currentModel.name,
            version: currentModel.parameters,
            libraryVersion: '0.24.1', // Version from package.json
            capabilities: currentModel.capabilities
        };
    }

    async testCurrentModel(): Promise<TestResult> {
        try {
            if (!this.geminiService.isConfigured()) {
                return {
                    success: false,
                    error: 'API key no configurada'
                };
            }

            const testMessage = 'Responde solo con "OK" para confirmar que funciona.';
            const response = await this.geminiService.generateResponse(testMessage).toPromise();

            if (response && response.success) {
                return {
                    success: true,
                    response: `Modelo funcionando correctamente. Respuesta: "${response.text.substring(0, 50)}..."`
                };
            } else {
                return {
                    success: false,
                    error: response?.error || 'Error desconocido'
                };
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Error de conexión'
            };
        }
    }
}