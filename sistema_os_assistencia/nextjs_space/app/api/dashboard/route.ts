export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { nowSP, monthStartUTC_SP, monthEndUTC_SP, weekStartUTC_SP, weekEndUTC_SP, todayISO_SP, todayStartUTC_SP, todayEndUTC_SP } from '@/lib/date-utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const startOfMonth = monthStartUTC_SP();
    const endOfMonth = monthEndUTC_SP();

    const [
      abertas, emAndamento, aguardandoPeca, concluidas, canceladas,
      totalClientes, totalOrcamentosPendentes, recentes
    ] = await Promise.all([
      prisma.ordemServico.count({ where: { status: 'aberta' } }),
      prisma.ordemServico.count({ where: { status: 'em_andamento' } }),
      prisma.ordemServico.count({ where: { status: 'aguardando_peca' } }),
      prisma.ordemServico.count({ where: { status: 'concluida', updatedAt: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.ordemServico.count({ where: { status: 'cancelada' } }),
      prisma.cliente.count(),
      prisma.orcamento.count({ where: { status: 'pendente' } }),
      prisma.ordemServico.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { cliente: true, tecnico: true },
      }),
    ]);

    // OS por status para gráfico de pizza
    const osPorStatus = [
      { name: 'Abertas', value: abertas, color: '#3b82f6' },
      { name: 'Em Andamento', value: emAndamento, color: '#f59e0b' },
      { name: 'Aguardando Peça', value: aguardandoPeca, color: '#f97316' },
      { name: 'Concluídas', value: concluidas, color: '#22c55e' },
      { name: 'Canceladas', value: canceladas, color: '#ef4444' },
    ].filter(s => s.value > 0);

    // Agenda items for the week (SP timezone)
    const startOfWeek = weekStartUTC_SP();
    const endOfWeek = weekEndUTC_SP();

    // Orçamento por status
    const [orcPendentes, orcAprovados, orcCancelados] = await Promise.all([
      prisma.orcamento.count({ where: { status: 'pendente' } }),
      prisma.orcamento.count({ where: { status: 'aprovado' } }),
      prisma.orcamento.count({ where: { status: { in: ['cancelado', 'recusado'] } } }),
    ]);
    const orcPorStatus = [
      { name: 'Pendentes', value: orcPendentes, color: '#f59e0b' },
      { name: 'Aprovados', value: orcAprovados, color: '#22c55e' },
      { name: 'Cancelados', value: orcCancelados, color: '#ef4444' },
    ].filter(s => s.value > 0);

    // Weekly daily data (OS + Orçamentos per day) - using SP-aware start
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const weeklyDailyData = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(startOfWeek.getTime() + i * 86400000);
      const dayEnd = new Date(dayStart.getTime() + 86400000 - 1);
      const [osCount, orcCount] = await Promise.all([
        prisma.ordemServico.count({ where: { createdAt: { gte: dayStart, lte: dayEnd } } }),
        prisma.orcamento.count({ where: { createdAt: { gte: dayStart, lte: dayEnd } } }),
      ]);
      weeklyDailyData.push({ dia: dayNames[i] ?? '', os: osCount, orc: orcCount });
    }

    const agendaSemana = await prisma.agendaItem.findMany({
      where: { data: { gte: startOfWeek, lte: endOfWeek } },
      orderBy: [{ data: 'asc' }, { horario: 'asc' }],
    });

    // Atendimentos remotos de hoje (SP timezone)
    const todayStart = todayStartUTC_SP();
    const todayEnd = todayEndUTC_SP();
    const remotosHoje = await prisma.atendimentoRemoto.findMany({
      where: { data: { gte: todayStart, lte: todayEnd } },
    });
    const remotosHojeCount = remotosHoje.length;
    const remotosHojeValor = remotosHoje.reduce((s: number, r: any) => s + (r.valorTotal || 0), 0);

    // Agenda de hoje (pendentes + confirmados)
    const todayStr = todayISO_SP();
    const agendaHoje = agendaSemana.filter((item: any) => {
      const itemDate = new Date(item.data).toISOString().split('T')[0];
      return itemDate === todayStr;
    });
    const agendaHojeCount = agendaHoje.length;
    const agendaHojePendentes = agendaHoje.filter((i: any) => i.status === 'pendente' || i.status === 'confirmado').length;

    return NextResponse.json({
      emAndamento: abertas + emAndamento + aguardandoPeca,
      concluidas,
      orcamentosPendentes: totalOrcamentosPendentes,
      totalClientes,
      osPorStatus,
      orcPorStatus,
      weeklyDailyData,
      recentes,
      agendaSemana,
      remotosHojeCount,
      remotosHojeValor,
      agendaHojeCount,
      agendaHojePendentes,
      agendaHoje,
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Erro ao carregar dashboard' }, { status: 500 });
  }
}
