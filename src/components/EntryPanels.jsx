import React, { useState } from 'react';
import { Btn, Card, SectionLabel, Alert, Metric } from './UI';
import { calcStats } from '../lib/calc';

function Field({ label, id, value, onChange, placeholder, step, onEnter }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <input id={id} type="number" step={step} value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onKeyDown={e => e.key === 'Enter' && onEnter && onEnter()} />
    </div>
  );
}

export function LapTimeEntry({ session, laps, addLap, updateLap, locked }) {
  const [lapTime, setLapTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const stats = calcStats(laps, session);
  const nextLap = laps.length + 1;
  const pendingLap = [...laps].reverse().find(l => !l.lap_time);

  const handleSubmit = async () => {
    if (!lapTime) return;
    setSaving(true);
    try {
      if (pendingLap) await updateLap(pendingLap.id, { lap_time: parseFloat(lapTime), source: 'manual', entered_by: 'lap-timer' });
      else await addLap({ lap_time: parseFloat(lapTime), source: 'manual', entered_by: 'lap-timer' });
      setMsg(`✓ Lap ${pendingLap?.lap_number || nextLap} — ${lapTime}s`);
      setLapTime('');
    } catch (e) { setMsg(`Error: ${e.message}`); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="role-header">
        <div className="role-name">⏱ Lap Timer</div>
        <div className="role-desc">Enter each lap time from LiveRC as the car crosses the line</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 8, marginBottom: 16 }}>
        <Metric label="Laps logged" value={laps.length} />
        <Metric label="Next lap" value={`#${nextLap}`} />
        <Metric label="Avg lap" value={stats.avgLap ? stats.avgLap.toFixed(1) : '—'} unit="sec" />
        <Metric label="Last lap" value={laps[laps.length-1]?.lap_time ?? '—'} unit="sec" />
      </div>
      <Card>
        <SectionLabel style={{ marginTop: 0 }}>Log lap {pendingLap?.lap_number || nextLap}</SectionLabel>
        <div style={{ marginBottom: 12 }}>
          <Field label="Lap time (seconds)" id="lt" value={lapTime} onChange={setLapTime} placeholder="e.g. 20.34" step="0.01" onEnter={handleSubmit} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Btn onClick={handleSubmit} disabled={saving || !lapTime || locked}>
            {saving ? 'Saving…' : `+ Log lap ${pendingLap?.lap_number || nextLap}`}
          </Btn>
          {msg && <span style={{ fontSize: 13, color: '#059669', fontWeight: 500 }}>{msg}</span>}
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 10 }}>Tip: press Enter to log quickly</div>
      </Card>
      <SectionLabel>Last 5 laps</SectionLabel>
      {[...laps].reverse().slice(0,5).map(l => (
        <div key={l.id} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #F3F4F6', fontSize:13 }}>
          <span style={{ color:'#6B7280', fontFamily:"'DM Mono',monospace" }}>Lap {l.lap_number}</span>
          <span style={{ color:'#111827', fontFamily:"'DM Mono',monospace", fontWeight:500 }}>{l.lap_time ? `${l.lap_time}s` : '—'}</span>
        </div>
      ))}
    </div>
  );
}

