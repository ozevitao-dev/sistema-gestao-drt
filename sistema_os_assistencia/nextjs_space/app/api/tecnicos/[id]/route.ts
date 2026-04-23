export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await request.json();
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.email !== undefined) data.email = body.email;
    if (body.role !== undefined) data.role = body.role;
    if (body.ativo !== undefined) data.ativo = body.ativo;
    if (body.password && body.password.trim()) {
      data.password = await bcrypt.hash(body.password, 10);
    }
    const tecnico = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, name: true, email: true, role: true, ativo: true, createdAt: true },
    });
    return NextResponse.json(tecnico);
  } catch (error: any) {
    console.error('Error updating tecnico:', error);
    if (error.code === 'P2002') return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 400 });
    return NextResponse.json({ error: 'Erro ao atualizar técnico' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    // Check if tecnico has OS assigned
    const osCount = await prisma.ordemServico.count({ where: { tecnicoId: params.id } });
    if (osCount > 0) {
      // Just deactivate instead of deleting
      await prisma.user.update({ where: { id: params.id }, data: { ativo: false } });
      return NextResponse.json({ message: 'Técnico desativado (possui OS vinculadas)' });
    }
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting tecnico:', error);
    return NextResponse.json({ error: 'Erro ao excluir técnico' }, { status: 500 });
  }
}
