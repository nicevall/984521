// src/app/services/model-checker.service.ts
import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ModelCheckerService {

    constructor() { }

    async checkAvailableModels(): Promise<string[]> {
        if (!environment.geminiApiKey || environment.geminiApiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            throw new Error('API key no configurada');
        }

        const genAI = new GoogleGenerativeAI(environment.geminiApiKey);
        const availableModels: string[] = [];

        // Lista de modelos para probar (actualizada para la versión 0.24.1)
        const modelsToTest = [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-1.0-pro-latest',
            'gemini-1.0-pro',
            'gemini-pro'
        ];

        for (const modelName of modelsToTest) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                // Hacer una prueba simple
                await model.generateContent('Hola');
                availableModels.push(modelName);
                console.log(`✅ Modelo disponible: ${modelName}`);
            } catch (error: any) {
                console.log(`❌ Modelo no disponible: ${modelName} - ${error.message}`);
            }
        }

        return availableModels;
    }

    async findBestModel(): Promise<string> {
        const available = await this.checkAvailableModels();

        // Orden de preferencia (actualizado para la versión 0.24.1)
        const preferred = [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-1.0-pro-latest',
            'gemini-1.0-pro',
            'gemini-pro'
        ];

        for (const model of preferred) {
            if (available.includes(model)) {
                return model;
            }
        }

        if (available.length > 0) {
            return available[0];
        }

        throw new Error('No hay modelos disponibles con esta API key');
    }
}