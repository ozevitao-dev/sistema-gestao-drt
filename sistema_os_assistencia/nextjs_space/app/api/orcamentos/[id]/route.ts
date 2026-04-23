export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const orcamento = await prisma.orcamento.findUnique({
      where: { id: params.id },
      include: { cliente: true, ordemServico: true },
    });
    if (!orcamento) return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    return NextResponse.json(orcamento);
  } catch (error: any) {
    console.error('Error fetching orcamento:', error);
    return NextResponse.json({ error: 'Erro ao buscar orçamento' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await request.json();
    const b = body ?? {};
    const allowedFields = ['nomeCliente', 'telefoneCliente', 'tipoEquipamento', 'marca', 'modelo', 'numeroSerie', 'descricao', 'servicos', 'pecas', 'observacoes', 'formaPagamento', 'parcelamento', 'status', 'entradaEquipamento'];
    const floatFields = ['valorPecas', 'valorMaoDeObra', 'valorTotal', 'valorPixVista'];

    const data: any = {};
    for (const f of allowedFields) { if (b[f] !== undefined) data[f] = b[f] || null; }
    for (const f of floatFields) { if (b[f] !== undefined) data[f] = parseFloat(b[f]) || 0; }
    if (b.status !== undefined) data.status = b.status;
    if (b.modoEntrada !== undefined) data.modoEntrada = b.modoEntrada === true;

    const orcamento = await prisma.orcamento.update({
      where: { id: params.id },
      data,
      include: { cliente: true, ordemServico: true },
    });
    return NextResponse.json(orcamento);
  } catch (error: any) {
    console.error('Error updating orcamento:', error);
    return NextResponse.json({ error: 'Erro ao atualizar orçamento' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    await prisma.orcamento.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting orcamento:', error);
    return NextResponse.json({ error: 'Erro ao excluir orçamento' }, { status: 500 });
  }
}

// POST to approve and convert to OS
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const orcamento = await prisma.orcamento.findUnique({
      where: { id: params.id },
      include: { cliente: true },
    });
    if (!orcamento) return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    if (orcamento.status === 'aprovado') return NextResponse.json({ error: 'Orçamento já foi aprovado' }, { status: 400 });

    // Ensure client exists
    let clienteId = orcamento.clienteId;
    if (!clienteId) {
      const cliente = await prisma.cliente.create({
        data: {
          nome: orcamento.nomeCliente,
          telefone: orcamento.telefoneCliente,
          whatsapp: orcamento.telefoneCliente,
        },
      });
      clienteId = cliente.id;
    }

    // Create OS from orcamento
    const ordem = await prisma.ordemServico.create({
      data: {
        clienteId,
        tipoEquipamento: orcamento.tipoEquipamento || 'notebook',
        marca: orcamento.marca || null,
        modelo: orcamento.modelo || null,
        numeroSerie: orcamento.numeroSerie || null,
        descricaoProblema: orcamento.descricao,
        servicoExecutado: orcamento.servicos ? JSON.parse(orcamento.servicos).map((s: any) => s.nome).join(', ') : null,
        valorTotal: orcamento.valorTotal,
        formaPagamento: orcamento.formaPagamento || null,
        observacoes: orcamento.observacoes || null,
        status: 'aberta',
      },
      include: { cliente: true, tecnico: true },
    });

    // Update orcamento status and link to OS
    await prisma.orcamento.update({
      where: { id: params.id },
      data: {
        status: 'aprovado',
        ordemServicoId: ordem.id,
        clienteId,
      },
    });

    return NextResponse.json({ orcamento: { ...orcamento, status: 'aprovado', ordemServicoId: ordem.id }, ordem });
  } catch (error: any) {
    console.error('Error approving orcamento:', error);
    return NextResponse.json({ error: 'Erro ao aprovar orçamento' }, { status: 500 });
  }
}
