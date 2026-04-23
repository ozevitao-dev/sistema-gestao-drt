const SP_TZ = 'America/Sao_Paulo';

/** Current date/time in SP timezone as a formatted object */
export function nowSP(): Date {
  // Returns a Date whose UTC values correspond to SP local time.
  // Use for display or extracting Y/M/D/H/M in SP.
  const now = new Date();
  const spStr = now.toLocaleString('en-US', { timeZone: SP_TZ });
  return new Date(spStr);
}

/** Format date as DD/MM/YYYY */
export function formatDateBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', { timeZone: SP_TZ });
}

/** Format date as DD/MM/YYYY HH:mm */
export function formatDateTimeBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', { timeZone: SP_TZ }) + ' ' +
    d.toLocaleTimeString('pt-BR', { timeZone: SP_TZ, hour: '2-digit', minute: '2-digit' });
}

/** Today's date as YYYY-MM-DD in SP timezone */
export function todayISO_SP(): string {
  const sp = nowSP();
  const y = sp.getFullYear();
  const m = String(sp.getMonth() + 1).padStart(2, '0');
  const d = String(sp.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Current time as HH:mm in SP timezone */
export function nowTimeSP(): string {
  const sp = nowSP();
  return String(sp.getHours()).padStart(2, '0') + ':' + String(sp.getMinutes()).padStart(2, '0');
}

/** Start of today in SP timezone (as UTC Date for DB queries) */
export function todayStartUTC_SP(): Date {
  const sp = nowSP();
  const iso = `${sp.getFullYear()}-${String(sp.getMonth() + 1).padStart(2, '0')}-${String(sp.getDate()).padStart(2, '0')}T00:00:00`;
  // Convert SP midnight back to UTC
  const utc = new Date(iso + '-03:00'); // BRT = UTC-3 (simplified; DST no longer applies in Brazil)
  return utc;
}

/** End of today in SP timezone (as UTC Date for DB queries) */
export function todayEndUTC_SP(): Date {
  const sp = nowSP();
  const iso = `${sp.getFullYear()}-${String(sp.getMonth() + 1).padStart(2, '0')}-${String(sp.getDate()).padStart(2, '0')}T23:59:59.999`;
  const utc = new Date(iso + '-03:00');
  return utc;
}

/** Start of week (Sunday) in SP timezone (as UTC Date for DB queries) */
export function weekStartUTC_SP(): Date {
  const sp = nowSP();
  const dayOfWeek = sp.getDay();
  sp.setDate(sp.getDate() - dayOfWeek);
  const iso = `${sp.getFullYear()}-${String(sp.getMonth() + 1).padStart(2, '0')}-${String(sp.getDate()).padStart(2, '0')}T00:00:00`;
  return new Date(iso + '-03:00');
}

/** End of week (Saturday) in SP timezone (as UTC Date for DB queries) */
export function weekEndUTC_SP(): Date {
  const sp = nowSP();
  const dayOfWeek = sp.getDay();
  sp.setDate(sp.getDate() + (6 - dayOfWeek));
  const iso = `${sp.getFullYear()}-${String(sp.getMonth() + 1).padStart(2, '0')}-${String(sp.getDate()).padStart(2, '0')}T23:59:59.999`;
  return new Date(iso + '-03:00');
}

/** Start of current month in SP timezone (as UTC Date for DB queries) */
export function monthStartUTC_SP(): Date {
  const sp = nowSP();
  const iso = `${sp.getFullYear()}-${String(sp.getMonth() + 1).padStart(2, '0')}-01T00:00:00`;
  return new Date(iso + '-03:00');
}

/** End of current month in SP timezone (as UTC Date for DB queries) */
export function monthEndUTC_SP(): Date {
  const sp = nowSP();
  const lastDay = new Date(sp.getFullYear(), sp.getMonth() + 1, 0).getDate();
  const iso = `${sp.getFullYear()}-${String(sp.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999`;
  return new Date(iso + '-03:00');
}
