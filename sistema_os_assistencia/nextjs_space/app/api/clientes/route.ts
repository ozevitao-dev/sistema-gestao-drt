export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Search client by phone for auto-fill
export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const clientes = await prisma.cliente.findMany({
      where: search ? {
        OR: [
          { nome: { contains: search, mode: 'insensitive' } },
          { cpfCnpj: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { telefone: { contains: search, mode: 'insensitive' } },
        ],
      } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { ordensServico: true } } },
    });
    return NextResponse.json(clientes);
  } catch (error: any) {
    console.error('Error fetching clientes:', error);
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await request.json();
    const { nome, telefone, whatsapp, email, cpfCnpj, endereco, cidade, estado, cep, bairro } = body ?? {};
    if (!nome) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    const cliente = await prisma.cliente.create({
      data: { nome, telefone: telefone || null, whatsapp: whatsapp || null, email: email || null, cpfCnpj: cpfCnpj || null, endereco: endereco || null, cidade: cidade || null, estado: estado || null, cep: cep || null, bairro: bairro || null },
    });
    return NextResponse.json(cliente);
  } catch (error: any) {
    console.error('Error creating cliente:', error);
    if (error?.code === 'P2002') return NextResponse.json({ error: 'CPF/CNPJ já cadastrado' }, { status: 400 });
    return NextResponse.json({ error: 'Erro ao cadastrar cliente' }, { status: 500 });
  }
}
