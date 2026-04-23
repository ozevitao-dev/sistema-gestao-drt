'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ClipboardList, CheckCircle, Users, ArrowRight, Loader2,
  Monitor, Plus, ShoppingBag, FileText, Calendar,
  Clock, ChevronLeft, ChevronRight, Trash2, Edit2, X, Save, Activity,
  BarChart3, PieChart as PieIcon
} from 'lucide-react';
import StatusBadge from '@/components/status-badge';
import CountUp from '@/components/count-up';
import dynamic from 'next/dynamic';
import { formatDateTimeBR, todayISO_SP, nowSP } from '@/lib/date-utils';

const WeeklyBarChart = dynamic(() => import('./dashboard-chart').then(m => m.WeeklyBarChart), {
  ssr: false, loading: () => <div className="h-[250px] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
});
const StatusPieChart = dynamic(() => import('./dashboard-chart').then(m => m.StatusPieChart), {
  ssr: false, loading: () => <div className="h-[250px] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
});

interface AgendaItem {
  id: string; titulo: string; descricao?: string; cliente?: string;
  data: string; horario: string; status: string; cor: string;
}

interface DashboardData {
  emAndamento: number; concluidas: number; orcamentosPendentes: number;
  totalClientes: number; osPorStatus: any[]; orcPorStatus: any[];
  weeklyDailyData: any[]; recentes: any[]; agendaSemana: AgendaItem[];
  remotosHojeCount: number; remotosHojeValor: number;
  agendaHojeCount: number; agendaHojePendentes: number;
  agendaHoje: AgendaItem[];
}

