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
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { nomeCliente: { contains: search, mode: 'insensitive' } },
        { telefoneCliente: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ];
      const num = parseInt(search);
      if (!isNaN(num)) where.OR.push({ numero: num });
    }
    if (status) where.status = status;

    const orcamentos = await prisma.orcamento.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { cliente: true, ordemServico: true },
    });
    return NextResponse.json(orcamentos);
  } catch (error: any) {
    console.error('Error fetching orcamentos:', error);
    return NextResponse.json({ error: 'Erro ao buscar orçamentos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await request.json();
    const b = body ?? {};
    if (!b.nomeCliente || !b.telefoneCliente || (!b.descricao && !b.modoEntrada)) {
      return NextResponse.json({ error: 'Nome, telefone e descrição são obrigatórios' }, { status: 400 });
    }

    // Auto-register client if not exists
    let cliente = await prisma.cliente.findFirst({
      where: {
        OR: [
          { telefone: b.telefoneCliente },
          { whatsapp: b.telefoneCliente },
        ],
      },
    });
    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          nome: b.nomeCliente,
          telefone: b.telefoneCliente,
          whatsapp: b.telefoneCliente,
        },
      });
    }

    const orcamento = await prisma.orcamento.create({
      data: {
        nomeCliente: b.nomeCliente,
        telefoneCliente: b.telefoneCliente,
        tipoEquipamento: b.tipoEquipamento || null,
        marca: b.marca || null,
        modelo: b.modelo || null,
        numeroSerie: b.numeroSerie || null,
        descricao: b.descricao,
        servicos: b.servicos || null,
        pecas: b.pecas || null,
        valorPecas: parseFloat(b.valorPecas) || 0,
        valorMaoDeObra: parseFloat(b.valorMaoDeObra) || 0,
        valorTotal: parseFloat(b.valorTotal) || 0,
        formaPagamento: b.formaPagamento || null,
        parcelamento: b.parcelamento || null,
        valorPixVista: b.valorPixVista ? parseFloat(b.valorPixVista) : null,
        observacoes: b.observacoes || null,
        entradaEquipamento: b.entradaEquipamento || null,
        modoEntrada: b.modoEntrada === true,
        clienteId: cliente.id,
        status: 'pendente',
      },
      include: { cliente: true },
    });

    return NextResponse.json(orcamento);
  } catch (error: any) {
    console.error('Error creating orcamento:', error);
    return NextResponse.json({ error: 'Erro ao criar orçamento' }, { status: 500 });
  }
}
