'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SourceCitation, sendChatStream } from '@/services/api';
import CitationCard from './CitationCard';
import { Bot, Send, User, AlertCircle, RefreshCw, Filter, Sparkles } from 'lucide-react';

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [docTypeFilter, setDocTypeFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  /**
   * Extract clean readable answer from streamed content.
   * Gemini streams JSON code blocks — this strips the wrapper and
   * returns just the "answer" field text.
   */
  function extractAnswerFromContent(raw: string, isFinal: boolean): string {
    const trimmed = raw.trim();

    // Try to parse full JSON (with or without code fences)
    let jsonStr = trimmed;
    if (jsonStr.startsWith('```')) {
      const lines = jsonStr.split('\n');
      const lastLine = lines[lines.length - 1].trim();
      jsonStr = lines.slice(1, lastLine === '```' ? -1 : undefined).join('\n');
    }
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed.answer === 'string') return parsed.answer;
    } catch { /* streaming - not complete JSON yet */ }

    // During streaming: extract partial answer text
    if (!isFinal) {
      const m = raw.match(/"answer"\s*:\s*"([\s\S]*?)(?=",\s*"has_sufficient|",\s*"sources|\}\s*$|$)/);
      if (m) return m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      if (trimmed.startsWith('```') || trimmed === '{' || trimmed === '') return '';
    }
    return raw;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setError(null);

    const userMsg: ChatMessage = { role: 'user', content: userText };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    const assistantIndex = newHistory.length;
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    let streamedContent = '';

    try {
      await sendChatStream(
        userText,
        newHistory.slice(0, -1),
        docTypeFilter || undefined,
        (token) => {
          streamedContent += token;
          const displayContent = extractAnswerFromContent(streamedContent, false);
          setMessages((prev) => {
            const updated = [...prev];
            if (updated[assistantIndex]) {
              updated[assistantIndex] = { ...updated[assistantIndex], content: displayContent };
            }
            return updated;
          });
        },
        (sources, hasEvidence) => {
          const finalContent = extractAnswerFromContent(streamedContent, true);
          setMessages((prev) => {
            const updated = [...prev];
            if (updated[assistantIndex]) {
              updated[assistantIndex] = { ...updated[assistantIndex], content: finalContent, sources, has_sufficient_evidence: hasEvidence };
            }
            return updated;
          });
        },
        (err) => setError(err)
      );
    } catch (err: any) {
      setError(err.message || 'Error generating answer');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => { setMessages([]); setError(null); };

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden"
      style={{ height: 'calc(100vh - 7rem)', background: 'white', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>

      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Clinical AI Assistant</h2>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Grounded exclusively in hospital knowledge base</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: 'white', border: '1px solid var(--border)' }}>
            <Filter className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} />
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="bg-transparent text-xs focus:outline-none cursor-pointer"
              style={{ color: 'var(--text)' }}>
              <option value="">All Document Types</option>
              <option value="clinical_protocol">Clinical Protocols</option>
              <option value="drug_interaction_guideline">Drug Interaction Guidelines</option>
              <option value="policy_circular">Policy Circulars</option>
            </select>
          </div>
          <button onClick={handleClear} title="New Conversation"
            className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-3)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ background: '#f8fafc' }}>

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: '#dbeafe', border: '1px solid #bfdbfe' }}>
              <Sparkles className="w-7 h-7" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text)' }}>Ask the Knowledge Assistant</h3>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                Ask questions about clinical protocols, drug interactions, or hospital policies.
              </p>
            </div>
            <div className="w-full space-y-2 text-left">
              {[
                'What are the four labels in TEST-ER-001 emergency response protocol?',
                'What is the interaction label for Compound-X and Compound-Y?',
              ].map((q, i) => (
                <button key={i} onClick={() => setInput(q)}
                  className="w-full p-3 rounded-xl text-xs text-left transition-all"
                  style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--text-2)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}>
                  &ldquo;{q}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1"
                style={{ background: 'var(--primary)' }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            <div className={`max-w-2xl p-4 text-sm leading-relaxed ${msg.role === 'user' ? 'chat-user' : 'chat-assistant'}`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {msg.role === 'assistant' && msg.has_sufficient_evidence === false && (
                <div className="mt-3 p-2.5 rounded-lg flex items-center gap-2 text-xs"
                  style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e' }}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Sufficient evidence was not found in the indexed documents.</span>
                </div>
              )}

              {msg.sources && msg.sources.length > 0 && <CitationCard sources={msg.sources} />}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1"
                style={{ background: '#e2e8f0' }}>
                <User className="w-4 h-4" style={{ color: 'var(--text-2)' }} />
              </div>
            )}
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse shrink-0"
              style={{ background: 'var(--primary)' }}>
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
              style={{ background: 'white', border: '1px solid var(--border)' }}>
              <div className="w-2 h-2 rounded-full animate-ping" style={{ background: 'var(--primary)' }} />
              <span className="text-xs" style={{ color: 'var(--text-2)' }}>Searching documents & generating grounded response...</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3.5 rounded-xl flex items-center gap-3 text-sm"
            style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48' }}>
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 flex items-center gap-3"
        style={{ borderTop: '1px solid var(--border)', background: 'white' }}>
        <input
          id="chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about protocols, drug guidelines, circulars..."
          className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
          style={{ background: '#f8fafc', border: '1.5px solid var(--border)', color: 'var(--text)' }}
          onFocus={(e) => { e.currentTarget.style.border = '1.5px solid var(--primary)'; }}
          onBlur={(e) => { e.currentTarget.style.border = '1.5px solid var(--border)'; }}
          disabled={loading}
        />
        <button type="submit" id="chat-send-btn"
          disabled={loading || !input.trim()}
          className="btn-primary px-5 py-3"
          style={{ opacity: loading || !input.trim() ? 0.55 : 1, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer' }}>
          <span>Send</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
