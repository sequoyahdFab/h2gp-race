import React, { useState, useEffect, useRef } from 'react';
import { Btn, Card, SectionLabel, Alert, Metric } from './UI';
import { calcStats } from '../lib/calc';

// ── Shared fast-entry field ───────────────────────────────────────────────
function FastField({ label, id, value, onChange, placeholder, step, autoFocus, onEnter }) {
  const ref = useRef(null);
  useEffect(() => { if (autoFocus && ref.current) ref.current.focus(); }, [autoFocus]);
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <input
        ref={ref}
        id={id}
        type="number"
        step={step || 'any'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={e => e.key === 'Enter' && onEnter && onEnter()}
        style={{ fontSize: 20, fontFamily: "'DM Mono', monospace", fontWeight: 500 }}
      />
    </div>
  );
}

// ── Flash confirmation overlay ────────────────────────────────────────────
function FlashConfirm({ msg, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
      background: '#059669', color: '#fff',
      fontFamily: "'Barlow Condensed', sans-serif",
      fontSize: 18, fontWeight: 800, letterSpacing: '0.04em',
      padding: '10px 24px', borderRadius: 8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      zIndex: 9999, pointerEvents: 'none',
      textTransform: 'uppercase',
    }}>
      ✓ {msg}
    </div>
  );
}

// ── useFlash hook ─────────────────────────────────────────────────────────
function useFlash() {
  const [flash, setFlash] = useState({ show: false, msg: '' });
  const trigger = (msg) => {
    setFlash({ show: true, msg });
    setTimeout(() => setFlash({ show: false, msg: '' }), 1500);
  };
  return [flash, trigger];
}

