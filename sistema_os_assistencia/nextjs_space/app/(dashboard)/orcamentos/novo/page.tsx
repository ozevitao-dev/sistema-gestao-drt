'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, FileText, Search, Phone, Trash2, Plus, ClipboardCheck, PackageOpen } from 'lucide-react';

interface Marca { id: string; nome: string; modelos: { id: string; nome: string }[]; }
interface ServicoPadrao { id: string; nome: string; valor: number; }
interface ServicoSel { nome: string; valor: number; }

interface EntradaChecklist {
  liga: boolean;
  daVideo: boolean;
  tecladoResponde: boolean;
  sinaisOxidacao: boolean;
  marcasUso: boolean;
}

export default function NovoOrcamentoPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [modoEntrada, setModoEntrada] = useState(false);

  // Client
  const [phoneLookup, setPhoneLookup] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [lookupDone, setLookupDone] = useState(false);
  const [clienteFound, setClienteFound] = useState(false);

  // Entrada do Equipamento
  const [entradaTipo, setEntradaTipo] = useState('notebook');
  const [entradaDescricao, setEntradaDescricao] = useState('');
  const [entradaChecklist, setEntradaChecklist] = useState<EntradaChecklist>({
    liga: false, daVideo: false, tecladoResponde: false, sinaisOxidacao: false, marcasUso: false,
  });

  const toggleCheck = (key: keyof EntradaChecklist) => {
    setEntradaChecklist(prev => {
      const next = { ...prev, [key]: !prev[key] };
      // Se "liga" for desmarcado, desabilitar "dá vídeo" e "teclado responde"
      if (key === 'liga' && !next.liga) {
        next.daVideo = false;
        next.tecladoResponde = false;
      }
      return next;
    });
  };

  // Equipment
  const [tipoEquipamento, setTipoEquipamento] = useState('notebook');
  const [marcaSel, setMarcaSel] = useState('');
  const [modeloSel, setModeloSel] = useState('');
  const [modeloCustom, setModeloCustom] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');

  // Problem
  const [descricao, setDescricao] = useState('');
  const [pecas, setPecas] = useState('');

  // Services
  const [servicosSel, setServicosSel] = useState<ServicoSel[]>([]);

  // Financial
  const [valorTotal, setValorTotal] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [parcelamento, setParcelamento] = useState('');
  const [valorPixVista, setValorPixVista] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Catalogs
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [servicosPadrao, setServicosPadrao] = useState<ServicoPadrao[]>([]);
  const [modelosFiltrados, setModelosFiltrados] = useState<{id:string;nome:string}[]>([]);
  const [servicoBusca, setServicoBusca] = useState('');
  const [showSugestoes, setShowSugestoes] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/marcas').then(r => r.ok ? r.json() : []),
      fetch('/api/servicos-padrao').then(r => r.ok ? r.json() : []),
    ]).then(([m, s]) => {
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
    setModeloSel(''); setModeloCustom('');
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
        setNomeCliente(data[0].nome);
        setTelefoneCliente(data[0].telefone || data[0].whatsapp || phoneLookup);
        setClienteFound(true);
      } else {
        setNomeCliente(''); setTelefoneCliente(phoneLookup); setClienteFound(false);
      }
    } catch { setClienteFound(false); }
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
    if (!nomeCliente.trim() || !telefoneCliente.trim()) { setError('Nome e telefone são obrigatórios'); return; }
    if (!modoEntrada && !descricao.trim()) { setError('Descreva o problema/serviço'); return; }
    setSaving(true); setError('');

    const finalModelo = modeloSel === '__custom__' ? modeloCustom : modeloSel;
    const entradaEquipamento = JSON.stringify({
      tipoEquipamento: entradaTipo,
      descricaoEntrada: entradaDescricao,
      checklist: entradaChecklist,
    });
    const body = {
      nomeCliente, telefoneCliente,
      tipoEquipamento, marca: marcaSel, modelo: finalModelo, numeroSerie,
      descricao: modoEntrada ? (descricao || entradaDescricao || 'Entrada de equipamento') : descricao,
      pecas: modoEntrada ? null : pecas,
      servicos: modoEntrada ? null : (servicosSel.length > 0 ? JSON.stringify(servicosSel) : null),
      valorTotal: modoEntrada ? 0 : (parseFloat(valorTotal) || 0),
      formaPagamento: modoEntrada ? null : (formaPagamento || null),
      parcelamento: modoEntrada ? null : (parcelamento || null),
      valorPixVista: modoEntrada ? null : (valorPixVista || null),
      observacoes: observacoes || null,
      entradaEquipamento,
      modoEntrada,
    };

    try {
      const r = await fetch('/api/orcamentos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok) { setError(data?.error ?? 'Erro'); setSaving(false); return; }
      router.push(`/orcamentos/${data.id}`);
    } catch { setError('Erro ao criar orçamento'); }
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
        <Link href="/orcamentos" className="p-2 hover:bg-bg-secondary rounded-lg"><ArrowLeft className="w-5 h-5 text-text-secondary" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            {modoEntrada ? <PackageOpen className="w-6 h-6 text-amber-500" /> : <FileText className="w-6 h-6 text-accent" />}
            {modoEntrada ? 'Entrada de Equipamento' : 'Novo Orçamento'}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {modoEntrada ? 'Registre a entrada sem valor — evolua para orçamento depois' : 'Cliente cadastrado automaticamente'}
          </p>
        </div>
      </div>

      {/* MODO TOGGLE */}
      <div className="flex gap-2 mb-6">
        <button type="button" onClick={() => setModoEntrada(false)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all border ${
            !modoEntrada ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' : 'bg-bg-secondary text-text-secondary border-border hover:border-accent/50'
          }`}>
          <FileText className="w-4 h-4" /> Orçamento Completo
        </button>
        <button type="button" onClick={() => setModoEntrada(true)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all border ${
            modoEntrada ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-600/20' : 'bg-bg-secondary text-text-secondary border-border hover:border-amber-500/50'
          }`}>
          <PackageOpen className="w-4 h-4" /> Apenas Entrada
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CLIENTE */}
        <section className="bg-bg-secondary rounded-xl p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-4">Cliente</h2>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input placeholder="Telefone / WhatsApp" value={phoneLookup} onChange={e => { setPhoneLookup(e.target.value); setLookupDone(false); }}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), lookupClient())}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm" />
            </div>
            <button type="button" onClick={lookupClient} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium flex items-center gap-1"><Search className="w-4 h-4" />Buscar</button>
          </div>
          {lookupDone && !clienteFound && <p className="text-xs text-yellow-400 mb-2">Cliente não encontrado. Preencha abaixo.</p>}
          {lookupDone && clienteFound && <p className="text-xs text-green-400 mb-2">Cliente encontrado: {nomeCliente}</p>}
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Nome do cliente *" value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} className="px-3 py-2.5 rounded-lg border text-sm" required />
            <input placeholder="Telefone *" value={telefoneCliente} onChange={e => setTelefoneCliente(e.target.value)} className="px-3 py-2.5 rounded-lg border text-sm" required />
          </div>
        </section>

        {/* ENTRADA DO EQUIPAMENTO */}
        <section className="bg-bg-secondary rounded-xl p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-4 flex items-center gap-2"><ClipboardCheck className="w-4 h-4" />Entrada do Equipamento</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Tipo de Equipamento</label>
              <select value={entradaTipo} onChange={e => setEntradaTipo(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border text-sm">
                <option value="notebook">Notebook</option>
                <option value="desktop">Desktop</option>
                <option value="servidor">Servidor</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs text-text-secondary mb-1 block">Descrição da Entrada</label>
            <textarea placeholder="Estado geral do equipamento ao receber, detalhes visuais, acessórios..." value={entradaDescricao} onChange={e => setEntradaDescricao(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border text-sm min-h-[60px]" />
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-2 block font-semibold">Checklist de Entrada</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {([
                { key: 'liga' as const, label: 'Liga', disabled: false },
                { key: 'daVideo' as const, label: 'Dá vídeo', disabled: !entradaChecklist.liga },
                { key: 'tecladoResponde' as const, label: 'Teclado responde', disabled: !entradaChecklist.liga },
                { key: 'sinaisOxidacao' as const, label: 'Sinais de oxidação', disabled: false },
                { key: 'marcasUso' as const, label: 'Marcas de uso', disabled: false },
              ]).map(item => (
                <label key={item.key} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                  item.disabled ? 'opacity-40 cursor-not-allowed bg-bg-primary' :
                  entradaChecklist[item.key] ? 'border-accent bg-accent/10' : 'border-border bg-bg-primary hover:border-accent/50'
                }`}>
                  <input type="checkbox" checked={entradaChecklist[item.key]} disabled={item.disabled}
                    onChange={() => !item.disabled && toggleCheck(item.key)}
                    className="w-4 h-4 rounded accent-[#2563eb]" />
                  <span className="text-sm text-text-primary">{item.label}</span>
                  {item.disabled && <span className="text-[10px] text-text-secondary ml-auto">(equipamento não liga)</span>}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* EQUIPAMENTO */}
        <section className="bg-bg-secondary rounded-xl p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-4">Equipamento</h2>
          <div className="grid grid-cols-2 gap-3">
            <select value={tipoEquipamento} onChange={e => setTipoEquipamento(e.target.value)} className="px-3 py-2.5 rounded-lg border text-sm">
              <option value="notebook">Notebook</option><option value="desktop">Desktop</option>
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
          <h2 className="text-sm font-bold text-accent uppercase mb-4">{modoEntrada ? 'Observações' : 'Problema / Serviço'}</h2>
          <textarea placeholder={modoEntrada ? 'Observações sobre a entrada (opcional)' : 'Problema relatado / Descrição do serviço *'} value={descricao} onChange={e => setDescricao(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border text-sm min-h-[80px] mb-3" required={!modoEntrada} />
          {!modoEntrada && (
            <textarea placeholder="Peças necessárias (opcional)" value={pecas} onChange={e => setPecas(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border text-sm min-h-[50px]" />
          )}
        </section>

        {/* SERVIÇOS */}
        {!modoEntrada && <section className="bg-bg-secondary rounded-xl p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-4">Produtos / Serviços</h2>
          <div className="relative mb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  placeholder="Buscar ou digitar produto/serviço..."
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
        </section>}

        {/* FINANCEIRO */}
        {!modoEntrada && <section className="bg-bg-secondary rounded-xl p-5 border border-border">
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
              <input type="number" step="0.01" placeholder="Desconto" value={valorPixVista} onChange={e => setValorPixVista(e.target.value)}
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
        </section>}

        {/* OBSERVAÇÕES */}
        <section className="bg-bg-secondary rounded-xl p-5 border border-border">
          <h2 className="text-sm font-bold text-accent uppercase mb-4">Observações</h2>
          <textarea placeholder="Observações (opcional)" value={observacoes} onChange={e => setObservacoes(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border text-sm min-h-[60px]" />
        </section>

        {error && <p className="text-red-400 text-sm text-center bg-red-400/10 p-3 rounded-lg">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full py-3 bg-accent hover:bg-accent-light text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {modoEntrada ? 'Registrar Entrada' : 'Criar Orçamento'}
        </button>
      </form>
    </div>
  );
}
