'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Search, Phone, Trash2, Plus } from 'lucide-react';
import { todayISO_SP, nowTimeSP } from '@/lib/date-utils';

interface Marca { id: string; nome: string; modelos: { id: string; nome: string }[]; }
interface ServicoPadrao { id: string; nome: string; valor: number; }
interface ServicoSel { nome: string; valor: number; }

export default function NovaOSPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [phoneLookup, setPhoneLookup] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTel, setClienteTel] = useState('');
  const [lookupDone, setLookupDone] = useState(false);

  const [tipoEquipamento, setTipoEquipamento] = useState('notebook');
  const [marcaSel, setMarcaSel] = useState('');
  const [modeloSel, setModeloSel] = useState('');
  const [modeloCustom, setModeloCustom] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');

  const [servicosSel, setServicosSel] = useState<ServicoSel[]>([]);
  const [descricaoProblema, setDescricaoProblema] = useState('');
  const [diagnostico, setDiagnostico] = useState('');

  const [valorTotal, setValorTotal] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [parcelamento, setParcelamento] = useState('');
  const [valorPixVista, setValorPixVista] = useState('');

  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [tecnicoId, setTecnicoId] = useState('');
  const [dataPrevista, setDataPrevista] = useState('');
  const [dataEntrada, setDataEntrada] = useState('');
  const [horaAbertura, setHoraAbertura] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [servicosPadrao, setServicosPadrao] = useState<ServicoPadrao[]>([]);
  const [modelosFiltrados, setModelosFiltrados] = useState<{id:string;nome:string}[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [servicoBusca, setServicoBusca] = useState('');
  const [showSugestoes, setShowSugestoes] = useState(false);

  useEffect(() => {
    // Auto-fill data/hora de abertura com timezone SP
    setDataEntrada(todayISO_SP());
    setHoraAbertura(nowTimeSP());

    Promise.all([
      fetch('/api/tecnicos').then(r => r.ok ? r.json() : []),
      fetch('/api/marcas').then(r => r.ok ? r.json() : []),
      fetch('/api/servicos-padrao').then(r => r.ok ? r.json() : []),
    ]).then(([t, m, s]) => {
      setTecnicos(Array.isArray(t) ? t : []);
      setMarcas(Array.isArray(m) ? m : []);
      setServicosPadrao(Array.isArray(s) ? s : []);
    }).catch(() => {}).finally(() => setLoadingData(false));
  }, []);

  useEffect(() => {
    if (marcaSel) {
      const found = marcas.find(m => m.nome === marcaSel);
      setModelosFiltrados(found?.modelos || []);
    } else {
      setModelosFiltrados([]);
    }
    setModeloSel('');
    setModeloCustom('');
  }, [marcaSel, marcas]);

  useEffect(() => {
    if (servicosSel.length > 0) {
      setValorTotal(servicosSel.reduce((s, sv) => s + sv.valor, 0).toFixed(2));
    }
  }, [servicosSel]);

  const lookupClient = useCallback(async () => {
    if (!phoneLookup.trim()) return;
    setLookupDone(true);
    try {
      const r = await fetch(`/api/clientes?search=${encodeURIComponent(phoneLookup)}`);
      const data = await r.json();
      if (Array.isArray(data) && data.length > 0) {
        setClienteId(data[0].id);
        setClienteNome(data[0].nome);
        setClienteTel(data[0].telefone || data[0].whatsapp || phoneLookup);
      } else {
        setClienteId(''); setClienteNome(''); setClienteTel(phoneLookup);
      }
    } catch { setClienteId(''); }
  }, [phoneLookup]);

  const addServico = (nome: string) => {
    if (!nome.trim() || servicosSel.some(s => s.nome === nome)) return;
    setServicosSel([...servicosSel, { nome, valor: 0 }]);
    setServicoBusca('');
    setShowSugestoes(false);
  };

  const addServicoCustom = () => {
    if (!servicoBusca.trim()) return;
    addServico(servicoBusca.trim());
  };

  const sugestoesFiltradas = servicosPadrao
    .filter(sp => !servicosSel.some(s => s.nome === sp.nome))
    .filter(sp => !servicoBusca || sp.nome.toLowerCase().includes(servicoBusca.toLowerCase()));

  const updateServicoValor = (idx: number, val: string) => {
    const arr = [...servicosSel];
    arr[idx].valor = parseFloat(val) || 0;
    setServicosSel(arr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId && !clienteNome) { setError('Busque ou informe o cliente'); return; }
    if (!descricaoProblema.trim()) { setError('Descreva o problema'); return; }
    setSaving(true); setError('');

    let finalClienteId = clienteId;
    if (!finalClienteId) {
      const cr = await fetch('/api/clientes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: clienteNome, telefone: clienteTel, whatsapp: clienteTel }),
      });
      const cd = await cr.json();
      if (cd.id) finalClienteId = cd.id;
      else { setError('Erro ao cadastrar cliente'); setSaving(false); return; }
    }

    const finalModelo = modeloSel === '__custom__' ? modeloCustom : modeloSel;
    // Combine dataEntrada + horaAbertura into ISO string
    const dataEntradaISO = dataEntrada ? `${dataEntrada}T${horaAbertura || '12:00'}:00` : null;
    const body: any = {
      clienteId: finalClienteId, tipoEquipamento, marca: marcaSel, modelo: finalModelo, numeroSerie,
      descricaoProblema, diagnostico,
      servicoExecutado: servicosSel.map(s => s.nome).join(', '),
      valorTotal: parseFloat(valorTotal) || 0,
      formaPagamento: formaPagamento || null,
      observacoes: observacoes || null, tecnicoId: tecnicoId || null, dataPrevista: dataPrevista || null,
      dataEntrada: dataEntradaISO,
    };

    try {
      const r = await fetch('/api/ordens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await r.json();
      if (r.ok && data.id) router.push(`/ordens/${data.id}`);
      else setError(data.error || 'Erro ao criar OS');
    } catch { setError('Erro de conexão'); }
    setSaving(false);
  };

  const parcelas = parcelamento ? parseInt(parcelamento) : 0;
  const valorNum = parseFloat(valorTotal) || 0;
  const valorParcela = parcelas > 0 ? valorNum / parcelas : 0;
  const valorPix = valorPixVista ? parseFloat(valorPixVista) : valorNum;

  if (loadingData) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ordens" className="p-2 hover:bg-bg-secondary rounded-lg"><ArrowLeft className="w-5 h-5 text-text-secondary" /></Link>
        <h1 className="text-2xl font-bold text-text-primary">Nova Ordem de Serviço</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CLIENTE */}
        <section className="bg-bg-secondary rounded-xl p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-4">Cliente</h2>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input placeholder="Telefone do cliente" value={phoneLookup} onChange={e => { setPhoneLookup(e.target.value); setLookupDone(false); }}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), lookupClient())}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm" />
            </div>
            <button type="button" onClick={lookupClient} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium flex items-center gap-1"><Search className="w-4 h-4" />Buscar</button>
          </div>
          {lookupDone && !clienteId && <p className="text-xs text-yellow-400 mb-2">Cliente não encontrado. Preencha os dados abaixo.</p>}
          {lookupDone && clienteId && <p className="text-xs text-green-400 mb-2">Cliente encontrado: {clienteNome}</p>}
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Nome do cliente *" value={clienteNome} onChange={e => setClienteNome(e.target.value)} className="px-3 py-2.5 rounded-lg border text-sm" required />
            <input placeholder="Telefone" value={clienteTel} onChange={e => setClienteTel(e.target.value)} className="px-3 py-2.5 rounded-lg border text-sm" />
          </div>
        </section>

        {/* EQUIPAMENTO */}
        <section className="bg-bg-secondary rounded-xl p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-4">Equipamento</h2>
          <div className="grid grid-cols-2 gap-3">
            <select value={tipoEquipamento} onChange={e => setTipoEquipamento(e.target.value)} className="px-3 py-2.5 rounded-lg border text-sm">
              <option value="notebook">Notebook</option>
              <option value="desktop">Desktop</option>
            </select>
            <select value={marcaSel} onChange={e => setMarcaSel(e.target.value)} className="px-3 py-2.5 rounded-lg border text-sm">
              <option value="">Selecione a marca</option>
              {marcas.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
            </select>
            <div>
              <select value={modeloSel} onChange={e => setModeloSel(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border text-sm">
                <option value="">Selecione o modelo</option>
                {modelosFiltrados.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                <option value="__custom__">Outro (digitar)</option>
              </select>
              {modeloSel === '__custom__' && (
                <input placeholder="Digite o modelo" value={modeloCustom} onChange={e => setModeloCustom(e.target.value)} className="w-full mt-2 px-3 py-2.5 rounded-lg border text-sm" />
              )}
            </div>
            <input placeholder="Nº de Série (opcional)" value={numeroSerie} onChange={e => setNumeroSerie(e.target.value)} className="px-3 py-2.5 rounded-lg border text-sm" />
          </div>
        </section>

        {/* PROBLEMA */}
        <section className="bg-bg-secondary rounded-xl p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-4">Problema / Diagnóstico</h2>
          <textarea placeholder="Problema relatado pelo cliente *" value={descricaoProblema} onChange={e => setDescricaoProblema(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border text-sm min-h-[80px] mb-3" required />
          <textarea placeholder="Diagnóstico técnico (opcional)" value={diagnostico} onChange={e => setDiagnostico(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border text-sm min-h-[60px]" />
        </section>

        {/* SERVIÇOS */}
        <section className="bg-bg-secondary rounded-xl p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-4">Serviços</h2>
          <div className="relative mb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  placeholder="Buscar ou digitar serviço..."
                  value={servicoBusca}
                  onChange={e => { setServicoBusca(e.target.value); setShowSugestoes(true); }}
                  onFocus={() => setShowSugestoes(true)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); addServicoCustom(); }
                    if (e.key === 'Escape') setShowSugestoes(false);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm"
                />
              </div>
              {servicoBusca.trim() && (
                <button type="button" onClick={addServicoCustom} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Adicionar
                </button>
              )}
            </div>
            {showSugestoes && sugestoesFiltradas.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-bg-primary border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {sugestoesFiltradas.map(sp => (
                  <button key={sp.id} type="button"
                    onClick={() => addServico(sp.nome)}
                    className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-accent/10 hover:text-accent transition-colors border-b border-border/50 last:border-0">
                    {sp.nome}
                  </button>
                ))}
              </div>
            )}
          </div>
          {servicosSel.length > 0 && (
            <div className="space-y-2">
              {servicosSel.map((s, i) => (
                <div key={i} className="flex items-center gap-2 bg-bg-primary rounded-lg px-3 py-2">
                  <span className="flex-1 text-sm text-text-primary">{s.nome}</span>
                  <span className="text-xs text-text-secondary">R$</span>
                  <input type="number" step="0.01" value={s.valor || ''} placeholder="0,00"
                    onChange={e => updateServicoValor(i, e.target.value)}
                    className="w-24 px-2 py-1 rounded border text-sm text-right" />
                  <button type="button" onClick={() => setServicosSel(servicosSel.filter((_,idx) => idx !== i))} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <div className="text-right text-sm font-bold text-accent">Total: R$ {servicosSel.reduce((s, sv) => s + sv.valor, 0).toFixed(2)}</div>
            </div>
          )}
        </section>

        {/* FINANCEIRO */}
        <section className="bg-bg-secondary rounded-xl p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-4">Financeiro</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-text-secondary mb-1 block">Valor Total (R$)</label>
              <input type="number" step="0.01" placeholder="0,00" value={valorTotal} onChange={e => setValorTotal(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border text-sm font-bold text-lg" /></div>
            <div><label className="text-xs text-text-secondary mb-1 block">Forma de Pagamento</label>
              <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border text-sm">
                <option value="">Selecione</option><option value="pix">PIX</option><option value="dinheiro">Dinheiro</option>
                <option value="cartao_debito">Cartão Débito</option><option value="cartao_credito">Cartão Crédito</option>
                <option value="transferencia">Transferência</option><option value="boleto">Boleto</option>
              </select></div>
            <div><label className="text-xs text-text-secondary mb-1 block">Valor PIX/À Vista (R$)</label>
              <input type="number" step="0.01" placeholder="Desconto no PIX" value={valorPixVista} onChange={e => setValorPixVista(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border text-sm" /></div>
            <div><label className="text-xs text-text-secondary mb-1 block">Parcelas</label>
              <select value={parcelamento} onChange={e => setParcelamento(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border text-sm">
                <option value="">Sem parcelamento</option><option value="2">2x</option><option value="3">3x</option>
                <option value="4">4x</option><option value="5">5x</option><option value="6">6x</option>
                <option value="10">10x</option><option value="12">12x</option>
              </select></div>
          </div>
          <div className="mt-4 bg-accent/10 rounded-lg p-4 border border-accent/30">
            <div className="flex justify-between text-sm mb-1"><span className="text-text-secondary">Valor Total</span><span className="font-bold text-xl text-accent">R$ {valorNum.toFixed(2)}</span></div>
            {valorPixVista && <div className="flex justify-between text-sm mb-1"><span className="text-text-secondary">PIX/À Vista</span><span className="font-bold text-green-400">R$ {valorPix.toFixed(2)}</span></div>}
            {parcelas > 0 && <div className="flex justify-between text-sm"><span className="text-text-secondary">{parcelas}x</span><span className="font-bold text-text-primary">R$ {valorParcela.toFixed(2)} /parcela</span></div>}
          </div>
        </section>

        {/* DATA DE ABERTURA */}
        <section className="bg-bg-secondary rounded-xl p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-4">Data de Abertura</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Data de Entrada</label>
              <input type="date" value={dataEntrada} onChange={e => setDataEntrada(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border text-sm" />
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Hora de Abertura</label>
              <input type="time" value={horaAbertura} onChange={e => setHoraAbertura(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border text-sm" />
            </div>
          </div>
        </section>

        {/* ATRIBUIÇÃO + OBS */}
        <section className="bg-bg-secondary rounded-xl p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-4">Atribuição e Observações</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select value={tecnicoId} onChange={e => setTecnicoId(e.target.value)} className="px-3 py-2.5 rounded-lg border text-sm">
              <option value="">Técnico (opcional)</option>
              {tecnicos.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input type="date" value={dataPrevista} onChange={e => setDataPrevista(e.target.value)} className="px-3 py-2.5 rounded-lg border text-sm" />
          </div>
          <textarea placeholder="Observações (opcional)" value={observacoes} onChange={e => setObservacoes(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border text-sm min-h-[60px]" />
        </section>

        {error && <p className="text-red-400 text-sm text-center bg-red-400/10 p-3 rounded-lg">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full py-3 bg-accent hover:bg-accent-light text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Criar Ordem de Serviço
        </button>
      </form>
    </div>
  );
}
