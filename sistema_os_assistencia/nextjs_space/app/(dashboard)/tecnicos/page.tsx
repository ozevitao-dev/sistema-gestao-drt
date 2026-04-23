'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, Edit2, Trash2, Loader2, Save, X, Shield, Wrench,
  Mail, Eye, EyeOff, UserCheck, UserX
} from 'lucide-react';
import Modal from '@/components/modal';

const roleLabels: Record<string, string> = { admin: 'Administrador', tecnico: 'Técnico' };
const roleColors: Record<string, string> = { admin: 'bg-purple-500/20 text-purple-600', tecnico: 'bg-blue-500/20 text-blue-600' };

export default function TecnicosPage() {
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'tecnico' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchTecnicos = useCallback(async () => {
    try {
      const r = await fetch('/api/tecnicos');
      if (r.ok) setTecnicos(await r.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchTecnicos(); }, [fetchTecnicos]);

  const openNew = () => {
    setEditId(null);
    setForm({ name: '', email: '', password: '', role: 'tecnico' });
    setError('');
    setShowPassword(false);
    setShowModal(true);
  };

  const openEdit = (t: any) => {
    setEditId(t.id);
    setForm({ name: t.name || '', email: t.email, password: '', role: t.role });
    setError('');
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) { setError('Nome e email são obrigatórios'); return; }
    if (!editId && !form.password) { setError('Senha é obrigatória para novo técnico'); return; }
    setSaving(true); setError('');
    try {
      const url = editId ? `/api/tecnicos/${editId}` : '/api/tecnicos';
      const method = editId ? 'PUT' : 'POST';
      const body: any = { name: form.name, email: form.email, role: form.role };
      if (form.password) body.password = form.password;
      const r = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (r.ok) { setShowModal(false); fetchTecnicos(); }
      else { const d = await r.json(); setError(d?.error || 'Erro ao salvar'); }
    } catch { setError('Erro ao salvar'); }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir/desativar o técnico "${name}"?`)) return;
    try {
      await fetch(`/api/tecnicos/${id}`, { method: 'DELETE' });
      fetchTecnicos();
    } catch {}
  };

  const handleToggleAtivo = async (t: any) => {
    try {
      await fetch(`/api/tecnicos/${t.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !t.ativo }),
      });
      fetchTecnicos();
    } catch {}
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Users className="w-6 h-6 text-accent" /> Técnicos
        </h1>
        <button onClick={openNew}
          className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-accent/90 min-h-[44px]">
          <Plus className="w-4 h-4" /> Novo Técnico
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-bg-secondary rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bg-primary">
                <tr>
                  <th className="text-left px-4 py-3 text-xs text-text-secondary font-medium">Nome</th>
                  <th className="text-left px-4 py-3 text-xs text-text-secondary font-medium">E-mail</th>
                  <th className="text-center px-4 py-3 text-xs text-text-secondary font-medium">Função</th>
                  <th className="text-center px-4 py-3 text-xs text-text-secondary font-medium">Status</th>
                  <th className="text-center px-4 py-3 text-xs text-text-secondary font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tecnicos.map(t => (
                  <tr key={t.id} className={`border-t border-border hover:bg-bg-primary/50 ${!t.ativo ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-text-primary font-medium">{t.name || 'Sem nome'}</td>
                    <td className="px-4 py-3 text-text-secondary">{t.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColors[t.role] || 'bg-gray-500/20 text-gray-400'}`}>
                        {t.role === 'admin' ? <Shield className="w-3 h-3 inline mr-1" /> : <Wrench className="w-3 h-3 inline mr-1" />}
                        {roleLabels[t.role] || t.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleToggleAtivo(t)}
                        className={`text-xs px-2 py-1 rounded-full font-medium ${t.ativo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {t.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-bg-primary rounded text-text-secondary hover:text-accent">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(t.id, t.name)} className="p-1.5 hover:bg-bg-primary rounded text-text-secondary hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tecnicos.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-text-secondary">Nenhum técnico cadastrado</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {tecnicos.map(t => (
              <div key={t.id} className={`bg-bg-secondary rounded-xl p-4 border border-border ${!t.ativo ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">{t.name || 'Sem nome'}</h3>
                    <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" /> {t.email}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${roleColors[t.role] || ''}`}>
                    {roleLabels[t.role] || t.role}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <button onClick={() => handleToggleAtivo(t)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${t.ativo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {t.ativo ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                    {t.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(t)} className="p-2 hover:bg-bg-primary rounded-lg text-text-secondary hover:text-accent min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(t.id, t.name)} className="p-2 hover:bg-bg-primary rounded-lg text-text-secondary hover:text-red-400 min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {tecnicos.length === 0 && (
              <p className="text-center py-8 text-text-secondary">Nenhum técnico cadastrado</p>
            )}
          </div>
        </>
      )}

      {/* Modal Novo/Editar */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Editar Técnico' : 'Novo Técnico'}>
        <div className="space-y-3">
          {error && <p className="text-red-400 text-xs bg-red-400/10 p-2 rounded-lg">{error}</p>}
          <div>
            <label className="text-xs text-text-secondary block mb-1">Nome *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm min-h-[44px]" placeholder="Nome completo" />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">E-mail *</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm min-h-[44px]" placeholder="email@exemplo.com" />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">
              Senha {editId ? '(deixe vazio para manter)' : '*'}
            </label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-bg-primary text-text-primary text-sm min-h-[44px]" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-secondary">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Função</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm min-h-[44px]">
              <option value="tecnico">Técnico</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-primary min-h-[44px]">Cancelar</button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 min-h-[44px]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editId ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