// ── Lap Timer (Student 1) ─────────────────────────────────────────────────
export function LapTimeEntry({ session, laps, addLap, updateLap, locked }) {
  const [lapTime, setLapTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, triggerFlash] = useFlash();
  const stats = calcStats(laps, session);
  const nextLap = laps.length + 1;
  const pendingLap = laps.length > 0 ? laps[laps.length - 1] : null;

  const handleSubmit = async () => {
    if (!lapTime || saving || locked) return;
    setSaving(true);
    try {
      if (pendingLap && !pendingLap.lap_time) {
        await updateLap(pendingLap.id, { lap_time: parseFloat(lapTime), source: 'manual', entered_by: 'lap-timer' });
      } else {
        await addLap({ lap_time: parseFloat(lapTime), source: 'manual', entered_by: 'lap-timer' });
      }
      triggerFlash(`Lap ${nextLap} — ${lapTime}s`);
      setLapTime('');
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <FlashConfirm msg={flash.msg} show={flash.show} />
      <div className="role-header">
        <div className="role-name">⏱ Lap Timer</div>
        <div className="role-desc">Enter lap time from LiveRC · auto-imported when extension is running</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 16 }}>
        <Metric label="Laps logged" value={laps.length} />
        <Metric label="Next lap" value={`#${nextLap}`} highlight />
        <Metric label="Avg lap" value={stats.avgLap ? stats.avgLap.toFixed(1) : '—'} unit="sec" />
        <Metric label="Last lap" value={laps[laps.length-1]?.lap_time ?? '—'} unit="sec" />
      </div>

      <Card>
        <SectionLabel style={{ marginTop: 0 }}>Lap {nextLap}</SectionLabel>
        <div style={{ marginBottom: 12 }}>
          <FastField
            label="Lap time (seconds)"
            id="lt" value={lapTime} onChange={setLapTime}
            placeholder="e.g. 20.34" step="0.01"
            autoFocus onEnter={handleSubmit}
          />
        </div>
        <Btn onClick={handleSubmit} disabled={saving || !lapTime || locked}>
          {saving ? 'Saving…' : `Log lap ${nextLap}`}
        </Btn>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
          Press Enter to log · auto-imported from LiveRC when extension is active
        </div>
      </Card>

      <SectionLabel>Last 5 laps</SectionLabel>
      {[...laps].reverse().slice(0, 5).map(l => (
        <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F3F4F6' }}>
          <span style={{ color: '#6B7280', fontFamily: "'DM Mono', monospace" }}>Lap {l.lap_number}</span>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: '#111827', fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>{l.lap_time ? `${l.lap_time}s` : '—'}</span>
            {l.source === 'LiveRC' && <span style={{ fontSize: 9, background: '#EFF6FF', color: '#1E40AF', padding: '1px 5px', borderRadius: 3, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>LIVERC</span>}
            {l.source === 'extension' && <span style={{ fontSize: 9, background: '#ECFDF5', color: '#065F46', padding: '1px 5px', borderRadius: 3, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>AUTO</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Capacity Entry (Student 2 — Battery cap + FC cap) ─────────────────────
export function CapacityEntry({ session, laps, addLap, updateLap, locked }) {
  const [batCap, setBatCap] = useState('');
  const [fcCap, setFcCap] = useState('');
  const [lapNum, setLapNum] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, triggerFlash] = useFlash();

  const currentLap = laps.length;
  const effectiveLap = lapNum ? parseInt(lapNum) : currentLap;
  const last = laps[laps.length - 1];

  const handleSubmit = async () => {
    if ((!batCap && !fcCap) || saving || locked) return;
    setSaving(true);
    try {
      const targetLap = laps.find(l => l.lap_number === effectiveLap);
      const data = {
        battery_cap_mah: batCap ? parseFloat(batCap) : null,
        fc_cap_mah: fcCap ? parseFloat(fcCap) : null,
        entered_by: 'capacity',
      };
      if (targetLap) {
        await updateLap(targetLap.id, data);
      } else {
        await addLap({ lap_number: effectiveLap, ...data });
      }
      triggerFlash(`Lap ${effectiveLap} capacity logged`);
      setBatCap(''); setFcCap('');
      setLapNum(String(effectiveLap + 1));
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const batRem = session ? Math.max(0, session.battery_limit_mah - (last?.battery_cap_mah || 0)) : null;

  return (
    <div>
      <FlashConfirm msg={flash.msg} show={flash.show} />
      <div className="role-header">
        <div className="role-name">📊 Capacity</div>
        <div className="role-desc">Battery capacity (mAh) + Fuel cell capacity (mAh) — both cumulative from JETI</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 16 }}>
        <Metric label="Bat used" value={last?.battery_cap_mah ? Math.round(last.battery_cap_mah) : 0} unit="mAh" />
        <Metric label="Bat remain" value={batRem !== null ? Math.round(batRem) : '—'} unit="mAh" />
        <Metric label="FC total" value={last?.fc_cap_mah ? Math.round(last.fc_cap_mah) : 0} unit="mAh" />
        <Metric label="Current lap" value={currentLap} />
      </div>

      {batRem !== null && batRem < session?.battery_limit_mah * 0.2 && (
        <Alert type="danger">Battery below 20% — alert strategy team</Alert>
      )}

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <SectionLabel style={{ marginTop: 0, marginBottom: 0, flex: 1 }}>Lap</SectionLabel>
          <input
            type="number"
            value={lapNum || currentLap}
            onChange={e => setLapNum(e.target.value)}
            style={{ width: 70, fontSize: 16, fontFamily: "'DM Mono', monospace", fontWeight: 700, textAlign: 'center', padding: '4px 8px' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <FastField label="Battery cap (mAh)" id="bc" value={batCap} onChange={setBatCap} placeholder="e.g. 1250" autoFocus onEnter={() => document.getElementById('fc-cap')?.focus()} />
          <FastField label="FC cap (mAh)" id="fc-cap" value={fcCap} onChange={setFcCap} placeholder="e.g. 850" onEnter={handleSubmit} />
        </div>
        <Btn onClick={handleSubmit} disabled={saving || (!batCap && !fcCap) || locked}>
          {saving ? 'Saving…' : `Log lap ${effectiveLap || currentLap}`}
        </Btn>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>Tab between fields · Enter to submit</div>
      </Card>

      <SectionLabel>Last 5 readings</SectionLabel>
      {[...laps].reverse().slice(0, 5).map(l => (
        <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F3F4F6', fontSize: 13 }}>
          <span style={{ color: '#6B7280', fontFamily: "'DM Mono', monospace" }}>Lap {l.lap_number}</span>
          <span style={{ color: '#111827', fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
            {l.battery_cap_mah ? `${Math.round(l.battery_cap_mah)} mAh` : '—'}
            {l.fc_cap_mah ? ` · FC ${Math.round(l.fc_cap_mah)}` : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Current Entry (Student 3 — Battery current + FC current) ─────────────
export function CurrentEntry({ session, laps, addLap, updateLap, locked }) {
  const [batCur, setBatCur] = useState('');
  const [fcCur, setFcCur] = useState('');
  const [lapNum, setLapNum] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, triggerFlash] = useFlash();

  const currentLap = laps.length;
  const effectiveLap = lapNum ? parseInt(lapNum) : currentLap;
  const last = laps[laps.length - 1];
  const fcLow = session?.fc_low_amps || 1.0;

  // EMA-7 for FC current display
  const EMA_ALPHA = 2 / (7 + 1);
  const fcReadings = laps.map(l => parseFloat(l.fc_current_a)).filter(v => !isNaN(v) && v > 0);
  let fcEMA = null;
  if (fcReadings.length > 0) {
    fcEMA = fcReadings[0];
    for (let i = 1; i < fcReadings.length; i++) {
      fcEMA = EMA_ALPHA * fcReadings[i] + (1 - EMA_ALPHA) * fcEMA;
    }
  }

  const handleSubmit = async () => {
    if ((!batCur && !fcCur) || saving || locked) return;
    setSaving(true);
    try {
      const targetLap = laps.find(l => l.lap_number === effectiveLap);
      const data = {
        battery_current_a: batCur ? parseFloat(batCur) : null,
        fc_current_a: fcCur ? parseFloat(fcCur) : null,
        entered_by: 'current',
      };
      if (targetLap) {
        await updateLap(targetLap.id, data);
      } else {
        await addLap({ lap_number: effectiveLap, ...data });
      }
      triggerFlash(`Lap ${effectiveLap} current logged`);
      setBatCur(''); setFcCur('');
      setLapNum(String(effectiveLap + 1));
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <FlashConfirm msg={flash.msg} show={flash.show} />
      <div className="role-header">
        <div className="role-name">⚡ Current</div>
        <div className="role-desc">Battery current (A) + Fuel cell current (A) — both from JETI</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 16 }}>
        <Metric label="Last bat A" value={last?.battery_current_a ? parseFloat(last.battery_current_a).toFixed(1) : '—'} unit="A" />
        <Metric label="Last FC A" value={last?.fc_current_a ? parseFloat(last.fc_current_a).toFixed(1) : '—'} unit="A" />
        <Metric label="FC EMA-7" value={fcEMA ? fcEMA.toFixed(2) : '—'} unit={fcEMA && fcEMA <= fcLow + 0.3 ? 'A ⚠' : 'A'} highlight={fcEMA && fcEMA > fcLow + 0.3} />
        <Metric label="FC trigger" value={fcLow} unit="A" />
      </div>

      {fcEMA !== null && fcEMA <= fcLow && (
        <Alert type="danger">FC EMA {fcEMA.toFixed(2)}A — below {fcLow}A trigger! Notify strategy!</Alert>
      )}
      {fcEMA !== null && fcEMA > fcLow && fcEMA <= fcLow + 0.3 && (
        <Alert type="warn">FC EMA {fcEMA.toFixed(2)}A — approaching trigger</Alert>
      )}

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <SectionLabel style={{ marginTop: 0, marginBottom: 0, flex: 1 }}>Lap</SectionLabel>
          <input
            type="number"
            value={lapNum || currentLap}
            onChange={e => setLapNum(e.target.value)}
            style={{ width: 70, fontSize: 16, fontFamily: "'DM Mono', monospace", fontWeight: 700, textAlign: 'center', padding: '4px 8px' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <FastField label="Battery current (A)" id="ba" value={batCur} onChange={setBatCur} placeholder="e.g. 3.5" step="0.1" autoFocus onEnter={() => document.getElementById('fc-cur')?.focus()} />
          <FastField label="FC current (A)" id="fc-cur" value={fcCur} onChange={setFcCur} placeholder="e.g. 2.1" step="0.1" onEnter={handleSubmit} />
        </div>
        <Btn onClick={handleSubmit} disabled={saving || (!batCur && !fcCur) || locked}>
          {saving ? 'Saving…' : `Log lap ${effectiveLap || currentLap}`}
        </Btn>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>Tab between fields · Enter to submit</div>
      </Card>

      <SectionLabel>Last 5 readings</SectionLabel>
      {[...laps].reverse().slice(0, 5).map(l => (
        <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F3F4F6', fontSize: 13 }}>
          <span style={{ color: '#6B7280', fontFamily: "'DM Mono', monospace" }}>Lap {l.lap_number}</span>
          <span style={{ color: l.fc_current_a && parseFloat(l.fc_current_a) <= fcLow ? '#DC2626' : '#111827', fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
            {l.battery_current_a ? `Bat ${parseFloat(l.battery_current_a).toFixed(1)}A` : '—'}
            {l.fc_current_a ? ` · FC ${parseFloat(l.fc_current_a).toFixed(1)}A` : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Voltage Entry (Student 4) ──────────────────────────────────────────────
export function VoltageEntry({ session, laps, addLap, updateLap, locked }) {
  const [voltage, setVoltage] = useState('');
  const [stickSwap, setStickSwap] = useState(false);
  const [lapNum, setLapNum] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, triggerFlash] = useFlash();

  const currentLap = laps.length;
  const effectiveLap = lapNum ? parseInt(lapNum) : currentLap;
  const last = laps[laps.length - 1];

  const handleSubmit = async () => {
    if (!voltage || saving || locked) return;
    setSaving(true);
    try {
      const targetLap = laps.find(l => l.lap_number === effectiveLap);
      const data = {
        battery_voltage_v: parseFloat(voltage),
        stick_swap: stickSwap,
        entered_by: 'voltage',
      };
      if (targetLap) {
        await updateLap(targetLap.id, data);
      } else {
        await addLap({ lap_number: effectiveLap, ...data });
      }
      triggerFlash(`Lap ${effectiveLap} voltage${stickSwap ? ' + SWAP' : ''}`);
      setVoltage(''); setStickSwap(false);
      setLapNum(String(effectiveLap + 1));
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <FlashConfirm msg={flash.msg} show={flash.show} />
      <div className="role-header">
        <div className="role-name">🔋 Voltage</div>
        <div className="role-desc">Battery voltage (V) from JETI · also log H2 stick swaps here</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 16 }}>
        <Metric label="Last voltage" value={last?.battery_voltage_v ? parseFloat(last.battery_voltage_v).toFixed(1) : '—'} unit="V" />
        <Metric label="Laps logged" value={laps.length} />
        <Metric label="Stick swaps" value={laps.filter(l => l.stick_swap).length} />
        <Metric label="Current lap" value={currentLap} />
      </div>

      {last?.battery_voltage_v && parseFloat(last.battery_voltage_v) < 7.0 && (
        <Alert type="warn">Voltage at {parseFloat(last.battery_voltage_v).toFixed(1)}V — monitor closely</Alert>
      )}

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <SectionLabel style={{ marginTop: 0, marginBottom: 0, flex: 1 }}>Lap</SectionLabel>
          <input
            type="number"
            value={lapNum || currentLap}
            onChange={e => setLapNum(e.target.value)}
            style={{ width: 70, fontSize: 16, fontFamily: "'DM Mono', monospace", fontWeight: 700, textAlign: 'center', padding: '4px 8px' }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <FastField label="Battery voltage (V)" id="v" value={voltage} onChange={setVoltage} placeholder="e.g. 7.4" step="0.1" autoFocus onEnter={handleSubmit} />
        </div>

        {/* Stick swap toggle */}
        <div onClick={() => setStickSwap(!stickSwap)} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
          marginBottom: 14, borderRadius: 7, cursor: 'pointer',
          border: `1.5px solid ${stickSwap ? '#059669' : '#D1D5DB'}`,
          background: stickSwap ? '#ECFDF5' : '#F9FAFB', transition: 'all 0.15s',
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: 4, flexShrink: 0,
            border: `2px solid ${stickSwap ? '#059669' : '#D1D5DB'}`,
            background: stickSwap ? '#059669' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {stickSwap && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: stickSwap ? '#065F46' : '#374151' }}>
            H2 stick swapped this lap
          </span>
        </div>

        <Btn onClick={handleSubmit} disabled={saving || !voltage || locked} variant={stickSwap ? 'secondary' : 'primary'}>
          {saving ? 'Saving…' : stickSwap ? `Log lap ${effectiveLap} + record swap` : `Log lap ${effectiveLap || currentLap}`}
        </Btn>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>Enter to submit</div>
      </Card>

      <SectionLabel>Voltage trend</SectionLabel>
      {[...laps].reverse().slice(0, 5).map(l => (
        <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F3F4F6', fontSize: 13 }}>
          <span style={{ color: '#6B7280', fontFamily: "'DM Mono', monospace" }}>Lap {l.lap_number}</span>
          <span style={{ color: l.battery_voltage_v && parseFloat(l.battery_voltage_v) < 7.0 ? '#DC2626' : '#111827', fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
            {l.battery_voltage_v ? `${parseFloat(l.battery_voltage_v).toFixed(1)} V` : '—'}
            {l.stick_swap ? ' 🔄' : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

// Keep old exports as aliases for backward compatibility
export const BatteryEntry = CapacityEntry;
export const FuelCellEntry = CurrentEntry;
