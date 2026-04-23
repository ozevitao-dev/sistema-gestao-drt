import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildOrcamentoHtmlPng, buildTermoEntradaHtmlPng } from '@/lib/os-html-builder';
import { loadExportConfig } from '@/lib/export-helpers';

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
    const cfg = { ...config, logoUrl: logoBase64 || config.logoUrl };
    const html = (orc as any).modoEntrada
      ? buildTermoEntradaHtmlPng(orc, cfg)
      : buildOrcamentoHtmlPng(orc, cfg);
    const prefix = (orc as any).modoEntrada ? 'ENTRADA' : 'ORC';
    return NextResponse.json({ success: true, html, filename: `${prefix}-${orc.numero}` });
  } catch (error: any) {
    console.error('Export ORC PNG error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao exportar' }, { status: 500 });
  }
}
