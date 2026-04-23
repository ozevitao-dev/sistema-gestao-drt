export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    const where: any = {};
    if (dataInicio) where.data = { ...where.data, gte: new Date(dataInicio + 'T00:00:00') };
    if (dataFim) where.data = { ...where.data, lte: new Date(dataFim + 'T23:59:59') };

    const items = await prisma.agendaItem.findMany({
      where,
      orderBy: [{ data: 'asc' }, { horario: 'asc' }],
    });
    return NextResponse.json(items);
  } catch (error: any) {
    console.error('Error fetching agenda:', error);
    return NextResponse.json({ error: 'Erro ao buscar agenda' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await request.json();
    const { titulo, descricao, cliente, data, horario, status, cor } = body;
    if (!titulo || !data) return NextResponse.json({ error: 'Título e data são obrigatórios' }, { status: 400 });

    const item = await prisma.agendaItem.create({
      data: {
        titulo, descricao: descricao || null, cliente: cliente || null,
        data: new Date(data), horario: horario || null,
        status: status || 'pendente', cor: cor || '#2563eb',
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('Error creating agenda item:', error);
    return NextResponse.json({ error: 'Erro ao criar item' }, { status: 500 });
  }
}
