export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const cliente = await prisma.cliente.findUnique({
      where: { id: params?.id },
      include: { ordensServico: { orderBy: { createdAt: 'desc' }, include: { tecnico: true } } },
    });
    if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    return NextResponse.json(cliente);
  } catch (error: any) {
    console.error('Error fetching cliente:', error);
    return NextResponse.json({ error: 'Erro ao buscar cliente' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await request.json();
    const cliente = await prisma.cliente.update({
      where: { id: params?.id },
      data: { ...(body ?? {}) },
    });
    return NextResponse.json(cliente);
  } catch (error: any) {
    console.error('Error updating cliente:', error);
    if (error?.code === 'P2002') return NextResponse.json({ error: 'CPF/CNPJ já cadastrado' }, { status: 400 });
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    await prisma.cliente.delete({ where: { id: params?.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting cliente:', error);
    return NextResponse.json({ error: 'Erro ao excluir cliente. Verifique se não há OS vinculadas.' }, { status: 500 });
  }
}
