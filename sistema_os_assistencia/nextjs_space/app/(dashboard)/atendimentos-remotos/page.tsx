'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Wifi, Plus, Edit2, Trash2, Loader2, Search, Calendar, Clock, DollarSign, Save, Download, FileText
} from 'lucide-react';
import Modal from '@/components/modal';
import { exportToCSV, exportListToPDF, Column } from '@/lib/list-export';

const statusLabels: Record<string, string> = {
  pendente: 'Pendente', em_andamento: 'Em Andamento', concluido: 'Concluído', cancelado: 'Cancelado',
};
const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-500/20 text-yellow-400', em_andamento: 'bg-blue-500/20 text-blue-400',
  concluido: 'bg-green-500/20 text-green-400', cancelado: 'bg-red-500/20 text-red-400',
};

function fmtMoney(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('pt-BR'); }
function today() { return new Date().toISOString().split('T')[0]; }

interface Atendimento {
  id: string; cliente: string; descricao: string; data: string;
  tempo: number; valorHora: number; valorTotal: number;
  status: string; observacoes?: string; createdAt: string;
}

const emptyForm = { cliente: '', descricao: '', data: '', tempo: 60, valorHora: 80, status: 'pendente', observacoes: '' };

export default function AtendimentosRemotosPage() {
  const [items, setItems] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Atendimento | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const handleExportPdf = async (id: string) => {
    setExportingId(id);
    try {
      const res = await fetch(`/api/atendimentos-remotos/${id}/export`);
      if (!res.ok) throw new Error('Erro ao gerar PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `atendimento-remoto-${id}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); alert('Erro ao exportar PDF'); }
    setExportingId(null);
  };

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/atendimentos-remotos')
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const valorCalculado = (form.tempo / 60) * form.valorHora;

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, data: today() || '' });
    setShowModal(true);
  };

  const openEdit = (item: Atendimento) => {
    setEditing(item);
    setForm({
      cliente: item.cliente, descricao: item.descricao || '',
      data: item.data ? new Date(item.data).toISOString().split('T')[0] || '' : '',
      tempo: item.tempo, valorHora: item.valorHora,
      status: item.status, observacoes: item.observacoes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editing ? `/api/atendimentos-remotos/${editing.id}` : '/api/atendimentos-remotos';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { setShowModal(false); load(); }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este atendimento remoto?')) return;
    await fetch(`/api/atendimentos-remotos/${id}`, { method: 'DELETE' });
    load();
  };

  const filtered = items.filter(i => {
    if (search && !i.cliente.toLowerCase().includes(search.toLowerCase()) && !(i.descricao || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && i.status !== statusFilter) return false;
    return true;
  });

  const totalValor = filtered.reduce((s, i) => s + i.valorTotal, 0);
  const totalTempo = filtered.reduce((s, i) => s + i.tempo, 0);

  const columns: Column[] = [
    { key: 'cliente', label: 'Cliente' },
    { key: 'data', label: 'Data', format: (v: any) => fmtDate(v) },
    { key: 'tempo', label: 'Tempo (min)' },
    { key: 'valorHora', label: 'Valor/Hora', format: (v: any) => fmtMoney(v) },
    { key: 'valorTotal', label: 'Total', format: (v: any) => fmtMoney(v) },
    { key: 'status', label: 'Status', format: (v: any) => statusLabels[v] || v },
  ];

  const inp = 'w-full px-3 py-2.5 rounded-xl bg-bg-primary border border-border text-text-primary text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2"><Wifi className="w-6 h-6 text-accent" /> Atendimentos Remotos</h1>
          <p className="text-text-secondary mt-1">Controle de sessões de suporte remoto</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(filtered, columns, 'atendimentos-remotos')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-border text-text-secondary hover:bg-bg-secondary transition-colors"><Download className="w-4 h-4" /> CSV</button>
          <button onClick={() => exportListToPDF('Atendimentos Remotos', filtered, columns, 'atendimentos-remotos')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-border text-text-secondary hover:bg-bg-secondary transition-colors"><FileText className="w-4 h-4" /> PDF</button>
          <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 transition-all shadow-lg shadow-accent/20">
            <Plus className="w-4 h-4" /> Novo Atendimento
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-bg-secondary rounded-xl p-4 shadow-lg shadow-black/10">
          <p className="text-xs text-text-secondary">Total Registros</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{filtered.length}</p>
        </div>
        <div className="bg-bg-secondary rounded-xl p-4 shadow-lg shadow-black/10">
          <p className="text-xs text-text-secondary">Tempo Total</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{Math.round(totalTempo)} min</p>
        </div>
        <div className="bg-bg-secondary rounded-xl p-4 shadow-lg shadow-black/10">
          <p className="text-xs text-text-secondary">Valor Total</p>
          <p className="text-2xl font-bold text-emerald-500 mt-1">{fmtMoney(totalValor)}</p>
        </div>
        <div className="bg-bg-secondary rounded-xl p-4 shadow-lg shadow-black/10">
          <p className="text-xs text-text-secondary">Concluídos</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{filtered.filter(i => i.status === 'concluido').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente ou descrição..."
            className={`${inp} pl-9`} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`${inp} w-full sm:w-48`}>
          <option value="">Todos os status</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">Nenhum atendimento encontrado</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-bg-secondary rounded-xl p-4 shadow-lg shadow-black/10 hover:shadow-xl transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-text-primary text-sm">{item.cliente}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[item.status] || ''}`}>{statusLabels[item.status] || item.status}</span>
                  </div>
                  <p className="text-xs text-text-secondary truncate">{item.descricao || '—'}</p>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-text-secondary">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(item.data)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.tempo} min</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{fmtMoney(item.valorHora)}/h</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-emerald-500">{fmtMoney(item.valorTotal)}</span>
                  <button onClick={() => handleExportPdf(item.id)} disabled={exportingId === item.id} title="Exportar PDF" className="p-2 rounded-lg hover:bg-accent/10 transition-colors disabled:opacity-50">
                    {exportingId === item.id ? <Loader2 className="w-4 h-4 animate-spin text-accent" /> : <FileText className="w-4 h-4 text-accent" />}
                  </button>
                  <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-bg-primary transition-colors"><Edit2 className="w-4 h-4 text-text-secondary" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Atendimento' : 'Novo Atendimento'}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Cliente *</label>
            <input value={form.cliente} onChange={e => setForm(p => ({ ...p, cliente: e.target.value }))} className={inp} placeholder="Nome do cliente" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Descrição</label>
            <textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} className={inp} rows={3} placeholder="Descrição do atendimento..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Data *</label>
              <input type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={inp}>
                {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Tempo (minutos) *</label>
              <input type="number" min={1} value={form.tempo} onChange={e => setForm(p => ({ ...p, tempo: Number(e.target.value) }))} className={inp} />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Valor/Hora (R$) *</label>
              <input type="number" min={0} step={0.01} value={form.valorHora} onChange={e => setForm(p => ({ ...p, valorHora: Number(e.target.value) }))} className={inp} />
            </div>
          </div>
          <div className="bg-accent/10 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-text-secondary">Valor Total Calculado</span>
            <span className="text-xl font-bold text-accent">{fmtMoney(valorCalculado)}</span>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Observações</label>
            <textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} className={inp} rows={2} placeholder="Observações adicionais..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-bg-primary transition-colors">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !form.cliente || !form.data || form.tempo <= 0}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 font-medium">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
