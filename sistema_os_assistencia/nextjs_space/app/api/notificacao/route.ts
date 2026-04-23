export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { ordemId } = await request.json();
    if (!ordemId) return NextResponse.json({ error: 'ordemId obrigatório' }, { status: 400 });

    const ordem = await prisma.ordemServico.findUnique({
      where: { id: ordemId },
      include: { cliente: true, tecnico: true },
    });
    if (!ordem) return NextResponse.json({ error: 'OS não encontrada' }, { status: 404 });

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    let appName = 'Sistema OS';
    try { appName = new URL(appUrl)?.hostname?.split('.')?.[0] || 'Sistema OS'; } catch {}

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">Nova Ordem de Serviço #${ordem?.numero ?? ''}</h2>
        </div>
        <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
          <p><strong>Cliente:</strong> ${ordem?.cliente?.nome ?? 'N/A'}</p>
          <p><strong>Equipamento:</strong> ${ordem?.tipoEquipamento ?? ''} - ${ordem?.marca ?? ''} ${ordem?.modelo ?? ''}</p>
          <p><strong>Problema:</strong> ${ordem?.descricaoProblema ?? ''}</p>
          <p><strong>Técnico:</strong> ${ordem?.tecnico?.name ?? 'Não atribuído'}</p>
          <p><strong>Valor Total:</strong> R$ ${(ordem?.valorTotal ?? 0)?.toFixed?.(2)?.replace('.', ',') ?? '0,00'}</p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">Gerado em: ${new Date()?.toLocaleString?.('pt-BR') ?? ''}</p>
        </div>
      </div>
    `;

    const senderEmail = (() => { try { return `noreply@${new URL(appUrl).hostname}`; } catch { return 'noreply@sistemaos.com'; } })();

    // Notify admin
    try {
      await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deployment_token: process.env.ABACUSAI_API_KEY,
          app_id: process.env.WEB_APP_ID,
          notification_id: process.env.NOTIF_ID_NOVA_OS_NOTIFICAO_ADMIN,
          subject: `Nova OS #${ordem?.numero ?? ''} - ${ordem?.cliente?.nome ?? ''}`,
          body: htmlBody,
          is_html: true,
          recipient_email: 'contato@drtinformatica.com.br',
          sender_email: senderEmail,
          sender_alias: appName,
        }),
      });
    } catch (e: any) { console.error('Admin notification error:', e); }

    // Notify client if has email
    if (ordem?.cliente?.email) {
      const clientHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">Sua OS foi registrada!</h2>
          </div>
          <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Olá <strong>${ordem?.cliente?.nome ?? ''}</strong>,</p>
            <p>Sua Ordem de Serviço <strong>#${ordem?.numero ?? ''}</strong> foi registrada com sucesso.</p>
            <p><strong>Equipamento:</strong> ${ordem?.tipoEquipamento ?? ''} - ${ordem?.marca ?? ''} ${ordem?.modelo ?? ''}</p>
            <p><strong>Problema:</strong> ${ordem?.descricaoProblema ?? ''}</p>
            <p><strong>Status:</strong> Aberta</p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">Entraremos em contato assim que houver atualizações.</p>
          </div>
        </div>
      `;
      try {
        await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deployment_token: process.env.ABACUSAI_API_KEY,
            app_id: process.env.WEB_APP_ID,
            notification_id: process.env.NOTIF_ID_NOVA_OS_CONFIRMAO_CLIENTE,
            subject: `OS #${ordem?.numero ?? ''} - Registrada com Sucesso`,
            body: clientHtml,
            is_html: true,
            recipient_email: ordem.cliente.email,
            sender_email: senderEmail,
            sender_alias: appName,
          }),
        });
      } catch (e: any) { console.error('Client notification error:', e); }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notificacao error:', error);
    return NextResponse.json({ error: 'Erro ao enviar notificação' }, { status: 500 });
  }
}
