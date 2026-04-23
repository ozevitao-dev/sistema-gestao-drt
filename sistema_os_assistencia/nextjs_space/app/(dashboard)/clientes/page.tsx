'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Search, Edit2, Trash2, Loader2, Phone, Mail, FileText, Eye, Download, FileSpreadsheet } from 'lucide-react';
import { exportToCSV, exportListToPDF, Column } from '@/lib/list-export';
import Modal from '@/components/modal';
import Link from 'next/link';

interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  cpfCnpj: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  bairro: string | null;
  _count?: { ordensServico: number };
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: '', telefone: '', whatsapp: '', email: '', cpfCnpj: '', endereco: '', cidade: '', estado: '', cep: '', bairro: '' });
  const [error, setError] = useState('');

  const fetchClientes = useCallback(async () => {
    try {
      const res = await fetch(`/api/clientes?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch (e: any) { console.error(e); }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const openNew = () => {
    setEditingCliente(null);
    setForm({ nome: '', telefone: '', whatsapp: '', email: '', cpfCnpj: '', endereco: '', cidade: '', estado: '', cep: '', bairro: '' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (c: Cliente) => {
    setEditingCliente(c);
    setForm({ nome: c?.nome ?? '', telefone: c?.telefone ?? '', whatsapp: c?.whatsapp ?? '', email: c?.email ?? '', cpfCnpj: c?.cpfCnpj ?? '', endereco: c?.endereco ?? '', cidade: c?.cidade ?? '', estado: c?.estado ?? '', cep: c?.cep ?? '', bairro: c?.bairro ?? '' });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form?.nome?.trim()) { setError('Nome é obrigatório'); return; }
    setSaving(true);
    setError('');
    try {
      const url = editingCliente ? `/api/clientes/${editingCliente.id}` : '/api/clientes';
      const method = editingCliente ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data?.error ?? 'Erro ao salvar'); return; }
      setModalOpen(false);
      fetchClientes();
    } catch (e: any) { setError('Erro ao salvar'); console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
      if (res.ok) fetchClientes();
      else { const d = await res.json(); alert(d?.error ?? 'Erro ao excluir'); }
    } catch (e: any) { console.error(e); }
  };

  const exportColumns: Column[] = [
    { key: 'nome', label: 'Nome' },
    { key: 'telefone', label: 'Telefone', format: v => v || '' },
    { key: 'whatsapp', label: 'WhatsApp', format: v => v || '' },
    { key: 'email', label: 'E-mail', format: v => v || '' },
    { key: 'cpfCnpj', label: 'CPF/CNPJ', format: v => v || '' },
    { key: 'cidade', label: 'Cidade', format: v => v || '' },
    { key: 'estado', label: 'UF', format: v => v || '' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" /> Clientes
          </h1>
          <p className="text-text-secondary mt-1">Gerencie os clientes da assistência técnica</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {clientes.length > 0 && (
            <>
              <button onClick={() => exportToCSV(clientes, exportColumns, 'clientes')} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-all">
                <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
              </button>
              <button onClick={() => exportListToPDF('Clientes', clientes, exportColumns, 'clientes')} className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-all">
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
            </>
          )}
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-light text-white rounded-xl font-medium transition-all shadow-lg shadow-accent/20">
            <Plus className="w-4 h-4" /> Novo Cliente
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <input
          type="text"
          placeholder="Buscar por nome, CPF/CNPJ, e-mail ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm bg-bg-secondary"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
      ) : (clientes?.length ?? 0) === 0 ? (
        <div className="text-center py-12 text-text-secondary">Nenhum cliente encontrado</div>
      ) : (
        <div className="grid gap-3">
          {(clientes ?? [])?.map?.((c: Cliente, i: number) => (
            <motion.div
              key={c?.id ?? i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-bg-secondary rounded-xl p-4 shadow-lg shadow-black/10 hover:shadow-xl transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text-primary truncate">{c?.nome ?? ''}</h3>
                    {(c?._count?.ordensServico ?? 0) > 0 && (
                      <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{c?._count?.ordensServico ?? 0} OS</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-text-secondary">
                    {c?.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.telefone}</span>}
                    {c?.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                    {c?.cpfCnpj && <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{c.cpfCnpj}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(c)} className="p-2 hover:bg-bg-primary rounded-lg transition-colors" title="Editar">
                    <Edit2 className="w-4 h-4 text-text-secondary" />
                  </button>
                  <button onClick={() => handleDelete(c?.id ?? '')} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors" title="Excluir">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          )) ?? []}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingCliente ? 'Editar Cliente' : 'Novo Cliente'}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm text-text-secondary mb-1">Nome *</label>
              <input value={form?.nome ?? ''} onChange={(e) => setForm({ ...(form ?? {}), nome: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm" placeholder="Nome completo" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Telefone</label>
              <input value={form?.telefone ?? ''} onChange={(e) => setForm({ ...(form ?? {}), telefone: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm" placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">WhatsApp</label>
              <input value={form?.whatsapp ?? ''} onChange={(e) => setForm({ ...(form ?? {}), whatsapp: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm" placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">E-mail</label>
              <input type="email" value={form?.email ?? ''} onChange={(e) => setForm({ ...(form ?? {}), email: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm" placeholder="email@exemplo.com" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">CPF/CNPJ</label>
              <input value={form?.cpfCnpj ?? ''} onChange={(e) => setForm({ ...(form ?? {}), cpfCnpj: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm" placeholder="000.000.000-00" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">CEP</label>
              <input value={form?.cep ?? ''} onChange={(e) => setForm({ ...(form ?? {}), cep: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm" placeholder="00000-000" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-text-secondary mb-1">Endereço</label>
              <input value={form?.endereco ?? ''} onChange={(e) => setForm({ ...(form ?? {}), endereco: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm" placeholder="Rua, número" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Bairro</label>
              <input value={form?.bairro ?? ''} onChange={(e) => setForm({ ...(form ?? {}), bairro: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Cidade</label>
              <input value={form?.cidade ?? ''} onChange={(e) => setForm({ ...(form ?? {}), cidade: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Estado</label>
              <input value={form?.estado ?? ''} onChange={(e) => setForm({ ...(form ?? {}), estado: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm" placeholder="UF" />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-bg-primary transition-colors">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-accent hover:bg-accent-light text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingCliente ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
