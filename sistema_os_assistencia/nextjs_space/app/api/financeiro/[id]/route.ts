export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await request.json();
    const updateData: any = {};
    if (body.tipo !== undefined) updateData.tipo = body.tipo;
    if (body.categoria !== undefined) updateData.categoria = body.categoria;
    if (body.descricao !== undefined) updateData.descricao = body.descricao;
    if (body.valor !== undefined) updateData.valor = parseFloat(body.valor);
    if (body.data !== undefined) updateData.data = new Date(body.data.length === 10 ? body.data + 'T12:00:00' : body.data);
    if (body.formaPagamento !== undefined) updateData.formaPagamento = body.formaPagamento;
    if (body.statusPagamento !== undefined) updateData.statusPagamento = body.statusPagamento;
    if (body.valorPago !== undefined) updateData.valorPago = parseFloat(body.valorPago);
    if (body.observacoes !== undefined) updateData.observacoes = body.observacoes;
    const lancamento = await prisma.lancamento.update({ where: { id: params.id }, data: updateData });
    return NextResponse.json(lancamento);
  } catch (error: any) {
    console.error('Error updating lancamento:', error);
    return NextResponse.json({ error: 'Erro ao atualizar lançamento' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    await prisma.lancamento.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting lancamento:', error);
    return NextResponse.json({ error: 'Erro ao excluir lançamento' }, { status: 500 });
  }
}
