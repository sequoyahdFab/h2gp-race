import React, { useState, useEffect, useRef } from 'react';
import { Btn, Card, SectionLabel, Alert, Metric } from './UI';
import { calcStats } from '../lib/calc';

// ── Sanitize numeric input — replace commas with periods ──────────────────
function sanitizeNumeric(val) {
  return typeof val === 'string' ? val.replace(/,/g, '.') : val;
}

// ── Fast entry field — type=text with decimal inputmode ───────────────────
function FastField({ label, id, value, onChange, placeholder, autoFocus, onEnter, onTab }) {
  const ref = useRef(null);
  useEffect(() => { if (autoFocus && ref.current) ref.current.focus(); }, [autoFocus]);

  const handleChange = e => onChange(sanitizeNumeric(e.target.value));

  const handleKeyDown = e => {
    if (e.key === 'Tab' && onTab) { e.preventDefault(); onTab(); return; }
    if (e.key === 'Enter' && onEnter) { onEnter(); return; }
    if (e.key === ',') {
      e.preventDefault();
      const el = e.target;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newVal = el.value.slice(0, start) + '.' + el.value.slice(end);
      onChange(newVal);
      setTimeout(() => el.setSelectionRange(start + 1, start + 1), 0);
    }
  };

  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <input
        ref={ref} id={id}
        type="text" inputMode="decimal"
        value={value} onChange={handleChange} onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{ fontSize: 20, fontFamily: "'DM Mono', monospace", fontWeight: 500 }}
      />
    </div>
  );
}

// ── Flash confirmation ────────────────────────────────────────────────────
function useFlash() {
  const [flash, setFlash] = useState({ show: false, msg: '', color: '#059669' });
  const trigger = (msg, color) => {
    setFlash({ show: true, msg, color: color || '#059669' });
    setTimeout(() => setFlash(f => ({ ...f, show: false })), 1500);
  };
  return [flash, trigger];
}

function FlashConfirm({ msg, show, color }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
      background: color || '#059669', color: '#fff',
      fontFamily: "'Barlow Condensed', sans-serif",
      fontSize: 18, fontWeight: 800, letterSpacing: '0.04em',
      padding: '10px 24px', borderRadius: 8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      zIndex: 9999, pointerEvents: 'none', textTransform: 'uppercase',
    }}>
      {msg}
    </div>
  );
}

// ── Lap beacon — shows current lap prominently ────────────────────────────
function LapBeacon({ lapNum, subtitle, fillBack }) {
  return (
    <div style={{
      background: fillBack ? '#FFFBEB' : '#ECFDF5',
      border: `0.5px solid ${fillBack ? '#FCD34D' : '#A7F3D0'}`,
      borderRadius: 'var(--border-radius-md)',
      padding: '8px 14px', display: 'flex', alignItems: 'center',
      gap: 12, marginBottom: 12,
    }}>
      <div style={{
        fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 500,
        color: fillBack ? '#D97706' : '#059669', lineHeight: 1,
      }}>
        {lapNum > 0 ? lapNum : '—'}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: fillBack ? '#92400E' : '#065F46' }}>
          {fillBack ? `Filling back missed lap ${lapNum}` : 'Now entering'}
        </div>
        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{subtitle}</div>
      </div>
    </div>
  );
}

