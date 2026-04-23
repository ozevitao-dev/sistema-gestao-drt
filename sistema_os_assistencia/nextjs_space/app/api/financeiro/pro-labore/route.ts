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

    const configs = await prisma.proLaboreConfig.findMany({ where: { ativo: true }, orderBy: { nomeSocio: 'asc' } });

    // Get pro-labore withdrawals per partner
    const whereRetiradas: any = { tipo: 'saida', categoria: 'pro_labore' };
    if (dataInicio || dataFim) {
      whereRetiradas.data = {};
      if (dataInicio) whereRetiradas.data.gte = new Date(dataInicio + 'T00:00:00');
      if (dataFim) whereRetiradas.data.lte = new Date(dataFim + 'T23:59:59');
    }
    const retiradas = await prisma.lancamento.findMany({ where: whereRetiradas, orderBy: { data: 'desc' } });

    const socios = configs.map(c => {
      const retiradasSocio = retiradas.filter(r => r.socioId === c.id);
      const totalRetirado = retiradasSocio.reduce((s, r) => s + r.valor, 0);
      return {
        ...c,
        retiradas: retiradasSocio,
        totalRetirado,
      };
    });

    return NextResponse.json({ socios });
  } catch (error: any) {
    console.error('Error fetching pro-labore:', error);
    return NextResponse.json({ error: 'Erro ao buscar pró-labore' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await request.json();
    const { action } = body;

    if (action === 'config') {
      const { nomeSocio, valorFixo, percentualLucro } = body;
      const config = await prisma.proLaboreConfig.upsert({
        where: { nomeSocio },
        update: { valorFixo: parseFloat(valorFixo) || 0, percentualLucro: parseFloat(percentualLucro) || 0 },
        create: { nomeSocio, valorFixo: parseFloat(valorFixo) || 0, percentualLucro: parseFloat(percentualLucro) || 0 },
      });
      return NextResponse.json(config);
    }

    if (action === 'retirada') {
      const { socioId, valor, data, observacoes, nomeSocio } = body;
      const lancamento = await prisma.lancamento.create({
        data: {
          tipo: 'saida',
          categoria: 'pro_labore',
          descricao: `Pró-labore - ${nomeSocio || 'Sócio'}`,
          valor: parseFloat(valor),
          data: data ? new Date(data + 'T12:00:00') : new Date(),
          formaPagamento: 'transferencia',
          statusPagamento: 'pago',
          valorPago: parseFloat(valor),
          observacoes: observacoes || null,
          socioId: socioId || null,
        },
      });
      return NextResponse.json(lancamento, { status: 201 });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error pro-labore action:', error);
    return NextResponse.json({ error: 'Erro na operação' }, { status: 500 });
  }
}
