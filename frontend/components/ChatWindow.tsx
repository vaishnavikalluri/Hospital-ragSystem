'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SourceCitation, sendChatStream } from '@/services/api';
import CitationCard from './CitationCard';
import {
  Bot,
  Send,
  User,
  AlertCircle,
  Plus,
  Filter,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [docTypeFilter, setDocTypeFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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
    } catch {
      /* streaming - not complete JSON yet */
    }

    // During streaming: extract partial answer text
    if (!isFinal) {
      const m = raw.match(/"answer"\s*:\s*"([\s\S]*?)(?=",\s*"has_sufficient|",\s*"sources|\}\s*$|$)/);
      if (m) return m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      if (trimmed.startsWith('```') || trimmed === '{' || trimmed === '') return '';
    }
    return raw;
  }

  const handleSendQuestion = async (questionText: string) => {
    if (!questionText.trim() || loading) return;

    const query = questionText.trim();
    setInput('');
    setError(null);

    const userMsg: ChatMessage = { role: 'user', content: query };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    const assistantIndex = newHistory.length;
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    let streamedContent = '';

    try {
      await sendChatStream(
        query,
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
              updated[assistantIndex] = {
                ...updated[assistantIndex],
                content: finalContent,
                sources,
                has_sufficient_evidence: hasEvidence,
              };
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendQuestion(input);
  };

  const handleNewConversation = () => {
    setMessages([]);
    setError(null);
    setInput('');
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm"
      style={{ height: 'calc(100vh - 8rem)', minHeight: '560px', maxHeight: '820px' }}
    >
      {/* ── 1. Assistant Workspace Header ──────────────────────────── */}
      <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white"
            style={{ background: 'var(--primary)' }}
          >
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Clinical AI Assistant
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                RAG Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Grounded exclusively in hospital knowledge base
            </p>
          </div>
        </div>

        {/* Right Controls: Filter & New Conversation */}
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          
          {/* Document Type Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer font-medium"
            >
              <option value="">All Document Types</option>
              <option value="clinical_protocol">Clinical Protocols</option>
              <option value="drug_interaction_guideline">Drug Interaction Guidelines</option>
              <option value="policy_circular">Policy Circulars</option>
            </select>
          </div>

          {/* New Conversation Button */}
          <button
            onClick={handleNewConversation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            title="Start a fresh conversation"
          >
            <Plus className="w-3.5 h-3.5 text-sky-700" />
            <span className="hidden sm:inline">New Conversation</span>
          </button>
        </div>
      </div>

      {/* ── 2. Scrollable Messages Area ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#f8fafc]/50">
        
        {/* Empty State */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center px-4 py-6">
            
            {/* AI Icon */}
            <div
              className="w-13 h-13 rounded-2xl flex items-center justify-center mb-3 shadow-xs"
              style={{ background: '#e0f2fe', color: 'var(--primary)', border: '1px solid #bae6fd' }}
            >
              <Sparkles className="w-6 h-6" />
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5">
              Ask the Knowledge Assistant
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-md">
              Ask questions about clinical protocols, drug interactions, or hospital policies.
            </p>

            {/* Clickable Suggestion Chips */}
            <div className="w-full space-y-2 text-left">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
                Suggested clinical queries
              </div>

              {[
                {
                  text: 'What are the four labels in the emergency response protocol?',
                  tag: 'Protocol',
                },
                {
                  text: 'What is the interaction label for Compound-X and Compound-Y?',
                  tag: 'Drug Guideline',
                },
                {
                  text: 'What is the patient health data privacy disclosure policy?',
                  tag: 'Policy',
                },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSendQuestion(item.text)}
                  className="w-full p-3 rounded-xl text-xs flex items-center justify-between gap-3 transition-all duration-150 bg-white border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 hover:shadow-2xs text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <HelpCircle className="w-4 h-4 text-sky-600 shrink-0 group-hover:text-sky-700" />
                    <span className="text-slate-700 font-medium group-hover:text-slate-900 truncate">
                      &ldquo;{item.text}&rdquo;
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md shrink-0 group-hover:bg-sky-100 group-hover:text-sky-700">
                    {item.tag}
                  </span>
                </button>
              ))}
            </div>

          </div>
        )}

        {/* Message Stream */}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {/* Assistant Avatar */}
            {msg.role === 'assistant' && (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1 shadow-2xs text-white"
                style={{ background: 'var(--primary)' }}
              >
                <Bot className="w-4 h-4" />
              </div>
            )}

            {/* Message Bubble / Card */}
            <div
              className={`p-4 text-xs sm:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'max-w-[75%] rounded-2xl rounded-tr-sm bg-sky-700 text-white shadow-xs'
                  : 'max-w-[85%] rounded-2xl rounded-tl-sm bg-white border border-slate-200 text-slate-800 shadow-xs space-y-3'
              }`}
            >
              {/* Grounded Status Badge on Assistant Message */}
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  {msg.has_sufficient_evidence !== false ? (
                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Answer grounded in hospital documents</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      <span>Insufficient evidence in the hospital knowledge base</span>
                    </div>
                  )}
                </div>
              )}

              {/* Message Content */}
              <div className="whitespace-pre-wrap font-normal">
                {msg.content || (
                  <span className="text-slate-400 italic">Thinking...</span>
                )}
              </div>

              {/* Refusal Notice */}
              {msg.role === 'assistant' && msg.has_sufficient_evidence === false && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Notice:</span>
                    <span>
                      I couldn&apos;t find sufficient information in the available hospital documents to fully answer this query.
                    </span>
                  </div>
                </div>
              )}

              {/* Verified Sources / Citations */}
              {msg.sources && msg.sources.length > 0 && (
                <CitationCard sources={msg.sources} />
              )}
            </div>

            {/* User Avatar */}
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* Loading State */}
        {loading && (
          <div className="flex items-start gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center animate-pulse shrink-0 text-white shadow-2xs"
              style={{ background: 'var(--primary)' }}
            >
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-slate-200 shadow-2xs">
              <div className="w-2 h-2 rounded-full bg-sky-600 animate-ping" />
              <span className="text-xs text-slate-600 font-medium">
                Searching hospital documents & generating grounded response...
              </span>
            </div>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="p-3.5 rounded-xl flex items-center gap-2.5 text-xs bg-rose-50 border border-rose-200 text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── 3. Chat Input / Composer ───────────────────────────────── */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about protocols, drug guidelines, circulars..."
            className="flex-1 px-4 py-3 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-600 transition-all"
            disabled={loading}
          />
          <button
            type="submit"
            id="chat-send-btn"
            disabled={loading || !input.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--primary)' }}
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Supporting Disclaimer Text */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-2">
          <span>Answers are grounded in available hospital documents.</span>
          <span className="hidden sm:inline">Retrieve First → Grounded Answer → Exact Citations</span>
        </div>
      </div>

    </div>
  );
}