// ── Missing data alerts ────────────────────────────────────────────────────
function MissedAlert({ missedLaps, role, onFillBack }) {
  if (!missedLaps || missedLaps.length === 0) return null;
  const count = missedLaps.length;
  const oldest = missedLaps[0];
  const type = count >= 2 ? 'danger' : 'warn';
  const msg = count >= 2
    ? `${count} laps missing data — calculations may drift`
    : `Lap ${oldest.lap_number} missing — enter now or skip`;
  return (
    <div style={{
      background: type === 'danger' ? '#FEF2F2' : '#FFFBEB',
      borderLeft: `3px solid ${type === 'danger' ? '#DC2626' : '#D97706'}`,
      borderRadius: '0 var(--border-radius-md) var(--border-radius-md) 0',
      padding: '8px 12px', fontSize: 12,
      color: type === 'danger' ? '#991B1B' : '#92400E',
      marginBottom: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    }}>
      <span>{msg}</span>
      <button
        onClick={() => onFillBack(oldest.lap_number)}
        style={{
          background: '#fff', border: '0.5px solid currentColor',
          borderRadius: 4, padding: '3px 8px', fontSize: 11,
          fontWeight: 600, cursor: 'pointer', flexShrink: 0,
          color: type === 'danger' ? '#991B1B' : '#92400E',
        }}
      >
        Fill lap {oldest.lap_number}
      </button>
    </div>
  );
}

// ── Submit + Skip button row ───────────────────────────────────────────────
function SubmitRow({ onSubmit, onSkip, disabled, submitLabel }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
      <Btn onClick={onSubmit} disabled={disabled} style={{ flex: 1 }}>
        {submitLabel}
      </Btn>
      <button
        onClick={onSkip}
        style={{
          background: '#fff', color: '#D97706',
          border: '0.5px solid #FCD34D',
          borderRadius: 'var(--border-radius-md)',
          padding: '9px 14px', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', whiteSpace: 'nowrap',
          fontFamily: "'Barlow Condensed', sans-serif',",
          letterSpacing: '0.02em', textTransform: 'uppercase',
        }}
      >
        Skip
      </button>
    </div>
  );
}

// ── Lap log with status badges ─────────────────────────────────────────────
function LapLogRow({ lap, valueStr, status, onFillBack }) {
  const badgeStyle = {
    ok:   { background: '#ECFDF5', color: '#065F46' },
    skip: { background: '#FFFBEB', color: '#92400E' },
    miss: { background: '#FEF2F2', color: '#991B1B' },
  }[status] || {};

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 0', borderBottom: '1px solid var(--color-border-tertiary)',
      fontSize: 12,
    }}>
      <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--color-text-secondary)', width: 36, flexShrink: 0 }}>
        L{lap.lap_number}
      </span>
      <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--color-text-primary)', fontWeight: 500, flex: 1 }}>
        {valueStr}
      </span>
      <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, flexShrink: 0, fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em', ...badgeStyle }}>
        {status}
      </span>
      {status === 'miss' && onFillBack && (
        <button
          onClick={() => onFillBack(lap.lap_number)}
          style={{ fontSize: 10, background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', padding: 0, textDecoration: 'underline', flexShrink: 0 }}
        >
          fill
        </button>
      )}
    </div>
  );
}

