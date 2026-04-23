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
    const dataInicio = searchParams.get('dataInicio') || '';
    const dataFim = searchParams.get('dataFim') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { cliente: { nome: { contains: search, mode: 'insensitive' } } },
        { descricaoProblema: { contains: search, mode: 'insensitive' } },
        { marca: { contains: search, mode: 'insensitive' } },
        { modelo: { contains: search, mode: 'insensitive' } },
      ];
      const num = parseInt(search);
      if (!isNaN(num)) {
        where.OR.push({ numero: num });
      }
    }
    if (status) where.status = status;
    if (dataInicio || dataFim) {
      where.createdAt = {};
      if (dataInicio) where.createdAt.gte = new Date(dataInicio);
      if (dataFim) where.createdAt.lte = new Date(dataFim + 'T23:59:59.999Z');
    }

    const ordens = await prisma.ordemServico.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { cliente: true, tecnico: true },
    });
    return NextResponse.json(ordens);
  } catch (error: any) {
    console.error('Error fetching ordens:', error);
    return NextResponse.json({ error: 'Erro ao buscar ordens' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await request.json();
    const b = body ?? {};
    if (!b.clienteId || !b.descricaoProblema) {
      return NextResponse.json({ error: 'Cliente e descrição do problema são obrigatórios' }, { status: 400 });
    }
    const ordem = await prisma.ordemServico.create({
      data: {
        clienteId: b.clienteId,
        descricaoProblema: b.descricaoProblema,
        diagnostico: b.diagnostico || null,
        servicoExecutado: b.servicoExecutado || null,
        tipoEquipamento: b.tipoEquipamento || 'notebook',
        marca: b.marca || null,
        modelo: b.modelo || null,
        numeroSerie: b.numeroSerie || null,
        carregador: Boolean(b.carregador),
        senhaEquipamento: b.senhaEquipamento || null,
        acessorios: b.acessorios || null,
        estadoGeral: b.estadoGeral || null,
        checklist: b.checklist || null,
        avarias: b.avarias || null,
        tecnicoId: b.tecnicoId || null,
        prazoEstimado: b.prazoEstimado ? new Date(b.prazoEstimado) : null,
        dataPrevista: b.dataPrevista ? new Date(b.dataPrevista) : null,
        valorTotal: parseFloat(b.valorTotal) || 0,
        formaPagamento: b.formaPagamento || null,
        observacoes: b.observacoes || null,
        observacoesInternas: b.observacoesInternas || null,
        responsavelAtendimento: b.responsavelAtendimento || null,
        status: 'aberta',
      },
      include: { cliente: true, tecnico: true },
    });

    // Send notification emails asynchronously
    try {
      await fetch(new URL('/api/notificacao', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordemId: ordem.id }),
      });
    } catch (notifError: any) {
      console.error('Notification error (non-blocking):', notifError);
    }

    return NextResponse.json(ordem);
  } catch (error: any) {
    console.error('Error creating ordem:', error);
    return NextResponse.json({ error: 'Erro ao criar ordem de serviço' }, { status: 500 });
  }
}
