// src/app/services/chat-storage.service.ts
import { Injectable, Inject, forwardRef } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message } from '../models/message.model';
import { Conversation, ConversationSummary } from '../models/conversation.model';
import { ChatState } from '../models/chat-state.model';

@Injectable({
  providedIn: 'root'
})
export class ChatStorageService {
  private readonly STORAGE_KEY = 'chatbot-folder-conversations';
  private readonly MAX_CONVERSATIONS = 50;

  private chatStateSubject = new BehaviorSubject<ChatState>({
    currentConversation: null,
    conversations: [],
    isLoading: false,
    isTyping: false,
    error: null,
    sidebarOpen: false
  });

  public chatState$ = this.chatStateSubject.asObservable();

  constructor() {
    this.loadConversations();
  }

  // Método para inyectar BackendChatService después de la construcción (evita dependencias circulares)
  private backendChatService: any = null;
  
  setBackendChatService(service: any) {
    this.backendChatService = service;
  }

  // Obtener estado actual
  getCurrentState(): ChatState {
    return this.chatStateSubject.value;
  }

  // Actualizar estado
  private updateState(updates: Partial<ChatState>): void {
    const currentState = this.getCurrentState();
    this.chatStateSubject.next({ ...currentState, ...updates });
  }

  // Crear nueva conversación SOLO cuando el usuario envíe el primer mensaje
  createNewConversation(): Conversation {
    const newConversation: Conversation = {
      id: this.generateId(),
      title: 'Nueva conversación',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    this.setCurrentConversation(newConversation);
    return newConversation;
  }

  // Establecer conversación actual
  setCurrentConversation(conversation: Conversation): void {
    this.updateState({ currentConversation: conversation });
    // NO guardar automáticamente hasta que haya mensajes
  }

  // Agregar mensaje a la conversación actual
  addMessage(message: Omit<Message, 'id' | 'timestamp'>): Message {
    const currentState = this.getCurrentState();
    let conversation = currentState.currentConversation;

    console.log('ChatStorage: Adding message:', message);

    // Si no hay conversación activa, crear una nueva SOLO cuando se añade el primer mensaje
    if (!conversation) {
      conversation = this.createNewConversation();
      console.log('ChatStorage: Created new conversation');
    }

    const newMessage: Message = {
      ...message,
      id: this.generateId(),
      timestamp: new Date()
    };

    console.log('ChatStorage: New message created:', newMessage);

    conversation.messages.push(newMessage);
    conversation.updatedAt = new Date();

    console.log('ChatStorage: Conversation after adding message:', conversation);

    // Actualizar título: generar título inteligente después de la primera respuesta de IA
    if (conversation.messages.length === 2 && !message.isUser) {
      // Generar título inteligente usando IA
      this.generateIntelligentTitle(conversation);
    } else if (conversation.messages.length === 1 && message.isUser) {
      // Título temporal mientras esperamos la respuesta de IA
      conversation.title = this.generateSimpleTitle(message.content);
    }

    this.updateState({ currentConversation: conversation });

    // GUARDAR solo cuando hay mensajes reales
    this.saveConversations();

    return newMessage;
  }

  // Actualizar último mensaje (útil para streaming)
  updateLastMessage(updates: Partial<Message>): void {
    const currentState = this.getCurrentState();
    const conversation = currentState.currentConversation;

    if (!conversation || conversation.messages.length === 0) return;

    const lastMessage = conversation.messages[conversation.messages.length - 1];
    Object.assign(lastMessage, updates);

    this.updateState({ currentConversation: conversation });
    this.saveConversations();
  }

  // Obtener todas las conversaciones
  getAllConversations(): ConversationSummary[] {
    const conversations = this.loadConversationsFromStorage();
    return conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      lastMessage: this.getLastUserMessage(conv.messages),
      messageCount: conv.messages.length,
      updatedAt: conv.updatedAt
    })).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // Cargar conversación por ID
  loadConversation(id: string): Conversation | null {
    const conversations = this.loadConversationsFromStorage();
    return conversations.find(conv => conv.id === id) || null;
  }

  // Eliminar conversación
  deleteConversation(id: string): void {
    const conversations = this.loadConversationsFromStorage();
    const filteredConversations = conversations.filter(conv => conv.id !== id);

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredConversations));

    const currentState = this.getCurrentState();
    if (currentState.currentConversation?.id === id) {
      // No crear automáticamente una nueva conversación
      this.updateState({ currentConversation: null });
    }

    this.loadConversations();
  }

  // Limpiar todas las conversaciones
  clearAllConversations(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.updateState({
      currentConversation: null,
      conversations: []
    });
  }

  // Estados de UI
  setLoading(isLoading: boolean): void {
    this.updateState({ isLoading });
  }

  setTyping(isTyping: boolean): void {
    this.updateState({ isTyping });
  }

  setError(error: string | null): void {
    this.updateState({ error });
  }

  toggleSidebar(): void {
    const currentState = this.getCurrentState();
    this.updateState({ sidebarOpen: !currentState.sidebarOpen });
  }

  setSidebarOpen(isOpen: boolean): void {
    this.updateState({ sidebarOpen: isOpen });
  }

  // Exportar conversaciones
  exportConversations(): string {
    const conversations = this.loadConversationsFromStorage();
    return JSON.stringify(conversations, null, 2);
  }

  // Importar conversaciones
  importConversations(jsonData: string): boolean {
    try {
      const conversations = JSON.parse(jsonData) as Conversation[];

      // Validar estructura básica
      if (!Array.isArray(conversations)) {
        throw new Error('Formato inválido');
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conversations));
      this.loadConversations();
      return true;
    } catch (error) {
      console.error('Error importing conversations:', error);
      return false;
    }
  }

  // Método para verificar si necesitamos crear una conversación
  needsNewConversation(): boolean {
    const currentState = this.getCurrentState();
    return !currentState.currentConversation ||
      (currentState.currentConversation.messages.length === 0);
  }

  // Método para limpiar conversación actual sin crear nueva
  clearCurrentConversation(): void {
    this.updateState({ currentConversation: null });
  }

  // Métodos privados
  private loadConversations(): void {
    const conversations = this.getAllConversations();
    this.updateState({ conversations });
  }

  private loadConversationsFromStorage(): Conversation[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const conversations = JSON.parse(stored) as Conversation[];

      // Convertir strings de fecha a objetos Date
      return conversations
        .map(conv => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }))
        // Filtrar conversaciones vacías al cargar
        .filter(conv => conv.messages.length > 0);
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  }

  private saveConversations(): void {
    try {
      const currentState = this.getCurrentState();
      const conversations = this.loadConversationsFromStorage();

      if (currentState.currentConversation && currentState.currentConversation.messages.length > 0) {
        const index = conversations.findIndex(
          conv => conv.id === currentState.currentConversation!.id
        );

        if (index >= 0) {
          conversations[index] = currentState.currentConversation;
        } else {
          conversations.unshift(currentState.currentConversation);
        }

        // Limitar número de conversaciones
        const limitedConversations = conversations.slice(0, this.MAX_CONVERSATIONS);

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedConversations));
        this.loadConversations();
      }
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateSimpleTitle(content: string): string {
    const maxLength = 50;
    const title = content.trim();

    if (title.length <= maxLength) {
      return title;
    }

    return title.substring(0, maxLength).trim() + '...';
  }

  private async generateIntelligentTitle(conversation: Conversation): Promise<void> {
    try {
      if (!this.backendChatService) {
        console.warn('BackendChatService not available, using simple title');
        return;
      }

      // Preparar mensajes para enviar al backend
      const messages = conversation.messages.map(msg => ({
        content: msg.content,
        isUser: msg.isUser,
        timestamp: msg.timestamp
      }));

      // Llamar al backend para generar título inteligente
      this.backendChatService.generateConversationTitle(messages).subscribe({
        next: (response: any) => {
          if (response.success && response.title) {
            console.log('Generated intelligent title:', response.title);
            
            // Actualizar el título de la conversación
            conversation.title = response.title;
            this.updateState({ currentConversation: conversation });
            this.saveConversations();
          }
        },
        error: (error: any) => {
          console.error('Error generating intelligent title:', error);
          // Mantener el título simple como fallback
        }
      });

    } catch (error) {
      console.error('Error in generateIntelligentTitle:', error);
    }
  }

  private getLastUserMessage(messages: Message[]): string {
    const userMessages = messages.filter(msg => msg.isUser);
    if (userMessages.length === 0) return 'Sin mensajes';

    const lastMessage = userMessages[userMessages.length - 1];
    return lastMessage.content.length > 100
      ? lastMessage.content.substring(0, 100) + '...'
      : lastMessage.content;
  }
}