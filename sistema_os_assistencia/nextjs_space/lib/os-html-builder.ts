// =============================================================================
//  Shared helpers for PDF/PNG export – OS, Orçamento, Termo, Venda, Remoto
// =============================================================================

const statusLabels: Record<string, string> = {
  aberta: 'Aberta', em_andamento: 'Em Andamento', aguardando_peca: 'Aguardando Peça',
  concluida: 'Concluída', cancelada: 'Cancelada',
};
const statusColors: Record<string, string> = {
  aberta: '#3b82f6', em_andamento: '#f59e0b', aguardando_peca: '#a855f7',
  concluida: '#22c55e', cancelada: '#ef4444',
};
const paymentLabels: Record<string, string> = {
  dinheiro: 'Dinheiro', pix: 'PIX', cartao_debito: 'Cartão Débito',
  cartao_credito: 'Cartão Crédito', transferencia: 'Transferência', boleto: 'Boleto',
};

function esc(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function fmtDate(d: any): string {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('pt-BR');
}
function fmtCurrency(v: number | null | undefined): string {
  return `R$ ${(v ?? 0).toFixed(2).replace('.', ',')}`;
}

export interface FullConfigData {
  nomeEmpresa?: string | null; subtituloEmpresa?: string | null; logoUrl?: string | null;
  endereco?: string | null; bairro?: string | null; cidade?: string | null; estado?: string | null;
  cep?: string | null; cnpj?: string | null; telefone?: string | null; whatsapp?: string | null;
  email?: string | null; textoCabecalho?: string | null;
  exibirEndereco?: boolean; exibirTelefone?: boolean; exibirWhatsapp?: boolean;
  exibirEmail?: boolean; exibirCnpj?: boolean; exibirNumeroOSNoTopo?: boolean;
  prefixoNumeroOS?: string | null; prefixoNumeroOrcamento?: string | null;
  posicaoLogo?: string | null; alinhamentoCabecalho?: string | null; corCabecalho?: string | null;
  garantiaDias?: number | null; textoGarantia?: string | null; textoBackup?: string | null;
  textoNaoRetirada?: string | null; textoPerdaGarantia?: string | null; observacaoOS?: string | null;
  usarMarcaDagua?: boolean; tamanhoLogo?: string | null;
}

// ---------------------------------------------------------------------------
//  Logo size helper
// ---------------------------------------------------------------------------
function logoSizes(tamanho: string | null | undefined): { h: string; w: string; hSm: string; wSm: string } {
  switch (tamanho) {
    case 'pequeno': return { h: '28px', w: '70px', hSm: '22px', wSm: '55px' };
    case 'grande':  return { h: '60px', w: '150px', hSm: '40px', wSm: '100px' };
    default:        return { h: '44px', w: '110px', hSm: '30px', wSm: '75px' };
  }
}

// ---------------------------------------------------------------------------
//  Build company info lines (vertical)
// ---------------------------------------------------------------------------
function buildInfoLines(cfg: FullConfigData, fs: string): string {
  const lines: string[] = [];
  if (cfg.exibirCnpj !== false && cfg.cnpj) lines.push(`CNPJ: ${esc(cfg.cnpj)}`);
  const addr = [cfg.endereco, cfg.bairro, cfg.cidade, cfg.estado, cfg.cep].filter(Boolean).join(', ');
  if (cfg.exibirEndereco !== false && addr) lines.push(esc(addr));
  if (cfg.exibirTelefone !== false && cfg.telefone) lines.push(`Tel: ${esc(cfg.telefone)}`);
  if (cfg.exibirWhatsapp !== false && cfg.whatsapp) lines.push(`WhatsApp: ${esc(cfg.whatsapp)}`);
  if (cfg.exibirEmail !== false && cfg.email) lines.push(`Email: ${esc(cfg.email)}`);
  if (lines.length === 0) return '';
  return lines.map(l => `<div style="font-size:${fs};color:#888;line-height:1.4;">${l}</div>`).join('');
}

// ---------------------------------------------------------------------------
//  Watermark HTML
// ---------------------------------------------------------------------------
function watermark(cfg: FullConfigData, logoSrc: string): string {
  if (!cfg.usarMarcaDagua || !logoSrc) return '';
  return `<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.04;pointer-events:none;z-index:0;"><img src="${logoSrc}" style="max-width:400px;max-height:400px;" /></div>`;
}

// ---------------------------------------------------------------------------
//  Signatures block
// ---------------------------------------------------------------------------
function signatures(small: boolean = false): string {
  const h = small ? '18px' : '30px';
  const fs = small ? '7px' : '9px';
  return `<div style="display:flex;gap:20px;margin-top:${small ? '6px' : '14px'};">
    <div style="flex:1;text-align:center;"><div style="border-bottom:1px solid #ccc;height:${h};"></div><span style="font-size:${fs};color:#888;">Assinatura do Cliente</span></div>
    <div style="flex:1;text-align:center;"><div style="border-bottom:1px solid #ccc;height:${h};"></div><span style="font-size:${fs};color:#888;">Assinatura do Técnico</span></div>
  </div>`;
}

// ---------------------------------------------------------------------------
//  Standard header for a "via" (small version for landscape 2-vias)
// ---------------------------------------------------------------------------
function buildViaHeader(cfg: FullConfigData, logoSrc: string, numberHtml: string, badgeHtml: string, viaLabel: string, small: boolean): string {
  const sz = logoSizes(cfg.tamanhoLogo);
  const logoH = small ? sz.hSm : sz.h;
  const logoW = small ? sz.wSm : sz.w;
  const logo = logoSrc ? `<img src="${logoSrc}" style="max-height:${logoH};max-width:${logoW};object-fit:contain;" />` : '';
  const nome = cfg.nomeEmpresa || 'Assistência Técnica';
  const nFs = small ? '11px' : '15px';
  const sFs = small ? '7px' : '9px';
  const iFs = small ? '6.5px' : '8px';

  return `<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e0e0e0;padding-bottom:6px;margin-bottom:8px;">
    <div style="display:flex;align-items:center;gap:8px;">
      ${logo}
      <div>
        <div style="font-size:${nFs};font-weight:700;color:#1a1a1a;">${esc(nome)}</div>
        ${cfg.subtituloEmpresa ? `<div style="font-size:${sFs};color:#888;">${esc(cfg.subtituloEmpresa)}</div>` : ''}
        ${buildInfoLines(cfg, iFs)}
      </div>
    </div>
    <div style="text-align:right;flex-shrink:0;">${numberHtml}${badgeHtml}<div style="font-size:${small ? '6px' : '8px'};color:#bbb;margin-top:2px;">${viaLabel}</div></div>
  </div>`;
}

// ---------------------------------------------------------------------------
//  Row & section helpers
// ---------------------------------------------------------------------------
function row(label: string, value: string, fs: string): string {
  return `<div style="display:flex;justify-content:space-between;padding:2px 0;font-size:${fs};border-bottom:1px solid #f0f0f0;"><span style="color:#888;">${label}</span><span style="font-weight:600;">${value}</span></div>`;
}
function sectionTitle(text: string, accent: string, fs: string): string {
  return `<div style="font-size:${fs};font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:0.3px;margin-bottom:4px;padding-bottom:2px;border-bottom:2px solid #e8e8f0;">${text}</div>`;
}

function buildTerms(cfg: FullConfigData, fs: string): string {
  const parts: string[] = [];
  if (cfg.garantiaDias && cfg.garantiaDias > 0) parts.push(`<strong>Garantia:</strong> ${cfg.garantiaDias} dias sobre o serviço executado.`);
  if (cfg.textoGarantia) parts.push(esc(cfg.textoGarantia));
  if (cfg.textoBackup) parts.push(esc(cfg.textoBackup));
  if (cfg.textoNaoRetirada) parts.push(esc(cfg.textoNaoRetirada));
  if (cfg.textoPerdaGarantia) parts.push(esc(cfg.textoPerdaGarantia));
  if (parts.length === 0) return '';
  return `<div style="margin-top:6px;padding:4px 8px;background:#f9f9f9;border:1px solid #e5e5e5;border-radius:3px;font-size:${fs};color:#555;line-height:1.3;">
    <div style="font-weight:700;color:#333;margin-bottom:2px;">TERMOS E GARANTIA</div>
    ${parts.map(p => `<div style="margin-bottom:1px;">• ${p}</div>`).join('')}
  </div>`;
}

// ---------------------------------------------------------------------------
//  Checklist builder (for Orçamento/Termo)
// ---------------------------------------------------------------------------
function buildChecklist(entradaJson: string | null | undefined, accent: string, fs: string): string {
  if (!entradaJson) return '';
  try {
    const entrada = JSON.parse(entradaJson);
    if (!entrada) return '';
    const tipoLabel: Record<string,string> = { notebook:'Notebook', desktop:'Desktop', servidor:'Servidor', outro:'Outro' };
    const checkLabels: Record<string,string> = { liga:'Liga', daVideo:'Dá vídeo', tecladoResponde:'Teclado responde', sinaisOxidacao:'Sinais de oxidação', marcasUso:'Marcas de uso' };
    const cl = entrada.checklist || {};
    const checkItems = Object.entries(checkLabels).map(([k, label]) => {
      const disabled = (k === 'daVideo' || k === 'tecladoResponde') && !cl.liga;
      if (disabled) return `<span style="display:inline-block;padding:1px 6px;margin:1px;border-radius:3px;font-size:${fs};background:#f1f5f9;color:#94a3b8;">— ${label}</span>`;
      const checked = cl[k];
      const bg = checked ? '#dcfce7' : '#fee2e2';
      const color = checked ? '#166534' : '#991b1b';
      const icon = checked ? '✓' : '✗';
      return `<span style="display:inline-block;padding:1px 6px;margin:1px;border-radius:3px;font-size:${fs};background:${bg};color:${color};font-weight:600;">${icon} ${label}</span>`;
    }).join('');
    return `<div style="margin-top:4px;">
      ${row('Tipo Equip.', tipoLabel[entrada.tipoEquipamento] || entrada.tipoEquipamento || 'N/A', fs)}
      ${entrada.descricaoEntrada ? `<div style="margin:3px 0;font-size:${fs};color:#444;">${esc(entrada.descricaoEntrada)}</div>` : ''}
      <div style="margin-top:3px;">${checkItems}</div>
    </div>`;
  } catch { return ''; }
}

// =============================================================================
//  WRAPPER: A4 Landscape with 2 vias side-by-side + optional watermark
// =============================================================================
function wrapLandscape2Vias(via1: string, via2: string, cfg: FullConfigData, logoSrc: string): string {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<style>
  @page { size: A4 landscape; margin: 6mm 8mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background:#fff; color:#1a1a1a; -webkit-font-smoothing:antialiased; }
  .container { display:flex; width:100%; min-height:100vh; }
  .via { flex:1; padding:10px 14px; position:relative; z-index:1; }
  .divider { width:0; border-left:2px dashed #ccc; position:relative; }
  .divider::after { content:'✂'; position:absolute; top:50%; left:-5px; transform:translateY(-50%); font-size:8px; color:#bbb; background:#fff; padding:2px 0; }
</style></head><body>
${watermark(cfg, logoSrc)}
<div class="container">
  <div class="via">${via1}</div>
  <div class="divider"></div>
  <div class="via">${via2}</div>
</div>
</body></html>`;
}

// =============================================================================
//  WRAPPER: A4 Portrait (single document)
// =============================================================================
function wrapPortrait(content: string, cfg: FullConfigData, logoSrc: string): string {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<style>
  @page { size: A4; margin: 10mm 12mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background:#fff; color:#1a1a1a; -webkit-font-smoothing:antialiased; position:relative; }
</style></head><body>
${watermark(cfg, logoSrc)}
<div style="position:relative;z-index:1;">${content}</div>
</body></html>`;
}

// =============================================================================
//  OS PDF – A4 Landscape, 2 vias lado a lado
// =============================================================================
export function buildOSHtml(ordem: any, config?: FullConfigData, logoBase64?: string): string {
  const cfg = config || {};
  const prefix = cfg.prefixoNumeroOS || 'OS';
  const sc = statusColors[ordem.status] || '#6b7280';
  const sl = statusLabels[ordem.status] || ordem.status;
  const logo = logoBase64 || cfg.logoUrl || '';
  const accent = cfg.corCabecalho || '#6c63ff';
  const fs = '8px';

  function buildVia(viaLabel: string): string {
    const numHtml = `<div style="font-size:14px;font-weight:800;color:#1a1a1a;"><span style="color:#888;font-weight:400;">${esc(prefix)}</span> ${ordem.numero}</div>`;
    const badgeHtml = `<div style="display:inline-block;padding:1px 8px;border-radius:8px;font-size:7px;font-weight:600;color:#fff;background:${sc};margin-top:1px;">${sl}</div>`;
    const header = buildViaHeader(cfg, logo, numHtml, badgeHtml, viaLabel, true);

    const cell = (label: string, value: string) => `<div style="margin-bottom:2px;"><span style="font-size:6.5px;color:#999;text-transform:uppercase;letter-spacing:0.3px;">${label}</span><div style="font-size:${fs};color:#333;font-weight:500;">${value}</div></div>`;

    const clienteBlock = `<div>${cell('Cliente', esc(ordem.cliente?.nome) || 'N/A')}${cell('Telefone', esc(ordem.cliente?.telefone) || 'N/A')}${ordem.cliente?.cpfCnpj ? cell('CPF/CNPJ', esc(ordem.cliente.cpfCnpj)) : ''}</div>`;
    const equipBlock = `<div>${cell('Equipamento', [(ordem.tipoEquipamento || '').charAt(0).toUpperCase() + (ordem.tipoEquipamento || '').slice(1), esc(ordem.marca), esc(ordem.modelo)].filter(Boolean).join(' · '))}${ordem.numeroSerie ? cell('Nº Série', esc(ordem.numeroSerie)) : ''}</div>`;
    const datesBlock = `<div>${cell('Entrada', fmtDate(ordem.dataEntrada || ordem.createdAt))}${ordem.dataPrevista ? cell('Previsão', fmtDate(ordem.dataPrevista)) : ''}${cell('Técnico', esc(ordem.tecnico?.name) || 'N/A')}</div>`;

    const descrBlock = (label: string, text: string) => text ? `<div style="margin-bottom:2px;"><span style="font-size:6.5px;color:#999;text-transform:uppercase;letter-spacing:0.3px;">${label}</span><div style="font-size:${fs};color:#444;line-height:1.3;max-height:24px;overflow:hidden;">${esc(text)}</div></div>` : '';
    const servicesBlock = `<div>${descrBlock('Problema', ordem.descricaoProblema || 'N/A')}${descrBlock('Diagnóstico', ordem.diagnostico)}${descrBlock('Serviço', ordem.servicoExecutado)}</div>`;

    const valorBox = `<div style="display:flex;align-items:center;justify-content:space-between;background:#f5f5f7;border-radius:4px;padding:3px 8px;margin-top:4px;"><div><span style="font-size:6.5px;color:#999;text-transform:uppercase;">Forma</span><div style="font-size:${fs};color:#555;">${paymentLabels[ordem.formaPagamento] || ordem.formaPagamento || '—'}</div></div><div style="text-align:right;"><span style="font-size:6.5px;color:#999;text-transform:uppercase;">Total</span><div style="font-size:13px;font-weight:800;color:#1a1a1a;">${fmtCurrency(ordem.valorTotal)}</div></div></div>`;

    return `${header}
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:4px;">${clienteBlock}${equipBlock}${datesBlock}</div>
      ${servicesBlock}
      ${valorBox}
      ${ordem.observacoes ? `<div style="margin-top:3px;padding:2px 6px;background:#fffbeb;border-radius:3px;font-size:7px;color:#92400e;"><strong>Obs:</strong> ${esc(ordem.observacoes)}</div>` : ''}
      ${buildTerms(cfg, '6.5px')}
      ${signatures(true)}`;
  }

  return wrapLandscape2Vias(
    buildVia('1ª Via – Estabelecimento'),
    buildVia('2ª Via – Cliente'),
    cfg, logo
  );
}

// =============================================================================
//  OS PNG – single card 800px wide
// =============================================================================
export function buildOSHtmlPng(ordem: any, config?: FullConfigData): string {
  const cfg = config || {};
  const accent = cfg.corCabecalho || '#6c63ff';
  const prefix = cfg.prefixoNumeroOS || 'OS';
  const sc = statusColors[ordem.status] || '#6b7280';
  const sl = statusLabels[ordem.status] || ordem.status;
  const logo = cfg.logoUrl || '';
  const fs = '13px';
  const sz = logoSizes(cfg.tamanhoLogo);

  const logoHtml = logo ? `<img src="${logo}" style="max-height:${sz.h};max-width:${sz.w};object-fit:contain;" />` : '';
  const numHtml = cfg.exibirNumeroOSNoTopo !== false ? `<div style="font-size:28px;font-weight:800;"><span style="color:${accent};">${esc(prefix)}</span> ${ordem.numero}</div>` : '';
  const badge = `<div style="display:inline-block;padding:4px 14px;border-radius:16px;font-size:12px;font-weight:600;color:#fff;background:${sc};margin-top:4px;">${sl}</div>`;
  const header = `<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ${accent};padding-bottom:8px;margin-bottom:10px;"><div style="display:flex;align-items:center;gap:10px;">${logoHtml}<div><div style="font-size:20px;color:${accent};font-weight:700;">${esc(cfg.nomeEmpresa || 'Assistência Técnica')}</div>${cfg.subtituloEmpresa ? `<div style="font-size:12px;color:#666;">${esc(cfg.subtituloEmpresa)}</div>` : ''}${buildInfoLines(cfg, '10px')}</div></div><div style="text-align:right;">${numHtml}${badge}</div></div>`;

  const section = (title: string, content: string) =>
    `<div style="background:#f8f9fc;border-radius:10px;padding:14px 18px;border:1px solid #e8e8f0;">${sectionTitle(title, accent, '13px')}${content}</div>`;

  const valorBox = `<div style="background:${accent};color:#fff;border-radius:8px;padding:8px 14px;display:flex;justify-content:space-between;align-items:center;margin-top:8px;"><span style="font-size:13px;font-weight:600;">VALOR TOTAL</span><span style="font-size:22px;font-weight:800;">${fmtCurrency(ordem.valorTotal)}</span></div>`;

  const textBlock = (label: string, text: string) =>
    `<div style="margin-bottom:8px;"><div style="font-size:10px;color:#888;font-weight:600;text-transform:uppercase;margin-bottom:3px;">${label}</div><div style="background:#fff;border:1px solid #e8e8f0;border-radius:6px;padding:8px 10px;font-size:${fs};color:#333;line-height:1.5;">${esc(text)}</div></div>`;

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; background:#fff; color:#1a1a2e; padding:30px; width:800px; }</style>
</head><body>
${header}
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
  ${section('Cliente', row('Nome', esc(ordem.cliente?.nome) || 'N/A', fs) + row('Telefone', esc(ordem.cliente?.telefone) || 'N/A', fs) + (ordem.cliente?.email ? row('E-mail', esc(ordem.cliente.email), fs) : ''))}
  ${section('Equipamento', row('Tipo', (ordem.tipoEquipamento || '').charAt(0).toUpperCase() + (ordem.tipoEquipamento || '').slice(1), fs) + row('Marca', esc(ordem.marca) || 'N/A', fs) + row('Modelo', esc(ordem.modelo) || 'N/A', fs))}
  ${section('Financeiro', row('Forma', paymentLabels[ordem.formaPagamento] || 'N/A', fs) + valorBox)}
  ${section('Status', row('Entrada', fmtDate(ordem.dataEntrada || ordem.createdAt), fs) + (ordem.dataPrevista ? row('Previsão', fmtDate(ordem.dataPrevista), fs) : ''))}
  <div style="grid-column:1/-1;background:#f8f9fc;border-radius:10px;padding:14px 18px;border:1px solid #e8e8f0;">${sectionTitle('Problema / Serviço', accent, '13px')}${textBlock('Problema Relatado', ordem.descricaoProblema || 'N/A')}${ordem.diagnostico ? textBlock('Diagnóstico', ordem.diagnostico) : ''}${ordem.servicoExecutado ? textBlock('Serviço Executado', ordem.servicoExecutado) : ''}</div>
</div>
${signatures(false)}
${buildTerms(cfg, '9px')}
</body></html>`;
}

// =============================================================================
//  Orçamento PDF – A4 portrait
// =============================================================================
export function buildOrcamentoHtml(orc: any, config?: FullConfigData, logoBase64?: string): string {
  const cfg = config || {};
  const accent = cfg.corCabecalho || '#6c63ff';
  const prefix = cfg.prefixoNumeroOrcamento || 'ORC';
  const logo = logoBase64 || cfg.logoUrl || '';
  const fs = '11px';
  const sz = logoSizes(cfg.tamanhoLogo);
  const statusMap: Record<string,{label:string,color:string}> = {
    pendente: {label:'Pendente',color:'#f59e0b'},
    aprovado: {label:'Aprovado',color:'#22c55e'},
    cancelado: {label:'Cancelado',color:'#ef4444'},
    recusado: {label:'Cancelado',color:'#ef4444'},
  };
  const st = statusMap[orc.status] || {label:orc.status,color:'#6b7280'};

  const logoHtml = logo ? `<img src="${logo}" style="max-height:${sz.h};max-width:${sz.w};object-fit:contain;" />` : '';
  const numHtml = `<div style="font-size:22px;font-weight:800;"><span style="color:${accent};">${esc(prefix)}</span> ${orc.numero}</div>`;
  const badge = `<div style="display:inline-block;padding:2px 12px;border-radius:12px;font-size:10px;font-weight:600;color:#fff;background:${st.color};margin-top:2px;">${st.label}</div>`;
  const header = `<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid ${accent};padding-bottom:8px;margin-bottom:10px;"><div style="display:flex;align-items:center;gap:10px;">${logoHtml}<div><div style="font-size:16px;color:${accent};font-weight:700;">${esc(cfg.nomeEmpresa || 'Assistência Técnica')}</div>${cfg.subtituloEmpresa ? `<div style="font-size:10px;color:#666;">${esc(cfg.subtituloEmpresa)}</div>` : ''}${buildInfoLines(cfg, '9px')}</div></div><div style="text-align:right;">${numHtml}${badge}</div></div>`;

  const section = (title: string, content: string) =>
    `<div style="background:#f8f9fc;border-radius:8px;padding:10px 14px;border:1px solid #e8e8f0;">${sectionTitle(title, accent, '11px')}${content}</div>`;

  let servicosHtml = '';
  try {
    const servicos = orc.servicos ? JSON.parse(orc.servicos) : [];
    if (servicos.length > 0) {
      servicosHtml = servicos.map((s: any) =>
        `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:${fs};border-bottom:1px solid #f0f0f5;"><span>${esc(s.nome)}</span><span style="font-weight:600;">${fmtCurrency(s.valor)}</span></div>`
      ).join('');
    }
  } catch {}

  const valorTotal = orc.valorTotal || 0;
  const valorPix = orc.valorPixVista || valorTotal;
  const parcelas = orc.parcelamento ? parseInt(orc.parcelamento) : 0;
  const valorParcela = parcelas > 0 ? valorTotal / parcelas : 0;

  const finContent = [
    `<div style="background:${accent};color:#fff;border-radius:6px;padding:8px 14px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><span style="font-size:12px;font-weight:600;">VALOR TOTAL</span><span style="font-size:20px;font-weight:800;">${fmtCurrency(valorTotal)}</span></div>`,
    valorPix !== valorTotal ? row('Valor PIX / À Vista', fmtCurrency(valorPix), fs) : '',
    parcelas > 0 ? row(`Parcelado ${parcelas}x`, `${fmtCurrency(valorParcela)} /parcela`, fs) : '',
    row('Forma de Pagamento', paymentLabels[orc.formaPagamento] || orc.formaPagamento || 'A definir', fs),
  ].join('');

  const textBlock = (label: string, text: string) =>
    `<div style="margin-bottom:6px;"><div style="font-size:9px;color:#888;font-weight:600;text-transform:uppercase;margin-bottom:2px;">${label}</div><div style="background:#fff;border:1px solid #e8e8f0;border-radius:4px;padding:5px 8px;font-size:${fs};color:#333;line-height:1.4;">${esc(text)}</div></div>`;

  const entradaHtml = orc.entradaEquipamento ? `<div style="grid-column:1/-1;background:#f0f7ff;border-radius:8px;padding:10px 14px;border:1px solid #bfdbfe;">${sectionTitle('Entrada do Equipamento', accent, '11px')}${buildChecklist(orc.entradaEquipamento, accent, '9px')}</div>` : '';

  const content = `${header}
<div style="text-align:center;font-size:10px;color:#888;margin-bottom:12px;">Data: ${fmtDate(orc.createdAt)}</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px;">
  ${section('Cliente', row('Nome', esc(orc.nomeCliente) || 'N/A', fs) + row('Telefone', esc(orc.telefoneCliente) || 'N/A', fs))}
  ${section('Equipamento', row('Tipo', (orc.tipoEquipamento || 'N/A').charAt(0).toUpperCase() + (orc.tipoEquipamento || '').slice(1), fs) + row('Marca', esc(orc.marca) || 'N/A', fs) + row('Modelo', esc(orc.modelo) || 'N/A', fs))}
  ${entradaHtml}
  <div style="grid-column:1/-1;">${section('Problema / Diagnóstico', textBlock('Problema Relatado', orc.descricao || 'N/A') + (orc.pecas ? textBlock('Peças', orc.pecas) : ''))}</div>
  ${servicosHtml ? `<div style="grid-column:1/-1;">${section('Produtos / Serviços', servicosHtml)}</div>` : ''}
  <div style="grid-column:1/-1;">${section('Financeiro', finContent)}</div>
</div>
${orc.observacoes ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:8px 10px;font-size:10px;color:#92400e;margin-bottom:8px;"><strong>Observações:</strong> ${esc(orc.observacoes)}</div>` : ''}
${signatures(false)}`;

  return wrapPortrait(content, cfg, logo);
}

// =============================================================================
//  Orçamento PNG
// =============================================================================
export function buildOrcamentoHtmlPng(orc: any, config?: FullConfigData): string {
  const cfg = config || {};
  const accent = cfg.corCabecalho || '#6c63ff';
  const prefix = cfg.prefixoNumeroOrcamento || 'ORC';
  const logo = cfg.logoUrl || '';
  const fs = '13px';
  const sz = logoSizes(cfg.tamanhoLogo);

  const logoHtml = logo ? `<img src="${logo}" style="max-height:${sz.h};max-width:${sz.w};object-fit:contain;" />` : '';
  const numHtml = `<div style="font-size:28px;font-weight:800;"><span style="color:${accent};">${esc(prefix)}</span> ${orc.numero}</div>`;
  const header = `<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ${accent};padding-bottom:8px;margin-bottom:10px;"><div style="display:flex;align-items:center;gap:10px;">${logoHtml}<div><div style="font-size:20px;color:${accent};font-weight:700;">${esc(cfg.nomeEmpresa || 'Assistência Técnica')}</div>${cfg.subtituloEmpresa ? `<div style="font-size:12px;color:#666;">${esc(cfg.subtituloEmpresa)}</div>` : ''}${buildInfoLines(cfg, '10px')}</div></div><div style="text-align:right;">${numHtml}</div></div>`;

  let servicosHtml = '';
  try {
    const servicos = orc.servicos ? JSON.parse(orc.servicos) : [];
    if (servicos.length > 0) {
      servicosHtml = servicos.map((s: any) =>
        `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:${fs};border-bottom:1px solid #f0f0f5;"><span>${esc(s.nome)}</span><span style="font-weight:600;">${fmtCurrency(s.valor)}</span></div>`
      ).join('');
    }
  } catch {}

  const valorTotal = orc.valorTotal || 0;
  const valorPix = orc.valorPixVista || valorTotal;
  const parcelas = orc.parcelamento ? parseInt(orc.parcelamento) : 0;
  const valorParcela = parcelas > 0 ? valorTotal / parcelas : 0;

  const entradaPngHtml = orc.entradaEquipamento ? `<div style="background:#f0f7ff;border-radius:10px;padding:14px 18px;border:1px solid #bfdbfe;margin-bottom:14px;">${sectionTitle('Entrada do Equipamento', accent, '13px')}${buildChecklist(orc.entradaEquipamento, accent, '11px')}</div>` : '';

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; background:#fff; color:#1a1a2e; padding:30px; width:800px; }</style>
</head><body>
${header}
<div style="text-align:center;font-size:11px;color:#888;margin-bottom:14px;">Data: ${fmtDate(orc.createdAt)}</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:14px;">
  <div style="background:#f8f9fc;border-radius:10px;padding:14px 18px;border:1px solid #e8e8f0;">${sectionTitle('Cliente', accent, '13px')}${row('Nome', esc(orc.nomeCliente) || 'N/A', fs)}${row('Telefone', esc(orc.telefoneCliente) || 'N/A', fs)}</div>
  <div style="background:#f8f9fc;border-radius:10px;padding:14px 18px;border:1px solid #e8e8f0;">${sectionTitle('Equipamento', accent, '13px')}${row('Tipo', (orc.tipoEquipamento||'').charAt(0).toUpperCase()+(orc.tipoEquipamento||'').slice(1), fs)}${row('Marca', esc(orc.marca)||'N/A', fs)}${row('Modelo', esc(orc.modelo)||'N/A', fs)}</div>
</div>
${entradaPngHtml}
<div style="background:#f8f9fc;border-radius:10px;padding:14px 18px;border:1px solid #e8e8f0;margin-bottom:14px;">${sectionTitle('Problema', accent, '13px')}<div style="font-size:${fs};line-height:1.5;">${esc(orc.descricao)}</div></div>
${servicosHtml ? `<div style="background:#f8f9fc;border-radius:10px;padding:14px 18px;border:1px solid #e8e8f0;margin-bottom:14px;">${sectionTitle('Produtos / Serviços', accent, '13px')}${servicosHtml}</div>` : ''}
<div style="background:#f8f9fc;border-radius:10px;padding:14px 18px;border:1px solid #e8e8f0;margin-bottom:14px;">
  ${sectionTitle('Financeiro', accent, '13px')}
  <div style="background:${accent};color:#fff;border-radius:8px;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><span style="font-size:14px;font-weight:600;">VALOR TOTAL</span><span style="font-size:24px;font-weight:800;">${fmtCurrency(valorTotal)}</span></div>
  ${valorPix !== valorTotal ? row('PIX / À Vista', fmtCurrency(valorPix), fs) : ''}
  ${parcelas > 0 ? row(`Parcelado ${parcelas}x`, `${fmtCurrency(valorParcela)} /parcela`, fs) : ''}
  ${row('Forma', paymentLabels[orc.formaPagamento] || 'A definir', fs)}
</div>
${signatures(false)}
</body></html>`;
}

// =============================================================================
//  Termo de Entrada PDF – A4 landscape, 2 vias
// =============================================================================
export function buildTermoEntradaHtml(orc: any, config?: FullConfigData, logoBase64?: string): string {
  const cfg = config || {};
  const accent = cfg.corCabecalho || '#6c63ff';
  const prefix = cfg.prefixoNumeroOrcamento || 'ORC';
  const logo = logoBase64 || cfg.logoUrl || '';
  const fs = '8px';

  function buildVia(viaLabel: string): string {
    const numHtml = `<div style="font-size:14px;font-weight:800;"><span style="color:${accent};">${esc(prefix)}</span> ${orc.numero}</div>`;
    const badgeHtml = `<div style="display:inline-block;padding:1px 8px;border-radius:8px;font-size:7px;font-weight:600;color:#fff;background:#f59e0b;margin-top:1px;">Entrada</div>`;
    const header = buildViaHeader(cfg, logo, numHtml, badgeHtml, viaLabel, true);

    const clienteInfo = `${row('Nome', esc(orc.nomeCliente) || 'N/A', fs)}${row('Telefone', esc(orc.telefoneCliente) || 'N/A', fs)}`;
    const equipInfo = `${row('Tipo', (orc.tipoEquipamento || 'N/A').charAt(0).toUpperCase() + (orc.tipoEquipamento || '').slice(1), fs)}${row('Marca', esc(orc.marca) || 'N/A', fs)}${row('Modelo', esc(orc.modelo) || 'N/A', fs)}${orc.numeroSerie ? row('Nº Série', esc(orc.numeroSerie), fs) : ''}`;

    const checklist = buildChecklist(orc.entradaEquipamento, accent, '7px');

    const declaracao = `<div style="margin-top:4px;padding:4px 6px;background:#fffbeb;border:1px solid #fde68a;border-radius:3px;font-size:6.5px;color:#78350f;line-height:1.4;">
      <div style="font-weight:700;margin-bottom:2px;">DECLARAÇÃO</div>
      Declaro que entreguei o equipamento para análise/reparo, ciente de que nenhum serviço será realizado sem aprovação do orçamento.
      ${cfg.textoNaoRetirada ? `<br/>• ${esc(cfg.textoNaoRetirada)}` : ''}
      ${cfg.textoBackup ? `<br/>• ${esc(cfg.textoBackup)}` : ''}
    </div>`;

    return `${header}
      <div style="text-align:center;font-size:9px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Termo de Entrada de Equipamento</div>
      <div style="text-align:center;font-size:7px;color:#888;margin-bottom:6px;">Data: ${fmtDate(orc.createdAt)}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:4px;">
        <div style="background:#f8f9fc;border-radius:4px;padding:6px 8px;border:1px solid #e8e8f0;">${sectionTitle('Cliente', accent, '8px')}${clienteInfo}</div>
        <div style="background:#f8f9fc;border-radius:4px;padding:6px 8px;border:1px solid #e8e8f0;">${sectionTitle('Equipamento', accent, '8px')}${equipInfo}</div>
      </div>
      ${checklist ? `<div style="background:#f0f7ff;border-radius:4px;padding:6px 8px;border:1px solid #bfdbfe;margin-bottom:4px;">${sectionTitle('Checklist de Entrada', accent, '8px')}${checklist}</div>` : ''}
      <div style="background:#f8f9fc;border-radius:4px;padding:6px 8px;border:1px solid #e8e8f0;margin-bottom:4px;">${sectionTitle('Defeito Relatado', accent, '8px')}<div style="font-size:${fs};color:#333;line-height:1.3;">${esc(orc.descricao) || 'N/A'}</div></div>
      ${orc.observacoes ? `<div style="font-size:7px;color:#555;margin-bottom:3px;"><strong>Obs:</strong> ${esc(orc.observacoes)}</div>` : ''}
      ${declaracao}
      ${signatures(true)}`;
  }

  return wrapLandscape2Vias(
    buildVia('1ª Via – Estabelecimento'),
    buildVia('2ª Via – Cliente'),
    cfg, logo
  );
}

// =============================================================================
//  Termo de Entrada PNG
// =============================================================================
export function buildTermoEntradaHtmlPng(orc: any, config?: FullConfigData): string {
  const cfg = config || {};
  const accent = cfg.corCabecalho || '#6c63ff';
  const prefix = cfg.prefixoNumeroOrcamento || 'ORC';
  const fs = '12px';
  const logo = cfg.logoUrl || '';
  const sz = logoSizes(cfg.tamanhoLogo);

  const logoHtml = logo ? `<img src="${logo}" style="max-height:${sz.h};max-width:${sz.w};object-fit:contain;" />` : '';
  const numHtml = `<div style="font-size:24px;font-weight:800;"><span style="color:${accent};">${esc(prefix)}</span> ${orc.numero}</div>`;
  const badge = `<div style="display:inline-block;padding:3px 14px;border-radius:12px;font-size:11px;font-weight:600;color:#fff;background:#f59e0b;margin-top:2px;">Entrada</div>`;
  const header = `<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ${accent};padding-bottom:8px;margin-bottom:10px;"><div style="display:flex;align-items:center;gap:10px;">${logoHtml}<div><div style="font-size:18px;color:${accent};font-weight:700;">${esc(cfg.nomeEmpresa || 'Assistência Técnica')}</div>${cfg.subtituloEmpresa ? `<div style="font-size:11px;color:#666;">${esc(cfg.subtituloEmpresa)}</div>` : ''}${buildInfoLines(cfg, '10px')}</div></div><div style="text-align:right;">${numHtml}${badge}</div></div>`;

  const checklist = buildChecklist(orc.entradaEquipamento, accent, '10px');

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:'Segoe UI',sans-serif; background:#fff; color:#1a1a2e; width:780px; padding:20px; }</style></head><body>
${header}
<div style="text-align:center;font-size:14px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Termo de Entrada de Equipamento</div>
<div style="text-align:center;font-size:11px;color:#888;margin-bottom:14px;">Data: ${fmtDate(orc.createdAt)}</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
  <div style="background:#f8f9fc;border-radius:8px;padding:10px 14px;border:1px solid #e8e8f0;">${sectionTitle('Cliente', accent, fs)}${row('Nome', esc(orc.nomeCliente) || 'N/A', fs)}${row('Telefone', esc(orc.telefoneCliente) || 'N/A', fs)}</div>
  <div style="background:#f8f9fc;border-radius:8px;padding:10px 14px;border:1px solid #e8e8f0;">${sectionTitle('Equipamento', accent, fs)}${row('Tipo', (orc.tipoEquipamento || 'N/A').charAt(0).toUpperCase() + (orc.tipoEquipamento || '').slice(1), fs)}${row('Marca', esc(orc.marca) || 'N/A', fs)}${row('Modelo', esc(orc.modelo) || 'N/A', fs)}</div>
</div>
${checklist ? `<div style="background:#f0f7ff;border-radius:8px;padding:12px 14px;border:1px solid #bfdbfe;margin-bottom:10px;">${sectionTitle('Checklist de Entrada', accent, fs)}${checklist}</div>` : ''}
<div style="background:#f8f9fc;border-radius:8px;padding:10px 14px;border:1px solid #e8e8f0;margin-bottom:10px;">${sectionTitle('Defeito Relatado', accent, fs)}<div style="font-size:${fs};color:#333;line-height:1.4;">${esc(orc.descricao) || 'N/A'}</div></div>
${orc.observacoes ? `<div style="background:#f8f9fc;border:1px solid #e8e8f0;border-radius:6px;padding:8px 10px;font-size:11px;color:#555;margin-bottom:10px;"><strong>Observações:</strong> ${esc(orc.observacoes)}</div>` : ''}
${signatures(false)}
</body></html>`;
}

// =============================================================================
//  Venda (Recibo) PDF – A4 Landscape, 2 vias
// =============================================================================
export function buildVendaHtml(venda: any, config?: FullConfigData, logoBase64?: string): string {
  const cfg = config || {};
  const logo = logoBase64 || cfg.logoUrl || '';
  const accent = cfg.corCabecalho || '#6c63ff';
  const fs = '8.5px';

  function buildVia(viaLabel: string): string {
    const numHtml = `<div style="font-size:13px;font-weight:800;color:#1a1a1a;">RECIBO DE VENDA</div>`;
    const badgeHtml = `<div style="display:inline-block;padding:1px 8px;border-radius:8px;font-size:7px;font-weight:600;color:#fff;background:#22c55e;margin-top:1px;">Pago</div>`;
    const header = buildViaHeader(cfg, logo, numHtml, badgeHtml, viaLabel, true);

    const descParts = (venda.descricao || '').split(' - ');
    const cliente = descParts.length > 1 ? descParts[0] : '';
    const descricao = descParts.length > 1 ? descParts.slice(1).join(' - ') : venda.descricao;

    return `${header}
      <div style="text-align:center;font-size:7px;color:#888;margin-bottom:6px;">Data: ${fmtDate(venda.data || venda.createdAt)}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px;">
        <div style="background:#f8f9fc;border-radius:4px;padding:6px 8px;border:1px solid #e8e8f0;">
          ${sectionTitle('Dados', accent, '8px')}
          ${cliente ? row('Cliente', esc(cliente), fs) : ''}
          ${row('Forma Pgto.', paymentLabels[venda.formaPagamento] || venda.formaPagamento || 'N/A', fs)}
        </div>
        <div style="background:#f8f9fc;border-radius:4px;padding:6px 8px;border:1px solid #e8e8f0;">
          ${sectionTitle('Valor', accent, '8px')}
          <div style="font-size:18px;font-weight:800;color:#1a1a1a;text-align:center;padding:4px 0;">${fmtCurrency(venda.valor)}</div>
        </div>
      </div>
      <div style="background:#f8f9fc;border-radius:4px;padding:6px 8px;border:1px solid #e8e8f0;margin-bottom:4px;">
        ${sectionTitle('Descrição', accent, '8px')}
        <div style="font-size:${fs};color:#333;line-height:1.3;">${esc(descricao) || 'N/A'}</div>
      </div>
      ${venda.observacoes ? `<div style="font-size:7px;color:#92400e;padding:2px 6px;background:#fffbeb;border-radius:3px;margin-bottom:4px;"><strong>Obs:</strong> ${esc(venda.observacoes)}</div>` : ''}
      ${signatures(true)}`;
  }

  return wrapLandscape2Vias(
    buildVia('1ª Via – Estabelecimento'),
    buildVia('2ª Via – Cliente'),
    cfg, logo
  );
}

// =============================================================================
//  Atendimento Remoto (Recibo) PDF – A4 Landscape, 2 vias
// =============================================================================
export function buildRemotoHtml(remoto: any, config?: FullConfigData, logoBase64?: string): string {
  const cfg = config || {};
  const logo = logoBase64 || cfg.logoUrl || '';
  const accent = cfg.corCabecalho || '#6c63ff';
  const fs = '8.5px';

  const statusMap: Record<string,{label:string,color:string}> = {
    pendente: {label:'Pendente',color:'#f59e0b'},
    concluido: {label:'Concluído',color:'#22c55e'},
    cancelado: {label:'Cancelado',color:'#ef4444'},
  };
  const st = statusMap[remoto.status] || {label:remoto.status,color:'#6b7280'};

  function buildVia(viaLabel: string): string {
    const numHtml = `<div style="font-size:13px;font-weight:800;color:#1a1a1a;">ATENDIMENTO REMOTO</div>`;
    const badgeHtml = `<div style="display:inline-block;padding:1px 8px;border-radius:8px;font-size:7px;font-weight:600;color:#fff;background:${st.color};margin-top:1px;">${st.label}</div>`;
    const header = buildViaHeader(cfg, logo, numHtml, badgeHtml, viaLabel, true);

    const tempoH = Math.floor((remoto.tempo || 0) / 60);
    const tempoM = Math.round((remoto.tempo || 0) % 60);
    const tempoStr = tempoH > 0 ? `${tempoH}h ${tempoM}min` : `${tempoM}min`;

    return `${header}
      <div style="text-align:center;font-size:7px;color:#888;margin-bottom:6px;">Data: ${fmtDate(remoto.data)}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px;">
        <div style="background:#f8f9fc;border-radius:4px;padding:6px 8px;border:1px solid #e8e8f0;">
          ${sectionTitle('Cliente', accent, '8px')}
          ${row('Nome', esc(remoto.cliente), fs)}
          ${row('Tempo', tempoStr, fs)}
          ${row('Valor/Hora', fmtCurrency(remoto.valorHora), fs)}
        </div>
        <div style="background:#f8f9fc;border-radius:4px;padding:6px 8px;border:1px solid #e8e8f0;">
          ${sectionTitle('Valor', accent, '8px')}
          <div style="font-size:18px;font-weight:800;color:#1a1a1a;text-align:center;padding:4px 0;">${fmtCurrency(remoto.valorTotal)}</div>
        </div>
      </div>
      <div style="background:#f8f9fc;border-radius:4px;padding:6px 8px;border:1px solid #e8e8f0;margin-bottom:4px;">
        ${sectionTitle('Descrição do Serviço', accent, '8px')}
        <div style="font-size:${fs};color:#333;line-height:1.3;">${esc(remoto.descricao) || 'N/A'}</div>
      </div>
      ${remoto.observacoes ? `<div style="font-size:7px;color:#92400e;padding:2px 6px;background:#fffbeb;border-radius:3px;margin-bottom:4px;"><strong>Obs:</strong> ${esc(remoto.observacoes)}</div>` : ''}
      ${signatures(true)}`;
  }

  return wrapLandscape2Vias(
    buildVia('1ª Via – Estabelecimento'),
    buildVia('2ª Via – Cliente'),
    cfg, logo
  );
}
