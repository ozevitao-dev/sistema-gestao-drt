'use client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';

export function WeeklyBarChart({ data }: { data: any[] }) {
  const safeData = data ?? [];
  if (safeData.length === 0) return <div className="flex items-center justify-center h-full text-text-secondary text-sm">Sem dados disponíveis</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={safeData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <XAxis dataKey="dia" tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12, color: 'var(--text-primary)' }} />
        <Bar dataKey="os" name="Ordens de Serviço" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={18} />
        <Bar dataKey="orc" name="Orçamentos" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={18} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusPieChart({ data }: { data: any[] }) {
  const safeData = data ?? [];
  if (safeData.length === 0) return <div className="flex items-center justify-center h-full text-text-secondary text-sm">Sem dados no período</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={safeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={45}
          label={({ name, percent, cx: cxVal, x, y }: any) => { const isRight = x > cxVal; return <text x={x} y={y} textAnchor={isRight ? 'start' : 'end'} dominantBaseline="central" fill="var(--text-primary)" fontSize={10}>{`${name} ${(percent * 100).toFixed(0)}%`}</text>; }} labelLine={false}>
          {safeData.map((entry: any, i: number) => <Cell key={i} fill={entry.color || '#60B5FF'} />)}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12, color: 'var(--text-primary)' }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default function DashboardChart({ data }: { data: any[] }) {
  return <WeeklyBarChart data={data} />;
}
