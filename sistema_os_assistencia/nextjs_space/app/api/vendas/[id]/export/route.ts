import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildVendaHtml } from '@/lib/os-html-builder';
import { loadExportConfig, generatePdf } from '@/lib/export-helpers';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const lancamento = await prisma.lancamento.findUnique({ where: { id: params.id } });
    if (!lancamento) return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });

    const { config, logoBase64 } = await loadExportConfig();
    const html = buildVendaHtml(lancamento, config, logoBase64);
    return await generatePdf(html, `Recibo-Venda-${lancamento.id.slice(-6)}`);
  } catch (error: any) {
    console.error('Export Venda PDF error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao exportar' }, { status: 500 });
  }
}
