/**
 * Utilitários de exportação de listas (CSV e PDF via impressão)
 * Sem dependências externas — usa apenas APIs nativas do navegador.
 */

export interface Column {
  key: string;
  label: string;
  /** Função opcional para formatar o valor antes de exibir */
  format?: (value: any, row: any) => string;
}

// ── CSV ────────────────────────────────────────────────────────────────────
export function exportToCSV(data: any[], columns: Column[], filename: string) {
  const sep = ';';
  const header = columns.map(c => `"${c.label}"`).join(sep);
  const rows = data.map(row =>
    columns.map(c => {
      const raw = getNestedValue(row, c.key);
      const val = c.format ? c.format(raw, row) : (raw ?? '');
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(sep)
  );
  const bom = '\uFEFF';
  const csv = bom + [header, ...rows].join('\n');
  downloadBlob(csv, `${filename}.csv`, 'text/csv;charset=utf-8');
}

// ── PDF (abre janela de impressão com tabela HTML) ─────────────────────────
export function exportListToPDF(title: string, data: any[], columns: Column[], filename: string) {
  const thStyle = 'padding:8px 12px;text-align:left;font-size:11px;font-weight:700;border-bottom:2px solid #2563eb;background:#f1f5f9;color:#1e293b;white-space:nowrap;';
  const tdStyle = 'padding:6px 12px;font-size:11px;border-bottom:1px solid #e2e8f0;color:#334155;';

  const headerRow = columns.map(c => `<th style="${thStyle}">${c.label}</th>`).join('');
  const bodyRows = data.map((row, i) => {
    const bg = i % 2 === 0 ? '' : 'background:#f8fafc;';
    const cells = columns.map(c => {
      const raw = getNestedValue(row, c.key);
      const val = c.format ? c.format(raw, row) : (raw ?? '');
      return `<td style="${tdStyle}${bg}">${escapeHtml(String(val))}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>@page{size:A4 landscape;margin:15mm;}body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:20px;}table{width:100%;border-collapse:collapse;}@media print{button{display:none!important;}}</style>
</head><body>
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
  <div><h1 style="font-size:18px;margin:0;color:#1e293b;">${title}</h1>
  <p style="font-size:11px;color:#64748b;margin:4px 0 0;">${data.length} registro(s) • Exportado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</p></div>
  <button onclick="window.print();" style="padding:8px 20px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;">Imprimir / Salvar PDF</button>
</div>
<table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>
</body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
