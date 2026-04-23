import { prisma } from '@/lib/prisma';
import { FullConfigData } from '@/lib/os-html-builder';

export async function loadExportConfig(): Promise<{ config: FullConfigData; logoBase64: string }> {
  const c = await prisma.configuracao.findUnique({ where: { id: 'config_unica' } });
  let logoBase64 = '';
  if (c?.logoUrl) {
    try {
      const r = await fetch(c.logoUrl);
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        const ct = r.headers.get('content-type') || 'image/png';
        logoBase64 = `data:${ct};base64,${buf.toString('base64')}`;
      }
    } catch {}
  }

  const config: FullConfigData = {
    nomeEmpresa: c?.nomeEmpresa, subtituloEmpresa: c?.subtituloEmpresa, logoUrl: c?.logoUrl,
    endereco: c?.endereco, bairro: c?.bairro, cidade: c?.cidade, estado: c?.estado, cep: c?.cep,
    cnpj: c?.cnpj, telefone: c?.telefone, whatsapp: c?.whatsapp, email: c?.email,
    textoCabecalho: c?.textoCabecalho,
    exibirEndereco: c?.exibirEndereco ?? true, exibirTelefone: c?.exibirTelefone ?? true,
    exibirWhatsapp: c?.exibirWhatsapp ?? true, exibirEmail: c?.exibirEmail ?? true,
    exibirCnpj: c?.exibirCnpj ?? true, exibirNumeroOSNoTopo: c?.exibirNumeroOSNoTopo ?? true,
    prefixoNumeroOS: c?.prefixoNumeroOS ?? 'OS', prefixoNumeroOrcamento: c?.prefixoNumeroOrcamento ?? 'ORC',
    posicaoLogo: c?.posicaoLogo ?? 'esquerda', alinhamentoCabecalho: c?.alinhamentoCabecalho ?? 'esquerda',
    corCabecalho: c?.corCabecalho ?? '#6c63ff',
    garantiaDias: c?.garantiaDias ?? 90, textoGarantia: c?.textoGarantia,
    textoBackup: c?.textoBackup, textoNaoRetirada: c?.textoNaoRetirada,
    textoPerdaGarantia: c?.textoPerdaGarantia, observacaoOS: c?.observacaoOS,
    usarMarcaDagua: c?.usarMarcaDagua ?? false,
    tamanhoLogo: c?.tamanhoLogo ?? 'medio',
  };

  return { config, logoBase64 };
}

export async function generatePdf(html: string, filename: string): Promise<Response> {
  const createRes = await fetch('https://apps.abacus.ai/api/createConvertHtmlToPdfRequest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deployment_token: process.env.ABACUSAI_API_KEY,
      html_content: html,
      pdf_options: { format: 'A4', print_background: true, margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' } },
      base_url: process.env.NEXTAUTH_URL || '',
    }),
  });
  if (!createRes.ok) throw new Error('Erro ao criar PDF');
  const { request_id } = await createRes.json();
  if (!request_id) throw new Error('Sem request_id');

  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 1500));
    const sr = await fetch('https://apps.abacus.ai/api/getConvertHtmlToPdfStatus', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id, deployment_token: process.env.ABACUSAI_API_KEY }),
    });
    const st = await sr.json();
    if (st?.status === 'SUCCESS' && st?.result?.result) {
      const buf = Buffer.from(st.result.result, 'base64');
      return new Response(buf, {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}.pdf"` },
      });
    }
    if (st?.status === 'FAILED') throw new Error(st?.result?.error || 'Falha PDF');
  }
  throw new Error('Timeout PDF');
}
