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
    const data: any = {};
    if (body.titulo !== undefined) data.titulo = body.titulo;
    if (body.descricao !== undefined) data.descricao = body.descricao || null;
    if (body.cliente !== undefined) data.cliente = body.cliente || null;
    if (body.data !== undefined) data.data = new Date(body.data);
    if (body.horario !== undefined) data.horario = body.horario || null;
    if (body.status !== undefined) data.status = body.status;
    if (body.cor !== undefined) data.cor = body.cor;

    const item = await prisma.agendaItem.update({ where: { id: params.id }, data });
    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error updating agenda item:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    await prisma.agendaItem.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting agenda item:', error);
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 });
  }
}
