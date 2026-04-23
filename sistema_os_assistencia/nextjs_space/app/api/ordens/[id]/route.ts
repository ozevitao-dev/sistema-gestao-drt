export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const ordem = await prisma.ordemServico.findUnique({
      where: { id: params?.id },
      include: { cliente: true, tecnico: true },
    });
    if (!ordem) return NextResponse.json({ error: 'OS não encontrada' }, { status: 404 });
    return NextResponse.json(ordem);
  } catch (error: any) {
    console.error('Error fetching ordem:', error);
    return NextResponse.json({ error: 'Erro ao buscar OS' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await request.json();
    const updateData: any = { ...(body ?? {}) };
    if (updateData.valorTotal !== undefined) updateData.valorTotal = parseFloat(updateData.valorTotal) || 0;
    // Handle date fields
    const dateFields = ['prazoEstimado', 'dataPagamento', 'dataPrevista', 'dataRetirada', 'dataEntrada'];
    for (const df of dateFields) {
      if (updateData[df]) updateData[df] = new Date(updateData[df]);
      else if (updateData[df] === '' || updateData[df] === null) updateData[df] = null;
    }
    // Handle boolean
    if (updateData.carregador !== undefined) updateData.carregador = Boolean(updateData.carregador);
    // Remove non-model fields
    delete updateData.cliente;
    delete updateData.tecnico;
    delete updateData.orcamento;
    delete updateData.id;
    delete updateData.numero;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const ordem = await prisma.ordemServico.update({
      where: { id: params?.id },
      data: updateData,
      include: { cliente: true, tecnico: true },
    });
    return NextResponse.json(ordem);
  } catch (error: any) {
    console.error('Error updating ordem:', error);
    return NextResponse.json({ error: 'Erro ao atualizar OS' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    await prisma.ordemServico.delete({ where: { id: params?.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting ordem:', error);
    return NextResponse.json({ error: 'Erro ao excluir OS' }, { status: 500 });
  }
}
