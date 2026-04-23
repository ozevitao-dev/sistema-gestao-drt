import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const marcaId = searchParams.get('marcaId');
  const where = marcaId ? { marcaId } : {};
  const modelos = await prisma.modelo.findMany({ where, include: { marca: true }, orderBy: { nome: 'asc' } });
  return NextResponse.json(modelos);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { nome, marcaId } = await req.json();
  if (!nome || !marcaId) return NextResponse.json({ error: 'Nome e marca obrigatórios' }, { status: 400 });
  try {
    const modelo = await prisma.modelo.create({ data: { nome, marcaId } });
    return NextResponse.json(modelo, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Modelo já existe para esta marca' }, { status: 409 });
  }
}
