import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildOSHtmlPng } from '@/lib/os-html-builder';
import { loadExportConfig } from '@/lib/export-helpers';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const ordem = await prisma.ordemServico.findUnique({
      where: { id: params.id }, include: { cliente: true, tecnico: true },
    });
    if (!ordem) return NextResponse.json({ error: 'OS não encontrada' }, { status: 404 });

    const { config, logoBase64 } = await loadExportConfig();
    const cfg = { ...config, logoUrl: logoBase64 || config.logoUrl };
    const html = buildOSHtmlPng(ordem, cfg);
    return NextResponse.json({ success: true, html, filename: `OS-${ordem.numero}` });
  } catch (error: any) {
    console.error('Export PNG error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao exportar' }, { status: 500 });
  }
}
