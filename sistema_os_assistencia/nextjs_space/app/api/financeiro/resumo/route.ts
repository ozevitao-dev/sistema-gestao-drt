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
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    const where: any = {};
    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = new Date(dataInicio + 'T00:00:00');
      if (dataFim) where.data.lte = new Date(dataFim + 'T23:59:59');
    }

    const lancamentos = await prisma.lancamento.findMany({ where });

    let totalEntradas = 0, totalSaidas = 0;
    let entradasPagas = 0, entradasPendentes = 0, entradasParciais = 0;
    let saidasPagas = 0, saidasPendentes = 0;
    let totalProLabore = 0;

    for (const l of lancamentos) {
      if (l.tipo === 'entrada') {
        totalEntradas += l.valor;
        if (l.statusPagamento === 'pago') entradasPagas += l.valor;
        else if (l.statusPagamento === 'pendente') entradasPendentes += l.valor;
        else if (l.statusPagamento === 'parcial') {
          entradasParciais += l.valor;
          entradasPagas += (l.valorPago || 0);
          entradasPendentes += l.valor - (l.valorPago || 0);
        }
      } else {
        totalSaidas += l.valor;
        if (l.statusPagamento === 'pago') saidasPagas += l.valor;
        else saidasPendentes += l.valor;
        if (l.categoria === 'pro_labore') totalProLabore += l.valor;
      }
    }

    const saldo = totalEntradas - totalSaidas;
    const lucroBruto = entradasPagas - saidasPagas;
    const capitalEmCaixa = entradasPagas - saidasPagas;

    // Weekly data: current week (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const lancamentosSemana = await prisma.lancamento.findMany({
      where: { data: { gte: weekStart, lte: weekEnd } },
    });

    let faturamentoSemanal = 0, entradasSemana = 0, saidasSemana = 0;
    for (const l of lancamentosSemana) {
      if (l.tipo === 'entrada') {
        entradasSemana += l.valor;
        if (l.statusPagamento === 'pago') faturamentoSemanal += l.valor;
        else if (l.statusPagamento === 'parcial') faturamentoSemanal += (l.valorPago || 0);
      } else {
        saidasSemana += l.valor;
      }
    }

    // Active caixa semanal
    const caixaSemanal = await prisma.caixaSemanal.findFirst({
      where: { ativo: true },
      orderBy: { dataAbertura: 'desc' },
    });

    const caixaInicial = caixaSemanal?.valorInicial || 0;
    const saldoAtual = caixaInicial + faturamentoSemanal - saidasSemana;

    return NextResponse.json({
      totalEntradas,
      totalSaidas,
      saldo,
      lucroBruto,
      capitalEmCaixa,
      entradasPagas,
      entradasPendentes,
      entradasParciais,
      saidasPagas,
      saidasPendentes,
      totalProLabore,
      // Weekly
      caixaInicial,
      faturamentoSemanal,
      entradasSemana,
      saidasSemana,
      saldoAtual,
      caixaSemanal: caixaSemanal ? { id: caixaSemanal.id, valorInicial: caixaSemanal.valorInicial, dataAbertura: caixaSemanal.dataAbertura } : null,
    });
  } catch (error: any) {
    console.error('Error fetching resumo:', error);
    return NextResponse.json({ error: 'Erro ao buscar resumo' }, { status: 500 });
  }
}
