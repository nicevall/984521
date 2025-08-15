// src/app/services/model-checker.service.ts
import { Injectable } from '@angular/core';
import { BackendChatService } from './backend-chat.service';

@Injectable({
    providedIn: 'root'
})
export class ModelCheckerService {

    constructor(private backendChatService: BackendChatService) { }

    async checkBackendConnection(): Promise<boolean> {
        try {
            const response = await this.backendChatService.testConnection().toPromise();
            return response?.status === 'healthy';
        } catch (error) {
            console.error('Backend connection failed:', error);
            return false;
        }
    }

    async getBackendStatus(): Promise<any> {
        try {
            return await this.backendChatService.testChatSystem().toPromise();
        } catch (error) {
            console.error('Backend status check failed:', error);
            return {
                success: false,
                message: 'Error connecting to backend',
                error: error
            };
        }
    }

    async getAvailableCarreras(): Promise<string[]> {
        try {
            const response = await this.backendChatService.getAvailableCarreras().toPromise();
            if (response?.success && response.carreras) {
                return response.carreras.map((c: any) => c.code);
            }
            return ['SISTEMAS', 'ADMINISTRACION', 'MARKETING']; // fallback
        } catch (error) {
            console.error('Could not load careers:', error);
            return ['SISTEMAS', 'ADMINISTRACION', 'MARKETING']; // fallback
        }
    }
}