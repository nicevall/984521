import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Backend API Interfaces
export interface ChatRequest {
  message: string;
  session_id?: string;
  carrera?: string;
  include_books?: boolean;
  search_limit?: number;
  context?: any;
}

export interface ChatResponse {
  message: string;
  session_id: string;
  session_token: string;
  books_found: any[];
  suggestions: string[];
  metadata: {
    carrera: string;
    total_messages: number;
    books_found_count: number;
    rag_sources_count?: number;
    confidence?: number;
    context_used?: boolean;
    response_type?: string;
  };
  success: boolean;
}

export interface SessionCreateRequest {
  carrera: string;
  student_level?: string;
  preferences?: any;
}

export interface SessionResponse {
  session_id: string;
  session_token: string;
  carrera: string;
  student_level?: string;
  created_at: string;
  expires_at: string;
}

export interface ConversationHistory {
  session_id: string;
  messages: any[];
  total_messages: number;
  carrera: string;
  created_at: string;
  last_activity: string;
}

@Injectable({
  providedIn: 'root'
})
export class BackendChatService {
  private readonly API_BASE_URL = environment.backendUrl || 'http://localhost:8000';
  private currentSessionId: string | null = null;
  private currentSessionToken: string | null = null;
  private currentCarrera: string = 'SISTEMAS'; // Default career

  // Subject para manejar el estado de generación
  private isGenerating$ = new BehaviorSubject<boolean>(false);
  public isGenerating = this.isGenerating$.asObservable();
  
  // Controller para cancelar requests
  private currentRequestController: AbortController | null = null;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  constructor(private http: HttpClient) {
    this.loadSessionFromStorage();
  }

  // Crear nueva sesión de chat
  createSession(carrera: string = 'SISTEMAS', studentLevel?: string): Observable<SessionResponse> {
    const request: SessionCreateRequest = {
      carrera,
      student_level: studentLevel
    };

    return this.http.post<SessionResponse>(`${this.API_BASE_URL}/api/v1/chat/session`, request, this.httpOptions)
      .pipe(
        map(response => {
          this.currentSessionId = response.session_id;
          this.currentSessionToken = response.session_token;
          this.currentCarrera = response.carrera;
          this.saveSessionToStorage();
          return response;
        }),
        catchError(this.handleError)
      );
  }

  // Enviar mensaje usando chat estándar
  sendMessage(message: string, includeBooks: boolean = true): Observable<ChatResponse> {
    return this.sendChatMessage(message, includeBooks, false);
  }

  // Enviar mensaje usando chat con RAG
  sendMessageWithRAG(message: string, includeBooks: boolean = true): Observable<ChatResponse> {
    return this.sendChatMessage(message, includeBooks, true);
  }

  // Método privado para enviar mensajes
  private sendChatMessage(message: string, includeBooks: boolean, useRAG: boolean): Observable<ChatResponse> {
    // Cancelar request anterior si existe
    if (this.currentRequestController) {
      this.currentRequestController.abort();
    }
    
    // Crear nuevo controller para esta request
    this.currentRequestController = new AbortController();
    
    this.isGenerating$.next(true);

    const request: ChatRequest = {
      message,
      session_id: this.currentSessionId || undefined,
      carrera: this.currentCarrera,
      include_books: includeBooks,
      search_limit: 5,
      context: {}
    };

    const endpoint = useRAG ? '/api/v1/chat/message/rag' : '/api/v1/chat/message';

    // Agregar signal del AbortController a las opciones HTTP
    const httpOptionsWithSignal = {
      ...this.httpOptions,
      signal: this.currentRequestController.signal
    };

    return this.http.post<ChatResponse>(`${this.API_BASE_URL}${endpoint}`, request, httpOptionsWithSignal)
      .pipe(
        map(response => {
          // Actualizar información de sesión si es nueva
          if (response.session_id !== this.currentSessionId) {
            this.currentSessionId = response.session_id;
            this.currentSessionToken = response.session_token;
            this.saveSessionToStorage();
          }
          
          this.isGenerating$.next(false);
          this.currentRequestController = null;
          return response;
        }),
        catchError(error => {
          this.isGenerating$.next(false);
          this.currentRequestController = null;
          
          // Si fue cancelado, no mostrar error
          if (error.name === 'AbortError') {
            return throwError(() => new Error('Request cancelled by user'));
          }
          
          return this.handleError(error);
        })
      );
  }

