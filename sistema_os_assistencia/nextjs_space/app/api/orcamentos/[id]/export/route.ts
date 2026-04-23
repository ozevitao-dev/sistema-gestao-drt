import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildOrcamentoHtml, buildTermoEntradaHtml } from '@/lib/os-html-builder';
import { loadExportConfig, generatePdf } from '@/lib/export-helpers';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const orc = await prisma.orcamento.findUnique({
      where: { id: params.id }, include: { cliente: true },
    });
    if (!orc) return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });

    const { config, logoBase64 } = await loadExportConfig();
    const html = (orc as any).modoEntrada
      ? buildTermoEntradaHtml(orc, config, logoBase64)
      : buildOrcamentoHtml(orc, config, logoBase64);
    const prefix = (orc as any).modoEntrada ? 'ENTRADA' : 'ORC';
    return await generatePdf(html, `${prefix}-${orc.numero}`);
  } catch (error: any) {
    console.error('Export ORC PDF error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao exportar' }, { status: 500 });
  }
}
