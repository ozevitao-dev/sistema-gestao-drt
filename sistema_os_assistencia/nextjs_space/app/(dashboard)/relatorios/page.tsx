'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BarChart3, Filter, Loader2, DollarSign, Clock, CheckCircle,
  TrendingUp, TrendingDown, FileText, Search, Download, FileSpreadsheet
} from 'lucide-react';
import StatusBadge from '@/components/status-badge';
import CountUp from '@/components/count-up';
import { exportToCSV, exportListToPDF, Column } from '@/lib/list-export';

const statusLabels: Record<string, string> = {
  aberta: 'Aberta', em_andamento: 'Em Andamento', aguardando_peca: 'Aguardando Peça',
  concluida: 'Concluída', cancelada: 'Cancelada',
};

const exportColumns: Column[] = [
  { key: 'numero', label: 'Nº OS' },
  { key: 'cliente.nome', label: 'Cliente' },
  { key: 'tecnico.name', label: 'Técnico' },
  { key: 'status', label: 'Status', format: v => statusLabels[v] || v },
  { key: 'valorTotal', label: 'Valor (R$)', format: v => (v ?? 0).toFixed(2).replace('.', ',') },
  { key: 'formaPagamento', label: 'Pagamento' },
  { key: 'createdAt', label: 'Data', format: v => v ? new Date(v).toLocaleDateString('pt-BR') : '' },
  { key: 'dataPagamento', label: 'Data Pgto', format: v => v ? new Date(v).toLocaleDateString('pt-BR') : '' },
];

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [activeTab, setActiveTab] = useState<'abertas' | 'pagas'>('abertas');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tipo: 'financeiro' });
      if (dataInicio) params.set('dataInicio', dataInicio);
      if (dataFim) params.set('dataFim', dataFim);
      const res = await fetch(`/api/relatorios?${params.toString()}`);
      const d = await res.json();
      setData(d);
    } catch (e: any) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const osList = activeTab === 'abertas' ? (data?.osAbertas ?? []) : (data?.osPagas ?? []);
  const allOS = [...(data?.osAbertas ?? []), ...(data?.osPagas ?? [])];

  const periodoLabel = () => {
    const parts: string[] = [];
    if (dataInicio) parts.push(`de ${new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')}`);
    if (dataFim) parts.push(`até ${new Date(dataFim + 'T12:00:00').toLocaleDateString('pt-BR')}`);
    return parts.length > 0 ? ` (${parts.join(' ')})` : '';
  };

  const handleExportCSV = (mode: 'tab' | 'all') => {
    const list = mode === 'tab' ? osList : allOS;
    const label = mode === 'tab' ? (activeTab === 'abertas' ? 'OS_Abertas' : 'OS_Pagas') : 'Relatorio_Financeiro';
    exportToCSV(list, exportColumns, label);
  };

  const handleExportPDF = (mode: 'tab' | 'all') => {
    if (mode === 'tab') {
      const label = activeTab === 'abertas' ? 'OS em Aberto' : 'OS Pagas';
      const title = `${label}${periodoLabel()}`;
      const filename = activeTab === 'abertas' ? 'OS_Abertas' : 'OS_Pagas';
      exportListToPDF(title, osList, exportColumns, filename);
      return;
    }
    // Full financial report with summary
    const fmtM = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
    const totalAberto = data?.totalAberto ?? 0;
    const totalPago = data?.totalPago ?? 0;
    const countAberto = data?.countAberto ?? 0;
    const countPago = data?.countPago ?? 0;
    const totalGeral = totalAberto + totalPago;
    const ticketMedio = countPago > 0 ? totalPago / countPago : 0;

    const thStyle = 'padding:8px 12px;text-align:left;font-size:11px;font-weight:700;border-bottom:2px solid #2563eb;background:#f1f5f9;color:#1e293b;white-space:nowrap;';
    const tdStyle = 'padding:6px 12px;font-size:11px;border-bottom:1px solid #e2e8f0;color:#334155;';
    const buildTable = (rows: any[]) => {
      const headerRow = exportColumns.map(c => `<th style="${thStyle}">${c.label}</th>`).join('');
      const bodyRows = rows.map((row: any, i: number) => {
        const bg = i % 2 === 0 ? '' : 'background:#f8fafc;';
        const cells = exportColumns.map(c => {
          const raw = c.key.split('.').reduce((o: any, k: string) => o?.[k], row);
          const val = c.format ? c.format(raw, row) : (raw ?? '');
          return `<td style="${tdStyle}${bg}">${String(val).replace(/&/g,'&amp;').replace(/</g,'&lt;')}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<table style="width:100%;border-collapse:collapse;"><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    };

    const title = `Relatório Financeiro${periodoLabel()}`;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>@page{size:A4 landscape;margin:15mm;}body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:20px;}table{width:100%;border-collapse:collapse;}@media print{button{display:none!important;}}</style>
</head><body>
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
  <div><h1 style="font-size:18px;margin:0;color:#1e293b;">${title}</h1>
  <p style="font-size:11px;color:#64748b;margin:4px 0 0;">Exportado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</p></div>
  <button onclick="window.print();" style="padding:8px 20px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;">Imprimir / Salvar PDF</button>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:20px;">
  <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;"><div style="font-size:10px;color:#92400e;font-weight:600;">EM ABERTO</div><div style="font-size:20px;font-weight:800;color:#d97706;">${fmtM(totalAberto)}</div><div style="font-size:10px;color:#92400e;">${countAberto} OS</div></div>
  <div style="background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:12px;"><div style="font-size:10px;color:#166534;font-weight:600;">RECEBIDO</div><div style="font-size:20px;font-weight:800;color:#16a34a;">${fmtM(totalPago)}</div><div style="font-size:10px;color:#166534;">${countPago} OS</div></div>
  <div style="background:#dbeafe;border:1px solid #93c5fd;border-radius:8px;padding:12px;"><div style="font-size:10px;color:#1e40af;font-weight:600;">TOTAL GERAL</div><div style="font-size:20px;font-weight:800;color:#2563eb;">${fmtM(totalGeral)}</div><div style="font-size:10px;color:#1e40af;">${countAberto + countPago} OS</div></div>
  <div style="background:#f3e8ff;border:1px solid #c4b5fd;border-radius:8px;padding:12px;"><div style="font-size:10px;color:#6b21a8;font-weight:600;">TICKET MÉDIO</div><div style="font-size:20px;font-weight:800;color:#7c3aed;">${fmtM(ticketMedio)}</div><div style="font-size:10px;color:#6b21a8;">por OS concluída</div></div>
</div>
${(data?.osAbertas?.length ?? 0) > 0 ? `<h2 style="font-size:14px;color:#1e293b;margin:16px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">OS em Aberto (${countAberto})</h2>${buildTable(data.osAbertas)}` : ''}
${(data?.osPagas?.length ?? 0) > 0 ? `<h2 style="font-size:14px;color:#1e293b;margin:16px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">OS Pagas (${countPago})</h2>${buildTable(data.osPagas)}` : ''}
</body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent" /> Relatórios
          </h1>
          <p className="text-text-secondary mt-1">Relatório financeiro e de ordens de serviço</p>
        </div>
        {!loading && allOS.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => handleExportCSV('all')} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-all">
              <FileSpreadsheet className="w-3.5 h-3.5" /> CSV Completo
            </button>
            <button onClick={() => handleExportPDF('all')} className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-all">
              <Download className="w-3.5 h-3.5" /> PDF Completo
            </button>
          </div>
        )}
      </div>

      <div className="bg-bg-secondary rounded-xl p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm text-text-secondary mb-1">Data Início</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-text-secondary mb-1">Data Fim</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border text-sm" />
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-light text-white rounded-lg text-sm font-medium transition-all">
            <Filter className="w-4 h-4" /> Filtrar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-bg-secondary rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Em Aberto</span>
                <div className="p-2 bg-yellow-500/10 rounded-lg"><Clock className="w-4 h-4 text-yellow-400" /></div>
              </div>
              <p className="text-2xl font-bold text-yellow-400">
                <CountUp end={data?.totalAberto ?? 0} prefix="R$ " decimals={2} />
              </p>
              <p className="text-xs text-text-secondary mt-1">{data?.countAberto ?? 0} ordem(ns)</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-bg-secondary rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Recebido</span>
                <div className="p-2 bg-green-500/10 rounded-lg"><CheckCircle className="w-4 h-4 text-green-400" /></div>
              </div>
              <p className="text-2xl font-bold text-green-400">
                <CountUp end={data?.totalPago ?? 0} prefix="R$ " decimals={2} />
              </p>
              <p className="text-xs text-text-secondary mt-1">{data?.countPago ?? 0} ordem(ns)</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-bg-secondary rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Total Geral</span>
                <div className="p-2 bg-accent/10 rounded-lg"><DollarSign className="w-4 h-4 text-accent" /></div>
              </div>
              <p className="text-2xl font-bold text-accent">
                <CountUp end={(data?.totalAberto ?? 0) + (data?.totalPago ?? 0)} prefix="R$ " decimals={2} />
              </p>
              <p className="text-xs text-text-secondary mt-1">{(data?.countAberto ?? 0) + (data?.countPago ?? 0)} ordem(ns)</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-bg-secondary rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Ticket Médio</span>
                <div className="p-2 bg-purple-500/10 rounded-lg"><TrendingUp className="w-4 h-4 text-purple-400" /></div>
              </div>
              <p className="text-2xl font-bold text-purple-400">
                <CountUp end={(data?.countPago ?? 0) > 0 ? (data?.totalPago ?? 0) / (data?.countPago ?? 1) : 0} prefix="R$ " decimals={2} />
              </p>
              <p className="text-xs text-text-secondary mt-1">por OS concluída</p>
            </motion.div>
          </div>

          <div className="bg-bg-secondary rounded-xl shadow-lg">
            <div className="flex items-center border-b border-border">
              <button
                onClick={() => setActiveTab('abertas')}
                className={`flex-1 py-3 text-sm font-medium transition-all ${activeTab === 'abertas' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <Clock className="w-4 h-4 inline mr-1" /> OS em Aberto ({data?.countAberto ?? 0})
              </button>
              <button
                onClick={() => setActiveTab('pagas')}
                className={`flex-1 py-3 text-sm font-medium transition-all ${activeTab === 'pagas' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <CheckCircle className="w-4 h-4 inline mr-1" /> OS Pagas ({data?.countPago ?? 0})
              </button>
              {osList.length > 0 && (
                <div className="flex gap-1 px-2">
                  <button onClick={() => handleExportCSV('tab')} title="Exportar aba CSV" className="p-1.5 text-text-secondary hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-all">
                    <FileSpreadsheet className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleExportPDF('tab')} title="Exportar aba PDF" className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="p-4">
              {(osList?.length ?? 0) === 0 ? (
                <p className="text-center text-text-secondary py-8">Nenhuma OS encontrada</p>
              ) : (
                <div className="space-y-2">
                  {(osList ?? [])?.map?.((os: any, i: number) => (
                    <Link key={os?.id ?? i} href={`/ordens/${os?.id ?? ''}`} className="flex items-center justify-between p-3 rounded-lg bg-bg-primary hover:bg-border/30 transition-all">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary">OS #{os?.numero ?? ''} - {os?.cliente?.nome ?? 'N/A'}</p>
                        <p className="text-xs text-text-secondary">{os?.tecnico?.name ?? 'Sem técnico'} | {os?.createdAt ? new Date(os.createdAt)?.toLocaleDateString?.('pt-BR') ?? '' : ''}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-text-primary">R$ {(os?.valorTotal ?? 0)?.toFixed?.(2)?.replace('.', ',') ?? '0,00'}</span>
                        <StatusBadge status={os?.status ?? 'aberta'} />
                      </div>
                    </Link>
                  )) ?? []}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
