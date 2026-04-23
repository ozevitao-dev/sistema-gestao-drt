import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ── Usuários ──────────────────────────────────────────────────────────
  const senha = await bcrypt.hash('Felicidade@00', 10);

  await prisma.user.upsert({
    where: { email: 'vitordrt' },
    update: { password: senha, role: 'admin', ativo: true, name: 'VITORDRT' },
    create: { email: 'vitordrt', name: 'VITORDRT', password: senha, role: 'admin', ativo: true },
  });

  await prisma.user.upsert({
    where: { email: 'diegodrt' },
    update: { password: senha, role: 'admin', ativo: true, name: 'DIEGODRT' },
    create: { email: 'diegodrt', name: 'DIEGODRT', password: senha, role: 'admin', ativo: true },
  });

  // Conta de teste (necessária para testes automatizados)
  const senhaTest = await bcrypt.hash('johndoe123', 10);
  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: { password: senhaTest, role: 'admin', ativo: true, name: 'Teste' },
    create: { email: 'john@doe.com', name: 'Teste', password: senhaTest, role: 'admin', ativo: true },
  });

  // Desativar outros usuários
  await prisma.user.updateMany({
    where: { email: { notIn: ['vitordrt', 'diegodrt', 'john@doe.com'] } },
    data: { ativo: false },
  });

  console.log('✓ Usuários criados/atualizados');

  // ── Marcas e Modelos ──────────────────────────────────────────────────
  const marcasModelos: Record<string, string[]> = {
    'Dell': ['Inspiron', 'Vostro', 'Latitude', 'G15', 'G3', 'G5', 'XPS', 'Alienware'],
    'Acer': ['Aspire 3', 'Aspire 5', 'Nitro 5', 'Predator', 'Extensa'],
    'Samsung': ['Book', 'Book E', 'Book X', 'Expert', 'Odyssey', 'Essentials'],
    'HP': ['Pavilion', 'EliteBook', 'ProBook', '240 G7', '250 G8', '256 G8', 'Envy', 'Omen'],
    'Lenovo': ['IdeaPad 1', 'IdeaPad 3', 'IdeaPad 3i', 'IdeaPad Gaming 3i', 'ThinkPad', 'ThinkCentre', 'Legion', 'V14', 'V15'],
    'Asus': ['VivoBook', 'ZenBook', 'TUF Gaming', 'ROG', 'X515', 'X515EA', 'M515', 'E510'],
    'Positivo': ['Motion', 'Master', 'Duo', 'Stilo'],
    'Vaio': ['FE14', 'FE15'],
    'Apple': ['MacBook Air', 'MacBook Pro'],
    'Avell': ['A series', 'B series', 'Storm'],
    'LG': ['Gram'],
    'Toshiba': ['Satellite'],
    'Sony': ['VAIO'],
    'Compaq': ['Presario'],
    'Gigabyte': ['G5', 'Aorus'],
    'MSI': ['Modern', 'GF63', 'Katana', 'Bravo'],
    'Multilaser': ['Legacy', 'Ultra'],
    'Philco': ['14L', '14M', '14P'],
    'Gateway': ['GWTN141', 'GWTN156'],
    'Alienware': ['m15', 'm16', 'm17', 'x14', 'x15', 'Aurora'],
    'Huawei': ['MateBook'],
    'Xiaomi': ['RedmiBook', 'Mi Notebook'],
    'Microsoft': ['Surface Laptop', 'Surface Book'],
    'Razer': ['Blade'],
    'Outros': [],
  };

  for (const [marcaNome, modelos] of Object.entries(marcasModelos)) {
    const marca = await prisma.marca.upsert({
      where: { nome: marcaNome },
      update: {},
      create: { nome: marcaNome },
    });
    for (const modeloNome of modelos) {
      await prisma.modelo.upsert({
        where: { nome_marcaId: { nome: modeloNome, marcaId: marca.id } },
        update: {},
        create: { nome: modeloNome, marcaId: marca.id },
      });
    }
  }
  console.log('✓ Marcas e modelos cadastrados');

  // ── Serviços Padrão ────────────────────────────────────────────────────
  const servicos = [
    { nome: 'Troca de tela', valor: 350 },
    { nome: 'Troca de teclado', valor: 200 },
    { nome: 'Troca de bateria', valor: 250 },
    { nome: 'Troca de dobradiça', valor: 180 },
    { nome: 'Troca de carcaça', valor: 300 },
    { nome: 'Upgrade de SSD', valor: 150 },
    { nome: 'Upgrade de RAM', valor: 120 },
    { nome: 'Limpeza interna', valor: 100 },
    { nome: 'Troca de pasta térmica', valor: 80 },
    { nome: 'Formatação', valor: 120 },
    { nome: 'Instalação de sistema operacional', valor: 130 },
    { nome: 'Instalação de drivers', valor: 70 },
    { nome: 'Backup de dados', valor: 100 },
    { nome: 'Reparo de placa', valor: 500 },
    { nome: 'Troca de conector DC Jack', valor: 200 },
    { nome: 'Reinstalação de sistema', valor: 120 },
    { nome: 'Remoção de vírus', valor: 100 },
    { nome: 'Recuperação de sistema', valor: 150 },
    { nome: 'Configuração de notebook', valor: 80 },
    { nome: 'Configuração de desktop', valor: 80 },
    { nome: 'Higienização completa', valor: 120 },
    { nome: 'Revisão técnica', valor: 100 },
    { nome: 'Diagnóstico técnico', valor: 60 },
  ];

  for (const s of servicos) {
    await prisma.servicoPadrao.upsert({
      where: { nome: s.nome },
      update: { valor: s.valor },
      create: { nome: s.nome, valor: s.valor, ativo: true },
    });
  }
  console.log('✓ Serviços padrão cadastrados');

  // ── Configuração padrão ──────────────────────────────────────────────
  await prisma.configuracao.upsert({
    where: { id: 'config_unica' },
    update: {},
    create: {
      id: 'config_unica',
      nomeEmpresa: 'DRT Informática',
      subtituloEmpresa: 'Assistência técnica especializada em notebooks e computadores',
      prefixoNumeroOS: 'OS',
      prefixoNumeroOrcamento: 'ORC',
      garantiaDias: 90,
      textoGarantia: 'A garantia cobre apenas o serviço executado e/ou peça substituída, pelo prazo indicado, não abrangendo mau uso, quedas, oxidação, umidade, violação por terceiros ou danos externos.',
      textoBackup: 'É de responsabilidade do cliente realizar backup prévio de seus dados. A assistência técnica não se responsabiliza por eventual perda de dados.',
      textoNaoRetirada: 'Equipamentos não retirados no prazo informado poderão ser armazenados, descartados ou destinados conforme política da empresa.',
      textoPerdaGarantia: 'A garantia será perdida em caso de mau uso, queda, umidade, oxidação ou violação por terceiros não autorizados.',
      tema: 'escuro',
    },
  });
  console.log('✓ Configuração padrão criada');

  // Pro-labore configs for partners
  for (const nome of ['VITORDRT', 'DIEGODRT']) {
    await prisma.proLaboreConfig.upsert({
      where: { nomeSocio: nome },
      update: {},
      create: { nomeSocio: nome, valorFixo: 0, percentualLucro: 50 },
    });
  }
  console.log('✓ Configurações de pró-labore criadas');

  console.log('\n🎉 Seed completo!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
