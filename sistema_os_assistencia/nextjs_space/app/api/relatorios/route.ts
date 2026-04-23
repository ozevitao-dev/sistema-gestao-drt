export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || 'financeiro';
    const dataInicio = searchParams.get('dataInicio') || '';
    const dataFim = searchParams.get('dataFim') || '';

    const dateFilter: any = {};
    if (dataInicio) dateFilter.gte = new Date(dataInicio);
    if (dataFim) dateFilter.lte = new Date(dataFim + 'T23:59:59.999Z');

    if (tipo === 'financeiro') {
      const where: any = {};
      if (dataInicio || dataFim) where.createdAt = dateFilter;

      const [totalAberto, totalPago, osPagas, osAbertas] = await Promise.all([
        prisma.ordemServico.aggregate({
          where: { ...where, status: { notIn: ['concluida', 'cancelada'] } },
          _sum: { valorTotal: true },
          _count: true,
        }),
        prisma.ordemServico.aggregate({
          where: { ...where, status: 'concluida', dataPagamento: { not: null } },
          _sum: { valorTotal: true },
          _count: true,
        }),
        prisma.ordemServico.findMany({
          where: { ...where, status: 'concluida', dataPagamento: { not: null } },
          include: { cliente: true, tecnico: true },
          orderBy: { dataPagamento: 'desc' },
        }),
        prisma.ordemServico.findMany({
          where: { ...where, status: { notIn: ['concluida', 'cancelada'] } },
          include: { cliente: true, tecnico: true },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return NextResponse.json({
        totalAberto: totalAberto?._sum?.valorTotal ?? 0,
        countAberto: totalAberto?._count ?? 0,
        totalPago: totalPago?._sum?.valorTotal ?? 0,
        countPago: totalPago?._count ?? 0,
        osPagas,
        osAbertas,
      });
    }

    return NextResponse.json({ error: 'Tipo de relatório inválido' }, { status: 400 });
  } catch (error: any) {
    console.error('Report error:', error);
    return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 });
  }
}