export function BatteryEntry({ session, laps, addLap, updateLap, locked }) {
  const [batCap, setBatCap] = useState('');
  const [batCur, setBatCur] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const stats = calcStats(laps, session);
  const nextLap = laps.length + 1;
  const pendingLap = [...laps].reverse().find(l => !l.battery_cap_mah && !l.battery_current_a);
  const last = laps[laps.length - 1];
  const batRem = session ? Math.max(0, session.battery_limit_mah - (last?.battery_cap_mah || 0)) : null;
  const batPct = session && last?.battery_cap_mah ? Math.max(0, 100 - (parseFloat(last.battery_cap_mah) / session.battery_limit_mah) * 100) : null;

  const handleSubmit = async () => {
    if (!batCap && !batCur) return;
    setSaving(true);
    try {
      const data = { battery_cap_mah: batCap ? parseFloat(batCap) : null, battery_current_a: batCur ? parseFloat(batCur) : null, entered_by: 'battery' };
      if (pendingLap) await updateLap(pendingLap.id, data);
      else await addLap(data);
      setMsg(`✓ Lap ${pendingLap?.lap_number || nextLap} logged`);
      setBatCap(''); setBatCur('');
    } catch (e) { setMsg(`Error: ${e.message}`); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="role-header">
        <div className="role-name">🔋 Battery Telemetry</div>
        <div className="role-desc">Read battery capacity (cumulative mAh) and current (A) from JETI screen</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(105px, 1fr))', gap:8, marginBottom:16 }}>
        <Metric label="Battery used" value={last?.battery_cap_mah ? Math.round(last.battery_cap_mah) : 0} unit="mAh" />
        <Metric label="Remaining" value={batRem !== null ? Math.round(batRem) : '—'} unit="mAh" />
        <Metric label="Remain %" value={batPct !== null ? `${Math.round(batPct)}%` : '—'} highlight={batPct !== null && batPct > 40} />
        <Metric label="mAh/min" value={stats.mahPerMin ? stats.mahPerMin.toFixed(1) : '—'} />
      </div>
      {batPct !== null && batPct < 20 && <Alert type="danger">Battery below 20% — alert strategy team immediately</Alert>}
      <Card>
        <SectionLabel style={{ marginTop:0 }}>Enter reading — lap {pendingLap?.lap_number || nextLap}</SectionLabel>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <Field label="Battery capacity (mAh) — cumulative" id="bc" value={batCap} onChange={setBatCap} placeholder="e.g. 1250" onEnter={handleSubmit} />
          <Field label="Battery current (A)" id="ba" value={batCur} onChange={setBatCur} placeholder="e.g. 3.5" step="0.1" onEnter={handleSubmit} />
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <Btn onClick={handleSubmit} disabled={saving || (!batCap && !batCur) || locked}>{saving ? 'Saving…' : 'Log reading'}</Btn>
          {msg && <span style={{ fontSize:13, color:'#059669', fontWeight:500 }}>{msg}</span>}
        </div>
      </Card>
      <SectionLabel>Last 5 readings</SectionLabel>
      {[...laps].reverse().slice(0,5).map(l => (
        <div key={l.id} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #F3F4F6', fontSize:13 }}>
          <span style={{ color:'#6B7280', fontFamily:"'DM Mono',monospace" }}>Lap {l.lap_number}</span>
          <span style={{ color:'#111827', fontFamily:"'DM Mono',monospace", fontWeight:500 }}>
            {l.battery_cap_mah ? `${Math.round(l.battery_cap_mah)} mAh` : '—'}
            {l.battery_current_a ? ` · ${parseFloat(l.battery_current_a).toFixed(1)}A` : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

export function FuelCellEntry({ session, laps, addLap, updateLap, locked }) {
  const [fcCap, setFcCap] = useState('');
  const [fcCur, setFcCur] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const nextLap = laps.length + 1;
  const pendingLap = [...laps].reverse().find(l => !l.fc_cap_mah && !l.fc_current_a);
  const last = laps[laps.length - 1];
  const recentFC = laps.slice(-3).map(l => parseFloat(l.fc_current_a)).filter(v => !isNaN(v) && v > 0);
  const avgFC = recentFC.length > 0 ? recentFC.reduce((s,v)=>s+v,0)/recentFC.length : null;
  const fcLow = session?.fc_low_amps || 1.0;

  const handleSubmit = async () => {
    if (!fcCap && !fcCur) return;
    setSaving(true);
    try {
      const data = { fc_cap_mah: fcCap ? parseFloat(fcCap) : null, fc_current_a: fcCur ? parseFloat(fcCur) : null, entered_by: 'fuel-cell' };
      if (pendingLap) await updateLap(pendingLap.id, data);
      else await addLap(data);
      setMsg(`✓ Lap ${pendingLap?.lap_number || nextLap} logged`);
      setFcCap(''); setFcCur('');
    } catch (e) { setMsg(`Error: ${e.message}`); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="role-header">
        <div className="role-name">⚗️ Fuel Cell Telemetry</div>
        <div className="role-desc">Read FC capacity (cumulative mAh) and current (A) from JETI screen</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(105px, 1fr))', gap:8, marginBottom:16 }}>
        <Metric label="FC cumulative" value={last?.fc_cap_mah ? Math.round(last.fc_cap_mah) : 0} unit="mAh" />
        <Metric label="Last FC current" value={last?.fc_current_a ? parseFloat(last.fc_current_a).toFixed(1) : '—'} unit="A" />
        <Metric label="3-lap avg FC" value={avgFC ? avgFC.toFixed(2) : '—'} unit="A" />
        <Metric label="Low trigger" value={fcLow} unit="A" />
      </div>
      {avgFC !== null && avgFC <= fcLow && <Alert type="danger">FC current at {avgFC.toFixed(2)}A — below {fcLow}A trigger. Notify strategy!</Alert>}
      {avgFC !== null && avgFC <= fcLow + 0.3 && avgFC > fcLow && <Alert type="warn">FC current dropping ({avgFC.toFixed(2)}A) — approaching swap trigger</Alert>}
      <Card>
        <SectionLabel style={{ marginTop:0 }}>Enter reading — lap {pendingLap?.lap_number || nextLap}</SectionLabel>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <Field label="FC capacity (mAh) — cumulative" id="fc" value={fcCap} onChange={setFcCap} placeholder="e.g. 850" onEnter={handleSubmit} />
          <Field label="FC current (A)" id="fa" value={fcCur} onChange={setFcCur} placeholder="e.g. 2.1" step="0.1" onEnter={handleSubmit} />
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <Btn onClick={handleSubmit} disabled={saving || (!fcCap && !fcCur) || locked}>{saving ? 'Saving…' : 'Log reading'}</Btn>
          {msg && <span style={{ fontSize:13, color:'#059669', fontWeight:500 }}>{msg}</span>}
        </div>
      </Card>
      <SectionLabel>Last 5 readings</SectionLabel>
      {[...laps].reverse().slice(0,5).map(l => (
        <div key={l.id} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #F3F4F6', fontSize:13 }}>
          <span style={{ color:'#6B7280', fontFamily:"'DM Mono',monospace" }}>Lap {l.lap_number}</span>
          <span style={{ color: l.fc_current_a && parseFloat(l.fc_current_a) <= fcLow ? '#DC2626' : '#111827', fontFamily:"'DM Mono',monospace", fontWeight:500 }}>
            {l.fc_cap_mah ? `${Math.round(l.fc_cap_mah)} mAh` : '—'}
            {l.fc_current_a ? ` · ${parseFloat(l.fc_current_a).toFixed(1)}A` : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

export function VoltageEntry({ session, laps, addLap, updateLap, locked }) {
  const [voltage, setVoltage] = useState('');
  const [stickSwap, setStickSwap] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const nextLap = laps.length + 1;
  const pendingLap = [...laps].reverse().find(l => !l.battery_voltage_v);
  const last = laps[laps.length - 1];

  const handleSubmit = async () => {
    if (!voltage) return;
    setSaving(true);
    try {
      const data = { battery_voltage_v: parseFloat(voltage), stick_swap: stickSwap, entered_by: 'voltage' };
      if (pendingLap) await updateLap(pendingLap.id, data);
      else await addLap(data);
      setMsg(`✓ Lap ${pendingLap?.lap_number || nextLap}${stickSwap ? ' — SWAP recorded' : ''}`);
      setVoltage(''); setStickSwap(false);
    } catch (e) { setMsg(`Error: ${e.message}`); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="role-header">
        <div className="role-name">⚡ Voltage + Swap</div>
        <div className="role-desc">Read battery voltage from JETI screen. Log H2 stick swaps here.</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(105px, 1fr))', gap:8, marginBottom:16 }}>
        <Metric label="Last voltage" value={last?.battery_voltage_v ? parseFloat(last.battery_voltage_v).toFixed(1) : '—'} unit="V" />
        <Metric label="Laps logged" value={laps.length} />
        <Metric label="Stick swaps" value={laps.filter(l=>l.stick_swap).length} />
      </div>
      {last?.battery_voltage_v && parseFloat(last.battery_voltage_v) < 7.0 && <Alert type="warn">Voltage at {parseFloat(last.battery_voltage_v).toFixed(1)}V — monitor closely</Alert>}
      <Card>
        <SectionLabel style={{ marginTop:0 }}>Enter reading — lap {pendingLap?.lap_number || nextLap}</SectionLabel>
        <div style={{ marginBottom:12 }}>
          <Field label="Battery voltage (V)" id="v" value={voltage} onChange={setVoltage} placeholder="e.g. 7.4" step="0.1" onEnter={handleSubmit} />
        </div>
        <div onClick={() => setStickSwap(!stickSwap)} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', marginBottom:14, borderRadius:7, cursor:'pointer', border:`1.5px solid ${stickSwap ? '#059669' : '#D1D5DB'}`, background: stickSwap ? '#ECFDF5' : '#F9FAFB', transition:'all 0.15s' }}>
          <div style={{ width:18, height:18, borderRadius:4, flexShrink:0, border:`2px solid ${stickSwap ? '#059669' : '#D1D5DB'}`, background: stickSwap ? '#059669' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {stickSwap && <span style={{ color:'#fff', fontSize:11, fontWeight:700 }}>✓</span>}
          </div>
          <span style={{ fontSize:14, fontWeight:600, color: stickSwap ? '#065F46' : '#374151' }}>H2 stick swapped this lap</span>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <Btn onClick={handleSubmit} disabled={saving || !voltage || locked} variant={stickSwap ? 'secondary' : 'primary'}>
            {saving ? 'Saving…' : stickSwap ? '🔄 Log + record swap' : 'Log reading'}
          </Btn>
          {msg && <span style={{ fontSize:13, color:'#059669', fontWeight:500 }}>{msg}</span>}
        </div>
      </Card>
      <SectionLabel>Voltage trend</SectionLabel>
      {[...laps].reverse().slice(0,5).map(l => (
        <div key={l.id} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #F3F4F6', fontSize:13 }}>
          <span style={{ color:'#6B7280', fontFamily:"'DM Mono',monospace" }}>Lap {l.lap_number}</span>
          <span style={{ color: l.battery_voltage_v && parseFloat(l.battery_voltage_v) < 7.0 ? '#DC2626' : '#111827', fontFamily:"'DM Mono',monospace", fontWeight:500 }}>
            {l.battery_voltage_v ? `${parseFloat(l.battery_voltage_v).toFixed(1)} V` : '—'}
            {l.stick_swap ? ' 🔄' : ''}
          </span>
        </div>
      ))}
    </div>
  );
}
