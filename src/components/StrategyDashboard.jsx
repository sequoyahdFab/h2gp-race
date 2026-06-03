import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { Metric, ResourceBar, StickDisplay, StickAdvisor, Alert, SectionLabel, ProjRow, Card } from './UI';
import { calcStats, fmtTime, fmtDuration, lapSpeed, interpolateLaps } from '../lib/calc';
import { PaceAdvisor } from './PaceAdvisor';
import { reasonMeta } from '../lib/constants';

Chart.register(...registerables);

export default function StrategyDashboard({ session, laps, pitStops = [], batteryPacks = [] }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const mahChartRef = useRef(null);
  const mahChartInstance = useRef(null);
  const [elapsed, setElapsed] = useState(0);
  const [mahXAxis, setMahXAxis] = useState('lap'); // 'lap' | 'time'
  const interpolated = useMemo(() => interpolateLaps(laps), [laps]);
  const stats = useMemo(() => calcStats(interpolated, session), [interpolated, session]);

  useEffect(() => {
    if (session?.race_end_time && session?.race_start_time) {
      setElapsed((new Date(session.race_end_time) - new Date(session.race_start_time)) / 1000);
      return;
    }
    const t = setInterval(() => {
      if (!session?.race_start_time) return;
      setElapsed((Date.now() - new Date(session.race_start_time).getTime()) / 1000);
    }, 500);
    return () => clearInterval(t);
  }, [session?.race_start_time, session?.race_end_time]);

  useEffect(() => {
    if (!chartRef.current) return;
    const pitSet = new Set(pitStops.map(p => p.lap_number));
    const swapSet = new Set(laps.filter(l => l.stick_swap).map(l => l.lap_number));
    const validLaps = laps.filter(l => parseFloat(l.lap_time) > 0 && parseFloat(l.lap_time) < 300);
    const labels = validLaps.map(l => `L${l.lap_number}`);
    const data = validLaps.map(l => parseFloat(parseFloat(l.lap_time).toFixed(2)));
    const tgt = session?.target_lap_time || 20;
    if (chartInstance.current) {
      chartInstance.current.data.labels = labels;
      chartInstance.current.data.datasets[0].data = data;
      chartInstance.current.data.datasets[1].data = labels.map(() => tgt);
      chartInstance.current.update('none');
      return;
    }
    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: { labels, datasets: [
        {
          label: 'Lap time', data,
          borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.06)',
          tension: 0.3, fill: true,
          pointBackgroundColor: validLaps.map(l =>
            pitSet.has(l.lap_number) ? '#DC2626' :
            swapSet.has(l.lap_number) ? '#D97706' : '#059669'
          ),
          pointRadius: validLaps.map(l =>
            pitSet.has(l.lap_number) || swapSet.has(l.lap_number) ? 5 : 2
          ),
        },
        { label: 'Target', data: labels.map(() => tgt), borderColor: '#D97706', borderDash: [4,3], pointRadius: 0 },
      ]},
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 10 }, color: '#9CA3AF', autoSkip: true, maxTicksLimit: 16 }, grid: { color: '#F3F4F6' } },
          y: { ticks: { font: { size: 10 }, color: '#9CA3AF' }, grid: { color: '#F3F4F6' } },
        },
      },
    });
  }, [laps, session, pitStops]);

  // ── mAh/min chart ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mahChartRef.current) return;

    // Build per-lap mAh/min: delta battery_cap_mah / lap_time_mins
    const validLaps = laps.filter(l =>
      l.battery_cap_mah != null && parseFloat(l.lap_time) > 0 && parseFloat(l.lap_time) < 300
    );
    if (validLaps.length < 2) {
      if (mahChartInstance.current) { mahChartInstance.current.destroy(); mahChartInstance.current = null; }
      return;
    }

    // Calculate cumulative elapsed time per lap (seconds from race start)
    let cumSecs = 0;
    const lapData = validLaps.map((l, i) => {
      const lapSecs = parseFloat(l.lap_time);
      cumSecs += lapSecs;
      const prevMah = i === 0 ? 0 : parseFloat(validLaps[i - 1].battery_cap_mah);
      const deltaMah = parseFloat(l.battery_cap_mah) - prevMah;
      const mpm = deltaMah > 0 ? parseFloat((deltaMah / (lapSecs / 60)).toFixed(2)) : null;
      return { lap: l.lap_number, cumSecs, mpm };
    });

    // Filter out nulls/negatives (battery resets on swap, bad readings)
    const filtered = lapData.filter(d => d.mpm !== null && d.mpm > 0 && d.mpm < 200);

    const labels = filtered.map(d => mahXAxis === 'lap' ? `L${d.lap}` : fmtDuration(d.cumSecs));
    const mpmData = filtered.map(d => d.mpm);

    // Trend line — linear regression
    const n = mpmData.length;
    const xVals = mpmData.map((_, i) => i);
    const sumX = xVals.reduce((a, b) => a + b, 0);
    const sumY = mpmData.reduce((a, b) => a + b, 0);
    const sumXY = xVals.reduce((s, x, i) => s + x * mpmData[i], 0);
    const sumX2 = xVals.reduce((s, x) => s + x * x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const trendData = xVals.map(x => parseFloat((slope * x + intercept).toFixed(2)));

    const maxLimit = session?.max_mah_per_min && session.max_mah_per_min < 200
      ? labels.map(() => parseFloat(session.max_mah_per_min))
      : null;

    const datasets = [
      {
        label: 'mAh/min', data: mpmData,
        borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.07)',
        tension: 0.3, fill: true, pointRadius: 2, pointBackgroundColor: '#3B82F6',
      },
      {
        label: 'Trend', data: trendData,
        borderColor: '#9333EA', borderDash: [5, 3], pointRadius: 0, tension: 0,
      },
    ];
    if (maxLimit) {
      datasets.push({
        label: 'Max limit', data: maxLimit,
        borderColor: '#DC2626', borderDash: [4, 3], pointRadius: 0, tension: 0, borderWidth: 1.5,
      });
    }

    if (mahChartInstance.current) {
      mahChartInstance.current.data.labels = labels;
      mahChartInstance.current.data.datasets = datasets;
      mahChartInstance.current.update('none');
      return;
    }

    mahChartInstance.current = new Chart(mahChartRef.current, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: {
          legend: {
            display: true,
            labels: { font: { size: 10 }, color: '#6B7280', boxWidth: 20, padding: 10 },
          },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y} mAh/min`,
            },
          },
        },
        scales: {
          x: { ticks: { font: { size: 10 }, color: '#9CA3AF', autoSkip: true, maxTicksLimit: 16 }, grid: { color: '#F3F4F6' } },
          y: {
            ticks: { font: { size: 10 }, color: '#9CA3AF', callback: v => `${v}` },
            grid: { color: '#F3F4F6' },
            title: { display: true, text: 'mAh/min', font: { size: 10 }, color: '#9CA3AF' },
          },
        },
      },
    });
  }, [laps, session, mahXAxis]);

  const { n, batUsed, batRem, batPct, avgLap, mahPerMin, fcPerMin, batTimeRem, estTotalLaps, sticksUsed, advisorState, advisorTitle, advisorDetail, raceMins, totalSticks, fcEMA, trendDeclining } = stats;

  const timePct = session?.race_start_time ? Math.min(100, (elapsed / (raceMins * 60)) * 100) : 0;
  const timeRem = Math.max(0, raceMins * 60 - elapsed);
  const last = laps[laps.length - 1];
  const pitSet = new Set(pitStops.map(p => p.lap_number));

  const isPractice = session?.preset_key === 'practice';
  const alerts = [];
  if (!isPractice) {
    if (batPct < 15) alerts.push({ type: 'danger', msg: `Battery critical: ${Math.round(batPct)}% remaining` });
    else if (batPct < 30) alerts.push({ type: 'warn', msg: 'Battery below 30% — consider slowing pace' });
    if (mahPerMin && session?.max_mah_per_min && session.max_mah_per_min < 90 && mahPerMin > session.max_mah_per_min)
      alerts.push({ type: 'danger', msg: `Drain ${mahPerMin.toFixed(1)} mAh/min exceeds limit of ${session.max_mah_per_min}` });
    if (sticksUsed >= totalSticks) alerts.push({ type: 'danger', msg: 'All H2 sticks depleted' });
    else if (sticksUsed === totalSticks - 1) alerts.push({ type: 'warn', msg: 'Last H2 stick in use' });
  }

  return (
    <div style={{ maxWidth: '100%' }}>

      {/* Alerts — full width */}
      {alerts.map((a, i) => <Alert key={i} type={a.type}>{a.msg}</Alert>)}
      {alerts.length === 0 && n > 0 && <Alert type="ok">All systems nominal</Alert>}

      {/* Two-column above-the-fold layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)', gap: 16, marginBottom: 20, alignItems: 'start' }}>

        {/* LEFT — decisions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Timer */}
          <div style={{ background: '#FFFFFF', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '12px 16px' }}>
            <div className="big-timer" style={session?.race_end_time ? { color: '#374151' } : {}}>
              {fmtDuration(elapsed)}
            </div>
            <div className="timer-rem">
              {session?.race_end_time ? `Final time · ${n} laps completed` : `${fmtTime(timeRem)} remaining · lap ${n}`}
            </div>
          </div>

          {/* Pace advisor */}
          {!session?.race_end_time && (
            <div>
              <SectionLabel>Pace guidance</SectionLabel>
              <PaceAdvisor session={session} laps={laps} elapsed={elapsed} />
            </div>
          )}

          {/* H2 Stick advisor */}
          <div>
            <SectionLabel>H2 Stick Advisor</SectionLabel>
            <StickAdvisor state={advisorState} title={advisorTitle} detail={advisorDetail} />
            <StickDisplay total={totalSticks} used={sticksUsed} />
          </div>

          {/* Resources */}
          <div>
            <SectionLabel>Resources</SectionLabel>
            <ResourceBar label="Battery" pct={batPct} valueLabel={`${Math.round(batPct)}%`} />
            <ResourceBar label="Race time" pct={timePct} color="#D97706" valueLabel={`${Math.round(timePct)}%`} />
            <ResourceBar label="H2 sticks" pct={totalSticks > 0 ? ((totalSticks - sticksUsed) / totalSticks) * 100 : 0} color="#3B82F6" valueLabel={`${totalSticks - sticksUsed} left`} />
          </div>
        </div>

        {/* RIGHT — data + charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Key metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            <Metric label="Avg lap" value={avgLap ? avgLap.toFixed(1) : '—'} unit="sec"
              hint={session?.target_lap_time ? `target: ${session.target_lap_time}s` : undefined} />
            <Metric label="mAh/min" value={mahPerMin ? mahPerMin.toFixed(1) : '—'}
              hint={session?.max_mah_per_min ? `max: ${session.max_mah_per_min} mAh/min` : undefined} />
            <Metric label="Bat remain" value={Math.round(batRem)} unit="mAh"
              hint={session?.battery_limit_mah ? `limit: ${session.battery_limit_mah.toLocaleString()} mAh` : undefined} />
            <Metric label="Bat used" value={Math.round(batUsed)} unit="mAh"
              hint={session?.battery_limit_mah ? `limit: ${session.battery_limit_mah.toLocaleString()} mAh` : undefined} />
            <Metric label="FC EMA-7" value={fcEMA ? fcEMA.toFixed(2) : last?.fc_current_a ? parseFloat(last.fc_current_a).toFixed(1) : '—'} unit={trendDeclining ? 'A ↓ declining' : 'A'}
              hint="7-lap exponential avg" />
            <Metric label="Voltage" value={last?.battery_voltage_v ? parseFloat(last.battery_voltage_v).toFixed(1) : '—'} unit="V"
              hint="min: 7.0V" />
          </div>

          {/* Lap time chart */}
          <div>
            <SectionLabel>Lap times</SectionLabel>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6, fontFamily: "'Barlow', sans-serif" }}>
              🔴 Pit stop &nbsp;·&nbsp; 🟠 H2 swap &nbsp;·&nbsp; — — Target
            </div>
            <div style={{ height: 130, background: '#FFFFFF', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: 10 }}>
              <canvas ref={chartRef} role="img" aria-label="Lap time chart" />
            </div>
          </div>

          {/* mAh/min chart */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <SectionLabel style={{ margin: 0 }}>Drain rate (mAh/min)</SectionLabel>
              <div style={{ display: 'flex', gap: 4 }}>
                {['lap', 'time'].map(axis => (
                  <button
                    key={axis}
                    onClick={() => setMahXAxis(axis)}
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700,
                      padding: '3px 10px', borderRadius: 5, cursor: 'pointer', textTransform: 'uppercase',
                      border: `1.5px solid ${mahXAxis === axis ? '#3B82F6' : '#D1D5DB'}`,
                      background: mahXAxis === axis ? '#EFF6FF' : '#FFFFFF',
                      color: mahXAxis === axis ? '#1D4ED8' : '#6B7280',
                    }}
                  >
                    {axis === 'lap' ? 'By lap' : 'By time'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6, fontFamily: "'Barlow', sans-serif" }}>
              <span style={{ color: '#3B82F6', fontWeight: 700 }}>—</span> mAh/min &nbsp;·&nbsp;
              <span style={{ color: '#9333EA', fontWeight: 700 }}>- -</span> Trend &nbsp;·&nbsp;
              <span style={{ color: '#DC2626', fontWeight: 700 }}>- -</span> Limit
            </div>
            <div style={{ height: 130, background: '#FFFFFF', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: 10 }}>
              <canvas ref={mahChartRef} role="img" aria-label="mAh per minute chart" />
            </div>
          </div>
        </div>
      </div>

      {/* BELOW FOLD — projections + recent laps side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 16, borderTop: '1.5px solid #E5E7EB', paddingTop: 16 }}>
        <Card style={{ marginBottom: 0 }}>
          <SectionLabel style={{ marginTop: 0 }}>Projections</SectionLabel>
          <ProjRow label="Est. total laps" value={estTotalLaps ? `${estTotalLaps} laps` : '—'} />
          <ProjRow label="Battery runs out in" value={batTimeRem ? fmtTime(batTimeRem * 60) : '—'} />
          <ProjRow label="Avg drain rate" value={mahPerMin ? `${mahPerMin.toFixed(1)} mAh/min` : '—'} />
          <ProjRow label="FC avg mAh/min" value={fcPerMin ? `${fcPerMin.toFixed(1)} mAh/min` : '—'} />
          <ProjRow label="FC cumulative" value={last?.fc_cap_mah ? `${Math.round(last.fc_cap_mah)} mAh` : '—'} />
          <ProjRow label="Pit stops" value={pitStops.length > 0 ? `${pitStops.length} logged` : '0'} />
          <ProjRow label="Battery packs" value={batteryPacks.length > 0 ? batteryPacks.map(p => p.pack_name).join(', ') : '—'} />
        </Card>

        {/* Recent laps */}
        <div>
          <SectionLabel>Recent laps</SectionLabel>
      <SectionLabel>Recent laps</SectionLabel>
      <div style={{ overflowX: 'auto', border: '1.5px solid #E5E7EB', borderRadius: 8, maxHeight: 360, overflowY: 'auto' }}>
        <table className="data-table" style={{ minWidth: 500 }}>
          <thead>
            <tr>{['#','Time','Speed','Bat mAh','FC mAh','Bat A','FC A','Volts','Event'].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {[...laps].reverse().slice(0, 20).map((l, ri) => {
              const sp = lapSpeed(parseFloat(l.lap_time), session?.fast_threshold, session?.slow_threshold);
              const isPit = pitSet.has(l.lap_number);
              const pitReason = isPit ? pitStops.find(p => p.lap_number === l.lap_number)?.reason : null;
              const pitMeta = pitReason ? reasonMeta(pitReason) : null;
              return (
                <tr key={l.id} style={{ background: isPit ? '#FEF2F2' : l.stick_swap ? '#FFFBEB' : 'transparent' }}>
                  <td style={{ color: '#111827', fontWeight: 500 }}>{l.lap_number}</td>
                  <td style={{ color: isPit ? '#DC2626' : '#059669', fontWeight: isPit ? 700 : 400 }}>{l.lap_time || '—'}</td>
                  <td>{sp && <span className={`badge badge-${sp}`}>{sp}</span>}</td>
                  <td>{l.battery_cap_mah ? Math.round(l.battery_cap_mah) : '—'}</td>
                  <td>{l.fc_cap_mah ? Math.round(l.fc_cap_mah) : '—'}</td>
                  <td>{l.battery_current_a || '—'}</td>
                  <td>{l.fc_current_a || '—'}</td>
                  <td>{l.battery_voltage_v || '—'}</td>
                  <td>
                    {isPit && pitMeta && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3, background: pitMeta.bg, color: pitMeta.color, fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>
                        {pitReason}
                      </span>
                    )}
                    {l.stick_swap && !isPit && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3, background: '#FFFBEB', color: '#92400E', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>
                        H2 Swap
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {laps.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 20, color: '#9CA3AF' }}>No laps logged yet</td></tr>}
          </tbody>
        </table>
      </div>
        </div>
      </div>
    </div>
  );
}
