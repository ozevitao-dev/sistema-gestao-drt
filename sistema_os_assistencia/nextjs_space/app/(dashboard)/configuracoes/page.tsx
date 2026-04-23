'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import NextImage from 'next/image';
import {
  Settings, Save, Loader2, Upload, Building2, FileText, Shield, Palette,
  Eye, EyeOff, Image as ImageIcon, X, Printer
} from 'lucide-react';

const TABS = [
  { id: 'empresa', label: 'Dados da Empresa', icon: Building2 },
  { id: 'cabecalho', label: 'Cabeçalho da OS', icon: FileText },
  { id: 'termos', label: 'Rodapé / Termos', icon: Shield },
  { id: 'pdf', label: 'Personalização do PDF', icon: Printer },
  { id: 'aparencia', label: 'Aparência', icon: Palette },
];

const defaultTermos = {
  textoGarantia: 'A garantia cobre apenas o serviço executado e/ou peça substituída, pelo prazo indicado, não abrangendo mau uso, quedas, oxidação, umidade, violação por terceiros ou danos externos.',
  textoBackup: 'É de responsabilidade do cliente realizar backup prévio de seus dados. A assistência técnica não se responsabiliza por eventual perda de dados.',
  textoNaoRetirada: 'Equipamentos não retirados no prazo informado poderão ser armazenados, descartados ou destinados conforme política da empresa e legislação aplicável.',
  textoPerdaGarantia: 'A garantia será perdida em caso de mau uso, queda, umidade, oxidação ou violação por terceiros não autorizados.',
};

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('empresa');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<any>({
    nomeEmpresa: '', subtituloEmpresa: '', logoUrl: '', logoCloudPath: '',
    endereco: '', bairro: '', cidade: '', estado: '', cep: '', cnpj: '',
    telefone: '', whatsapp: '', email: '', textoCabecalho: '',
    exibirEndereco: true, exibirTelefone: true, exibirWhatsapp: true,
    exibirEmail: true, exibirCnpj: true, exibirNumeroOSNoTopo: true,
    prefixoNumeroOS: 'OS', posicaoLogo: 'esquerda', alinhamentoCabecalho: 'esquerda',
    corCabecalho: '#6c63ff',
    garantiaDias: 90, textoGarantia: '', textoBackup: '', textoNaoRetirada: '', textoPerdaGarantia: '',
    tema: 'escuro', observacaoOS: '',
    usarMarcaDagua: false, tamanhoLogo: 'medio',
  });

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d && !d.error) {
        setForm((prev: any) => ({
          ...prev,
          ...Object.fromEntries(Object.entries(d).filter(([_, v]) => v !== null && v !== undefined)),
        }));
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const updateField = (field: string, value: any) => setForm((prev: any) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (res.ok) {
        setMsg('Configurações salvas com sucesso!');
        window.dispatchEvent(new Event('settings-change'));
        if (form.tema) window.dispatchEvent(new CustomEvent('theme-change', { detail: form.tema }));
      } else { setMsg('Erro ao salvar'); }
    } catch { setMsg('Erro ao salvar'); }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const presRes = await fetch('/api/upload/presigned', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, isPublic: true }),
      });
      const { uploadUrl, cloud_storage_path } = await presRes.json();
      const headers: any = { 'Content-Type': file.type };
      if (uploadUrl.includes('content-disposition')) headers['Content-Disposition'] = 'attachment';
      await fetch(uploadUrl, { method: 'PUT', headers, body: file });
      const urlParts = uploadUrl.split('?')[0];
      updateField('logoUrl', urlParts);
      updateField('logoCloudPath', cloud_storage_path);
    } catch (err) { console.error(err); setMsg('Erro no upload'); }
    setUploading(false);
  };

  const ToggleField = ({ label, field }: { label: string; field: string }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-text-primary">{label}</span>
      <button
        type="button"
        onClick={() => updateField(field, !form[field])}
        className={`relative w-11 h-6 rounded-full transition-colors ${form[field] ? 'bg-accent' : 'bg-border'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form[field] ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Settings className="w-6 h-6 text-accent" /> Configurações
          </h1>
          <p className="text-text-secondary mt-1">Personalize o sistema e o layout das OS</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 bg-accent hover:bg-accent-light text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2 w-fit">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar Tudo
        </button>
      </div>

      {msg && <div className={`p-3 rounded-lg text-sm ${msg.includes('sucesso') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{msg}</div>}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-bg-secondary text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-bg-secondary rounded-xl p-6 shadow-lg space-y-5">

        {/* DADOS DA EMPRESA */}
        {activeTab === 'empresa' && (
          <>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2"><Building2 className="w-5 h-5 text-accent" /> Dados da Empresa</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm text-text-secondary mb-1">Logo da Empresa</label>
                <div className="flex items-center gap-4">
                  {form.logoUrl ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-bg-primary border border-border">
                      <NextImage src={form.logoUrl} alt="Logo da empresa" fill className="object-contain" unoptimized />
                      <button onClick={() => { updateField('logoUrl', ''); updateField('logoCloudPath', ''); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-bg-primary border-2 border-dashed border-border flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-text-secondary" />
                    </div>
                  )}
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-accent/10 text-accent rounded-lg text-sm font-medium hover:bg-accent/20 transition-all flex items-center gap-2">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {uploading ? 'Enviando...' : 'Upload Logo'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadLogo} className="hidden" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Nome da Empresa</label>
                <input value={form.nomeEmpresa || ''} onChange={e => updateField('nomeEmpresa', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm" placeholder="Nome da empresa" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Subtítulo / Slogan</label>
                <input value={form.subtituloEmpresa || ''} onChange={e => updateField('subtituloEmpresa', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm" placeholder="Ex: Notebooks & Desktops" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">CNPJ</label>
                <input value={form.cnpj || ''} onChange={e => updateField('cnpj', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm" placeholder="00.000.000/0001-00" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Telefone</label>
                <input value={form.telefone || ''} onChange={e => updateField('telefone', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm" placeholder="(00) 0000-0000" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">WhatsApp</label>
                <input value={form.whatsapp || ''} onChange={e => updateField('whatsapp', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm" placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">E-mail</label>
                <input value={form.email || ''} onChange={e => updateField('email', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm" placeholder="contato@empresa.com" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-text-secondary mb-1">Endereço</label>
                <input value={form.endereco || ''} onChange={e => updateField('endereco', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm" placeholder="Rua, número" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Bairro</label>
                <input value={form.bairro || ''} onChange={e => updateField('bairro', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Cidade</label>
                <input value={form.cidade || ''} onChange={e => updateField('cidade', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Estado</label>
                <input value={form.estado || ''} onChange={e => updateField('estado', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm" placeholder="SP" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">CEP</label>
                <input value={form.cep || ''} onChange={e => updateField('cep', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm" placeholder="00000-000" />
              </div>
            </div>
          </>
        )}

        {/* CABEÇALHO DA OS */}
        {activeTab === 'cabecalho' && (
          <>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2"><FileText className="w-5 h-5 text-accent" /> Cabeçalho da OS</h2>
            <p className="text-sm text-text-secondary">Configure quais informações aparecem no cabeçalho das Ordens de Serviço exportadas.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Prefixo do Número da OS</label>
                <input value={form.prefixoNumeroOS || ''} onChange={e => updateField('prefixoNumeroOS', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm" placeholder="OS" />
                <p className="text-xs text-text-secondary mt-1">Ex: OS, O.S., Nº, DRT-OS</p>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Cor Principal do Cabeçalho</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.corCabecalho || '#6c63ff'} onChange={e => updateField('corCabecalho', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" style={{ padding: '2px' }} />
                  <input value={form.corCabecalho || '#6c63ff'} onChange={e => updateField('corCabecalho', e.target.value)} className="flex-1 px-4 py-2.5 rounded-lg border text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Posição da Logo</label>
                <select value={form.posicaoLogo || 'esquerda'} onChange={e => updateField('posicaoLogo', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm">
                  <option value="esquerda">Esquerda</option>
                  <option value="centro">Centro</option>
                  <option value="direita">Direita</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Alinhamento do Cabeçalho</label>
                <select value={form.alinhamentoCabecalho || 'esquerda'} onChange={e => updateField('alinhamentoCabecalho', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm">
                  <option value="esquerda">Esquerda</option>
                  <option value="centro">Centro</option>
                  <option value="direita">Direita</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-text-secondary mb-1">Texto Complementar do Cabeçalho</label>
                <textarea value={form.textoCabecalho || ''} onChange={e => updateField('textoCabecalho', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm" rows={2} placeholder="Texto adicional abaixo do cabeçalho" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Exibir / Ocultar Campos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <ToggleField label="Endereço" field="exibirEndereco" />
                <ToggleField label="Telefone" field="exibirTelefone" />
                <ToggleField label="WhatsApp" field="exibirWhatsapp" />
                <ToggleField label="E-mail" field="exibirEmail" />
                <ToggleField label="CNPJ" field="exibirCnpj" />
                <ToggleField label="Número da OS no Topo" field="exibirNumeroOSNoTopo" />
              </div>
            </div>
          </>
        )}

        {/* TERMOS */}
        {activeTab === 'termos' && (
          <>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2"><Shield className="w-5 h-5 text-accent" /> Rodapé / Termos e Garantia</h2>
            <p className="text-sm text-text-secondary">Estes textos serão exibidos no rodapé das OS exportadas (PDF/PNG).</p>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Prazo de Garantia (dias)</label>
                <input type="number" value={form.garantiaDias ?? 90} onChange={e => updateField('garantiaDias', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm max-w-[200px]" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Texto de Garantia</label>
                <textarea value={form.textoGarantia || ''} onChange={e => updateField('textoGarantia', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm" rows={3} placeholder={defaultTermos.textoGarantia} />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Texto sobre Backup de Dados</label>
                <textarea value={form.textoBackup || ''} onChange={e => updateField('textoBackup', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm" rows={3} placeholder={defaultTermos.textoBackup} />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Texto sobre Equipamentos Não Retirados</label>
                <textarea value={form.textoNaoRetirada || ''} onChange={e => updateField('textoNaoRetirada', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm" rows={3} placeholder={defaultTermos.textoNaoRetirada} />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Texto sobre Perda de Garantia</label>
                <textarea value={form.textoPerdaGarantia || ''} onChange={e => updateField('textoPerdaGarantia', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm" rows={3} placeholder={defaultTermos.textoPerdaGarantia} />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Observação Padrão da OS (exibida em exportações)</label>
                <textarea value={form.observacaoOS || ''} onChange={e => updateField('observacaoOS', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm" rows={3} placeholder="Observações gerais" />
              </div>
            </div>
          </>
        )}

        {/* PERSONALIZAÇÃO DO PDF */}
        {activeTab === 'pdf' && (
          <>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2"><Printer className="w-5 h-5 text-accent" /> Personalização do PDF</h2>
            <p className="text-sm text-text-secondary">Ajuste a aparência dos documentos exportados em PDF (OS, Termo, Venda, Atendimento Remoto).</p>
            <div className="space-y-6 mt-4">
              <ToggleField label="Exibir marca d'água (logo de fundo)" field="usarMarcaDagua" />
              <div>
                <label className="block text-sm text-text-secondary mb-1">Tamanho da Logo no Cabeçalho</label>
                <select value={form.tamanhoLogo || 'medio'} onChange={e => updateField('tamanhoLogo', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm max-w-xs">
                  <option value="pequeno">Pequeno</option>
                  <option value="medio">Médio</option>
                  <option value="grande">Grande</option>
                </select>
                <p className="text-xs text-text-secondary mt-1">Define o tamanho da logo exibida no topo dos PDFs gerados.</p>
              </div>
            </div>
          </>
        )}

        {/* APARÊNCIA */}
        {activeTab === 'aparencia' && (
          <>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2"><Palette className="w-5 h-5 text-accent" /> Aparência</h2>
            <div className="mt-4">
              <label className="block text-sm text-text-secondary mb-3">Tema do Sistema</label>
              <div className="flex gap-4">
                {['escuro', 'claro'].map(t => (
                  <button
                    key={t}
                    onClick={() => updateField('tema', t)}
                    className={`px-6 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                      form.tema === t ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:border-text-secondary'
                    }`}
                  >
                    {t === 'escuro' ? '🌙 Escuro' : '☀️ Claro'}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
