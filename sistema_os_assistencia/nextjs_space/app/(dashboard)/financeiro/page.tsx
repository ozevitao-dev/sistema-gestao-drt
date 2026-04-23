'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, Wallet, AlertCircle, Plus, Trash2, Edit2,
  Loader2, Search, Filter, Calendar, Users, ArrowUpCircle, ArrowDownCircle, Save, X, FileText
} from 'lucide-react';
import Modal from '@/components/modal';

const paymentLabels: Record<string, string> = {
  dinheiro: 'Dinheiro', pix: 'PIX', cartao_debito: 'Cartão Débito',
  cartao_credito: 'Cartão Crédito', transferencia: 'Transferência', boleto: 'Boleto',
};
const statusLabels: Record<string, string> = { pago: 'Pago', parcial: 'Parcial', pendente: 'Pendente' };
const statusColors: Record<string, string> = {
  pago: 'bg-green-500/20 text-green-600', parcial: 'bg-yellow-500/20 text-amber-500', pendente: 'bg-red-500/20 text-red-500',
};
const categoriaLabels: Record<string, string> = {
  servico: 'Serviço', peca: 'Peça', aluguel: 'Aluguel', luz: 'Luz/Energia', internet: 'Internet',
  material: 'Material', transporte: 'Transporte', alimentacao: 'Alimentação', pro_labore: 'Pró-labore',
  imposto: 'Imposto', manutencao: 'Manutenção', outro: 'Outro', despesa: 'Despesa', venda: 'Venda', remoto: 'Atend. Remoto',
};

function fmtMoney(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('pt-BR'); }
function today() { return new Date().toISOString().split('T')[0]; }
function startOfWeek() {
  const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split('T')[0];
}
function startOfMonth() {
  const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
}

type Tab = 'dashboard' | 'lancamentos' | 'despesa' | 'receita' | 'prolabore';

