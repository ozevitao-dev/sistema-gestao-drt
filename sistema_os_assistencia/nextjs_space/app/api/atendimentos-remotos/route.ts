import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

    const atendimentos = await prisma.atendimentoRemoto.findMany({
      where,
      orderBy: { data: 'desc' },
    });
    return NextResponse.json(atendimentos);
  } catch (error: any) {
    console.error('Error fetching atendimentos remotos:', error);
    return NextResponse.json({ error: 'Erro ao buscar atendimentos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const b = await request.json();

    if (!b.cliente || !b.descricao) {
      return NextResponse.json({ error: 'Cliente e descrição são obrigatórios' }, { status: 400 });
    }

    const tempo = parseFloat(b.tempo) || 0;
    const valorHora = parseFloat(b.valorHora) || 0;
    const valorTotal = (tempo / 60) * valorHora;

    const atendimento = await prisma.atendimentoRemoto.create({
      data: {
        cliente: b.cliente,
        descricao: b.descricao,
        data: b.data ? new Date(b.data + 'T12:00:00') : new Date(),
        tempo,
        valorHora,
        valorTotal,
        status: b.status || 'pendente',
        observacoes: b.observacoes || null,
      },
    });

    // Auto-create financial entry
    try {
      await prisma.lancamento.create({
        data: {
          tipo: 'entrada',
          categoria: 'remoto',
          descricao: `Atendimento remoto - ${b.cliente}`,
          valor: valorTotal,
          data: b.data ? new Date(b.data + 'T12:00:00') : new Date(),
          formaPagamento: b.formaPagamento || 'pix',
          statusPagamento: 'pago',
          valorPago: valorTotal,
          observacoes: b.descricao,
        },
      });
    } catch (e) { console.error('Erro ao criar lançamento financeiro:', e); }

    return NextResponse.json(atendimento, { status: 201 });
  } catch (error: any) {
    console.error('Error creating atendimento remoto:', error);
    return NextResponse.json({ error: 'Erro ao criar atendimento' }, { status: 500 });
  }
}
