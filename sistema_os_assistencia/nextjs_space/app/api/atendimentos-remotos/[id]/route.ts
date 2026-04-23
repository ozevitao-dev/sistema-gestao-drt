import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const b = await request.json();

    const data: any = {};
    if (b.cliente !== undefined) data.cliente = b.cliente;
    if (b.descricao !== undefined) data.descricao = b.descricao;
    if (b.data !== undefined) data.data = new Date(b.data.length === 10 ? b.data + 'T12:00:00' : b.data);
    if (b.tempo !== undefined) data.tempo = parseFloat(b.tempo);
    if (b.valorHora !== undefined) data.valorHora = parseFloat(b.valorHora);
    if (b.status !== undefined) data.status = b.status;
    if (b.observacoes !== undefined) data.observacoes = b.observacoes;

    // Recalculate total if tempo or valorHora changed
    if (b.tempo !== undefined || b.valorHora !== undefined) {
      const current = await prisma.atendimentoRemoto.findUnique({ where: { id: params.id } });
      if (current) {
        const tempo = data.tempo ?? current.tempo;
        const valorHora = data.valorHora ?? current.valorHora;
        data.valorTotal = (tempo / 60) * valorHora;
      }
    }

    const atendimento = await prisma.atendimentoRemoto.update({ where: { id: params.id }, data });
    return NextResponse.json(atendimento);
  } catch (error: any) {
    console.error('Error updating atendimento:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    await prisma.atendimentoRemoto.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting atendimento:', error);
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 });
  }
}
