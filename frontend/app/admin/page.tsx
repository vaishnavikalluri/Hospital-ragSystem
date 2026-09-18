'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchDocuments,
  fetchMetrics,
  triggerReindex,
  uploadDocument,
  deleteDocument,
  getSession,
  UserSession,
  DocumentInfo,
  MetricsResponse,
} from '@/services/api';
import DocumentList from '@/components/DocumentList';
import {
  ShieldAlert,
  Upload,
  RefreshCw,
  Activity,
  Layers,
  Zap,
  Clock,
  HardDrive,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Upload modal/form state
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('clinical_protocol');
  const [customCategory, setCustomCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Re-index state
  const [indexing, setIndexing] = useState(false);
  const [indexMessage, setIndexMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsRes, metricsRes] = await Promise.all([fetchDocuments(), fetchMetrics().catch(() => null)]);
      setDocuments(docsRes.documents || []);
      setMetrics(metricsRes);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = getSession();
    if (!session || !session.authorized) {
      router.push('/login');
      return;
    }
    if (!session.is_admin) {
      router.push('/dashboard');
      return;
    }
    setUser(session);
    loadData();
  }, [router]);

  if (!user || !user.is_admin) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const finalCategory = docType === 'custom' ? (customCategory.trim() || 'general_document') : docType;

    setUploading(true);
    setUploadMessage(null);

    try {
      const res = await uploadDocument(file, finalCategory);
      setUploadMessage({ text: res.message, type: 'success' });
      setFile(null);
      setCustomCategory('');
      await loadData();
    } catch (err: any) {
      setUploadMessage({ text: err.message || 'Upload failed.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleReindex = async (force = false) => {
    setIndexing(true);
    setIndexMessage(null);
    try {
      const res = await triggerReindex(force);
      setIndexMessage(res.summary);
      await loadData();
    } catch (err: any) {
      setIndexMessage(`Indexing failed: ${err.message}`);
    } finally {
      setIndexing(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the knowledge base?`)) return;
    try {
      await deleteDocument(name);
      await loadData();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* Header */}
      <div className="p-6 rounded-2xl flex items-center justify-between shadow-sm"
        style={{ background: 'white', border: '1px solid var(--border)' }}>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                Admin Management Console
              </h1>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                AUTHORIZED ADMIN
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
              Upload documents, trigger ingestion indexing, & monitor RAG performance.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded-xl transition-all hover:bg-slate-50"
          style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--text-2)' }}
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl shadow-sm" style={{ background: 'white', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-1" style={{ color: 'var(--text-2)' }}>
              <span className="text-xs font-semibold">Total Queries</span>
              <Activity className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{metrics.total_queries}</div>
            <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>{metrics.successful_queries} successful</span>
          </div>

          <div className="p-4 rounded-xl shadow-sm" style={{ background: 'white', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-1" style={{ color: 'var(--text-2)' }}>
              <span className="text-xs font-semibold">Avg Latency</span>
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{metrics.avg_response_time_ms} ms</div>
            <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>Retrieval: {metrics.avg_retrieval_time_ms} ms</span>
          </div>

          <div className="p-4 rounded-xl shadow-sm" style={{ background: 'white', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-1" style={{ color: 'var(--text-2)' }}>
              <span className="text-xs font-semibold">Total Chunks</span>
              <Layers className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{metrics.chunks_indexed}</div>
            <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>{metrics.documents_indexed} documents</span>
          </div>

          <div className="p-4 rounded-xl shadow-sm" style={{ background: 'white', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-1" style={{ color: 'var(--text-2)' }}>
              <span className="text-xs font-semibold">Cache Hits</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{metrics.cache_hits}</div>
            <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>Misses: {metrics.cache_misses}</span>
          </div>
        </div>
      )}

      {/* Main Admin Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* PDF Upload Panel */}
        <div className="p-6 rounded-2xl shadow-sm space-y-4"
          style={{ background: 'white', border: '1px solid var(--border)' }}>
          <div className="flex items-center space-x-3 font-semibold text-sm" style={{ color: 'var(--primary)' }}>
            <Upload className="w-5 h-5" />
            <span>Admin Document Upload (Concept #36)</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-2)' }}>
            Upload new hospital PDFs. File goes through extraction, cleaning, token chunking, metadata enrichment, embedding, & ChromaDB indexing.
          </p>

          <form onSubmit={handleUpload} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-2)' }}>
                Document Category
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full text-xs rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer"
                style={{ background: 'white', border: '1.5px solid var(--border)', color: 'var(--text)' }}
              >
                <option value="clinical_protocol">Clinical Protocol</option>
                <option value="drug_interaction_guideline">Drug Interaction Guideline</option>
                <option value="policy_circular">Policy Circular</option>
                <option value="surgical_guideline">Surgical Protocol / Guideline</option>
                <option value="emergency_sop">Emergency SOP / Manual</option>
                <option value="lab_manual">Laboratory Manual</option>
                <option value="custom">✏️ Other / Custom Category...</option>
              </select>

              {docType === 'custom' && (
                <div className="mt-2">
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category (e.g. Radiology SOP, Training Guide)..."
                    className="w-full text-xs rounded-xl px-3 py-2.5 focus:outline-none transition-all"
                    style={{ background: '#f8fafc', border: '1.5px solid var(--primary)', color: 'var(--text)' }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-2)' }}>
                PDF File
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-xs file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                style={{ color: 'var(--text-2)' }}
              />
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="btn-primary w-full justify-center py-3 text-xs"
              style={{ opacity: uploading || !file ? 0.6 : 1, cursor: uploading || !file ? 'not-allowed' : 'pointer' }}
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Process & Index Document</span>
                </>
              )}
            </button>
          </form>

          {uploadMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                uploadMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {uploadMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{uploadMessage.text}</span>
            </div>
          )}
        </div>

        {/* Index Control Panel */}
        <div className="p-6 rounded-2xl shadow-sm space-y-4"
          style={{ background: 'white', border: '1px solid var(--border)' }}>
          <div className="flex items-center space-x-3 font-semibold text-sm text-purple-700">
            <RefreshCw className="w-5 h-5" />
            <span>Ingestion Index Trigger</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-2)' }}>
            Trigger document discovery and full re-indexing of all pre-loaded PDFs inside <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs">data/documents/</code> directory.
          </p>

          <div className="space-y-3 pt-4">
            <button
              onClick={() => handleReindex(false)}
              disabled={indexing}
              className="w-full py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all hover:bg-slate-50"
              style={{ background: 'white', border: '1.5px solid var(--border)', color: 'var(--text)' }}
            >
              {indexing ? (
                <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Re-index Incremental Documents</span>
              )}
            </button>

            <button
              onClick={() => handleReindex(true)}
              disabled={indexing}
              className="w-full py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all hover:bg-amber-50"
              style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e' }}
            >
              <span>Force Reset & Full Corpus Re-index</span>
            </button>
          </div>

          {indexMessage && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono">
              {indexMessage}
            </div>
          )}
        </div>

      </div>

      {/* Managed Documents List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          Managed Documents
        </h3>
        <DocumentList documents={documents} loading={loading} onDelete={handleDelete} isAdmin={true} />
      </div>

    </div>
  );
}
