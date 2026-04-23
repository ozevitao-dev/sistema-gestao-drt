'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingBag, Save, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const formasPagamento = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao_debito', label: 'Cartão Débito' },
  { value: 'cartao_credito', label: 'Cartão Crédito' },
  { value: 'transferencia', label: 'Transferência' },
];

export default function NovaVendaPage() {
  const router = useRouter();
  const [form, setForm] = useState({ cliente: '', descricao: '', valor: '', formaPagamento: 'pix', observacoes: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.descricao || !form.valor) { setError('Preencha descrição e valor.'); return; }
    const valor = parseFloat(form.valor.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) { setError('Valor inválido.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, valor }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Erro ao registrar venda.'); return; }
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch { setError('Erro de conexão.'); } finally { setSaving(false); }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-text-primary">Venda Registrada!</h2>
          <p className="text-text-secondary text-sm mt-1">Redirecionando...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 rounded-xl hover:bg-bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Nova Venda Avulsa</h1>
          <p className="text-text-secondary text-sm mt-0.5">Registrar uma venda rápida sem ordem de serviço</p>
        </div>
      </div>

      <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-bg-secondary rounded-2xl p-6 shadow-lg shadow-black/10 space-y-4">
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1 block">Cliente (opcional)</label>
          <input value={form.cliente} onChange={e => setForm(p => ({ ...p, cliente: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-border text-text-primary text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
            placeholder="Nome do cliente" />
        </div>
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1 block">Descrição *</label>
          <input value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-border text-text-primary text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
            placeholder="Ex: Venda de cabo HDMI, Mouse USB..." required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1 block">Valor (R$) *</label>
            <input value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-border text-text-primary text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="0,00" required />
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1 block">Forma de Pagamento</label>
            <select value={form.formaPagamento} onChange={e => setForm(p => ({ ...p, formaPagamento: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-border text-text-primary text-sm focus:ring-2 focus:ring-accent focus:border-transparent">
              {formasPagamento.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1 block">Observações</label>
          <textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-border text-text-primary text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
            rows={3} placeholder="Observações adicionais..." />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
          {saving ? 'Registrando...' : 'Registrar Venda'}
        </button>
      </motion.form>
    </div>
  );
}
