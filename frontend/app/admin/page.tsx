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

    setUploading(true);
    setUploadMessage(null);

    try {
      const res = await uploadDocument(file, docType);
      setUploadMessage({ text: res.message, type: 'success' });
      setFile(null);
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
    <div className="space-y-8 py-2">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Admin Management Console</h1>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                AUTHORIZED ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload documents, trigger ingestion indexing, & monitor RAG performance.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Total Queries</span>
              <Activity className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl font-bold text-white">{metrics.total_queries}</div>
            <span className="text-[10px] text-slate-500">{metrics.successful_queries} successful</span>
          </div>

          <div className="glass-card p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Avg Latency</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-white">{metrics.avg_response_time_ms} ms</div>
            <span className="text-[10px] text-slate-500">Retrieval: {metrics.avg_retrieval_time_ms} ms</span>
          </div>

          <div className="glass-card p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Total Chunks</span>
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white">{metrics.chunks_indexed}</div>
            <span className="text-[10px] text-slate-500">{metrics.documents_indexed} documents</span>
          </div>

          <div className="glass-card p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Cache Hits</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white">{metrics.cache_hits}</div>
            <span className="text-[10px] text-slate-500">Misses: {metrics.cache_misses}</span>
          </div>
        </div>
      )}

      {/* Main Admin Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* PDF Upload Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-3 text-sky-400 font-semibold text-sm">
            <Upload className="w-5 h-5" />
            <span>Admin Document Upload (Concept #36)</span>
          </div>
          <p className="text-xs text-slate-400">
            Upload new hospital PDFs. File goes through extraction, cleaning, token chunking, metadata enrichment, embedding, & ChromaDB indexing.
          </p>

          <form onSubmit={handleUpload} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Document Category
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-sky-500"
              >
                <option value="clinical_protocol">Clinical Protocol</option>
                <option value="drug_interaction_guideline">Drug Interaction Guideline</option>
                <option value="policy_circular">Policy Circular</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                PDF File
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-500/10 file:text-sky-400 hover:file:bg-sky-500/20 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
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
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
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
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-3 text-purple-400 font-semibold text-sm">
            <RefreshCw className="w-5 h-5" />
            <span>Ingestion Index Trigger</span>
          </div>
          <p className="text-xs text-slate-400">
            Trigger document discovery and full re-indexing of all pre-loaded PDFs inside <code className="text-sky-300">data/documents/</code> directory.
          </p>

          <div className="space-y-3 pt-4">
            <button
              onClick={() => handleReindex(false)}
              disabled={indexing}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
            >
              {indexing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Re-index Incremental Documents</span>
              )}
            </button>

            <button
              onClick={() => handleReindex(true)}
              disabled={indexing}
              className="w-full py-3 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
            >
              <span>Force Reset & Full Corpus Re-index</span>
            </button>
          </div>

          {indexMessage && (
            <div className="p-3 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 text-xs font-mono">
              {indexMessage}
            </div>
          )}
        </div>

      </div>

      {/* Managed Documents List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white tracking-tight">Managed Documents</h3>
        <DocumentList documents={documents} loading={loading} onDelete={handleDelete} isAdmin={true} />
      </div>

    </div>
  );
}
