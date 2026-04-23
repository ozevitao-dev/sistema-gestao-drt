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
    const tipo = searchParams.get('tipo');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const status = searchParams.get('status');
    const categoria = searchParams.get('categoria');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (tipo) where.tipo = tipo;
    if (status) where.statusPagamento = status;
    if (categoria) where.categoria = categoria;
    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = new Date(dataInicio + 'T00:00:00');
      if (dataFim) where.data.lte = new Date(dataFim + 'T23:59:59');
    }

    const [lancamentos, total] = await Promise.all([
      prisma.lancamento.findMany({
        where,
        include: { ordemServico: { select: { numero: true, cliente: { select: { nome: true } } } } },
        orderBy: { data: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lancamento.count({ where }),
    ]);
    return NextResponse.json({ lancamentos, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error('Error fetching lancamentos:', error);
    return NextResponse.json({ error: 'Erro ao buscar lançamentos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await request.json();
    const { tipo, categoria, descricao, valor, data, formaPagamento, statusPagamento, valorPago, observacoes, ordemServicoId, socioId } = body;
    if (!tipo || !descricao || valor === undefined) {
      return NextResponse.json({ error: 'Campos obrigatórios: tipo, descricao, valor' }, { status: 400 });
    }
    const lancamento = await prisma.lancamento.create({
      data: {
        tipo,
        categoria: categoria || (tipo === 'entrada' ? 'servico' : 'despesa'),
        descricao,
        valor: parseFloat(valor),
        data: data ? new Date(data + 'T12:00:00') : new Date(),
        formaPagamento: formaPagamento || null,
        statusPagamento: statusPagamento || 'pago',
        valorPago: valorPago !== undefined ? parseFloat(valorPago) : parseFloat(valor),
        observacoes: observacoes || null,
        ordemServicoId: ordemServicoId || null,
        socioId: socioId || null,
      },
    });
    return NextResponse.json(lancamento, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lancamento:', error);
    return NextResponse.json({ error: 'Erro ao criar lançamento' }, { status: 500 });
  }
}
