import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildRemotoHtml } from '@/lib/os-html-builder';
import { loadExportConfig, generatePdf } from '@/lib/export-helpers';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const remoto = await prisma.atendimentoRemoto.findUnique({ where: { id: params.id } });
    if (!remoto) return NextResponse.json({ error: 'Atendimento não encontrado' }, { status: 404 });

    const { config, logoBase64 } = await loadExportConfig();
    const html = buildRemotoHtml(remoto, config, logoBase64);
    return await generatePdf(html, `Recibo-Remoto-${remoto.cliente.replace(/\s/g, '_')}`);
  } catch (error: any) {
    console.error('Export Remoto PDF error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao exportar' }, { status: 500 });
  }
}