// ── Shared hook for fill-back logic ───────────────────────────────────────
function useFillBack(laps, currentLap, getStatus) {
  const [fillBackLap, setFillBackLap] = useState(null);
  const activeLap = fillBackLap || currentLap;

  // Only include previous laps (not current) that are genuinely missed
  const missedLaps = laps.length > 1
    ? laps.slice(0, -1).filter(l => getStatus(l) === 'miss')
    : [];

  // Auto-clear fill-back if that lap gets filled or skipped
  useEffect(() => {
    if (!fillBackLap) return;
    const lap = laps.find(l => l.lap_number === fillBackLap);
    if (!lap || getStatus(lap) !== 'miss') setFillBackLap(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laps, fillBackLap]);

  return { activeLap, fillBackLap, setFillBackLap, missedLaps };
}

// ── Lap Timer (Student 1) ─────────────────────────────────────────────────
export function LapTimeEntry({ session, laps, addLap, updateLap, locked }) {
  const [lapTime, setLapTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, triggerFlash] = useFlash();
  const stats = calcStats(laps, session);
  const currentLap = laps.length;
  const nextLap = currentLap + 1;

  const handleSubmit = async () => {
    if (!lapTime || saving || locked) return;
    setSaving(true);
    try {
      const last = laps[laps.length - 1];
      if (last && !last.lap_time) {
        await updateLap(last.id, { lap_time: parseFloat(lapTime), source: 'manual', entered_by: 'lap-timer' });
      } else {
        await addLap({ lap_time: parseFloat(lapTime), source: 'manual', entered_by: 'lap-timer' });
      }
      triggerFlash(`✓ Lap ${nextLap} — ${lapTime}s`);
      setLapTime('');
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <FlashConfirm {...flash} />
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
          <FastField label="Lap time (seconds)" id="lt" value={lapTime} onChange={setLapTime} placeholder="e.g. 20.34" autoFocus onEnter={handleSubmit} />
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
        <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--color-border-tertiary)' }}>
          <span style={{ color: 'var(--color-text-secondary)', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>Lap {l.lap_number}</span>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: 'var(--color-text-primary)', fontFamily: "'DM Mono', monospace", fontWeight: 500, fontSize: 12 }}>{l.lap_time ? `${l.lap_time}s` : '—'}</span>
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
  const [saving, setSaving] = useState(false);
  const [flash, triggerFlash] = useFlash();

  const currentLap = laps.length;
  const last = laps[laps.length - 1];
  const batRem = session ? Math.max(0, session.battery_limit_mah - (last?.battery_cap_mah || 0)) : null;

  const getCapStatus = l => l.cap_skipped ? 'skip' : (l.battery_cap_mah !== null || l.fc_cap_mah !== null) ? 'ok' : 'miss';
  const { activeLap, fillBackLap, setFillBackLap, missedLaps } = useFillBack(laps, currentLap, getCapStatus);

  const handleSubmit = async () => {
    if ((!batCap && !fcCap) || saving || locked || !activeLap) return;
    setSaving(true);
    try {
      const target = laps.find(l => l.lap_number === activeLap);
      const data = {
        battery_cap_mah: batCap ? parseFloat(batCap) : null,
        fc_cap_mah: fcCap ? parseFloat(fcCap) : null,
        cap_skipped: false,
        entered_by: 'capacity',
      };
      if (target) await updateLap(target.id, data);
      else await addLap({ lap_number: activeLap, ...data });
      triggerFlash(`✓ Lap ${activeLap} capacity logged`);
      setBatCap(''); setFcCap('');
      setFillBackLap(null);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleSkip = async () => {
    if (!activeLap) return;
    const target = laps.find(l => l.lap_number === activeLap);
    if (target) await updateLap(target.id, { cap_skipped: true });
    else await addLap({ lap_number: activeLap, cap_skipped: true });
    triggerFlash(`Lap ${activeLap} skipped`, '#D97706');
    setFillBackLap(null);
  };

  const lapStatus = getCapStatus;

  return (
    <div>
      <FlashConfirm {...flash} />
      <div className="role-header">
        <div className="role-name">📊 Capacity</div>
        <div className="role-desc">Battery capacity (mAh) + Fuel cell capacity (mAh) — both cumulative from JETI</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 12 }}>
        <Metric label="Bat used" value={last?.battery_cap_mah ? Math.round(last.battery_cap_mah) : 0} unit="mAh" />
        <Metric label="Bat remain" value={batRem !== null ? Math.round(batRem) : '—'} unit="mAh" />
        <Metric label="FC total" value={last?.fc_cap_mah ? Math.round(last.fc_cap_mah) : 0} unit="mAh" />
        <Metric label="Current lap" value={currentLap} />
      </div>
      <MissedAlert missedLaps={missedLaps} role="cap" onFillBack={setFillBackLap} />
      <LapBeacon lapNum={activeLap} subtitle="Battery cap + FC cap from JETI" fillBack={!!fillBackLap} />
      {fillBackLap && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button onClick={() => setFillBackLap(null)} style={{ fontSize: 11, background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', textDecoration: 'underline' }}>
            Cancel fill-back
          </button>
        </div>
      )}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <FastField label="Battery cap (mAh)" id="bc" value={batCap} onChange={setBatCap} placeholder="e.g. 338" autoFocus onTab={() => document.getElementById('cap-fc-f')?.focus()} onEnter={() => document.getElementById('cap-fc-f')?.focus()} />
          <FastField label="FC cap (mAh)" id="cap-fc-f" value={fcCap} onChange={setFcCap} placeholder="e.g. 198" onEnter={handleSubmit} />
        </div>
        <SubmitRow onSubmit={handleSubmit} onSkip={handleSkip} disabled={saving || (!batCap && !fcCap) || locked} submitLabel={saving ? 'Saving…' : `Log lap ${activeLap}`} />
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>Tab between fields · Enter to submit · Skip if reading was missed</div>
      </Card>
      <SectionLabel>Lap log</SectionLabel>
      {[...laps].reverse().slice(0, 6).map(l => (
        <LapLogRow key={l.id} lap={l}
          valueStr={lapStatus(l) === 'ok' ? `${Math.round(l.battery_cap_mah)} mAh · FC ${Math.round(l.fc_cap_mah || 0)}` : '—'}
          status={lapStatus(l)}
          onFillBack={lapStatus(l) === 'miss' && l.lap_number !== currentLap ? setFillBackLap : null}
        />
      ))}
    </div>
  );
}

// ── Current Entry (Student 3 — Battery current + FC current) ─────────────
export function CurrentEntry({ session, laps, addLap, updateLap, locked }) {
  const [batCur, setBatCur] = useState('');
  const [fcCur, setFcCur] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, triggerFlash] = useFlash();

  const currentLap = laps.length;
  const last = laps[laps.length - 1];
  const fcLow = session?.fc_low_amps || 1.0;

  const EMA_ALPHA = 2 / (7 + 1);
  const fcReadings = laps.map(l => parseFloat(l.fc_current_a)).filter(v => !isNaN(v) && v > 0);
  let fcEMA = null;
  if (fcReadings.length > 0) {
    fcEMA = fcReadings[0];
    for (let i = 1; i < fcReadings.length; i++) fcEMA = EMA_ALPHA * fcReadings[i] + (1 - EMA_ALPHA) * fcEMA;
  }

  const getCurStatus = l => l.cur_skipped ? 'skip' : (l.battery_current_a !== null || l.fc_current_a !== null) ? 'ok' : 'miss';
  const { activeLap, fillBackLap, setFillBackLap, missedLaps } = useFillBack(laps, currentLap, getCurStatus);

  const handleSubmit = async () => {
    if ((!batCur && !fcCur) || saving || locked || !activeLap) return;
    setSaving(true);
    try {
      const target = laps.find(l => l.lap_number === activeLap);
      const data = {
        battery_current_a: batCur ? parseFloat(batCur) : null,
        fc_current_a: fcCur ? parseFloat(fcCur) : null,
        cur_skipped: false,
        entered_by: 'current',
      };
      if (target) await updateLap(target.id, data);
      else await addLap({ lap_number: activeLap, ...data });
      triggerFlash(`✓ Lap ${activeLap} current logged`);
      setBatCur(''); setFcCur('');
      setFillBackLap(null);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleSkip = async () => {
    if (!activeLap) return;
    const target = laps.find(l => l.lap_number === activeLap);
    if (target) await updateLap(target.id, { cur_skipped: true });
    else await addLap({ lap_number: activeLap, cur_skipped: true });
    triggerFlash(`Lap ${activeLap} skipped`, '#D97706');
    setFillBackLap(null);
  };

  const lapStatus = getCurStatus;

  return (
    <div>
      <FlashConfirm {...flash} />
      <div className="role-header">
        <div className="role-name">⚡ Current</div>
        <div className="role-desc">Battery current (A) + Fuel cell current (A) — both from JETI</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 12 }}>
        <Metric label="Last bat A" value={last?.battery_current_a ? parseFloat(last.battery_current_a).toFixed(1) : '—'} unit="A" />
        <Metric label="Last FC A" value={last?.fc_current_a ? parseFloat(last.fc_current_a).toFixed(1) : '—'} unit="A" />
        <Metric label="FC EMA-7" value={fcEMA ? fcEMA.toFixed(2) : '—'} unit={fcEMA && fcEMA <= fcLow + 0.3 ? 'A ⚠' : 'A'} highlight={fcEMA && fcEMA > fcLow + 0.3} />
        <Metric label="FC trigger" value={fcLow} unit="A" />
      </div>
      {fcEMA !== null && fcEMA <= fcLow && <Alert type="danger">FC EMA {fcEMA.toFixed(2)}A — below {fcLow}A trigger! Notify strategy!</Alert>}
      {fcEMA !== null && fcEMA > fcLow && fcEMA <= fcLow + 0.3 && <Alert type="warn">FC EMA {fcEMA.toFixed(2)}A — approaching trigger</Alert>}
      <MissedAlert missedLaps={missedLaps} role="cur" onFillBack={setFillBackLap} />
      <LapBeacon lapNum={activeLap} subtitle="Battery current + FC current from JETI" fillBack={!!fillBackLap} />
      {fillBackLap && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button onClick={() => setFillBackLap(null)} style={{ fontSize: 11, background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', textDecoration: 'underline' }}>
            Cancel fill-back
          </button>
        </div>
      )}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <FastField label="Battery current (A)" id="ba" value={batCur} onChange={setBatCur} placeholder="e.g. 3.5" autoFocus onTab={() => document.getElementById('cur-fc-f')?.focus()} onEnter={() => document.getElementById('cur-fc-f')?.focus()} />
          <FastField label="FC current (A)" id="cur-fc-f" value={fcCur} onChange={setFcCur} placeholder="e.g. 2.1" onEnter={handleSubmit} />
        </div>
        <SubmitRow onSubmit={handleSubmit} onSkip={handleSkip} disabled={saving || (!batCur && !fcCur) || locked} submitLabel={saving ? 'Saving…' : `Log lap ${activeLap}`} />
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>Tab between fields · Enter to submit · Skip if reading was missed</div>
      </Card>
      <SectionLabel>Lap log</SectionLabel>
      {[...laps].reverse().slice(0, 6).map(l => (
        <LapLogRow key={l.id} lap={l}
          valueStr={lapStatus(l) === 'ok' ? `Bat ${parseFloat(l.battery_current_a||0).toFixed(1)}A · FC ${parseFloat(l.fc_current_a||0).toFixed(1)}A` : '—'}
          status={lapStatus(l)}
          onFillBack={lapStatus(l) === 'miss' && l.lap_number !== currentLap ? setFillBackLap : null}
        />
      ))}
    </div>
  );
}

// ── Voltage Entry (Student 4) ──────────────────────────────────────────────
export function VoltageEntry({ session, laps, addLap, updateLap, locked }) {
  const [voltage, setVoltage] = useState('');
  const [stickSwap, setStickSwap] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flash, triggerFlash] = useFlash();

  const currentLap = laps.length;
  const last = laps[laps.length - 1];

  const getVoltStatus = l => l.volt_skipped ? 'skip' : l.battery_voltage_v !== null ? 'ok' : 'miss';
  const { activeLap, fillBackLap, setFillBackLap, missedLaps } = useFillBack(laps, currentLap, getVoltStatus);

  const handleSubmit = async () => {
    if (!voltage || saving || locked || !activeLap) return;
    setSaving(true);
    try {
      const target = laps.find(l => l.lap_number === activeLap);
      const data = {
        battery_voltage_v: parseFloat(voltage),
        stick_swap: stickSwap,
        volt_skipped: false,
        entered_by: 'voltage',
      };
      if (target) await updateLap(target.id, data);
      else await addLap({ lap_number: activeLap, ...data });
      triggerFlash(`✓ Lap ${activeLap} voltage${stickSwap ? ' + SWAP' : ''}`);
      setVoltage(''); setStickSwap(false);
      setFillBackLap(null);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleSkip = async () => {
    if (!activeLap) return;
    const target = laps.find(l => l.lap_number === activeLap);
    if (target) await updateLap(target.id, { volt_skipped: true });
    else await addLap({ lap_number: activeLap, volt_skipped: true });
    triggerFlash(`Lap ${activeLap} skipped`, '#D97706');
    setFillBackLap(null);
  };

  const lapStatus = getVoltStatus;

  return (
    <div>
      <FlashConfirm {...flash} />
      <div className="role-header">
        <div className="role-name">🔋 Voltage</div>
        <div className="role-desc">Battery voltage (V) from JETI · also log H2 stick swaps here</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 12 }}>
        <Metric label="Last voltage" value={last?.battery_voltage_v ? parseFloat(last.battery_voltage_v).toFixed(1) : '—'} unit="V" />
        <Metric label="Laps logged" value={laps.length} />
        <Metric label="Stick swaps" value={laps.filter(l => l.stick_swap).length} />
        <Metric label="Current lap" value={currentLap} />
      </div>
      {last?.battery_voltage_v && parseFloat(last.battery_voltage_v) < 7.0 && <Alert type="warn">Voltage at {parseFloat(last.battery_voltage_v).toFixed(1)}V — monitor closely</Alert>}
      <MissedAlert missedLaps={missedLaps} role="volt" onFillBack={setFillBackLap} />
      <LapBeacon lapNum={activeLap} subtitle="Battery voltage from JETI" fillBack={!!fillBackLap} />
      {fillBackLap && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button onClick={() => setFillBackLap(null)} style={{ fontSize: 11, background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', textDecoration: 'underline' }}>
            Cancel fill-back
          </button>
        </div>
      )}
      <Card>
        <div style={{ marginBottom: 10 }}>
          <FastField label="Battery voltage (V)" id="v" value={voltage} onChange={setVoltage} placeholder="e.g. 7.4" autoFocus onEnter={handleSubmit} />
        </div>
        <div onClick={() => setStickSwap(!stickSwap)} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
          marginBottom: 10, borderRadius: 'var(--border-radius-md)', cursor: 'pointer',
          border: `1.5px solid ${stickSwap ? '#059669' : '#D1D5DB'}`,
          background: stickSwap ? '#ECFDF5' : '#F9FAFB', transition: 'all 0.15s',
        }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, border: `2px solid ${stickSwap ? '#059669' : '#D1D5DB'}`, background: stickSwap ? '#059669' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {stickSwap && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: stickSwap ? '#065F46' : '#374151' }}>
            H2 stick swapped this lap
          </span>
        </div>
        <SubmitRow onSubmit={handleSubmit} onSkip={handleSkip} disabled={saving || !voltage || locked} submitLabel={saving ? 'Saving…' : stickSwap ? `Log lap ${activeLap} + swap` : `Log lap ${activeLap}`} />
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>Enter to submit · Skip if reading was missed</div>
      </Card>
      <SectionLabel>Voltage trend</SectionLabel>
      {[...laps].reverse().slice(0, 6).map(l => (
        <LapLogRow key={l.id} lap={l}
          valueStr={lapStatus(l) === 'ok' ? `${parseFloat(l.battery_voltage_v).toFixed(1)} V${l.stick_swap ? ' 🔄' : ''}` : '—'}
          status={lapStatus(l)}
          onFillBack={lapStatus(l) === 'miss' && l.lap_number !== currentLap ? setFillBackLap : null}
        />
      ))}
    </div>
  );
}

// Backward compatibility aliases
export const BatteryEntry = CapacityEntry;
export const FuelCellEntry = CurrentEntry;
