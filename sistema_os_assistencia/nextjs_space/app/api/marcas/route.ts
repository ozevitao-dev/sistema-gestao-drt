import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const marcas = await prisma.marca.findMany({ include: { modelos: { orderBy: { nome: 'asc' } } }, orderBy: { nome: 'asc' } });
  return NextResponse.json(marcas);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { nome } = await req.json();
  if (!nome) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
  try {
    const marca = await prisma.marca.create({ data: { nome } });
    return NextResponse.json(marca, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Marca já existe' }, { status: 409 });
  }
}
