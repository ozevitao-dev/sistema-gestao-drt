'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Download, Image as ImageIcon, Loader2, Trash2,
  CheckCircle, XCircle, ArrowRight, Hash, Phone, User, DollarSign,
  Edit2, Save, MessageCircle, Printer, X, Plus, ClipboardCheck, Check,
  PackageOpen, FileText
} from 'lucide-react';
import Modal from '@/components/modal';

const paymentLabels: Record<string, string> = {
  dinheiro: 'Dinheiro', pix: 'PIX', cartao_debito: 'Cartão Débito',
  cartao_credito: 'Cartão Crédito', transferencia: 'Transferência', boleto: 'Boleto',
};
const statusLabels: Record<string, string> = { pendente: 'Pendente', aprovado: 'Aprovado', recusado: 'Cancelado', cancelado: 'Cancelado' };
const statusColors: Record<string, string> = { pendente: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30', aprovado: 'text-green-600 bg-green-600/10 border-green-600/30', recusado: 'text-red-400 bg-red-400/10 border-red-400/30', cancelado: 'text-red-400 bg-red-400/10 border-red-400/30' };

export default function OrcamentoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const [orc, setOrc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showCancelar, setShowCancelar] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [gerandoOrc, setGerandoOrc] = useState(false);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editServicos, setEditServicos] = useState<{ nome: string; valor: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [editEntrada, setEditEntrada] = useState<any>({ tipoEquipamento: 'notebook', descricaoEntrada: '', checklist: { liga: false, daVideo: false, tecladoResponde: false, sinaisOxidacao: false, marcasUso: false } });

  const fetchOrc = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/orcamentos/${params.id}`);
      if (r.ok) { setOrc(await r.json()); }
      else setError('Orçamento não encontrado');
    } catch { setError('Erro ao carregar'); }
    setLoading(false);
  }, [params.id]);

  useEffect(() => { fetchOrc(); }, [fetchOrc]);

  const startEditing = () => {
    if (!orc) return;
    const servicos = orc.servicos ? (() => { try { return JSON.parse(orc.servicos); } catch { return []; } })() : [];
    setEditForm({
      descricao: orc.descricao || '',
      pecas: orc.pecas || '',
      formaPagamento: orc.formaPagamento || '',
      parcelamento: orc.parcelamento || '',
      valorPixVista: orc.valorPixVista ? String(orc.valorPixVista) : '',
      observacoes: orc.observacoes || '',
    });
    setEditServicos(servicos.length > 0 ? servicos : [{ nome: '', valor: 0 }]);
    // Parse entrada
    let entrada = { tipoEquipamento: 'notebook', descricaoEntrada: '', checklist: { liga: false, daVideo: false, tecladoResponde: false, sinaisOxidacao: false, marcasUso: false } };
    if (orc.entradaEquipamento) { try { entrada = { ...entrada, ...JSON.parse(orc.entradaEquipamento) }; } catch {} }
    setEditEntrada(entrada);
    setEditing(true);
  };

  const cancelEditing = () => { setEditing(false); setError(''); };

  const handleSaveEdit = async () => {
    setSaving(true); setError('');
    try {
      const filteredServicos = editServicos.filter(s => s.nome.trim());
      const valorTotal = filteredServicos.reduce((sum, s) => sum + (s.valor || 0), 0);
      const body: any = {
        descricao: editForm.descricao,
        pecas: editForm.pecas || null,
        servicos: JSON.stringify(filteredServicos),
        valorTotal,
        formaPagamento: editForm.formaPagamento || null,
        parcelamento: editForm.parcelamento || null,
        valorPixVista: editForm.valorPixVista ? parseFloat(editForm.valorPixVista) : null,
        observacoes: editForm.observacoes || null,
        entradaEquipamento: JSON.stringify(editEntrada),
      };
      const r = await fetch(`/api/orcamentos/${params.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (r.ok) { setEditing(false); fetchOrc(); }
      else { const d = await r.json(); setError(d?.error || 'Erro ao salvar'); }
    } catch { setError('Erro ao salvar alterações'); }
    setSaving(false);
  };

  const addServico = () => setEditServicos(prev => [...prev, { nome: '', valor: 0 }]);
  const removeServico = (i: number) => setEditServicos(prev => prev.filter((_, idx) => idx !== i));
  const updateServico = (i: number, field: string, value: any) => {
    setEditServicos(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const r = await fetch(`/api/orcamentos/${params.id}/export`);
      if (r.ok) {
        const blob = await r.blob();
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `ORC-${orc.numero}.pdf`; a.click();
      }
    } catch {} setExportingPdf(false);
  };

  const handleExportPng = async () => {
    setExportingPng(true);
    try {
      const r = await fetch(`/api/orcamentos/${params.id}/export-png`);
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
        a.download = `${data.filename || 'ORC'}.png`; a.click();
        document.body.removeChild(iframe);
      }
    } catch {} setExportingPng(false);
  };

  const handleApprove = async () => {
    setApproving(true); setError('');
    try {
      const r = await fetch(`/api/orcamentos/${params.id}`, { method: 'POST' });
      const data = await r.json();
      if (!r.ok) { setError(data?.error || 'Erro ao aprovar'); setApproving(false); return; }
      if (data?.ordem?.id) router.push(`/ordens/${data.ordem.id}`);
      else fetchOrc();
    } catch { setError('Erro ao aprovar'); }
    setApproving(false);
  };

  const handleCancelar = async () => {
    try {
      const r = await fetch(`/api/orcamentos/${params.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelado' }),
      });
      if (r.ok) { fetchOrc(); setShowCancelar(false); }
    } catch {}
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const r = await fetch(`/api/orcamentos/${params.id}`, { method: 'DELETE' });
      if (r.ok) router.push('/orcamentos');
    } catch {}
    setDeleting(false);
  };

  const handleGerarOrcamento = async () => {
    setGerandoOrc(true); setError('');
    try {
      const r = await fetch(`/api/orcamentos/${params.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modoEntrada: false }),
      });
      if (r.ok) fetchOrc();
      else { const d = await r.json(); setError(d?.error || 'Erro ao gerar orçamento'); }
    } catch { setError('Erro ao gerar orçamento'); }
    setGerandoOrc(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  if (!orc) return <div className="text-center py-20 text-text-secondary">{error || 'Orçamento não encontrado'}</div>;

  const servicos = orc.servicos ? (() => { try { return JSON.parse(orc.servicos); } catch { return []; } })() : [];
  const whatsLink = orc.telefoneCliente;
  const editTotal = editServicos.reduce((sum, s) => sum + (s.valor || 0), 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/orcamentos" className="p-2 hover:bg-bg-secondary rounded-lg"><ArrowLeft className="w-5 h-5 text-text-secondary" /></Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-text-primary flex items-center gap-2">
              {orc.modoEntrada && <PackageOpen className="w-5 h-5 text-amber-500" />}
              {orc.modoEntrada ? 'Entrada' : 'Orçamento'} #{orc.numero}
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[orc.status] || ''}`}>
              {statusLabels[orc.status] || orc.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {editing ? (
            <>
              <button onClick={cancelEditing} className="px-3 py-2 bg-bg-secondary text-text-secondary rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-bg-primary">
                <X className="w-3 h-3" /> Cancelar
              </button>
              <button onClick={handleSaveEdit} disabled={saving} className="px-3 py-2 bg-accent text-white rounded-lg text-xs font-medium flex items-center gap-1">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Salvar
              </button>
            </>
          ) : (
            <>
              <button onClick={handleExportPdf} disabled={exportingPdf} className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-medium flex items-center gap-1">
                {exportingPdf ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} PDF
              </button>
              <button onClick={handleExportPng} disabled={exportingPng} className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium flex items-center gap-1">
                {exportingPng ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />} PNG
              </button>
              {orc.status === 'pendente' && (
                <>
                  <button onClick={startEditing} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium flex items-center gap-1">
                    <Edit2 className="w-3 h-3" /> Editar
                  </button>
                  {orc.modoEntrada ? (
                    <button onClick={handleGerarOrcamento} disabled={gerandoOrc} className="px-3 py-2 bg-accent text-white rounded-lg text-xs font-medium flex items-center gap-1">
                      {gerandoOrc ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />} Gerar Orçamento
                    </button>
                  ) : (
                    <button onClick={handleApprove} disabled={approving} className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium flex items-center gap-1">
                      {approving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Aprovar
                    </button>
                  )}
                  <button onClick={() => setShowCancelar(true)} className="px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Cancelar
                  </button>
                </>
              )}
              {orc.status === 'aprovado' && orc.ordemServico && (
                <Link href={`/ordens/${orc.ordemServico.id}`} className="px-3 py-2 bg-accent text-white rounded-lg text-xs font-medium flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" /> Ver OS #{orc.ordemServico.numero}
                </Link>
              )}
              <button onClick={() => setShowDelete(true)} className="px-3 py-2 bg-red-700 text-white rounded-lg text-xs font-medium flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Excluir
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg mb-4">{error}</p>}

      <div className="space-y-4">
        {/* Cliente */}
        <section className="bg-bg-secondary rounded-xl p-4 md:p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-3">Cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div><span className="text-text-secondary">Nome:</span> <span className="font-medium text-text-primary">{orc.nomeCliente}</span></div>
            <div><span className="text-text-secondary">Telefone:</span> <span className="font-medium text-text-primary">{orc.telefoneCliente}</span></div>
            {orc.cliente?.email && <div><span className="text-text-secondary">E-mail:</span> <span className="font-medium text-text-primary">{orc.cliente.email}</span></div>}
            {whatsLink && !orc.modoEntrada && (
              <div className="sm:col-span-2 mt-1">
                <a
                  href={`https://wa.me/55${whatsLink.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá, ${orc.nomeCliente}.\n\nSeu orçamento nº ${orc.numero} foi finalizado.\n\nValor: R$ ${(orc.valorTotal ?? 0).toFixed(2).replace('.', ',')}\n\nPor favor, nos informe se deseja aprovar para darmos continuidade.\n\nDRT Informática`
                  )}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-all"
                >
                  <MessageCircle className="w-4 h-4" /> Enviar Orçamento via WhatsApp
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Entrada do Equipamento */}
        {(() => {
          let entrada: any = null;
          if (orc.entradaEquipamento) { try { entrada = JSON.parse(orc.entradaEquipamento); } catch {} }
          const checklistLabels: Record<string, string> = { liga: 'Liga', daVideo: 'Dá vídeo', tecladoResponde: 'Teclado responde', sinaisOxidacao: 'Sinais de oxidação', marcasUso: 'Marcas de uso' };
          const tipoLabels: Record<string, string> = { notebook: 'Notebook', desktop: 'Desktop', servidor: 'Servidor', outro: 'Outro' };

          if (editing) {
            const toggleEditCheck = (key: string) => {
              setEditEntrada((prev: any) => {
                const cl = { ...prev.checklist, [key]: !prev.checklist[key] };
                if (key === 'liga' && !cl.liga) { cl.daVideo = false; cl.tecladoResponde = false; }
                return { ...prev, checklist: cl };
              });
            };
            return (
              <section className="bg-bg-secondary rounded-xl p-4 md:p-5 border border-border">
                <h2 className="text-sm font-bold text-accent uppercase mb-3 flex items-center gap-2"><ClipboardCheck className="w-4 h-4" />Entrada do Equipamento</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-text-secondary block mb-1">Tipo de Equipamento</label>
                    <select value={editEntrada.tipoEquipamento} onChange={e => setEditEntrada((p: any) => ({ ...p, tipoEquipamento: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm min-h-[44px]">
                      <option value="notebook">Notebook</option><option value="desktop">Desktop</option>
                      <option value="servidor">Servidor</option><option value="outro">Outro</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-xs text-text-secondary block mb-1">Descrição da Entrada</label>
                  <textarea value={editEntrada.descricaoEntrada || ''} onChange={e => setEditEntrada((p: any) => ({ ...p, descricaoEntrada: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm min-h-[60px]" placeholder="Estado do equipamento..." />
                </div>
                <label className="text-xs text-text-secondary mb-2 block font-semibold">Checklist</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(['liga','daVideo','tecladoResponde','sinaisOxidacao','marcasUso'] as const).map(key => {
                    const disabled = (key === 'daVideo' || key === 'tecladoResponde') && !editEntrada.checklist?.liga;
                    return (
                      <label key={key} className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all ${disabled ? 'opacity-40 cursor-not-allowed bg-bg-primary' : editEntrada.checklist?.[key] ? 'border-accent bg-accent/10' : 'border-border bg-bg-primary hover:border-accent/50'}`}>
                        <input type="checkbox" checked={editEntrada.checklist?.[key] || false} disabled={disabled}
                          onChange={() => !disabled && toggleEditCheck(key)} className="w-4 h-4 rounded accent-[#2563eb]" />
                        <span className="text-text-primary">{checklistLabels[key]}</span>
                      </label>
                    );
                  })}
                </div>
              </section>
            );
          }

          if (!entrada) return null;
          return (
            <section className="bg-bg-secondary rounded-xl p-4 md:p-5 border border-border">
              <h2 className="text-sm font-bold text-accent uppercase mb-3 flex items-center gap-2"><ClipboardCheck className="w-4 h-4" />Entrada do Equipamento</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-3">
                <div><span className="text-text-secondary">Tipo:</span> <span className="font-medium text-text-primary capitalize">{tipoLabels[entrada.tipoEquipamento] || entrada.tipoEquipamento}</span></div>
              </div>
              {entrada.descricaoEntrada && (
                <div className="mb-3">
                  <span className="text-text-secondary text-xs uppercase block mb-1">Descrição da Entrada</span>
                  <p className="text-sm text-text-primary whitespace-pre-wrap bg-bg-primary rounded-lg p-3">{entrada.descricaoEntrada}</p>
                </div>
              )}
              {entrada.checklist && (
                <div>
                  <span className="text-text-secondary text-xs uppercase block mb-2">Checklist</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(checklistLabels).map(([key, label]) => {
                      const checked = entrada.checklist?.[key];
                      const disabled = (key === 'daVideo' || key === 'tecladoResponde') && !entrada.checklist?.liga;
                      return (
                        <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                          disabled ? 'bg-bg-primary text-text-secondary/50' :
                          checked ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                          {disabled ? <span className="w-3.5 h-3.5 rounded-full bg-gray-500/20" /> :
                           checked ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          {label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          );
        })()}

        {/* Equipamento */}
        {(orc.tipoEquipamento || orc.marca || orc.modelo) && (
          <section className="bg-bg-secondary rounded-xl p-4 md:p-5 border border-border">
            <h2 className="text-sm font-bold text-accent uppercase mb-3">Equipamento</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {orc.tipoEquipamento && <div><span className="text-text-secondary">Tipo:</span> <span className="font-medium text-text-primary capitalize">{orc.tipoEquipamento}</span></div>}
              {orc.marca && <div><span className="text-text-secondary">Marca:</span> <span className="font-medium text-text-primary">{orc.marca}</span></div>}
              {orc.modelo && <div><span className="text-text-secondary">Modelo:</span> <span className="font-medium text-text-primary">{orc.modelo}</span></div>}
              {orc.numeroSerie && <div><span className="text-text-secondary">Nº Série:</span> <span className="font-medium text-text-primary">{orc.numeroSerie}</span></div>}
            </div>
          </section>
        )}

        {/* Descrição */}
        <section className="bg-bg-secondary rounded-xl p-4 md:p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-3">{orc.modoEntrada ? 'Motivo da Entrada / Defeito Relatado' : 'Descrição do Problema / Serviço'}</h2>
          {editing ? (
            <textarea value={editForm.descricao} onChange={e => setEditForm((p: any) => ({ ...p, descricao: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm min-h-[80px]" />
          ) : (
            <p className="text-sm text-text-primary whitespace-pre-wrap">{orc.descricao}</p>
          )}
          {editing ? (
            <div className="mt-3">
              <label className="text-text-secondary text-xs uppercase block mb-1">Peças Necessárias</label>
              <input value={editForm.pecas} onChange={e => setEditForm((p: any) => ({ ...p, pecas: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm" placeholder="Peças necessárias" />
            </div>
          ) : orc.pecas ? (
            <div className="mt-3">
              <span className="text-text-secondary text-xs uppercase block mb-1">Peças Necessárias</span>
              <p className="text-sm text-text-primary">{orc.pecas}</p>
            </div>
          ) : null}
        </section>

        {/* Serviços */}
        {!orc.modoEntrada && <section className="bg-bg-secondary rounded-xl p-4 md:p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-3">Produtos / Serviços</h2>
          {editing ? (
            <div className="space-y-2">
              {editServicos.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={s.nome} onChange={e => updateServico(i, 'nome', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm min-h-[44px]" placeholder="Nome do serviço" />
                  <input type="number" step="0.01" value={s.valor || ''} onChange={e => updateServico(i, 'valor', parseFloat(e.target.value) || 0)}
                    className="w-28 px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm min-h-[44px]" placeholder="R$ 0,00" />
                  <button onClick={() => removeServico(i)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg min-h-[44px]">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={addServico} className="text-accent text-xs flex items-center gap-1 hover:underline mt-2">
                <Plus className="w-3 h-3" /> Adicionar serviço
              </button>
              <div className="flex justify-end pt-2 border-t border-border">
                <span className="text-sm font-bold text-accent">Total: R$ {editTotal.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {servicos.length === 0 && <p className="text-xs text-text-secondary">Nenhum serviço cadastrado</p>}
              {servicos.map((s: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-text-primary">{s.nome}</span>
                  <span className="text-accent font-medium">R$ {(s.valor || 0).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
            </div>
          )}
        </section>}

        {/* Financeiro */}
        {!orc.modoEntrada && <section className="bg-bg-secondary rounded-xl p-4 md:p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-3">Financeiro</h2>
          {editing ? (
            <div className="space-y-3">
              <div className="bg-accent/10 rounded-lg p-4 border border-accent/30">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">Valor Total (calculado)</span>
                  <span className="text-2xl font-bold text-accent">R$ {editTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary block mb-1">Forma de Pagamento</label>
                  <select value={editForm.formaPagamento} onChange={e => setEditForm((p: any) => ({ ...p, formaPagamento: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm min-h-[44px]">
                    <option value="">Selecione</option>
                    {Object.entries(paymentLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-secondary block mb-1">Parcelamento</label>
                  <select value={editForm.parcelamento} onChange={e => setEditForm((p: any) => ({ ...p, parcelamento: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm min-h-[44px]">
                    <option value="">À vista</option>
                    {[2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={String(n)}>{n}x</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-secondary block mb-1">Valor PIX / À Vista (R$)</label>
                  <input type="number" step="0.01" value={editForm.valorPixVista} onChange={e => setEditForm((p: any) => ({ ...p, valorPixVista: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm min-h-[44px]" placeholder="Valor com desconto" />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-accent/10 rounded-lg p-4 border border-accent/30 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">Valor Total</span>
                  <span className="text-2xl font-bold text-accent">R$ {(orc.valorTotal ?? 0).toFixed(2).replace('.', ',')}</span>
                </div>
                {orc.valorPixVista && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-text-secondary text-sm">Valor PIX / À Vista</span>
                    <span className="text-lg font-bold text-green-400">R$ {parseFloat(orc.valorPixVista).toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                {orc.parcelamento && parseFloat(orc.valorTotal) > 0 && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-text-secondary text-sm">Parcelamento</span>
                    <span className="text-sm font-medium text-text-primary">
                      {orc.parcelamento}x de R$ {(parseFloat(orc.valorTotal) / parseInt(orc.parcelamento)).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {orc.formaPagamento && (
                  <div><span className="text-text-secondary">Pagamento:</span> <span className="font-medium text-text-primary">{paymentLabels[orc.formaPagamento] || orc.formaPagamento}</span></div>
                )}
                <div><span className="text-text-secondary">Criado em:</span> <span className="font-medium text-text-primary">{new Date(orc.createdAt).toLocaleDateString('pt-BR')}</span></div>
              </div>
            </>
          )}
        </section>}

        {/* Observações */}
        <section className="bg-bg-secondary rounded-xl p-4 md:p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-3">Observações</h2>
          {editing ? (
            <textarea value={editForm.observacoes} onChange={e => setEditForm((p: any) => ({ ...p, observacoes: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm min-h-[80px]" placeholder="Observações do orçamento" />
          ) : (
            <p className="text-sm text-text-primary whitespace-pre-wrap">{orc.observacoes || 'Nenhuma observação'}</p>
          )}
        </section>
      </div>

      {/* Cancelar modal */}
      <Modal open={showCancelar} onClose={() => setShowCancelar(false)} title="Cancelar Orçamento">
        <p className="text-text-secondary text-sm mb-4">Tem certeza que deseja cancelar este orçamento? Ele será mantido no histórico.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowCancelar(false)} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-primary">Voltar</button>
          <button onClick={handleCancelar} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Cancelar Orçamento
          </button>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title={`Excluir Orçamento #${orc.numero}?`}>
        <p className="text-text-secondary text-sm mb-4">Esta ação não pode ser desfeita.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowDelete(false)} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-primary">Voltar</button>
          <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Excluir
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
