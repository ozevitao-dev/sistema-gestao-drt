import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      // Return safe defaults so the theme loads without a 401 console error
      return NextResponse.json({ tema: 'escuro' });
    }

    let config = await prisma.configuracao.findUnique({ where: { id: 'config_unica' } });
    if (!config) {
      config = await prisma.configuracao.create({
        data: { id: 'config_unica', tema: 'escuro' },
      });
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();

    // All allowed fields
    const allowedFields = [
      'nomeEmpresa', 'subtituloEmpresa', 'logoUrl', 'logoCloudPath',
      'endereco', 'bairro', 'cidade', 'estado', 'cep', 'cnpj',
      'telefone', 'whatsapp', 'email', 'textoCabecalho',
      'exibirEndereco', 'exibirTelefone', 'exibirWhatsapp', 'exibirEmail', 'exibirCnpj',
      'exibirNumeroOSNoTopo', 'prefixoNumeroOS', 'posicaoLogo', 'alinhamentoCabecalho', 'corCabecalho',
      'garantiaDias', 'textoGarantia', 'textoBackup', 'textoNaoRetirada', 'textoPerdaGarantia',
      'tema', 'observacaoOS', 'prefixoNumeroOrcamento',
      'usarMarcaDagua', 'tamanhoLogo',
    ];
    const booleanFields = ['exibirEndereco', 'exibirTelefone', 'exibirWhatsapp', 'exibirEmail', 'exibirCnpj', 'exibirNumeroOSNoTopo', 'usarMarcaDagua'];
    const intFields = ['garantiaDias'];

    const data: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (booleanFields.includes(field)) {
          data[field] = Boolean(body[field]);
        } else if (intFields.includes(field)) {
          data[field] = parseInt(body[field]) || 0;
        } else {
          data[field] = body[field] || null;
        }
      }
    }
    // Preserve string fields that are intentionally empty strings
    if (body.prefixoNumeroOS !== undefined) data.prefixoNumeroOS = body.prefixoNumeroOS ?? 'OS';
    if (body.corCabecalho !== undefined) data.corCabecalho = body.corCabecalho ?? '#6c63ff';
    if (body.posicaoLogo !== undefined) data.posicaoLogo = body.posicaoLogo ?? 'esquerda';
    if (body.alinhamentoCabecalho !== undefined) data.alinhamentoCabecalho = body.alinhamentoCabecalho ?? 'esquerda';

    const config = await prisma.configuracao.upsert({
      where: { id: 'config_unica' },
      update: data,
      create: { id: 'config_unica', ...data },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
