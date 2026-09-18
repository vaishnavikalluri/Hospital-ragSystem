/**
 * API Client service for Hospital Knowledge Assistant.
 * Connects frontend to FastAPI backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface UserSession {
  authorized: boolean;
  hospital_id: string;
  name: string;
  is_admin: boolean;
  token: string;
  message: string;
}

export interface SourceCitation {
  document: string;
  document_type: string;
  page: number;
  section?: string;
  chunk_id: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitation[];
  has_sufficient_evidence?: boolean;
}

export interface ChatResponse {
  answer: string;
  has_sufficient_evidence: boolean;
  sources: SourceCitation[];
  retrieval_count: number;
  model_used: string;
  tokens_used: number;
}

export interface DocumentInfo {
  name: string;
  document_type: string;
  page_count: number;
  chunk_count: number;
  file_size_bytes: number;
  indexed: boolean;
  indexed_at?: string;
}

export interface DocumentListResponse {
  documents: DocumentInfo[];
  total: number;
  by_type: Record<string, number>;
}

export interface MetricsResponse {
  total_queries: number;
  successful_queries: number;
  failed_queries: number;
  total_tokens_used: number;
  avg_response_time_ms: number;
  avg_retrieval_time_ms: number;
  avg_llm_time_ms: number;
  documents_indexed: number;
  chunks_indexed: number;
  cache_hits: number;
  cache_misses: number;
  uptime_seconds: number;
}

// ── Auth helpers ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hka_token');
}

export function setSession(session: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('hka_token', session.token);
  localStorage.setItem('hka_user', JSON.stringify(session));
}

export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('hka_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('hka_token');
  localStorage.removeItem('hka_user');
}

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── API Methods ──────────────────────────────────────────────────────────────

export async function login(hospitalId: string): Promise<UserSession> {
  const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hospital_id: hospitalId }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Authentication failed' }));
    throw new Error(errData.detail || 'Access Denied. Invalid Hospital ID.');
  }

  const data: UserSession = await res.json();
  setSession(data);
  return data;
}

export async function fetchDocuments(): Promise<DocumentListResponse> {
  const res = await fetch(`${API_BASE_URL}/api/documents`, {
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch documents' }));
    throw new Error(err.detail);
  }

  return res.json();
}

export async function sendChat(
  question: string,
  history: ChatMessage[],
  docTypeFilter?: string
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      question,
      conversation_history: history.map((h) => ({ role: h.role, content: h.content })),
      document_type_filter: docTypeFilter || null,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to generate answer' }));
    throw new Error(err.detail || 'Failed to complete question.');
  }

  return res.json();
}

export async function sendChatStream(
  question: string,
  history: ChatMessage[],
  docTypeFilter: string | undefined,
  onToken: (token: string) => void,
  onSources: (sources: SourceCitation[], hasEvidence: boolean) => void,
  onError: (err: string) => void
): Promise<void> {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      question,
      conversation_history: history.map((h) => ({ role: h.role, content: h.content })),
      document_type_filter: docTypeFilter || null,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Stream request failed' }));
    onError(err.detail || 'Streaming failed');
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError('Response body missing reader');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.replace(/^data:\s*/, '').trim();
        if (!jsonStr) continue;

        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.type === 'token') {
            onToken(parsed.content);
          } else if (parsed.type === 'sources') {
            onSources(parsed.sources || [], parsed.has_sufficient_evidence ?? true);
          } else if (parsed.type === 'error') {
            onError(parsed.content);
          }
        } catch {
          // ignore parse errors on partial chunks
        }
      }
    }
  }
}

export async function uploadDocument(
  file: File,
  docType: string
): Promise<{ success: boolean; message: string; chunk_count: number }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_type', docType);

  const res = await fetch(`${API_BASE_URL}/api/admin/documents/upload`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Document upload failed.');
  }

  return res.json();
}

export async function triggerReindex(forceReindex = false): Promise<{ summary: string; success: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/documents/index?force_reindex=${forceReindex}`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Re-indexing failed' }));
    throw new Error(err.detail || 'Re-indexing failed.');
  }

  return res.json();
}

export async function fetchMetrics(): Promise<MetricsResponse> {
  const res = await fetch(`${API_BASE_URL}/api/admin/metrics`, {
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch metrics' }));
    throw new Error(err.detail || 'Failed to fetch metrics');
  }

  return res.json();
}

export async function deleteDocument(docName: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/documents/${encodeURIComponent(docName)}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Delete failed' }));
    throw new Error(err.detail || 'Failed to delete document.');
  }
}

export function getDocumentFileUrl(documentName: string, page?: number): string {
  const token = getToken();
  const base = `${API_BASE_URL}/api/documents/${encodeURIComponent(documentName)}/file`;
  const query = token ? `?token=${encodeURIComponent(token)}` : '';
  const hash = page ? `#page=${page}` : '';
  return `${base}${query}${hash}`;
}
