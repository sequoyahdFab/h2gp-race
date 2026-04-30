import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import {
  Metric, ResourceBar, StickDisplay, StickAdvisor,
  Alert, SectionLabel, ProjRow, Card,
} from './UI';
import { calcStats, fmtTime, fmtDuration, lapSpeed } from '../lib/calc';

Chart.register(...registerables);

export default function StrategyDashboard({ session, laps }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [elapsed, setElapsed] = useState(0);

  const stats = useMemo(() => calcStats(laps, session), [laps, session]);

  // Race timer
  useEffect(() => {
    const t = setInterval(() => {
      if (!session?.race_start_time) return;
      const secs = (Date.now() - new Date(session.race_start_time).getTime()) / 1000;
      setElapsed(Math.max(0, secs));
    }, 500);
    return () => clearInterval(t);
  }, [session?.race_start_time]);

  // Lap time chart
  useEffect(() => {
    if (!chartRef.current) return;
    const validLaps = laps.filter(
      l => parseFloat(l.lap_time) > 0 && parseFloat(l.lap_time) < 300
    );
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
      data: {
        labels,
        datasets: [
          {
            label: 'Lap time',
            data,
            borderColor: '#1D9E75',
            backgroundColor: 'rgba(29,158,117,0.07)',
            tension: 0.3,
            pointRadius: 2,
            fill: true,
          },
          {
            label: 'Target',
            data: labels.map(() => tgt),
            borderColor: '#BA7517',
            borderDash: [4, 3],
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 10 }, autoSkip: true, maxTicksLimit: 16 }, grid: { display: false } },
          y: { ticks: { font: { size: 10 } } },
        },
        animation: false,
      },
    });
  }, [laps, session]);

  const {
    n, batUsed, batRem, batPct, totalSec, avgLap, mahPerMin,
    fcPerMin, batTimeRem, estTotalLaps, sticksUsed,
    advisorState, advisorTitle, advisorDetail,
    pace, raceMins, maxBat, totalSticks,
  } = stats;

  const timePct = session?.race_start_time
    ? Math.min(100, (elapsed / (raceMins * 60)) * 100)
    : 0;
  const timeRem = Math.max(0, raceMins * 60 - elapsed);
  const last = laps[laps.length - 1];

  // Alerts
  const alerts = [];
  if (batPct < 15) alerts.push({ type: 'danger', msg: `Battery critical: ${Math.round(batPct)}% remaining` });
  else if (batPct < 30) alerts.push({ type: 'warn', msg: 'Battery below 30% — consider slowing pace' });
  if (mahPerMin && session?.max_mah_per_min && mahPerMin > session.max_mah_per_min)
    alerts.push({ type: 'danger', msg: `Drain rate ${mahPerMin.toFixed(1)} mAh/min exceeds limit of ${session.max_mah_per_min}` });
  if (sticksUsed >= totalSticks)
    alerts.push({ type: 'danger', msg: 'All H2 sticks depleted' });
  else if (sticksUsed === totalSticks - 1)
    alerts.push({ type: 'warn', msg: 'Last H2 stick in use' });

  return (
    <div>
      {/* Race timer */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: '1rem' }}>
        <div style={{ fontSize: 32, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-primary)' }}>
          {fmtDuration(elapsed)}
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {fmtTime(timeRem)} remaining
        </div>
      </div>

      {/* Alerts */}
      {alerts.map((a, i) => <Alert key={i} type={a.type}>{a.msg}</Alert>)}
      {alerts.length === 0 && <Alert type="ok">All systems nominal</Alert>}

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 7, marginBottom: '1rem' }}>
        <Metric label="Lap" value={n} />
        <Metric label="Avg lap" value={avgLap ? avgLap.toFixed(1) : '—'} unit="sec" />
        <Metric label="Bat used" value={Math.round(batUsed)} unit="mAh" />
        <Metric label="Bat remain" value={Math.round(batRem)} unit="mAh" />
        <Metric label="mAh/min" value={mahPerMin ? mahPerMin.toFixed(1) : '—'} />
        <Metric label="FC current" value={last?.fc_current_a ? parseFloat(last.fc_current_a).toFixed(1) : '—'} unit="A" />
      </div>

      {/* Resource bars */}
      <SectionLabel>Resources</SectionLabel>
      <ResourceBar label="Battery" pct={batPct} valueLabel={`${Math.round(batPct)}%`} />
      <ResourceBar label="Race time" pct={timePct} color="#BA7517" valueLabel={`${Math.round(timePct)}%`} />
      <ResourceBar
        label="H2 sticks"
        pct={totalSticks > 0 ? ((totalSticks - sticksUsed) / totalSticks) * 100 : 0}
        color="#378ADD"
        valueLabel={`${totalSticks - sticksUsed} left`}
      />

      {/* Stick advisor */}
      <SectionLabel>H2 stick advisor</SectionLabel>
      <StickAdvisor state={advisorState} title={advisorTitle} detail={advisorDetail} />
      <StickDisplay total={totalSticks} used={sticksUsed} />

      {/* Projections */}
      <Card style={{ marginBottom: '1rem' }}>
        <SectionLabel style={{ marginTop: 0 }}>Projections</SectionLabel>
        <ProjRow label="Est. total laps at current pace" value={estTotalLaps ? `${estTotalLaps} laps` : '—'} />
        <ProjRow label="Battery runs out in" value={batTimeRem ? fmtTime(batTimeRem * 60) : '—'} />
        <ProjRow label="Avg drain rate" value={mahPerMin ? `${mahPerMin.toFixed(1)} mAh/min` : '—'} />
        <ProjRow label="FC avg mAh/min" value={fcPerMin ? `${fcPerMin.toFixed(1)} mAh/min` : '—'} />
        <ProjRow label="Current voltage" value={last?.battery_voltage_v ? `${parseFloat(last.battery_voltage_v).toFixed(1)} V` : '—'} />
        <ProjRow label="FC cumulative" value={last?.fc_cap_mah ? `${Math.round(last.fc_cap_mah)} mAh` : '—'} />
      </Card>

      {/* Lap chart */}
      <SectionLabel>Lap times</SectionLabel>
      <div style={{ height: 140, position: 'relative', marginBottom: '1rem' }}>
        <canvas ref={chartRef} role="img" aria-label="Lap time chart with target line">Lap time history</canvas>
      </div>

      {/* Recent laps table */}
      <SectionLabel>Recent laps</SectionLabel>
      <div style={{ overflowX: 'auto', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 480 }}>
          <thead>
            <tr style={{ background: 'var(--color-background-secondary)' }}>
              {['#', 'Time', 'Speed', 'Bat cap', 'FC cap', 'Bat A', 'FC A', 'Volts', 'mAh/lap', 'By'].map(h => (
                <th key={h} style={{ padding: '5px 7px', textAlign: 'left', fontSize: 10, fontWeight: 500, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...laps].reverse().slice(0, 20).map((l, ri) => {
              const prev = laps[laps.length - 1 - ri - 1];
              const delta = l.battery_cap_mah && prev?.battery_cap_mah
                ? Math.round(parseFloat(l.battery_cap_mah) - parseFloat(prev.battery_cap_mah))
                : '—';
              const sp = lapSpeed(parseFloat(l.lap_time), session?.fast_threshold, session?.slow_threshold);
              const spStyle = sp === 'good' ? { background: '#E1F5EE', color: '#085041' } : sp === 'fast' ? { background: '#FAECE7', color: '#4A1B0C' } : sp === 'slow' ? { background: '#FAEEDA', color: '#633806' } : {};
              return (
                <tr key={l.id} style={{ background: l.stick_swap ? '#F0FAF6' : 'transparent' }}>
                  <td style={{ padding: '4px 7px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{l.lap_number}</td>
                  <td style={{ padding: '4px 7px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{l.lap_time || '—'}</td>
                  <td style={{ padding: '4px 7px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                    {sp && <span style={{ fontSize: 9, fontWeight: 500, padding: '2px 5px', borderRadius: 3, ...spStyle }}>{sp}</span>}
                  </td>
                  <td style={{ padding: '4px 7px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{l.battery_cap_mah || '—'}</td>
                  <td style={{ padding: '4px 7px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{l.fc_cap_mah || '—'}</td>
                  <td style={{ padding: '4px 7px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{l.battery_current_a || '—'}</td>
                  <td style={{ padding: '4px 7px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{l.fc_current_a || '—'}</td>
                  <td style={{ padding: '4px 7px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{l.battery_voltage_v || '—'}</td>
                  <td style={{ padding: '4px 7px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{delta}</td>
                  <td style={{ padding: '4px 7px', borderBottom: '0.5px solid var(--color-border-tertiary)', color: 'var(--color-text-secondary)' }}>{l.entered_by || '—'}</td>
                </tr>
              );
            })}
            {laps.length === 0 && (
              <tr><td colSpan={10} style={{ padding: 16, textAlign: 'center', color: 'var(--color-text-secondary)' }}>No laps logged yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
