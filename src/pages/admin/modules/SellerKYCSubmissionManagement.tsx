import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  fetchAllKYCSubmissions,
  approveKYC,
  rejectKYC,
  deleteKYC,
  updateKYC,
} from '../../../lib/kycService';
import {
  CheckCircle2, XCircle, Trash2, Eye, Edit3, X,
  Loader2, AlertCircle, Search, RefreshCw, Save,
} from 'lucide-react';

type KYCRow = Record<string, unknown>;
type Modal = { type: 'view' | 'edit' | 'reject'; row: KYCRow } | null;

const BADGE: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  draft:    'bg-gray-100 text-gray-600',
};

const FIELDS = ['pan','gstin','id_type','id_number','bank_holder_name','account_number','account_type','ifsc_code'] as const;

export const SellerKYCSubmissionManagement: React.FC = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<KYCRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modal, setModal] = useState<Modal>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: e } = await fetchAllKYCSubmissions();
    if (e) setError(e); else setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter(r => {
    const s = statusFilter === 'all' || r.kyc_status === statusFilter;
    const q = !search || [r.full_name, r.email, r.country, r.pan].some(
      v => String(v || '').toLowerCase().includes(search.toLowerCase())
    );
    return s && q;
  });

  const handleApprove = async (row: KYCRow) => {
    if (!confirm('Approve this seller KYC?')) return;
    setActionLoading(true);
    const res = await approveKYC(row.id as string, row.seller_id as string, user?.id || '');
    if (res.success) await load(); else setError(res.error || 'Failed');
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!modal || modal.type !== 'reject' || !rejectReason.trim()) return;
    setActionLoading(true);
    const res = await rejectKYC(modal.row.id as string, modal.row.seller_id as string, rejectReason);
    if (res.success) { setModal(null); setRejectReason(''); await load(); }
    else setError(res.error || 'Failed');
    setActionLoading(false);
  };

  const handleDelete = async (row: KYCRow) => {
    if (!confirm('Delete this KYC record permanently?')) return;
    setActionLoading(true);
    const res = await deleteKYC(row.id as string);
    if (res.success) await load(); else setError(res.error || 'Failed');
    setActionLoading(false);
  };

  const handleSaveEdit = async () => {
    if (!modal || modal.type !== 'edit') return;
    setActionLoading(true);
    const res = await updateKYC(modal.row.id as string, editData);
    if (res.success) { setModal(null); await load(); }
    else setError(res.error || 'Failed');
    setActionLoading(false);
  };

  const openEdit = (row: KYCRow) => {
    const data: Record<string, string> = {};
    FIELDS.forEach(f => { data[f] = String(row[f] || ''); });
    setEditData(data);
    setModal({ type: 'edit', row });
  };

  const counts = {
    all: rows.length,
    pending: rows.filter(r => r.kyc_status === 'pending').length,
    approved: rows.filter(r => r.kyc_status === 'approved').length,
    rejected: rows.filter(r => r.kyc_status === 'rejected').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Seller KYC Management</h1>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {(['all','pending','approved','rejected'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, PAN..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:border-amber-400" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-amber-500" size={32} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No KYC submissions found.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Seller</th>
                <th className="px-4 py-3 text-left">Country</th>
                <th className="px-4 py-3 text-left">PAN</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Submitted</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(row => (
                <tr key={row.id as string} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{String(row.full_name || '—')}</p>
                    <p className="text-gray-400 text-xs">{String(row.email || '')}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{String(row.country || '—')}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{String(row.pan || '—')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${BADGE[row.kyc_status as string] || BADGE.draft}`}>
                      {String(row.kyc_status || 'draft')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {row.submitted_at ? new Date(row.submitted_at as string).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Btn icon={<Eye size={15} />} title="View" onClick={() => setModal({ type: 'view', row })} />
                      <Btn icon={<Edit3 size={15} />} title="Edit" onClick={() => openEdit(row)} />
                      {row.kyc_status === 'pending' && (
                        <>
                          <Btn icon={<CheckCircle2 size={15} />} title="Approve" cls="text-green-600 hover:bg-green-50" onClick={() => handleApprove(row)} />
                          <Btn icon={<XCircle size={15} />} title="Reject" cls="text-red-600 hover:bg-red-50" onClick={() => { setRejectReason(''); setModal({ type: 'reject', row }); }} />
                        </>
                      )}
                      <Btn icon={<Trash2 size={15} />} title="Delete" cls="text-red-600 hover:bg-red-50" onClick={() => handleDelete(row)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Overlay */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {modal.type === 'view' ? 'KYC Details' : modal.type === 'edit' ? 'Edit KYC' : 'Reject KYC'}
              </h2>
              <button onClick={() => setModal(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>

            <div className="p-6">
              {/* VIEW */}
              {modal.type === 'view' && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <Detail label="Full Name" value={modal.row.full_name} />
                  <Detail label="Email" value={modal.row.email} />
                  <Detail label="Phone" value={modal.row.phone} />
                  <Detail label="Country" value={modal.row.country} />
                  <Detail label="PAN" value={modal.row.pan} />
                  <Detail label="GSTIN" value={modal.row.gstin} />
                  <Detail label="ID Type" value={modal.row.id_type} />
                  <Detail label="ID Number" value={modal.row.id_number} />
                  <Detail label="Bank Holder" value={modal.row.bank_holder_name} />
                  <Detail label="Account No" value={modal.row.account_number} />
                  <Detail label="IFSC" value={modal.row.ifsc_code} />
                  <Detail label="Account Type" value={modal.row.account_type} />
                  <Detail label="PEP" value={modal.row.pep_declaration ? 'Yes' : 'No'} />
                  <Detail label="AML" value={modal.row.aml_compliance ? 'Yes' : 'No'} />
                  <Detail label="Status" value={modal.row.kyc_status} />
                  <Detail label="Submitted" value={modal.row.submitted_at ? new Date(modal.row.submitted_at as string).toLocaleString() : '—'} />
                  {!!modal.row.id_document_url && <DocLink label="ID Document" url={modal.row.id_document_url as string} />}
                  {!!modal.row.address_proof_url && <DocLink label="Address Proof" url={modal.row.address_proof_url as string} />}
                  {!!modal.row.bank_statement_url && <DocLink label="Bank Statement" url={modal.row.bank_statement_url as string} />}
                  {!!modal.row.rejection_reason && (
                    <div className="col-span-2 bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="font-semibold text-red-700 text-xs mb-1">Rejection Reason</p>
                      <p className="text-red-600">{String(modal.row.rejection_reason)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* EDIT */}
              {modal.type === 'edit' && (
                <div className="grid grid-cols-2 gap-4">
                  {FIELDS.map(f => (
                    <div key={f}>
                      <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{f.replace(/_/g, ' ')}</label>
                      <input value={editData[f] || ''} onChange={e => setEditData({ ...editData, [f]: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                    </div>
                  ))}
                  <div className="col-span-2 flex justify-end gap-3 pt-4">
                    <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button onClick={handleSaveEdit} disabled={actionLoading}
                      className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-400 flex items-center gap-2 disabled:opacity-50">
                      {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                    </button>
                  </div>
                </div>
              )}

              {/* REJECT */}
              {modal.type === 'reject' && (
                <div>
                  <p className="text-sm text-gray-600 mb-3">Provide a reason so the seller knows what to fix:</p>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} placeholder="e.g. PAN number doesn't match the uploaded document..."
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-400 mb-4" />
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button onClick={handleReject} disabled={actionLoading || !rejectReason.trim()}
                      className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-500 flex items-center gap-2 disabled:opacity-50">
                      {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Btn: React.FC<{ icon: React.ReactNode; title: string; cls?: string; onClick: () => void }> = ({ icon, title, cls = 'text-gray-500 hover:bg-gray-100', onClick }) => (
  <button onClick={onClick} title={title} className={`p-1.5 rounded-lg transition-colors ${cls}`}>{icon}</button>
);

const Detail: React.FC<{ label: string; value: unknown }> = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">{label}</p>
    <p className="text-gray-900">{String(value ?? '—')}</p>
  </div>
);

const DocLink: React.FC<{ label: string; url: string }> = ({ label, url }) => (
  <div>
    <p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">{label}</p>
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline text-sm">View Document ↗</a>
  </div>
);
