import React, { useMemo, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { calcStats, fmtTime, fmtDuration, lapSpeed } from '../lib/calc';
import { reasonMeta } from '../lib/constants';

Chart.register(...registerables);

function StatCard({ label, value, unit, color }) {
  return (
    <div style={{
      background: '#FFFFFF', border: '1.5px solid #E5E7EB',
      borderRadius: 10, padding: '14px 16px',
      borderTop: `4px solid ${color || '#059669'}`,
    }}>
      <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 26, fontWeight: 500, color: '#111827', lineHeight: 1 }}>{value ?? '—'}</div>
      {unit && <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{unit}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: "'Barlow Condensed', sans-serif",
      fontSize: 14, fontWeight: 800,
      color: '#9CA3AF', textTransform: 'uppercase',
      letterSpacing: '0.1em', margin: '24px 0 10px',
    }}>
      {children}
    </div>
  );
}

export default function ReviewPage({ session, laps, events = [], batteryPacks = [], onBack }) {
  const lapChartRef = useRef(null);
  const batChartRef = useRef(null);
  const lapChartInst = useRef(null);
  const batChartInst = useRef(null);

  const stats = useMemo(() => calcStats(laps, session), [laps, session]);

  // Final elapsed time
  const finalElapsed = session?.race_start_time && session?.race_end_time
    ? (new Date(session.race_end_time) - new Date(session.race_start_time)) / 1000
    : null;

  // Stick swap laps
  const swapLaps = laps.filter(l => l.stick_swap);

  // Best / worst lap
  const validLaps = laps.filter(l => parseFloat(l.lap_time) > 0 && parseFloat(l.lap_time) < 300);
  const bestLap = validLaps.length > 0 ? validLaps.reduce((b, l) => parseFloat(l.lap_time) < parseFloat(b.lap_time) ? l : b) : null;
  // Total battery used
  const lastLap = laps[laps.length - 1];
  const totalBatUsed = lastLap?.battery_cap_mah ? Math.round(parseFloat(lastLap.battery_cap_mah)) : null;
  const totalFCUsed = lastLap?.fc_cap_mah ? Math.round(parseFloat(lastLap.fc_cap_mah)) : null;
  const batPctUsed = session && totalBatUsed ? Math.round((totalBatUsed / session.battery_limit_mah) * 100) : null;

  // Lap time chart
  useEffect(() => {
    if (!lapChartRef.current || validLaps.length === 0) return;
    const labels = validLaps.map(l => `L${l.lap_number}`);
    const data = validLaps.map(l => parseFloat(parseFloat(l.lap_time).toFixed(2)));
    const tgt = session?.target_lap_time || 20;
    const swapSet = new Set(swapLaps.map(l => l.lap_number));

    if (lapChartInst.current) { lapChartInst.current.destroy(); }
    lapChartInst.current = new Chart(lapChartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Lap time',
            data,
            borderColor: '#059669',
            backgroundColor: 'rgba(5,150,105,0.06)',
            tension: 0.3, fill: true,
            pointBackgroundColor: validLaps.map(l =>
              swapSet.has(l.lap_number) ? '#D97706' :
              parseFloat(l.lap_time) === parseFloat(bestLap?.lap_time) ? '#DC2626' : '#059669'
            ),
            pointRadius: validLaps.map(l =>
              swapSet.has(l.lap_number) || parseFloat(l.lap_time) === parseFloat(bestLap?.lap_time) ? 6 : 3
            ),
          },
          {
            label: 'Target',
            data: labels.map(() => tgt),
            borderColor: '#D97706', borderDash: [4,3], pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => {
                const ln = validLaps[ctx.dataIndex]?.lap_number;
                return swapSet.has(ln) ? '🔄 H2 stick swap' : '';
              }
            }
          }
        },
        scales: {
          x: { ticks: { font: { size: 10 }, color: '#9CA3AF', autoSkip: true, maxTicksLimit: 20 }, grid: { color: '#F3F4F6' } },
          y: { ticks: { font: { size: 10 }, color: '#9CA3AF' }, grid: { color: '#F3F4F6' } },
        },
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laps, session]);

  // Battery + FC drain chart
  useEffect(() => {
    if (!batChartRef.current || laps.length === 0) return;
    const lapsWithBat = laps.filter(l => l.battery_cap_mah);
    const labels = lapsWithBat.map(l => `L${l.lap_number}`);

    if (batChartInst.current) { batChartInst.current.destroy(); }
    batChartInst.current = new Chart(batChartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Battery (mAh)',
            data: lapsWithBat.map(l => parseFloat(l.battery_cap_mah)),
            borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.05)',
            tension: 0.3, pointRadius: 2, fill: true, yAxisID: 'y',
          },
          {
            label: 'FC (mAh)',
            data: lapsWithBat.map(l => parseFloat(l.fc_cap_mah || 0)),
            borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.05)',
            tension: 0.3, pointRadius: 2, fill: true, yAxisID: 'y',
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: true, labels: { font: { size: 10, family: 'Barlow' }, color: '#6B7280' } } },
        scales: {
          x: { ticks: { font: { size: 10 }, color: '#9CA3AF', autoSkip: true, maxTicksLimit: 20 }, grid: { color: '#F3F4F6' } },
          y: { ticks: { font: { size: 10 }, color: '#9CA3AF' }, grid: { color: '#F3F4F6' }, title: { display: true, text: 'mAh', font: { size: 10 }, color: '#9CA3AF' } },
        },
      },
    });
  }, [laps]);

  return (
    <div>
      {/* Header */}
      <div className="race-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/h2gplogo.png" alt="Sequoyah Racing" style={{ height: 36, width: 'auto' }} />
          <div>
            <div className="race-title">{session?.name}</div>
            <div className="race-subtitle">
              {session?.race_end_time
                ? `Completed ${new Date(session.race_end_time).toLocaleDateString()} at ${new Date(session.race_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : new Date(session?.created_at).toLocaleDateString()
              }
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 11, fontWeight: 700,
            color: '#065F46', background: '#ECFDF5',
            border: '1.5px solid #A7F3D0', borderRadius: 6,
            padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            ✓ Race Complete
          </span>
          <button
            className="btn-ghost-dark"
            style={{ fontSize: 12, padding: '6px 10px' }}
            onClick={() => {
              const header = 'lap_number,lap_time,battery_cap_mah,fc_cap_mah,battery_current_a,fc_current_a,battery_voltage_v,stick_swap,source\n';
              const rows = laps.map(l => [l.lap_number,l.lap_time,l.battery_cap_mah,l.fc_cap_mah,l.battery_current_a,l.fc_current_a,l.battery_voltage_v,l.stick_swap?1:0,l.source].join(',')).join('\n');
              const a = document.createElement('a');
              a.href = URL.createObjectURL(new Blob([header+rows],{type:'text/csv'}));
              a.download = `h2gp_${session?.name?.replace(/\s+/g,'_')}.csv`;
              a.click();
            }}
          >
            Export CSV
          </button>
          <button className="btn-ghost-dark" style={{ fontSize: 12, padding: '6px 10px' }} onClick={onBack}>
            ← Sessions
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 48px' }}>

        {/* Key stats */}
        <SectionTitle>Race Summary</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 8 }}>
          <StatCard label="Final time" value={finalElapsed ? fmtDuration(finalElapsed) : '—'} color="#111827" />
          <StatCard label="Total laps" value={laps.length} color="#3B82F6" />
          <StatCard label="Avg lap" value={stats.avgLap ? stats.avgLap.toFixed(2) : '—'} unit="sec" color="#059669" />
          <StatCard label="Best lap" value={bestLap ? parseFloat(bestLap.lap_time).toFixed(2) : '—'} unit={bestLap ? `Lap ${bestLap.lap_number}` : ''} color="#DC2626" />
          <StatCard label="Battery used" value={totalBatUsed ?? '—'} unit={batPctUsed ? `${batPctUsed}% of limit` : 'mAh'} color="#3B82F6" />
          <StatCard label="FC total" value={totalFCUsed ?? '—'} unit="mAh" color="#059669" />
          <StatCard label="Avg drain" value={stats.mahPerMin ? stats.mahPerMin.toFixed(1) : '—'} unit="mAh/min" color="#D97706" />
          <StatCard label="Stick swaps" value={swapLaps.length} color="#8B5CF6" />
        </div>

        {/* Lap time chart */}
        <SectionTitle>Lap Times</SectionTitle>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8, fontFamily: "'Barlow', sans-serif" }}>
          🔴 Best lap &nbsp;·&nbsp; 🟠 H2 stick swap &nbsp;·&nbsp; — — Target pace
        </div>
        <div style={{ height: 180, background: '#FFFFFF', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: 12, marginBottom: 8 }}>
          <canvas ref={lapChartRef} role="img" aria-label="Lap time chart" />
        </div>

        {/* Drain chart */}
        <SectionTitle>Battery + Fuel Cell Drain</SectionTitle>
        <div style={{ height: 180, background: '#FFFFFF', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: 12, marginBottom: 8 }}>
          <canvas ref={batChartRef} role="img" aria-label="Battery and fuel cell drain chart" />
        </div>

        {/* Stick swap timeline */}
        {swapLaps.length > 0 && (
          <>
            <SectionTitle>H2 Stick Swap Timeline</SectionTitle>
            <div style={{ background: '#FFFFFF', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '12px 16px', marginBottom: 8 }}>
              {swapLaps.map((l, i) => {
                const prevSwap = i === 0 ? null : swapLaps[i - 1];
                const lapsSince = prevSwap ? l.lap_number - prevSwap.lap_number : l.lap_number;
                const timeSince = laps
                  .slice(prevSwap ? prevSwap.lap_number : 0, l.lap_number)
                  .reduce((s, x) => s + (parseFloat(x.lap_time) || 0), 0);
                return (
                  <div key={l.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '8px 0', borderBottom: i < swapLaps.length - 1 ? '1px solid #F3F4F6' : 'none',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: '#FFFBEB', border: '2px solid #D97706',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 800, color: '#92400E',
                      flexShrink: 0,
                    }}>
                      #{i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: '#111827' }}>
                        Stick {i + 1} → Stick {i + 2} &nbsp;
                        <span style={{ fontWeight: 400, color: '#6B7280' }}>after lap {l.lap_number}</span>
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        {lapsSince} laps on stick · {fmtTime(timeSince)} elapsed
                        {l.fc_current_a ? ` · FC at ${parseFloat(l.fc_current_a).toFixed(2)}A` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pit stops */}
        {events.filter(e => e.event_type === 'pit_stop').length > 0 && (
          <>
            <SectionTitle>Pit Stop Log</SectionTitle>
            <div style={{ background: '#FFFFFF', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '12px 16px', marginBottom: 8 }}>
              {events.filter(e => e.event_type === 'pit_stop').map(p => {
                const m = reasonMeta(p.reason);
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #F3F4F6' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        Lap {p.lap_number} · {p.reason}
                      </div>
                      {p.notes && <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{p.notes}</div>}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: m.bg, color: m.color, fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {m.category}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Battery packs */}
        {batteryPacks.length > 0 && (
          <>
            <SectionTitle>Battery Pack Log</SectionTitle>
            <div style={{ background: '#FFFFFF', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '12px 16px', marginBottom: 8 }}>
              {batteryPacks.map((p, i) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0', borderBottom: i < batteryPacks.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EFF6FF', border: '2px solid #3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 800, color: '#1E40AF', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      {p.pack_name} · {p.capacity_mah} mAh
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                      Swapped in at lap {p.swap_lap}{p.notes ? ` · ${p.notes}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Full lap table */}
        <SectionTitle>Full Lap Log</SectionTitle>
        <div style={{ overflowX: 'auto', border: '1.5px solid #E5E7EB', borderRadius: 10, maxHeight: 400, overflowY: 'auto' }}>
          <table className="data-table" style={{ minWidth: 520 }}>
            <thead>
              <tr>
                {['#', 'Time (s)', 'Speed', 'Bat mAh', 'FC mAh', 'Bat A', 'FC A', 'Volts', 'mAh/lap'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {laps.map((l, i) => {
                const prev = laps[i - 1];
                const delta = l.battery_cap_mah && prev?.battery_cap_mah
                  ? Math.round(parseFloat(l.battery_cap_mah) - parseFloat(prev.battery_cap_mah))
                  : '—';
                const sp = lapSpeed(parseFloat(l.lap_time), session?.fast_threshold, session?.slow_threshold);
                const isBest = bestLap && l.id === bestLap.id;
                return (
                  <tr key={l.id} className={l.stick_swap ? 'swap-row' : ''}>
                    <td style={{ color: '#111827', fontWeight: 500 }}>{l.lap_number}</td>
                    <td style={{ color: isBest ? '#DC2626' : '#059669', fontWeight: isBest ? 700 : 400 }}>
                      {l.lap_time || '—'}{isBest ? ' ★' : ''}
                    </td>
                    <td>{sp && <span className={`badge badge-${sp}`}>{sp}</span>}</td>
                    <td>{l.battery_cap_mah ? Math.round(l.battery_cap_mah) : '—'}</td>
                    <td>{l.fc_cap_mah ? Math.round(l.fc_cap_mah) : '—'}</td>
                    <td>{l.battery_current_a || '—'}</td>
                    <td>{l.fc_current_a || '—'}</td>
                    <td>{l.battery_voltage_v || '—'}</td>
                    <td>{delta}</td>
                  </tr>
                );
              })}
              {laps.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 20, color: '#9CA3AF' }}>No lap data</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
