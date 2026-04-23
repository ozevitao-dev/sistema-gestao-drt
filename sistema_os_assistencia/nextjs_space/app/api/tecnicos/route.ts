export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const tecnicos = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, ativo: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(tecnicos);
  } catch (error: any) {
    console.error('Error fetching tecnicos:', error);
    return NextResponse.json({ error: 'Erro ao buscar técnicos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await request.json();
    const { name, email, password, role } = body;
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 });
    }
    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);
    const tecnico = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role || 'tecnico' },
      select: { id: true, name: true, email: true, role: true, ativo: true, createdAt: true },
    });
    return NextResponse.json(tecnico, { status: 201 });
  } catch (error: any) {
    console.error('Error creating tecnico:', error);
    return NextResponse.json({ error: 'Erro ao criar técnico' }, { status: 500 });
  }
}
