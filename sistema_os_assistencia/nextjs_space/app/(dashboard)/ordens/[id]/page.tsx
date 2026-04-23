'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Save, Loader2, Edit2, Download, Image as ImageIcon,
  Trash2, MessageCircle, Copy, Printer, CheckCircle, XCircle, PlayCircle, Pause
} from 'lucide-react';
import StatusBadge from '@/components/status-badge';
import Modal from '@/components/modal';

const paymentLabels: Record<string, string> = {
  dinheiro: 'Dinheiro', pix: 'PIX', cartao_debito: 'Cartão Débito',
  cartao_credito: 'Cartão Crédito', transferencia: 'Transferência', boleto: 'Boleto',
};

interface Marca { id: string; nome: string; modelos: { id: string; nome: string }[]; }

function fmt(d: any) { return d ? new Date(d).toLocaleDateString('pt-BR') : 'N/A'; }
function isoDate(d: any) { try { return d ? new Date(d).toISOString().split('T')[0] : ''; } catch { return ''; } }

export default function OrdemDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const [ordem, setOrdem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<any>({});
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState<string | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    formaPagamento: 'pix',
    statusPagamento: 'pago',
    valor: '',
    valorPago: '',
    data: new Date().toISOString().split('T')[0],
    observacoes: '',
  });

  // Marca/Modelo state
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelosFiltrados, setModelosFiltrados] = useState<{id:string;nome:string}[]>([]);
  const [marcaSel, setMarcaSel] = useState('');
  const [modeloSel, setModeloSel] = useState('');
  const [modeloCustom, setModeloCustom] = useState('');

  const fetchOS = async () => {
    setLoading(true);
    const r = await fetch(`/api/ordens/${params.id}`);
    if (r.ok) { const d = await r.json(); setOrdem(d); setForm(d); }
    else setError('OS não encontrada');
    setLoading(false);
  };

  useEffect(() => {
    fetchOS();
    fetch('/api/tecnicos').then(r => r.json()).then(setTecnicos).catch(() => {});
    fetch('/api/marcas').then(r => r.ok ? r.json() : []).then(d => setMarcas(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // When entering edit mode, set marca/modelo selections from current form values
  useEffect(() => {
    if (editing && form.marca) {
      setMarcaSel(form.marca || '');
      setModeloSel(form.modelo || '');
      setModeloCustom('');
    }
  }, [editing]);

  // Filter models when marca changes
  useEffect(() => {
    if (marcaSel) {
      const found = marcas.find(m => m.nome === marcaSel);
      setModelosFiltrados(found?.modelos || []);
    } else {
      setModelosFiltrados([]);
    }
  }, [marcaSel, marcas]);

  const up = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const handleMarcaChange = (val: string) => {
    setMarcaSel(val);
    setModeloSel('');
    setModeloCustom('');
    up('marca', val);
    up('modelo', '');
  };

  const handleModeloChange = (val: string) => {
    if (val === '__custom__') {
      setModeloSel('__custom__');
      setModeloCustom('');
      up('modelo', '');
    } else {
      setModeloSel(val);
      setModeloCustom('');
      up('modelo', val);
    }
  };

  const handleModeloCustomChange = (val: string) => {
    setModeloCustom(val);
    up('modelo', val);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = { ...form };
    for (const k of ['cliente', 'tecnico', 'orcamento', 'id', 'numero', 'createdAt', 'updatedAt']) delete body[k];
    const r = await fetch(`/api/ordens/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) { await fetchOS(); setEditing(false); }
    else setError('Erro ao salvar');
    setSaving(false);
  };

  const handleDelete = async () => {
    await fetch(`/api/ordens/${params.id}`, { method: 'DELETE' });
    router.push('/ordens');
  };

  const handleDuplicate = async () => {
    const body: any = {
      clienteId: ordem.clienteId, tipoEquipamento: ordem.tipoEquipamento,
      marca: ordem.marca, modelo: ordem.modelo, numeroSerie: ordem.numeroSerie,
      descricaoProblema: ordem.descricaoProblema, diagnostico: ordem.diagnostico,
      servicoExecutado: ordem.servicoExecutado, valorTotal: ordem.valorTotal,
      formaPagamento: ordem.formaPagamento, observacoes: ordem.observacoes,
    };
    const r = await fetch('/api/ordens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json();
    if (d.id) router.push(`/ordens/${d.id}`);
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const r = await fetch(`/api/ordens/${params.id}/export`);
      if (r.ok) {
        const blob = await r.blob();
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `OS-${ordem.numero}.pdf`; a.click();
      }
    } catch {} setExportingPdf(false);
  };

  const handleExportPng = async () => {
    setExportingPng(true);
    try {
      const r = await fetch(`/api/ordens/${params.id}/export-png`);
      const data = await r.json();
      if (data.html) {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;left:-9999px;width:800px;height:1200px;';
        document.body.appendChild(iframe);
        const doc = iframe.contentDocument!;
        doc.open(); doc.write(data.html); doc.close();
        await new Promise(res => setTimeout(res, 500));
        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(doc.body, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const a = document.createElement('a'); a.href = canvas.toDataURL('image/png');
        a.download = `${data.filename || 'OS'}.png`; a.click();
        document.body.removeChild(iframe);
      }
    } catch {} setExportingPng(false);
  };

  const handlePrint = () => window.print();

  const handleStatusChange = async (newStatus: string) => {
    setChangingStatus(true); setError('');
    try {
      const r = await fetch(`/api/ordens/${params.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (r.ok) { await fetchOS(); setShowStatusModal(null); }
      else setError('Erro ao alterar status');
    } catch { setError('Erro ao alterar status'); }
    setChangingStatus(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  if (!ordem) return <div className="text-center py-20 text-text-secondary">{error || 'OS não encontrada'}</div>;

  const o = editing ? form : ordem;
  const whatsLink = ordem.cliente?.whatsapp || ordem.cliente?.telefone;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/ordens" className="p-2 hover:bg-bg-secondary rounded-lg"><ArrowLeft className="w-5 h-5 text-text-secondary" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">OS #{ordem.numero}</h1>
            <StatusBadge status={ordem.status} />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExportPdf} disabled={exportingPdf} className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-medium flex items-center gap-1">
            {exportingPdf ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} PDF
          </button>
          <button onClick={handleExportPng} disabled={exportingPng} className="px-3 py-2 bg-green-700 text-white rounded-lg text-xs font-medium flex items-center gap-1">
            {exportingPng ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />} PNG
          </button>
          <button onClick={handlePrint} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"><Printer className="w-3 h-3" />Imprimir</button>
          <button onClick={handleDuplicate} className="px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"><Copy className="w-3 h-3" />Duplicar</button>

          {/* Status action buttons */}
          {!editing && ordem.status === 'aberta' && (
            <button onClick={() => handleStatusChange('em_andamento')} className="px-3 py-2 bg-yellow-600 text-white rounded-lg text-xs font-medium flex items-center gap-1">
              <PlayCircle className="w-3 h-3" /> Iniciar
            </button>
          )}
          {!editing && (ordem.status === 'aberta' || ordem.status === 'em_andamento' || ordem.status === 'aguardando_peca') && (
            <button onClick={() => { setPaymentForm(pf => ({ ...pf, valor: String(ordem.valorTotal || ''), valorPago: String(ordem.valorTotal || '') })); setShowPaymentModal(true); }} className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Concluir
            </button>
          )}
          {!editing && ordem.status !== 'cancelada' && ordem.status !== 'concluida' && (
            <button onClick={() => setShowStatusModal('cancelada')} className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Cancelar OS
            </button>
          )}

          {!editing ? (
            <button onClick={() => setEditing(true)} className="px-3 py-2 bg-accent text-white rounded-lg text-xs font-medium flex items-center gap-1"><Edit2 className="w-3 h-3" />Editar</button>
          ) : (
            <>
              <button onClick={() => { setEditing(false); setForm(ordem); }} className="px-3 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="px-3 py-2 bg-accent text-white rounded-lg text-xs font-medium flex items-center gap-1">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Salvar
              </button>
            </>
          )}
          <button onClick={() => setShowDelete(true)} className="px-3 py-2 bg-red-700 text-white rounded-lg text-xs font-medium flex items-center gap-1"><Trash2 className="w-3 h-3" />Excluir</button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="space-y-4">
        {/* Cliente */}
        <section className="bg-bg-secondary rounded-xl p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-3">Cliente</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div><span className="text-text-secondary">Nome:</span> <span className="font-medium text-text-primary">{ordem.cliente?.nome}</span></div>
            <div><span className="text-text-secondary">Telefone:</span> <span className="font-medium text-text-primary">{ordem.cliente?.telefone || 'N/A'}</span></div>
            <div><span className="text-text-secondary">E-mail:</span> <span className="font-medium text-text-primary">{ordem.cliente?.email || 'N/A'}</span></div>
            {whatsLink && (
              <div className="col-span-2 mt-1">
                <a
                  href={`https://wa.me/55${whatsLink.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá, ${ordem.cliente?.nome || ''}.\n\nSeu equipamento foi finalizado e está pronto para retirada.\n\nQualquer dúvida estamos à disposição.\n\nDRT Informática`
                  )}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-all"
                >
                  <MessageCircle className="w-4 h-4" /> Avisar Cliente via WhatsApp
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Equipamento */}
        <section className="bg-bg-secondary rounded-xl p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-3">Equipamento</h2>
          {editing ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary block mb-1">Tipo</label>
                <select value={form.tipoEquipamento || 'notebook'} onChange={e => up('tipoEquipamento', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm">
                  <option value="notebook">Notebook</option><option value="desktop">Desktop</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">Marca</label>
                <select value={marcaSel} onChange={e => handleMarcaChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm">
                  <option value="">Selecione a marca</option>
                  {marcas.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">Modelo</label>
                {modeloSel === '__custom__' ? (
                  <input placeholder="Digite o modelo" value={modeloCustom} onChange={e => handleModeloCustomChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" />
                ) : (
                  <select value={modeloSel} onChange={e => handleModeloChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm">
                    <option value="">Selecione o modelo</option>
                    {modelosFiltrados.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                    <option value="__custom__">✏️ Outro (digitar)</option>
                  </select>
                )}
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">Nº Série</label>
                <input placeholder="Nº Série" value={form.numeroSerie || ''} onChange={e => up('numeroSerie', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div><span className="text-text-secondary">Tipo:</span> <span className="font-medium text-text-primary capitalize">{o.tipoEquipamento}</span></div>
              <div><span className="text-text-secondary">Marca:</span> <span className="font-medium text-text-primary">{o.marca || 'N/A'}</span></div>
              <div><span className="text-text-secondary">Modelo:</span> <span className="font-medium text-text-primary">{o.modelo || 'N/A'}</span></div>
              <div><span className="text-text-secondary">Nº Série:</span> <span className="font-medium text-text-primary">{o.numeroSerie || 'N/A'}</span></div>
            </div>
          )}
        </section>

        {/* Problema / Serviço */}
        <section className="bg-bg-secondary rounded-xl p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-3">Problema / Serviço</h2>
          {editing ? (
            <div className="space-y-3">
              <div><label className="text-xs text-text-secondary block mb-1">Problema Relatado</label>
                <textarea value={form.descricaoProblema || ''} onChange={e => up('descricaoProblema', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm min-h-[60px]" /></div>
              <div><label className="text-xs text-text-secondary block mb-1">Diagnóstico</label>
                <textarea value={form.diagnostico || ''} onChange={e => up('diagnostico', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm min-h-[60px]" /></div>
              <div><label className="text-xs text-text-secondary block mb-1">Serviço Executado</label>
                <textarea value={form.servicoExecutado || ''} onChange={e => up('servicoExecutado', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm min-h-[60px]" /></div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div><span className="text-text-secondary text-xs uppercase block mb-1">Problema Relatado</span><p className="text-text-primary">{o.descricaoProblema}</p></div>
              {o.diagnostico && <div><span className="text-text-secondary text-xs uppercase block mb-1">Diagnóstico</span><p className="text-text-primary">{o.diagnostico}</p></div>}
              {o.servicoExecutado && <div><span className="text-text-secondary text-xs uppercase block mb-1">Serviço Executado</span><p className="text-text-primary">{o.servicoExecutado}</p></div>}
            </div>
          )}
        </section>

        {/* Financeiro */}
        <section className="bg-bg-secondary rounded-xl p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-3">Financeiro</h2>
          {editing ? (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-text-secondary block mb-1">Valor Total (R$)</label>
                <input type="number" step="0.01" value={form.valorTotal ?? ''} onChange={e => up('valorTotal', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" /></div>
              <div><label className="text-xs text-text-secondary block mb-1">Forma de Pagamento</label>
                <select value={form.formaPagamento || ''} onChange={e => up('formaPagamento', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm">
                  <option value="">Selecione</option><option value="pix">PIX</option><option value="dinheiro">Dinheiro</option>
                  <option value="cartao_debito">Cartão Débito</option><option value="cartao_credito">Cartão Crédito</option>
                  <option value="transferencia">Transferência</option><option value="boleto">Boleto</option>
                </select></div>
              <div><label className="text-xs text-text-secondary block mb-1">Status</label>
                <select value={form.status} onChange={e => up('status', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm">
                  <option value="aberta">Aberta</option><option value="em_andamento">Em Andamento</option>
                  <option value="aguardando_peca">Aguardando Peça</option><option value="concluida">Concluída</option>
                  <option value="cancelada">Cancelada</option>
                </select></div>
              <div><label className="text-xs text-text-secondary block mb-1">Técnico</label>
                <select value={form.tecnicoId || ''} onChange={e => up('tecnicoId', e.target.value || null)} className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm">
                  <option value="">Não atribuído</option>
                  {tecnicos.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select></div>
              <div><label className="text-xs text-text-secondary block mb-1">Data Prevista</label>
                <input type="date" value={isoDate(form.dataPrevista)} onChange={e => up('dataPrevista', e.target.value || null)} className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" /></div>
              <div><label className="text-xs text-text-secondary block mb-1">Data Retirada</label>
                <input type="date" value={isoDate(form.dataRetirada)} onChange={e => up('dataRetirada', e.target.value || null)} className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" /></div>
            </div>
          ) : (
            <div>
              <div className="bg-accent/10 rounded-lg p-4 border border-accent/30 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">Valor Total</span>
                  <span className="text-2xl font-bold text-accent">R$ {(o.valorTotal ?? 0).toFixed(2)}</span>
                </div>
                {o.formaPagamento && <div className="text-sm text-text-secondary mt-1">Pagamento: <span className="text-text-primary font-medium">{paymentLabels[o.formaPagamento] || o.formaPagamento}</span></div>}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div><span className="text-text-secondary">Técnico:</span> <span className="font-medium text-text-primary">{o.tecnico?.name || 'Não atribuído'}</span></div>
                <div><span className="text-text-secondary">Entrada:</span> <span className="font-medium text-text-primary">{fmt(o.dataEntrada || o.createdAt)}</span></div>
                {o.dataPrevista && <div><span className="text-text-secondary">Previsão:</span> <span className="font-medium text-text-primary">{fmt(o.dataPrevista)}</span></div>}
                {o.dataRetirada && <div><span className="text-text-secondary">Retirada:</span> <span className="font-medium text-text-primary">{fmt(o.dataRetirada)}</span></div>}
              </div>
            </div>
          )}
        </section>

        {/* Observações */}
        {(editing || o.observacoes) && (
          <section className="bg-bg-secondary rounded-xl p-5 border border-border">
            <h2 className="text-sm font-bold text-accent uppercase mb-3">Observações</h2>
            {editing ? (
              <textarea value={form.observacoes || ''} onChange={e => up('observacoes', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm min-h-[60px]" />
            ) : (
              <p className="text-sm text-text-primary">{o.observacoes}</p>
            )}
          </section>
        )}
      </div>

      {/* Cancel status modal */}
      <Modal open={showStatusModal === 'cancelada'} onClose={() => setShowStatusModal(null)} title="Cancelar OS">
        <p className="text-text-secondary text-sm mb-4">Tem certeza que deseja cancelar esta OS?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowStatusModal(null)} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-primary">Voltar</button>
          <button onClick={() => handleStatusChange('cancelada')} disabled={changingStatus}
            className="px-4 py-2 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 bg-red-500">
            {changingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Cancelar OS
          </button>
        </div>
      </Modal>

      {/* Payment + Conclude modal */}
      <Modal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Concluir OS - Pagamento">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary block mb-1">Forma de Pagamento</label>
              <select value={paymentForm.formaPagamento} onChange={e => setPaymentForm(p => ({ ...p, formaPagamento: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm">
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_debito">Cartão Débito</option>
                <option value="cartao_credito">Cartão Crédito</option>
                <option value="transferencia">Transferência</option>
                <option value="boleto">Boleto</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Status Pagamento</label>
              <select value={paymentForm.statusPagamento} onChange={e => setPaymentForm(p => ({ ...p, statusPagamento: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm">
                <option value="pago">Pago</option>
                <option value="parcial">Parcial</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary block mb-1">Valor Total (R$)</label>
              <input type="number" step="0.01" value={paymentForm.valor} onChange={e => setPaymentForm(p => ({ ...p, valor: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" />
            </div>
            {paymentForm.statusPagamento === 'parcial' && (
              <div>
                <label className="text-xs text-text-secondary block mb-1">Valor Pago (R$)</label>
                <input type="number" step="0.01" value={paymentForm.valorPago} onChange={e => setPaymentForm(p => ({ ...p, valorPago: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" />
              </div>
            )}
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Data do Pagamento</label>
            <input type="date" value={paymentForm.data} onChange={e => setPaymentForm(p => ({ ...p, data: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Observações</label>
            <textarea value={paymentForm.observacoes} onChange={e => setPaymentForm(p => ({ ...p, observacoes: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm min-h-[60px]" placeholder="Observações sobre o pagamento..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-primary">Cancelar</button>
            <button onClick={async () => {
              setChangingStatus(true); setError('');
              try {
                // 1. Update OS status to concluida + payment fields
                const rOS = await fetch(`/api/ordens/${params.id}`, {
                  method: 'PUT', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'concluida', formaPagamento: paymentForm.formaPagamento, valorTotal: parseFloat(paymentForm.valor) || 0, dataPagamento: paymentForm.data }),
                });
                if (!rOS.ok) { setError('Erro ao concluir OS'); setChangingStatus(false); return; }
                // 2. Create financial entry (lancamento)
                await fetch('/api/financeiro', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    tipo: 'entrada', categoria: 'servico',
                    descricao: `OS #${ordem.numero} - ${ordem.cliente?.nome || 'Cliente'}`,
                    valor: parseFloat(paymentForm.valor) || 0,
                    data: paymentForm.data,
                    formaPagamento: paymentForm.formaPagamento,
                    statusPagamento: paymentForm.statusPagamento,
                    valorPago: paymentForm.statusPagamento === 'parcial' ? parseFloat(paymentForm.valorPago) || 0 : paymentForm.statusPagamento === 'pago' ? parseFloat(paymentForm.valor) || 0 : 0,
                    observacoes: paymentForm.observacoes || null,
                    ordemServicoId: ordem.id,
                  }),
                });
                await fetchOS(); setShowPaymentModal(false);
              } catch { setError('Erro ao concluir OS'); }
              setChangingStatus(false);
            }} disabled={changingStatus || !paymentForm.valor}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              {changingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Concluir e Registrar
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowDelete(false)}>
          <div className="bg-bg-secondary rounded-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-text-primary mb-3">Excluir OS #{ordem.numero}?</h3>
            <p className="text-sm text-text-secondary mb-4">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2 rounded-lg border border-border text-sm text-text-primary">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
