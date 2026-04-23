import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const body = await req.json();
  const data: any = {};
  if (body.nome !== undefined) data.nome = body.nome;
  if (body.valor !== undefined) data.valor = parseFloat(body.valor) || 0;
  if (body.ativo !== undefined) data.ativo = body.ativo;
  const servico = await prisma.servicoPadrao.update({ where: { id: params.id }, data });
  return NextResponse.json(servico);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  await prisma.servicoPadrao.update({ where: { id: params.id }, data: { ativo: false } });
  return NextResponse.json({ ok: true });
}
