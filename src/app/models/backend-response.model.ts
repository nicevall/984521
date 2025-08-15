// Interface compatible with the existing GeminiResponse interface
export interface BackendChatResponse {
  text: string;
  success: boolean;
  error?: string;
  metadata?: {
    session_id?: string;
    books_found?: any[];
    suggestions?: string[];
    carrera?: string;
    response_type?: string;
  };
}

export interface CarreraOption {
  code: string;
  name: string;
}

export interface BackendHealthStatus {
  status: string;
  message?: string;
  timestamp: string;
  version?: string;
  environment?: string;
}