  // Obtener historial de conversación
  getConversationHistory(sessionId?: string, limit?: number): Observable<ConversationHistory> {
    const id = sessionId || this.currentSessionId;
    if (!id) {
      return throwError(() => new Error('No hay sesión activa'));
    }

    const params = limit ? `?limit=${limit}` : '';
    return this.http.get<ConversationHistory>(`${this.API_BASE_URL}/api/v1/chat/session/${id}/history${params}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  // Cambiar carrera activa
  setCarrera(carrera: string): void {
    this.currentCarrera = carrera;
    this.saveSessionToStorage();
  }

  // Obtener carrera actual
  getCurrentCarrera(): string {
    return this.currentCarrera;
  }

  // Obtener información de sesión actual
  getCurrentSession(): { sessionId: string | null; sessionToken: string | null; carrera: string } {
    return {
      sessionId: this.currentSessionId,
      sessionToken: this.currentSessionToken,
      carrera: this.currentCarrera
    };
  }

  // Limpiar sesión actual
  clearSession(): void {
    this.currentSessionId = null;
    this.currentSessionToken = null;
    this.currentCarrera = 'SISTEMAS';
    this.clearSessionFromStorage();
  }

  // Verificar si hay una sesión activa
  hasActiveSession(): boolean {
    return !!this.currentSessionId;
  }

  // Detener generación (para compatibility con la interfaz anterior)
  stopGeneration(): void {
    // Cancelar la request HTTP actual
    if (this.currentRequestController) {
      this.currentRequestController.abort();
      this.currentRequestController = null;
    }
    
    this.isGenerating$.next(false);
    console.log('Generación detenida por el usuario');
  }

  // Test de conectividad con el backend
  testConnection(): Observable<any> {
    return this.http.get(`${this.API_BASE_URL}/health`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  // Test del sistema de chat
  testChatSystem(): Observable<any> {
    return this.http.get(`${this.API_BASE_URL}/api/v1/chat/test`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  // Obtener carreras disponibles
  getAvailableCarreras(): Observable<any> {
    return this.http.get(`${this.API_BASE_URL}/api/v1/carreras`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  // Generar título inteligente para conversación
  generateConversationTitle(messages: any[]): Observable<any> {
    const requestBody = {
      messages: messages,
      carrera: this.currentCarrera
    };

    return this.http.post(`${this.API_BASE_URL}/api/v1/generate-title`, requestBody, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  // Manejar errores HTTP
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Error de conexión con el servidor';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.detail) {
      errorMessage = error.error.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Backend Chat Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  // Guardar sesión en localStorage
  private saveSessionToStorage(): void {
    const sessionData = {
      sessionId: this.currentSessionId,
      sessionToken: this.currentSessionToken,
      carrera: this.currentCarrera,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('backend_chat_session', JSON.stringify(sessionData));
  }

  // Cargar sesión desde localStorage
  private loadSessionFromStorage(): void {
    try {
      const stored = localStorage.getItem('backend_chat_session');
      if (stored) {
        const sessionData = JSON.parse(stored);
        
        // Verificar que la sesión no sea muy antigua (24 horas)
        const sessionAge = new Date().getTime() - new Date(sessionData.timestamp).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas
        
        if (sessionAge < maxAge) {
          this.currentSessionId = sessionData.sessionId;
          this.currentSessionToken = sessionData.sessionToken;
          this.currentCarrera = sessionData.carrera || 'SISTEMAS';
        } else {
          this.clearSessionFromStorage();
        }
      }
    } catch (error) {
      console.error('Error loading session from storage:', error);
      this.clearSessionFromStorage();
    }
  }

  // Limpiar sesión del localStorage
  private clearSessionFromStorage(): void {
    localStorage.removeItem('backend_chat_session');
  }
}