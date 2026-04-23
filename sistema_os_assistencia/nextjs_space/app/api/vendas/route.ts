export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await request.json();
    const { cliente, descricao, valor, formaPagamento, observacoes } = body;
    if (!descricao || !valor) return NextResponse.json({ error: 'Descrição e valor são obrigatórios' }, { status: 400 });

    const lancamento = await prisma.lancamento.create({
      data: {
        tipo: 'entrada',
        categoria: 'venda',
        descricao: `${cliente ? cliente + ' - ' : ''}${descricao}`,
        valor: parseFloat(valor),
        data: new Date(),
        formaPagamento: formaPagamento || 'pix',
        statusPagamento: 'pago',
        observacoes: observacoes || null,
      },
    });
    return NextResponse.json(lancamento, { status: 201 });
  } catch (error: any) {
    console.error('Error creating venda:', error);
    return NextResponse.json({ error: 'Erro ao registrar venda' }, { status: 500 });
  }
}
