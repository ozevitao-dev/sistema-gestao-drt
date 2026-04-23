'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FileText, Plus, Search, Loader2, CheckCircle, XCircle, Clock, Trash2,
  ArrowRight, Hash, Phone, User, DollarSign, Download, FileSpreadsheet
} from 'lucide-react';
import Modal from '@/components/modal';
import { exportToCSV, exportListToPDF, Column } from '@/lib/list-export';

const statusLabels: Record<string, string> = { pendente: 'Pendente', aprovado: 'Aprovado', recusado: 'Cancelado', cancelado: 'Cancelado' };
const statusColors: Record<string, string> = { pendente: 'text-yellow-400 bg-yellow-400/10', aprovado: 'text-green-600 bg-green-600/10', recusado: 'text-red-400 bg-red-400/10', cancelado: 'text-red-400 bg-red-400/10' };
const statusIcons: Record<string, any> = { pendente: Clock, aprovado: CheckCircle, recusado: XCircle, cancelado: XCircle };

export default function OrcamentosPage() {
  const router = useRouter();
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [showCancelar, setShowCancelar] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      const res = await fetch(`/api/orcamentos?${params.toString()}`);
      const data = await res.json();
      setOrcamentos(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [search, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id: string) => {
    setApproving(id); setError('');
    try {
      const res = await fetch(`/api/orcamentos/${id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || 'Erro ao aprovar'); setApproving(null); return; }
      if (data?.ordem?.id) router.push(`/ordens/${data.ordem.id}`);
      else fetchData();
    } catch { setError('Erro ao aprovar'); }
    setApproving(null);
  };

  const handleCancelar = async (id: string) => {
    try {
      const res = await fetch(`/api/orcamentos/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelado' }),
      });
      if (res.ok) { fetchData(); setShowCancelar(null); }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/orcamentos/${id}`, { method: 'DELETE' });
      if (res.ok) { fetchData(); setShowDeleteConfirm(null); }
    } catch (e) { console.error(e); }
    setDeleting(false);
  };

  const handleExportPdf = async (id: string, numero: number) => {
    setExportingPdf(id);
    try {
      const r = await fetch(`/api/orcamentos/${id}/export`);
      if (r.ok) {
        const blob = await r.blob();
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `ORC-${numero}.pdf`; a.click();
      }
    } catch {} setExportingPdf(null);
  };

  const orcExportColumns: Column[] = [
    { key: 'numero', label: 'Nº' },
    { key: 'nomeCliente', label: 'Cliente' },
    { key: 'telefoneCliente', label: 'Telefone', format: v => v || '' },
    { key: 'tipoEquipamento', label: 'Equipamento', format: v => v || '' },
    { key: 'marca', label: 'Marca', format: v => v || '' },
    { key: 'status', label: 'Status', format: v => statusLabels[v] || v },
    { key: 'valorTotal', label: 'Valor (R$)', format: v => (v ?? 0).toFixed(2).replace('.', ',') },
    { key: 'createdAt', label: 'Data', format: v => v ? new Date(v).toLocaleDateString('pt-BR') : '' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-6 h-6 text-accent" /> Orçamentos
          </h1>
          <p className="text-text-secondary mt-1">Gerencie seus orçamentos e converta em OS</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {orcamentos.length > 0 && (
            <>
              <button onClick={() => exportToCSV(orcamentos, orcExportColumns, 'orcamentos')} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-all">
                <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
              </button>
              <button onClick={() => exportListToPDF('Orçamentos', orcamentos, orcExportColumns, 'orcamentos')} className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-all">
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
            </>
          )}
          <Link href="/orcamentos/novo" className="px-4 py-2.5 bg-accent hover:bg-accent-light text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 w-fit">
            <Plus className="w-4 h-4" /> Novo Orçamento
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm" placeholder="Buscar..." />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2.5 rounded-lg border text-sm min-w-[160px]">
          <option value="">Todos</option><option value="pendente">Pendente</option><option value="aprovado">Aprovado</option><option value="cancelado">Cancelado</option>
        </select>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
      ) : orcamentos.length === 0 ? (
        <div className="text-center py-20"><FileText className="w-12 h-12 text-text-secondary mx-auto mb-4" /><p className="text-text-secondary">Nenhum orçamento encontrado</p></div>
      ) : (
        <div className="grid gap-4">
          {orcamentos.map((orc: any, i: number) => {
            const StatusIcon = statusIcons[orc.status] || Clock;
            return (
              <motion.div key={orc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-bg-secondary rounded-xl p-5 shadow-lg border border-border hover:border-accent/30 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-accent font-bold text-lg flex items-center gap-1"><Hash className="w-4 h-4" />{orc.numero}</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[orc.status] || ''}`}>
                        <StatusIcon className="w-3.5 h-3.5" />{statusLabels[orc.status] || orc.status}
                      </span>
                      {orc.modoEntrada && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-amber-500 bg-amber-500/10">
                          Entrada
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{orc.nomeCliente}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{orc.telefoneCliente}</span>
                      {!orc.modoEntrada && <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />R$ {(orc.valorTotal || 0).toFixed(2).replace('.', ',')}</span>}
                    </div>
                    {orc.marca && <p className="text-xs text-text-secondary mt-1">{orc.tipoEquipamento} • {orc.marca} {orc.modelo || ''}</p>}
                    <p className="text-xs text-text-secondary mt-1">
                      {new Date(orc.createdAt).toLocaleDateString('pt-BR')}
                      {orc.ordemServico ? ` • OS #${orc.ordemServico.numero}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {/* PDF */}
                    <button onClick={() => handleExportPdf(orc.id, orc.numero)} disabled={exportingPdf === orc.id}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-50">
                      {exportingPdf === orc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
                    </button>

                    {orc.status === 'pendente' && (
                      <>
                        <button onClick={() => handleApprove(orc.id)} disabled={approving === orc.id}
                          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-50">
                          {approving === orc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Aprovar
                        </button>
                        <button onClick={() => setShowCancelar(orc.id)}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" /> Cancelar
                        </button>
                      </>
                    )}
                    {orc.status === 'aprovado' && orc.ordemServico && (
                      <Link href={`/ordens/${orc.ordemServico.id}`}
                        className="px-3 py-2 bg-accent/20 hover:bg-accent/30 text-accent rounded-lg text-xs font-medium flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5" /> Ver OS
                      </Link>
                    )}
                    <button onClick={() => setShowDeleteConfirm(orc.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg" title="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal open={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Excluir Orçamento">
        <p className="text-text-secondary text-sm mb-4">Tem certeza que deseja excluir? Esta ação não pode ser desfeita.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-primary">Voltar</button>
          <button onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)} disabled={deleting}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Excluir
          </button>
        </div>
      </Modal>

      <Modal open={!!showCancelar} onClose={() => setShowCancelar(null)} title="Cancelar Orçamento">
        <p className="text-text-secondary text-sm mb-4">Tem certeza que deseja cancelar? O orçamento será mantido no histórico.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowCancelar(null)} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-primary">Voltar</button>
          <button onClick={() => showCancelar && handleCancelar(showCancelar)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Cancelar Orçamento
          </button>
        </div>
      </Modal>
    </div>
  );
}
