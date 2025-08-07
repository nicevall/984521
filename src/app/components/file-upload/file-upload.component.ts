// src/app/components/file-upload/file-upload.component.ts
import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService } from '../../services/file.service';
import { FileAttachment } from '../../models/file-upload.model';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="file-upload-container">
      <div class="upload-area" 
           [class.dragover]="isDragOver"
           [class.disabled]="disabled"
           (click)="triggerFileInput()"
           (dragover)="onDragOver($event)"
           (dragleave)="onDragLeave($event)"
           (drop)="onDrop($event)">
        
        <input #fileInput
               type="file"
               multiple
               accept="image/*,.pdf,.txt"
               (change)="onFileSelected($event)"
               style="display: none;">
        
        <div class="upload-content">
          <div class="upload-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17,8 12,3 7,8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          
          <div class="upload-text">
            <h4>Arrastra archivos aquí o haz clic para seleccionar</h4>
            <p>Soporta imágenes, PDF y archivos de texto (máx. 10MB)</p>
          </div>
        </div>
      </div>
      
      <div *ngIf="isUploading" class="upload-progress">
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        <span>Procesando archivos...</span>
      </div>
    </div>
  `,
  styles: [`
    .file-upload-container {
      width: 100%;
    }

    .upload-area {
      border: 2px dashed var(--separator-opaque);
      border-radius: var(--border-radius-lg);
      padding: var(--spacing-xl);
      text-align: center;
      cursor: pointer;
      transition: all var(--transition-fast);
      background: var(--system-secondary-background);
      
      &:hover:not(.disabled) {
        border-color: var(--apple-blue);
        background: rgba(0, 122, 255, 0.05);
      }
      
      &.dragover {
        border-color: var(--apple-blue);
        background: rgba(0, 122, 255, 0.1);
        transform: scale(1.02);
      }
      
      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-md);
    }

    .upload-icon {
      color: var(--label-tertiary);
      
      .upload-area:hover:not(.disabled) & {
        color: var(--apple-blue);
      }
      
      .upload-area.dragover & {
        color: var(--apple-blue);
      }
    }

    .upload-text {
      h4 {
        margin: 0 0 var(--spacing-xs) 0;
        color: var(--label-primary);
        font-size: 16px;
        font-weight: 600;
      }
      
      p {
        margin: 0;
        color: var(--label-secondary);
        font-size: 14px;
      }
    }

    .upload-progress {
      margin-top: var(--spacing-md);
      text-align: center;
      
      .progress-bar {
        width: 100%;
        height: 4px;
        background: var(--fill-tertiary);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: var(--spacing-sm);
        
        .progress-fill {
          height: 100%;
          background: var(--apple-blue);
          border-radius: 2px;
          animation: progress 2s ease-in-out infinite;
        }
      }
      
      span {
        font-size: 14px;
        color: var(--label-secondary);
      }
    }

    @keyframes progress {
      0% {
        width: 0%;
      }
      50% {
        width: 70%;
      }
      100% {
        width: 100%;
      }
    }

    @media (max-width: 768px) {
      .upload-area {
        padding: var(--spacing-lg);
      }
      
      .upload-icon svg {
        width: 24px;
        height: 24px;
      }
      
      .upload-text h4 {
        font-size: 14px;
      }
      
      .upload-text p {
        font-size: 12px;
      }
    }
  `]
})
export class FileUploadComponent {
  @Input() disabled: boolean = false;
  @Output() filesSelected = new EventEmitter<FileAttachment[]>();

  isDragOver = false;
  isUploading = false;

  constructor(private fileService: FileService) { }

  triggerFileInput() {
    if (this.disabled) return;

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  async onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      await this.processFiles(target.files);
      target.value = ''; // Reset input
    }
  }

  onDragOver(event: DragEvent) {
    if (this.disabled) return;

    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    if (this.disabled) return;

    event.preventDefault();
    this.isDragOver = false;
  }

  async onDrop(event: DragEvent) {
    if (this.disabled) return;

    event.preventDefault();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      await this.processFiles(files);
    }
  }

  private async processFiles(files: FileList) {
    this.isUploading = true;

    try {
      // Validate files first
      const validFiles: File[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = this.fileService.validateFile(file);

        if (validation.valid) {
          validFiles.push(file);
        } else {
          console.warn(`File ${file.name} rejected: ${validation.error}`);
          // Optionally show error to user
        }
      }

      if (validFiles.length > 0) {
        const attachments = await this.fileService.processFiles(validFiles);
        this.filesSelected.emit(attachments);
      }
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      this.isUploading = false;
    }
  }
}