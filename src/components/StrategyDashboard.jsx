import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { Metric, ResourceBar, StickDisplay, StickAdvisor, Alert, SectionLabel, ProjRow, Card } from './UI';
import { calcStats, fmtTime, fmtDuration, lapSpeed } from '../lib/calc';

Chart.register(...registerables);

export default function StrategyDashboard({ session, laps }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [elapsed, setElapsed] = useState(0);
  const stats = useMemo(() => calcStats(laps, session), [laps, session]);

  useEffect(() => {
    // If race has ended, freeze timer at final elapsed time
    if (session?.race_end_time && session?.race_start_time) {
      const finalElapsed = (new Date(session.race_end_time) - new Date(session.race_start_time)) / 1000;
      setElapsed(finalElapsed);
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
        { label: 'Lap time', data, borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.06)', tension: 0.3, pointRadius: 2, fill: true },
        { label: 'Target', data: labels.map(() => tgt), borderColor: '#D97706', borderDash: [4,3], pointRadius: 0 },
      ]},
      options: { responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 10 }, color: '#9CA3AF', autoSkip: true, maxTicksLimit: 16 }, grid: { color: '#F3F4F6' } },
          y: { ticks: { font: { size: 10 }, color: '#9CA3AF' }, grid: { color: '#F3F4F6' } },
        },
      },
    });
  }, [laps, session]);

  const { n, batUsed, batRem, batPct, avgLap, mahPerMin, fcPerMin, batTimeRem, estTotalLaps, sticksUsed, advisorState, advisorTitle, advisorDetail, raceMins, totalSticks } = stats;
  const timePct = session?.race_start_time ? Math.min(100, (elapsed / (raceMins * 60)) * 100) : 0;
  const timeRem = Math.max(0, raceMins * 60 - elapsed);
  const last = laps[laps.length - 1];

  const alerts = [];
  if (batPct < 15) alerts.push({ type: 'danger', msg: `Battery critical: ${Math.round(batPct)}% remaining` });
  else if (batPct < 30) alerts.push({ type: 'warn', msg: 'Battery below 30% — consider slowing pace' });
  if (mahPerMin && session?.max_mah_per_min && mahPerMin > session.max_mah_per_min)
    alerts.push({ type: 'danger', msg: `Drain ${mahPerMin.toFixed(1)} mAh/min exceeds limit of ${session.max_mah_per_min}` });
  if (sticksUsed >= totalSticks) alerts.push({ type: 'danger', msg: 'All H2 sticks depleted' });
  else if (sticksUsed === totalSticks - 1) alerts.push({ type: 'warn', msg: 'Last H2 stick in use' });

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="big-timer" style={ session?.race_end_time ? { color: '#374151' } : {} }>
          {fmtDuration(elapsed)}
        </div>
        <div className="timer-rem">
          {session?.race_end_time
            ? `Final time · ${n} laps completed`
            : `${fmtTime(timeRem)} remaining · lap ${n}`}
        </div>
      </div>

      {alerts.map((a, i) => <Alert key={i} type={a.type}>{a.msg}</Alert>)}
      {alerts.length === 0 && n > 0 && <Alert type="ok">All systems nominal</Alert>}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(105px, 1fr))', gap:8, marginBottom:16 }}>
        <Metric label="Avg lap" value={avgLap ? avgLap.toFixed(1) : '—'} unit="sec" />
        <Metric label="Bat used" value={Math.round(batUsed)} unit="mAh" />
        <Metric label="Bat remain" value={Math.round(batRem)} unit="mAh" />
        <Metric label="mAh/min" value={mahPerMin ? mahPerMin.toFixed(1) : '—'} />
        <Metric label="FC current" value={last?.fc_current_a ? parseFloat(last.fc_current_a).toFixed(1) : '—'} unit="A" />
        <Metric label="Voltage" value={last?.battery_voltage_v ? parseFloat(last.battery_voltage_v).toFixed(1) : '—'} unit="V" />
      </div>

      <SectionLabel>Resources</SectionLabel>
      <ResourceBar label="Battery" pct={batPct} valueLabel={`${Math.round(batPct)}%`} />
      <ResourceBar label="Race time" pct={timePct} color="#D97706" valueLabel={`${Math.round(timePct)}%`} />
      <ResourceBar label="H2 sticks" pct={totalSticks > 0 ? ((totalSticks - sticksUsed) / totalSticks) * 100 : 0} color="#3B82F6" valueLabel={`${totalSticks - sticksUsed} left`} />

      <SectionLabel>H2 Stick Advisor</SectionLabel>
      <StickAdvisor state={advisorState} title={advisorTitle} detail={advisorDetail} />
      <StickDisplay total={totalSticks} used={sticksUsed} />

      <Card style={{ marginBottom: 16 }}>
        <SectionLabel style={{ marginTop:0 }}>Projections</SectionLabel>
        <ProjRow label="Est. total laps at current pace" value={estTotalLaps ? `${estTotalLaps} laps` : '—'} />
        <ProjRow label="Battery runs out in" value={batTimeRem ? fmtTime(batTimeRem * 60) : '—'} />
        <ProjRow label="Avg drain rate" value={mahPerMin ? `${mahPerMin.toFixed(1)} mAh/min` : '—'} />
        <ProjRow label="FC avg mAh/min" value={fcPerMin ? `${fcPerMin.toFixed(1)} mAh/min` : '—'} />
        <ProjRow label="FC cumulative" value={last?.fc_cap_mah ? `${Math.round(last.fc_cap_mah)} mAh` : '—'} />
      </Card>

      <SectionLabel>Lap times</SectionLabel>
      <div style={{ height:150, position:'relative', marginBottom:16, background:'#FFFFFF', borderRadius:8, padding:10, border:'1.5px solid #E5E7EB' }}>
        <canvas ref={chartRef} role="img" aria-label="Lap time chart" />
      </div>

      <SectionLabel>Recent laps</SectionLabel>
      <div style={{ overflowX:'auto', border:'1.5px solid #E5E7EB', borderRadius:8, maxHeight:280, overflowY:'auto' }}>
        <table className="data-table" style={{ minWidth:480 }}>
          <thead><tr>{['#','Time','Speed','Bat mAh','FC mAh','Bat A','FC A','Volts','mAh/lap','By'].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {[...laps].reverse().slice(0,20).map((l,ri) => {
              const prev = laps[laps.length-2-ri];
              const delta = l.battery_cap_mah && prev?.battery_cap_mah ? Math.round(parseFloat(l.battery_cap_mah)-parseFloat(prev.battery_cap_mah)) : '—';
              const sp = lapSpeed(parseFloat(l.lap_time), session?.fast_threshold, session?.slow_threshold);
              return (
                <tr key={l.id} className={l.stick_swap ? 'swap-row' : ''}>
                  <td style={{ color:'#111827', fontWeight:500 }}>{l.lap_number}</td>
                  <td style={{ color:'#059669', fontWeight:500 }}>{l.lap_time||'—'}</td>
                  <td>{sp && <span className={`badge badge-${sp}`}>{sp}</span>}</td>
                  <td>{l.battery_cap_mah ? Math.round(l.battery_cap_mah) : '—'}</td>
                  <td>{l.fc_cap_mah ? Math.round(l.fc_cap_mah) : '—'}</td>
                  <td>{l.battery_current_a||'—'}</td>
                  <td>{l.fc_current_a||'—'}</td>
                  <td>{l.battery_voltage_v||'—'}</td>
                  <td>{delta}</td>
                  <td style={{ color:'#9CA3AF' }}>{l.entered_by||'—'}</td>
                </tr>
              );
            })}
            {laps.length===0 && <tr><td colSpan={10} style={{ textAlign:'center', padding:20, color:'#9CA3AF' }}>No laps logged yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
