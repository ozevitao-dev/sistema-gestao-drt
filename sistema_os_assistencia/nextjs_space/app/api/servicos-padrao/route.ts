import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const servicos = await prisma.servicoPadrao.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } });
  return NextResponse.json(servicos);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { nome, valor } = await req.json();
  if (!nome) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
  try {
    const servico = await prisma.servicoPadrao.create({ data: { nome, valor: parseFloat(valor) || 0, ativo: true } });
    return NextResponse.json(servico, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Serviço já existe' }, { status: 409 });
  }
}