export default function FinanceiroPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [resumo, setResumo] = useState<any>(null);
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes');
  const [dataInicio, setDataInicio] = useState(startOfMonth());
  const [dataFim, setDataFim] = useState(today());
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  // Despesa form
  const [showDespesa, setShowDespesa] = useState(false);
  const [despesaForm, setDespesaForm] = useState({
    categoria: 'despesa', descricao: '', valor: '', data: today(),
    formaPagamento: 'pix', statusPagamento: 'pago', observacoes: '',
  });
  const [savingDespesa, setSavingDespesa] = useState(false);

  // Receita form
  const [showReceita, setShowReceita] = useState(false);
  const [receitaForm, setReceitaForm] = useState({
    categoria: 'servico', descricao: '', valor: '', data: today(),
    formaPagamento: 'pix', statusPagamento: 'pago', observacoes: '',
  });
  const [savingReceita, setSavingReceita] = useState(false);

  // Caixa semanal
  const [showAbrirCaixa, setShowAbrirCaixa] = useState(false);
  const [caixaValor, setCaixaValor] = useState('');
  const [savingCaixa, setSavingCaixa] = useState(false);

  // Edit modal
  const [editItem, setEditItem] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Pro-labore
  const [socios, setSocios] = useState<any[]>([]);
  const [showRetirada, setShowRetirada] = useState<any>(null);
  const [retiradaForm, setRetiradaForm] = useState({ valor: '', data: today(), observacoes: '' });
  const [savingRetirada, setSavingRetirada] = useState(false);
  const [editConfig, setEditConfig] = useState<any>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  const applyPeriodo = useCallback((p: string) => {
    setPeriodo(p);
    const t = today();
    if (p === 'hoje') { setDataInicio(t); setDataFim(t); }
    else if (p === 'semana') { setDataInicio(startOfWeek()); setDataFim(t); }
    else if (p === 'mes') { setDataInicio(startOfMonth()); setDataFim(t); }
  }, []);

  const fetchResumo = useCallback(async () => {
    try {
      const r = await fetch(`/api/financeiro/resumo?dataInicio=${dataInicio}&dataFim=${dataFim}`);
      if (r.ok) setResumo(await r.json());
    } catch {}
  }, [dataInicio, dataFim]);

  const fetchLancamentos = useCallback(async () => {
    try {
      let url = `/api/financeiro?dataInicio=${dataInicio}&dataFim=${dataFim}&limit=200`;
      if (filtroTipo) url += `&tipo=${filtroTipo}`;
      if (filtroStatus) url += `&status=${filtroStatus}`;
      const r = await fetch(url);
      if (r.ok) { const d = await r.json(); setLancamentos(d.lancamentos); setTotal(d.total); }
    } catch {}
  }, [dataInicio, dataFim, filtroTipo, filtroStatus]);

  const fetchProLabore = useCallback(async () => {
    try {
      const r = await fetch(`/api/financeiro/pro-labore?dataInicio=${dataInicio}&dataFim=${dataFim}`);
      if (r.ok) { const d = await r.json(); setSocios(d.socios); }
    } catch {}
  }, [dataInicio, dataFim]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchResumo(), fetchLancamentos(), fetchProLabore()]);
    setLoading(false);
  }, [fetchResumo, fetchLancamentos, fetchProLabore]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Init pro-labore configs if empty
  useEffect(() => {
    if (socios.length === 0 && !loading) {
      const initSocios = async () => {
        for (const nome of ['VITORDRT', 'DIEGODRT']) {
          await fetch('/api/financeiro/pro-labore', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'config', nomeSocio: nome, valorFixo: 0, percentualLucro: 50 }),
          });
        }
        fetchProLabore();
      };
      initSocios();
    }
  }, [socios.length, loading, fetchProLabore]);

  const handleSaveDespesa = async () => {
    if (!despesaForm.descricao || !despesaForm.valor) return;
    setSavingDespesa(true);
    try {
      const r = await fetch('/api/financeiro', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'saida', ...despesaForm, valor: parseFloat(despesaForm.valor) }),
      });
      if (r.ok) {
        setShowDespesa(false);
        setDespesaForm({ categoria: 'despesa', descricao: '', valor: '', data: today(), formaPagamento: 'pix', statusPagamento: 'pago', observacoes: '' });
        loadAll();
      }
    } catch {}
    setSavingDespesa(false);
  };

  const handleSaveReceita = async () => {
    if (!receitaForm.descricao || !receitaForm.valor) return;
    setSavingReceita(true);
    try {
      const r = await fetch('/api/financeiro', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'entrada', ...receitaForm, valor: parseFloat(receitaForm.valor) }),
      });
      if (r.ok) {
        setShowReceita(false);
        setReceitaForm({ categoria: 'servico', descricao: '', valor: '', data: today(), formaPagamento: 'pix', statusPagamento: 'pago', observacoes: '' });
        loadAll();
      }
    } catch {}
    setSavingReceita(false);
  };

  const [exportingVendaId, setExportingVendaId] = useState<string | null>(null);

  const handleExportVenda = async (id: string) => {
    setExportingVendaId(id);
    try {
      const res = await fetch(`/api/vendas/${id}/export`);
      if (!res.ok) throw new Error('Erro ao gerar PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `recibo-venda-${id}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); alert('Erro ao exportar PDF'); }
    setExportingVendaId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este lançamento?')) return;
    await fetch(`/api/financeiro/${id}`, { method: 'DELETE' });
    loadAll();
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    setSavingEdit(true);
    try {
      await fetch(`/api/financeiro/${editItem.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao: editItem.descricao, valor: parseFloat(editItem.valor), categoria: editItem.categoria,
          formaPagamento: editItem.formaPagamento, statusPagamento: editItem.statusPagamento,
          valorPago: editItem.statusPagamento === 'parcial' ? parseFloat(editItem.valorPago || '0') : editItem.statusPagamento === 'pago' ? parseFloat(editItem.valor) : 0,
          observacoes: editItem.observacoes, data: editItem.data,
        }),
      });
      setEditItem(null); loadAll();
    } catch {}
    setSavingEdit(false);
  };

  const handleRetirada = async () => {
    if (!showRetirada || !retiradaForm.valor) return;
    setSavingRetirada(true);
    try {
      await fetch('/api/financeiro/pro-labore', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retirada', socioId: showRetirada.id, nomeSocio: showRetirada.nomeSocio, ...retiradaForm, valor: parseFloat(retiradaForm.valor) }),
      });
      setShowRetirada(null); setRetiradaForm({ valor: '', data: today(), observacoes: '' }); loadAll();
    } catch {}
    setSavingRetirada(false);
  };

  const handleSaveConfig = async () => {
    if (!editConfig) return;
    setSavingConfig(true);
    try {
      await fetch('/api/financeiro/pro-labore', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'config', nomeSocio: editConfig.nomeSocio, valorFixo: parseFloat(editConfig.valorFixo || '0'), percentualLucro: parseFloat(editConfig.percentualLucro || '0') }),
      });
      setEditConfig(null); fetchProLabore();
    } catch {}
    setSavingConfig(false);
  };

  const handleAbrirCaixa = async () => {
    if (!caixaValor) return;
    setSavingCaixa(true);
    try {
      const r = await fetch('/api/financeiro/caixa', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valorInicial: parseFloat(caixaValor) }),
      });
      if (r.ok) { setShowAbrirCaixa(false); setCaixaValor(''); loadAll(); }
    } catch {}
    setSavingCaixa(false);
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Resumo', icon: Wallet },
    { id: 'lancamentos', label: 'Lançamentos', icon: DollarSign },
    { id: 'receita', label: 'Nova Receita', icon: ArrowUpCircle },
    { id: 'despesa', label: 'Nova Despesa', icon: ArrowDownCircle },
    { id: 'prolabore', label: 'Pró-labore', icon: Users },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-accent" /> Financeiro
        </h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAbrirCaixa(true)}
            className="px-3 py-2 bg-accent text-white rounded-lg text-xs md:text-sm font-medium flex items-center gap-1.5 hover:bg-accent/90">
            <Wallet className="w-4 h-4" /> <span className="hidden sm:inline">Abrir</span> Caixa
          </button>
          <button onClick={() => { setShowReceita(true); setTab('receita'); }}
            className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs md:text-sm font-medium flex items-center gap-1.5 hover:bg-green-700">
            <Plus className="w-4 h-4" /> Receita
          </button>
          <button onClick={() => { setShowDespesa(true); setTab('despesa'); }}
            className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs md:text-sm font-medium flex items-center gap-1.5 hover:bg-red-700">
            <Plus className="w-4 h-4" /> Despesa
          </button>
        </div>
      </div>

      {/* Period filters */}
      <div className="bg-bg-secondary rounded-xl p-4 border border-border mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Calendar className="w-4 h-4 text-text-secondary" />
          {['hoje', 'semana', 'mes'].map(p => (
            <button key={p} onClick={() => applyPeriodo(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${periodo === p && periodo !== 'custom' ? 'bg-accent text-white' : 'bg-bg-primary text-text-secondary hover:text-text-primary'}`}>
              {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Semana' : 'Mês'}
            </button>
          ))}
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={dataInicio} onChange={e => { setDataInicio(e.target.value); setPeriodo('custom'); }}
              className="px-2 py-1.5 rounded-lg border border-border bg-bg-primary text-text-primary text-xs" />
            <span className="text-text-secondary text-xs">até</span>
            <input type="date" value={dataFim} onChange={e => { setDataFim(e.target.value); setPeriodo('custom'); }}
              className="px-2 py-1.5 rounded-lg border border-border bg-bg-primary text-text-primary text-xs" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-bg-secondary rounded-xl p-1 border border-border">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'despesa') setShowDespesa(true); if (t.id === 'receita') setShowReceita(true); }}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${tab === t.id ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
      ) : (
        <>
          {/* Dashboard */}
          {tab === 'dashboard' && resumo && (
            <div className="space-y-4">
              {/* Weekly Cash Summary */}
              <div className="bg-accent/5 rounded-xl p-4 border border-accent/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-accent flex items-center gap-2">
                    <Wallet className="w-4 h-4" /> Resumo Semanal
                  </h3>
                  {resumo.caixaSemanal && (
                    <span className="text-[10px] text-text-secondary">
                      Caixa aberto em {new Date(resumo.caixaSemanal.dataAbertura).toLocaleDateString('pt-BR')} às {new Date(resumo.caixaSemanal.dataAbertura).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: 'Caixa Inicial', value: resumo.caixaInicial, color: 'text-accent' },
                    { label: 'Faturamento', value: resumo.faturamentoSemanal, color: 'text-green-600' },
                    { label: 'Entradas', value: resumo.entradasSemana, color: 'text-green-600' },
                    { label: 'Saídas', value: resumo.saidasSemana, color: 'text-red-400' },
                    { label: 'Saldo Atual', value: resumo.saldoAtual, color: resumo.saldoAtual >= 0 ? 'text-green-600' : 'text-red-400' },
                  ].map((c, i) => (
                    <div key={i} className="bg-bg-secondary rounded-lg p-3 border border-border">
                      <span className="text-[10px] text-text-secondary block">{c.label}</span>
                      <p className={`text-base font-bold ${c.color}`}>{fmtMoney(c.value)}</p>
                    </div>
                  ))}
                </div>
                {!resumo.caixaSemanal && (
                  <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Nenhum caixa aberto. Clique em &quot;Abrir Caixa Semanal&quot; para iniciar.
                  </p>
                )}
              </div>

              {/* Period Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Entradas (período)', value: resumo.totalEntradas, icon: ArrowUpCircle, color: 'text-green-600', bg: 'bg-green-500/10' },
                  { label: 'Saídas (período)', value: resumo.totalSaidas, icon: ArrowDownCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
                  { label: 'Saldo (período)', value: resumo.saldo, icon: Wallet, color: resumo.saldo >= 0 ? 'text-green-600' : 'text-red-400', bg: 'bg-blue-500/10' },
                  { label: 'Capital em Caixa', value: resumo.capitalEmCaixa, icon: DollarSign, color: 'text-accent', bg: 'bg-accent/10' },
                ].map((c, i) => (
                  <div key={i} className={`${c.bg} rounded-xl p-4 border border-border`}>
                    <div className="flex items-center gap-2 mb-2">
                      <c.icon className={`w-4 h-4 ${c.color}`} />
                      <span className="text-xs text-text-secondary">{c.label}</span>
                    </div>
                    <p className={`text-lg font-bold ${c.color}`}>{fmtMoney(c.value)}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Recebido', value: resumo.entradasPagas, color: 'text-green-600' },
                  { label: 'A Receber', value: resumo.entradasPendentes, color: 'text-amber-500' },
                  { label: 'Pró-labore Total', value: resumo.totalProLabore, color: 'text-purple-400' },
                ].map((c, i) => (
                  <div key={i} className="bg-bg-secondary rounded-xl p-4 border border-border">
                    <span className="text-xs text-text-secondary">{c.label}</span>
                    <p className={`text-lg font-bold ${c.color}`}>{fmtMoney(c.value)}</p>
                  </div>
                ))}
              </div>

              {/* Recent transactions */}
              <div className="bg-bg-secondary rounded-xl p-4 border border-border">
                <h3 className="text-sm font-bold text-text-primary mb-3">Últimos Lançamentos</h3>
                <div className="space-y-2">
                  {lancamentos.slice(0, 10).map(l => (
                    <div key={l.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        {l.tipo === 'entrada' ? <ArrowUpCircle className="w-4 h-4 text-green-600" /> : <ArrowDownCircle className="w-4 h-4 text-red-400" />}
                        <div>
                          <p className="text-sm text-text-primary">{l.descricao}</p>
                          <p className="text-xs text-text-secondary">{fmtDate(l.data)} • {categoriaLabels[l.categoria] || l.categoria}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${l.tipo === 'entrada' ? 'text-green-600' : 'text-red-400'}`}>
                          {l.tipo === 'entrada' ? '+' : '-'}{fmtMoney(l.valor)}
                        </p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColors[l.statusPagamento]}`}>
                          {statusLabels[l.statusPagamento]}
                        </span>
                      </div>
                    </div>
                  ))}
                  {lancamentos.length === 0 && <p className="text-sm text-text-secondary text-center py-4">Nenhum lançamento no período</p>}
                </div>
              </div>
            </div>
          )}

          {/* Lançamentos list */}
          {tab === 'lancamentos' && (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-bg-secondary text-text-primary text-xs">
                  <option value="">Todos os tipos</option>
                  <option value="entrada">Entradas</option>
                  <option value="saida">Saídas</option>
                </select>
                <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-bg-secondary text-text-primary text-xs">
                  <option value="">Todos os status</option>
                  <option value="pago">Pago</option>
                  <option value="parcial">Parcial</option>
                  <option value="pendente">Pendente</option>
                </select>
                <span className="text-xs text-text-secondary self-center ml-auto">{total} lançamento(s)</span>
              </div>
              <div className="bg-bg-secondary rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-bg-primary">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs text-text-secondary font-medium">Data</th>
                        <th className="text-left px-4 py-2 text-xs text-text-secondary font-medium">Tipo</th>
                        <th className="text-left px-4 py-2 text-xs text-text-secondary font-medium">Descrição</th>
                        <th className="text-left px-4 py-2 text-xs text-text-secondary font-medium">Categoria</th>
                        <th className="text-left px-4 py-2 text-xs text-text-secondary font-medium">Pagamento</th>
                        <th className="text-right px-4 py-2 text-xs text-text-secondary font-medium">Valor</th>
                        <th className="text-center px-4 py-2 text-xs text-text-secondary font-medium">Status</th>
                        <th className="text-center px-4 py-2 text-xs text-text-secondary font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lancamentos.map(l => (
                        <tr key={l.id} className="border-t border-border hover:bg-bg-primary/50">
                          <td className="px-4 py-2 text-xs text-text-primary">{fmtDate(l.data)}</td>
                          <td className="px-4 py-2">
                            {l.tipo === 'entrada' ? <span className="text-xs text-green-600 font-medium">Entrada</span> : <span className="text-xs text-red-400 font-medium">Saída</span>}
                          </td>
                          <td className="px-4 py-2 text-xs text-text-primary max-w-[200px] truncate">{l.descricao}
                            {l.ordemServico && <span className="text-text-secondary"> (OS #{l.ordemServico.numero})</span>}
                          </td>
                          <td className="px-4 py-2 text-xs text-text-secondary">{categoriaLabels[l.categoria] || l.categoria}</td>
                          <td className="px-4 py-2 text-xs text-text-secondary">{paymentLabels[l.formaPagamento] || l.formaPagamento || '-'}</td>
                          <td className={`px-4 py-2 text-xs font-bold text-right ${l.tipo === 'entrada' ? 'text-green-600' : 'text-red-400'}`}>
                            {l.tipo === 'entrada' ? '+' : '-'}{fmtMoney(l.valor)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColors[l.statusPagamento]}`}>
                              {statusLabels[l.statusPagamento]}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {l.categoria === 'venda' && (
                                <button onClick={() => handleExportVenda(l.id)} disabled={exportingVendaId === l.id} title="Recibo PDF"
                                  className="p-1 hover:bg-accent/10 rounded text-accent disabled:opacity-50">
                                  {exportingVendaId === l.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                                </button>
                              )}
                              <button onClick={() => setEditItem({ ...l, valor: String(l.valor), valorPago: String(l.valorPago || 0), data: l.data.split('T')[0] })}
                                className="p-1 hover:bg-bg-primary rounded text-text-secondary hover:text-accent"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete(l.id)}
                                className="p-1 hover:bg-bg-primary rounded text-text-secondary hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {lancamentos.length === 0 && (
                        <tr><td colSpan={8} className="text-center py-8 text-text-secondary text-sm">Nenhum lançamento encontrado</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Pró-labore */}
          {tab === 'prolabore' && (
            <div className="space-y-4">
              {socios.map(s => (
                <div key={s.id} className="bg-bg-secondary rounded-xl p-5 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Users className="w-5 h-5 text-accent" /> {s.nomeSocio}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1">
                        Fixo: {fmtMoney(s.valorFixo)} • Lucro: {s.percentualLucro}%
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditConfig({ ...s, valorFixo: String(s.valorFixo), percentualLucro: String(s.percentualLucro) })}
                        className="px-3 py-1.5 bg-bg-primary text-text-secondary rounded-lg text-xs hover:text-accent flex items-center gap-1">
                        <Edit2 className="w-3 h-3" /> Config
                      </button>
                      <button onClick={() => { setShowRetirada(s); setRetiradaForm({ valor: '', data: today(), observacoes: '' }); }}
                        className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Retirada
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-bg-primary rounded-lg p-3">
                      <span className="text-xs text-text-secondary">Total Retirado (período)</span>
                      <p className="text-lg font-bold text-purple-400">{fmtMoney(s.totalRetirado)}</p>
                    </div>
                    <div className="bg-bg-primary rounded-lg p-3">
                      <span className="text-xs text-text-secondary">Direito s/ Faturamento Semanal</span>
                      <p className="text-lg font-bold text-accent">
                        {resumo ? fmtMoney((resumo.faturamentoSemanal * s.percentualLucro) / 100) : '-'}
                      </p>
                    </div>
                  </div>
                  {s.retiradas && s.retiradas.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-text-secondary mb-2">Histórico de Retiradas</h4>
                      <div className="space-y-1">
                        {s.retiradas.map((r: any) => (
                          <div key={r.id} className="flex justify-between items-center py-1.5 px-2 bg-bg-primary rounded text-xs">
                            <span className="text-text-primary">{fmtDate(r.data)} - {r.observacoes || 'Retirada'}</span>
                            <span className="text-red-400 font-bold">{fmtMoney(r.valor)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {socios.length === 0 && <p className="text-center text-text-secondary py-8">Configurando sócios...</p>}
            </div>
          )}
        </>
      )}

      {/* Nova Despesa Modal */}
      <Modal open={showDespesa} onClose={() => setShowDespesa(false)} title="Nova Despesa (Saída)">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-secondary block mb-1">Descrição *</label>
            <input value={despesaForm.descricao} onChange={e => setDespesaForm(p => ({ ...p, descricao: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" placeholder="Ex: Conta de luz" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary block mb-1">Categoria</label>
              <select value={despesaForm.categoria} onChange={e => setDespesaForm(p => ({ ...p, categoria: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm">
                {Object.entries(categoriaLabels).filter(([k]) => k !== 'servico' && k !== 'pro_labore').map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Valor (R$) *</label>
              <input type="number" step="0.01" value={despesaForm.valor} onChange={e => setDespesaForm(p => ({ ...p, valor: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary block mb-1">Forma de Pagamento</label>
              <select value={despesaForm.formaPagamento} onChange={e => setDespesaForm(p => ({ ...p, formaPagamento: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm">
                <option value="pix">PIX</option><option value="dinheiro">Dinheiro</option>
                <option value="cartao_debito">Cartão Débito</option><option value="cartao_credito">Cartão Crédito</option>
                <option value="transferencia">Transferência</option><option value="boleto">Boleto</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Data</label>
              <input type="date" value={despesaForm.data} onChange={e => setDespesaForm(p => ({ ...p, data: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Observações</label>
            <textarea value={despesaForm.observacoes} onChange={e => setDespesaForm(p => ({ ...p, observacoes: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm min-h-[50px]" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowDespesa(false)} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-primary">Cancelar</button>
            <button onClick={handleSaveDespesa} disabled={savingDespesa || !despesaForm.descricao || !despesaForm.valor}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              {savingDespesa ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownCircle className="w-4 h-4" />} Registrar Saída
            </button>
          </div>
        </div>
      </Modal>

      {/* Nova Receita Modal */}
      <Modal open={showReceita} onClose={() => setShowReceita(false)} title="Nova Receita (Entrada)">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-secondary block mb-1">Descrição *</label>
            <input value={receitaForm.descricao} onChange={e => setReceitaForm(p => ({ ...p, descricao: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" placeholder="Ex: Venda de peça, Serviço avulso" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary block mb-1">Categoria</label>
              <select value={receitaForm.categoria} onChange={e => setReceitaForm(p => ({ ...p, categoria: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm">
                <option value="servico">Serviço</option>
                <option value="peca">Venda de Peça</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Valor (R$) *</label>
              <input type="number" step="0.01" value={receitaForm.valor} onChange={e => setReceitaForm(p => ({ ...p, valor: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary block mb-1">Forma de Pagamento</label>
              <select value={receitaForm.formaPagamento} onChange={e => setReceitaForm(p => ({ ...p, formaPagamento: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm">
                <option value="pix">PIX</option><option value="dinheiro">Dinheiro</option>
                <option value="cartao_debito">Cartão Débito</option><option value="cartao_credito">Cartão Crédito</option>
                <option value="transferencia">Transferência</option><option value="boleto">Boleto</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Data</label>
              <input type="date" value={receitaForm.data} onChange={e => setReceitaForm(p => ({ ...p, data: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary block mb-1">Status</label>
              <select value={receitaForm.statusPagamento} onChange={e => setReceitaForm(p => ({ ...p, statusPagamento: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm">
                <option value="pago">Pago</option><option value="parcial">Parcial</option><option value="pendente">Pendente</option>
              </select>
            </div>
            <div />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Observações</label>
            <textarea value={receitaForm.observacoes} onChange={e => setReceitaForm(p => ({ ...p, observacoes: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm min-h-[50px]" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowReceita(false)} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-primary">Cancelar</button>
            <button onClick={handleSaveReceita} disabled={savingReceita || !receitaForm.descricao || !receitaForm.valor}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              {savingReceita ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpCircle className="w-4 h-4" />} Registrar Entrada
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Editar Lançamento">
        {editItem && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-text-secondary block mb-1">Descrição</label>
              <input value={editItem.descricao} onChange={e => setEditItem((p: any) => ({ ...p, descricao: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary block mb-1">Valor (R$)</label>
                <input type="number" step="0.01" value={editItem.valor} onChange={e => setEditItem((p: any) => ({ ...p, valor: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">Data</label>
                <input type="date" value={editItem.data} onChange={e => setEditItem((p: any) => ({ ...p, data: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary block mb-1">Status</label>
                <select value={editItem.statusPagamento} onChange={e => setEditItem((p: any) => ({ ...p, statusPagamento: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm">
                  <option value="pago">Pago</option><option value="parcial">Parcial</option><option value="pendente">Pendente</option>
                </select>
              </div>
            </div>
            {editItem.statusPagamento === 'parcial' && (
              <div>
                <label className="text-xs text-text-secondary block mb-1">Valor Pago (R$)</label>
                <input type="number" step="0.01" value={editItem.valorPago} onChange={e => setEditItem((p: any) => ({ ...p, valorPago: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" />
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditItem(null)} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-primary">Cancelar</button>
              <button onClick={handleSaveEdit} disabled={savingEdit}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Retirada Modal */}
      <Modal open={!!showRetirada} onClose={() => setShowRetirada(null)} title={`Retirada - ${showRetirada?.nomeSocio || ''}`}>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-secondary block mb-1">Valor (R$) *</label>
            <input type="number" step="0.01" value={retiradaForm.valor} onChange={e => setRetiradaForm(p => ({ ...p, valor: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Data</label>
            <input type="date" value={retiradaForm.data} onChange={e => setRetiradaForm(p => ({ ...p, data: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Observações</label>
            <input value={retiradaForm.observacoes} onChange={e => setRetiradaForm(p => ({ ...p, observacoes: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" placeholder="Motivo da retirada" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowRetirada(null)} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-primary">Cancelar</button>
            <button onClick={handleRetirada} disabled={savingRetirada || !retiradaForm.valor}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              {savingRetirada ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />} Registrar
            </button>
          </div>
        </div>
      </Modal>

      {/* Abrir Caixa Semanal Modal */}
      <Modal open={showAbrirCaixa} onClose={() => setShowAbrirCaixa(false)} title="Abrir Caixa Semanal">
        <div className="space-y-3">
          <p className="text-xs text-text-secondary">Informe o valor disponível em caixa para esta semana. O caixa anterior será encerrado.</p>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Valor Inicial do Caixa (R$) *</label>
            <input type="number" step="0.01" value={caixaValor} onChange={e => setCaixaValor(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" placeholder="0.00" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAbrirCaixa(false)} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-primary">Cancelar</button>
            <button onClick={handleAbrirCaixa} disabled={savingCaixa || !caixaValor}
              className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              {savingCaixa ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />} Abrir Caixa
            </button>
          </div>
        </div>
      </Modal>

      {/* Config Modal */}
      <Modal open={!!editConfig} onClose={() => setEditConfig(null)} title={`Configurar - ${editConfig?.nomeSocio || ''}`}>
        {editConfig && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-text-secondary block mb-1">Valor Fixo Mensal (R$)</label>
              <input type="number" step="0.01" value={editConfig.valorFixo} onChange={e => setEditConfig((p: any) => ({ ...p, valorFixo: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Percentual do Lucro (%)</label>
              <input type="number" step="0.1" value={editConfig.percentualLucro} onChange={e => setEditConfig((p: any) => ({ ...p, percentualLucro: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditConfig(null)} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-primary">Cancelar</button>
              <button onClick={handleSaveConfig} disabled={savingConfig}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                {savingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
