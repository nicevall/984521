// src/app/services/file.service.ts
import { Injectable } from '@angular/core';
import { FileAttachment } from '../models/file-upload.model';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor() { }

  // Convertir File a FileAttachment
  async processFile(file: File): Promise<FileAttachment> {
    const base64 = await this.fileToBase64(file);

    return {
      id: this.generateId(),
      name: file.name,
      type: file.type,
      size: file.size,
      base64: base64,
      uploadedAt: new Date()
    };
  }

  // Procesar múltiples archivos
  async processFiles(files: FileList | File[]): Promise<FileAttachment[]> {
    const fileArray = Array.from(files);
    const promises = fileArray.map(file => this.processFile(file));
    return Promise.all(promises);
  }

  // Validar archivo
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'application/pdf'
    ];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'El archivo es demasiado grande (máximo 10MB)'
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de archivo no soportado'
      };
    }

    return { valid: true };
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

  // Generar ID único
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Formatear tamaño de archivo
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Verificar si es imagen
  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  // Crear URL temporal para vista previa
  createObjectURL(file: File): string {
    return URL.createObjectURL(file);
  }

  // Limpiar URL temporal
  revokeObjectURL(url: string): void {
    URL.revokeObjectURL(url);
  }
}