const statusAgendaColors: Record<string, string> = {
  pendente: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  confirmado: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  concluido: 'bg-green-500/20 text-green-600 dark:text-green-400',
  cancelado: 'bg-red-500/20 text-red-600 dark:text-red-400',
};
const statusAgendaLabels: Record<string, string> = {
  pendente: 'Pendente', confirmado: 'Confirmado', concluido: 'Concluído', cancelado: 'Cancelado',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);
  const [agendaForm, setAgendaForm] = useState({ titulo: '', descricao: '', cliente: '', data: '', horario: '09:00', status: 'pendente', cor: '#2563eb' });
  const [savingAgenda, setSavingAgenda] = useState(false);
  const [clockStr, setClockStr] = useState('');

  useEffect(() => {
    const tick = () => setClockStr(formatDateTimeBR(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const loadDashboard = () => {
    setLoading(true);
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setAgendaItems(d.agendaSemana ?? []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDashboard(); }, []);

  // Week navigation — use SP timezone via date-utils
  const getWeekDays = () => {
    const now = nowSP();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + weekOffset * 7);
    start.setHours(0, 0, 0, 0);
    const days = [];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      days.push({ date: d, label: dayNames[i] ?? '', dayNum: d.getDate(), iso: `${y}-${m}-${dd}` });
    }
    return days;
  };
  const weekDays = getWeekDays();

  const loadWeekAgenda = (offset: number) => {
    const now = nowSP();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + offset * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    fetch(`/api/agenda?dataInicio=${start.toISOString()}&dataFim=${end.toISOString()}`)
      .then(r => r.json())
      .then(items => setAgendaItems(Array.isArray(items) ? items : []))
      .catch(() => {});
  };

  const handleWeekChange = (dir: number) => {
    const newOffset = weekOffset + dir;
    setWeekOffset(newOffset);
    loadWeekAgenda(newOffset);
  };

  const openNewAgenda = (dateIso?: string) => {
    setEditingItem(null);
    setAgendaForm({ titulo: '', descricao: '', cliente: '', data: dateIso || todayISO_SP(), horario: '09:00', status: 'pendente', cor: '#2563eb' });
    setShowAgendaModal(true);
  };

  const openEditAgenda = (item: AgendaItem) => {
    setEditingItem(item);
    setAgendaForm({
      titulo: item.titulo, descricao: item.descricao || '', cliente: item.cliente || '',
      data: item.data ? new Date(item.data).toISOString().split('T')[0] || '' : '',
      horario: item.horario, status: item.status, cor: item.cor,
    });
    setShowAgendaModal(true);
  };

  const saveAgendaItem = async () => {
    setSavingAgenda(true);
    try {
      const url = editingItem ? `/api/agenda/${editingItem.id}` : '/api/agenda';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(agendaForm) });
      if (res.ok) { setShowAgendaModal(false); loadWeekAgenda(weekOffset); }
    } catch (e) { console.error(e); }
    setSavingAgenda(false);
  };

  const deleteAgendaItem = async (id: string) => {
    if (!confirm('Excluir este item da agenda?')) return;
    await fetch(`/api/agenda/${id}`, { method: 'DELETE' });
    loadWeekAgenda(weekOffset);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  const kpis = [
    { label: 'Agenda Hoje', value: data?.agendaHojePendentes ?? 0, subtitle: `de ${data?.agendaHojeCount ?? 0} compromissos`, icon: Calendar, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'OS em Andamento', value: data?.emAndamento ?? 0, subtitle: `${data?.concluidas ?? 0} concluídas no mês`, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Orçamentos Pendentes', value: data?.orcamentosPendentes ?? 0, subtitle: 'aguardando aprovação', icon: FileText, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Atividade', value: data?.concluidas && (data.concluidas + (data?.emAndamento ?? 0)) > 0 ? Math.round((data.concluidas / (data.concluidas + (data?.emAndamento ?? 0))) * 100) : 0, subtitle: 'conclusão do mês', icon: Activity, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10', suffix: '%' },
  ];

  const todayStr = todayISO_SP();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
            {clockStr && (
              <span className="text-sm font-mono text-text-secondary bg-bg-card px-3 py-1 rounded-lg border border-border">
                <Clock className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5 text-accent" />
                {clockStr}
              </span>
            )}
          </div>
          <p className="text-text-secondary mt-1">Visão geral da assistência técnica</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/orcamentos/novo" className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 transition-all shadow-lg shadow-accent/20">
            <FileText className="w-4 h-4" /> Orçamento
          </Link>
          <Link href="/vendas/nova" className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
            <ShoppingBag className="w-4 h-4" /> Venda
          </Link>
          <Link href="/ordens/nova" className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20">
            <Plus className="w-4 h-4" /> Nova OS
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-bg-secondary rounded-xl p-4 md:p-5 shadow-lg shadow-black/10 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs md:text-sm text-text-secondary">{kpi.label}</span>
              <div className={`p-2 rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`w-4 h-4 md:w-5 md:h-5 ${kpi.color}`} />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-text-primary"><CountUp end={kpi.value} />{(kpi as any).suffix || ''}</p>
            <p className="text-[10px] md:text-xs text-text-secondary mt-1">{kpi.subtitle}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts: OS+Orç semanal | OS por Status | Orçamentos por Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-bg-secondary rounded-xl p-4 md:p-6 shadow-lg shadow-black/10">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-accent" />
            <h2 className="font-semibold text-text-primary text-sm md:text-base">OS e Orçamentos (Semana)</h2>
          </div>
          <div className="h-[220px] md:h-[250px]"><WeeklyBarChart data={data?.weeklyDailyData ?? []} /></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-bg-secondary rounded-xl p-4 md:p-6 shadow-lg shadow-black/10">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-5 h-5 text-accent" />
            <h2 className="font-semibold text-text-primary text-sm md:text-base">OS por Status</h2>
          </div>
          <div className="h-[220px] md:h-[250px]"><StatusPieChart data={data?.osPorStatus ?? []} /></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-bg-secondary rounded-xl p-4 md:p-6 shadow-lg shadow-black/10">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold text-text-primary text-sm md:text-base">Orçamentos por Status</h2>
          </div>
          <div className="h-[220px] md:h-[250px]"><StatusPieChart data={data?.orcPorStatus ?? []} /></div>
        </motion.div>
      </div>

      {/* Main content: Agenda + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Agenda Semanal — 2/3 width */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-bg-secondary rounded-xl p-4 md:p-6 shadow-lg shadow-black/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              <h2 className="font-semibold text-text-primary text-sm md:text-base">Agenda Semanal</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleWeekChange(-1)} className="p-1.5 rounded-lg hover:bg-bg-primary transition-colors"><ChevronLeft className="w-4 h-4 text-text-secondary" /></button>
              <button onClick={() => { setWeekOffset(0); loadWeekAgenda(0); }} className="text-xs text-accent font-medium px-2 py-1 rounded-lg hover:bg-accent/10">Hoje</button>
              <button onClick={() => handleWeekChange(1)} className="p-1.5 rounded-lg hover:bg-bg-primary transition-colors"><ChevronRight className="w-4 h-4 text-text-secondary" /></button>
              <button onClick={() => openNewAgenda()} className="ml-2 p-1.5 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {weekDays.map(day => {
              const dayItems = agendaItems.filter(item => {
                const itemDate = new Date(item.data).toISOString().split('T')[0];
                return itemDate === day.iso;
              });
              const isToday = day.iso === todayStr;
              return (
                <div key={day.iso} className={`rounded-xl p-2 min-h-[140px] border transition-colors ${
                  isToday ? 'border-accent/50 bg-accent/5' : 'border-border bg-bg-primary'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-center">
                      <span className="text-[10px] text-text-secondary block">{day.label}</span>
                      <span className={`text-sm font-bold ${isToday ? 'text-accent' : 'text-text-primary'}`}>{day.dayNum}</span>
                    </div>
                    <button onClick={() => openNewAgenda(day.iso)} className="p-0.5 rounded hover:bg-bg-secondary transition-colors">
                      <Plus className="w-3 h-3 text-text-secondary" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {dayItems.map(item => (
                      <div key={item.id} className="rounded-lg p-1.5 cursor-pointer hover:opacity-80 transition-opacity group"
                        style={{ backgroundColor: item.cor + '20', borderLeft: `3px solid ${item.cor}` }}
                        onClick={() => openEditAgenda(item)}>
                        <p className="text-[10px] font-medium text-text-primary truncate">{item.titulo}</p>
                        <p className="text-[9px] text-text-secondary">{item.horario}</p>
                        {item.cliente && <p className="text-[9px] text-text-secondary truncate">{item.cliente}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Right sidebar — Compromissos de hoje */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-bg-secondary rounded-xl p-4 md:p-6 shadow-lg shadow-black/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              <h2 className="font-semibold text-text-primary text-sm md:text-base">Hoje</h2>
            </div>
            <button onClick={() => openNewAgenda(todayStr)} className="p-1.5 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-2">
            {(data?.agendaHoje ?? []).length === 0 ? (
              <p className="text-text-secondary text-xs text-center py-8">Nenhum compromisso hoje</p>
            ) : (
              (data?.agendaHoje ?? []).map((item: AgendaItem) => (
                <div key={item.id} className="rounded-xl p-3 border border-border bg-bg-primary hover:shadow-md transition-all cursor-pointer"
                  onClick={() => openEditAgenda(item)}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.cor }} />
                    <span className="text-sm font-medium text-text-primary truncate">{item.titulo}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-secondary ml-4">
                    <span>{item.horario}</span>
                    {item.cliente && <span className="truncate">{item.cliente}</span>}
                  </div>
                  <div className="ml-4 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusAgendaColors[item.status] || ''}`}>
                      {statusAgendaLabels[item.status] || item.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* OS Recentes */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-bg-secondary rounded-xl p-4 md:p-6 shadow-lg shadow-black/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-accent" />
            <h2 className="font-semibold text-text-primary text-sm md:text-base">OS Recentes</h2>
          </div>
          <Link href="/ordens" className="text-accent text-xs hover:underline flex items-center gap-1">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {(data?.recentes ?? []).length === 0 && <p className="text-text-secondary text-xs text-center py-6 col-span-2">Nenhuma OS cadastrada</p>}
          {(data?.recentes ?? []).slice(0, 6).map((os: any) => (
            <Link key={os?.id} href={`/ordens/${os?.id ?? ''}`}
              className="flex items-center justify-between p-3 rounded-xl bg-bg-primary hover:bg-border/30 transition-all group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Monitor className="w-4 h-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">OS #{os?.numero} - {os?.cliente?.nome ?? ''}</p>
                  <p className="text-[10px] text-text-secondary truncate">{os?.marca ?? ''} {os?.modelo ?? ''}</p>
                </div>
              </div>
              <StatusBadge status={os?.status ?? 'aberta'} />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Agenda Modal */}
      {showAgendaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowAgendaModal(false)}>
          <div className="bg-bg-secondary rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary">{editingItem ? 'Editar' : 'Novo'} Item da Agenda</h3>
              <button onClick={() => setShowAgendaModal(false)} className="p-1 rounded-lg hover:bg-bg-primary"><X className="w-5 h-5 text-text-secondary" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Título *</label>
                <input value={agendaForm.titulo} onChange={e => setAgendaForm(p => ({ ...p, titulo: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-bg-primary border border-border text-text-primary text-sm focus:ring-2 focus:ring-accent focus:border-transparent" placeholder="Ex: Manutenção PC" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Cliente</label>
                <input value={agendaForm.cliente} onChange={e => setAgendaForm(p => ({ ...p, cliente: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-bg-primary border border-border text-text-primary text-sm focus:ring-2 focus:ring-accent focus:border-transparent" placeholder="Nome do cliente" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Descrição</label>
                <textarea value={agendaForm.descricao} onChange={e => setAgendaForm(p => ({ ...p, descricao: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-bg-primary border border-border text-text-primary text-sm focus:ring-2 focus:ring-accent focus:border-transparent" rows={2} placeholder="Detalhes do atendimento" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Data *</label>
                  <input type="date" value={agendaForm.data} onChange={e => setAgendaForm(p => ({ ...p, data: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-bg-primary border border-border text-text-primary text-sm focus:ring-2 focus:ring-accent focus:border-transparent" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Horário</label>
                  <input type="time" value={agendaForm.horario} onChange={e => setAgendaForm(p => ({ ...p, horario: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-bg-primary border border-border text-text-primary text-sm focus:ring-2 focus:ring-accent focus:border-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Status</label>
                  <select value={agendaForm.status} onChange={e => setAgendaForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-bg-primary border border-border text-text-primary text-sm focus:ring-2 focus:ring-accent focus:border-transparent">
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Cor</label>
                  <input type="color" value={agendaForm.cor} onChange={e => setAgendaForm(p => ({ ...p, cor: e.target.value }))}
                    className="w-full h-[38px] rounded-xl bg-bg-primary border border-border cursor-pointer" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-5">
              {editingItem ? (
                <button onClick={() => { deleteAgendaItem(editingItem.id); setShowAgendaModal(false); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-4 h-4" /> Excluir
                </button>
              ) : <div />}
              <div className="flex gap-2">
                <button onClick={() => setShowAgendaModal(false)} className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-bg-primary transition-colors">Cancelar</button>
                <button onClick={saveAgendaItem} disabled={savingAgenda || !agendaForm.titulo || !agendaForm.data}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50">
                  {savingAgenda ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
