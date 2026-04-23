export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    // Get the most recent active caixa
    const caixa = await prisma.caixaSemanal.findFirst({
      where: { ativo: true },
      orderBy: { dataAbertura: 'desc' },
    });
    return NextResponse.json({ caixa });
  } catch (error: any) {
    console.error('Error fetching caixa:', error);
    return NextResponse.json({ error: 'Erro ao buscar caixa' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await request.json();
    const { valorInicial } = body;
    if (valorInicial === undefined) {
      return NextResponse.json({ error: 'Valor inicial obrigatório' }, { status: 400 });
    }
    // Deactivate all previous caixas
    await prisma.caixaSemanal.updateMany({ where: { ativo: true }, data: { ativo: false } });
    // Create new caixa
    const caixa = await prisma.caixaSemanal.create({
      data: { valorInicial: parseFloat(valorInicial), dataAbertura: new Date(), ativo: true },
    });
    return NextResponse.json({ caixa }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating caixa:', error);
    return NextResponse.json({ error: 'Erro ao abrir caixa' }, { status: 500 });
  }
}
