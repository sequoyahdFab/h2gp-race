import React, { useState } from 'react';
import { Btn, Card, SectionLabel, Alert, Metric } from './UI';
import { calcStats } from '../lib/calc';

// ── Shared field input ────────────────────────────────────────────────────────
function Field({ label, id, value, onChange, placeholder, step, type = 'number' }) {
  return (
    <div>
      <label htmlFor={id} style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 3 }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', fontSize: 16 }}
      />
    </div>
  );
}

// ── Lap time entry (Student 1 / LiveRC operator) ───────────────────────────────
export function LapTimeEntry({ session, laps, addLap, updateLap }) {
  const [lapTime, setLapTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const stats = calcStats(laps, session);
  const nextLap = laps.length + 1;
  // Find the most recent lap that has no lap_time (created by another role)
  const pendingLap = [...laps].reverse().find(l => !l.lap_time);

  const handleSubmit = async () => {
    if (!lapTime) return;
    setSaving(true);
    try {
      if (pendingLap) {
        // Fill in the lap time on a lap that already exists
        await updateLap(pendingLap.id, { lap_time: parseFloat(lapTime), source: 'manual', entered_by: 'lap-timer' });
      } else {
        await addLap({ lap_time: parseFloat(lapTime), source: 'manual', entered_by: 'lap-timer' });
      }
      setMsg(`Lap ${nextLap} logged — ${lapTime}s`);
      setLapTime('');
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Role</div>
        <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)' }}>Lap Timer</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Enter each lap time from LiveRC as it completes</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 7, marginBottom: '1rem' }}>
        <Metric label="Laps logged" value={laps.length} />
        <Metric label="Next lap" value={`#${nextLap}`} />
        <Metric label="Avg lap" value={stats.avgLap ? stats.avgLap.toFixed(1) : '—'} unit="sec" />
        <Metric label="Last lap" value={laps[laps.length - 1]?.lap_time ?? '—'} unit="sec" />
      </div>

      <Card>
        <SectionLabel style={{ marginTop: 0 }}>Log lap time</SectionLabel>
        <div style={{ marginBottom: 10 }}>
          <Field
            label={`Lap ${nextLap} time (seconds)`}
            id="lt"
            value={lapTime}
            onChange={setLapTime}
            placeholder="e.g. 20.34"
            step="0.01"
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Btn onClick={handleSubmit} disabled={saving || !lapTime}>
            {saving ? 'Saving…' : `+ Log lap ${nextLap}`}
          </Btn>
          {msg && <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{msg}</span>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 8 }}>
          Tip: press Enter to log quickly
        </div>
      </Card>

      <SectionLabel>Last 5 laps</SectionLabel>
      <div style={{ fontSize: 12 }}>
        {[...laps].reverse().slice(0, 5).map(l => (
          <div key={l.id} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '5px 0', borderBottom: '0.5px solid var(--color-border-tertiary)',
          }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Lap {l.lap_number}</span>
            <span style={{ fontWeight: 500 }}>{l.lap_time ? `${l.lap_time}s` : '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Battery entry (Student 2) ─────────────────────────────────────────────────
export function BatteryEntry({ session, laps, addLap, updateLap }) {
  const [batCap, setBatCap] = useState('');
  const [batCur, setBatCur] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const stats = calcStats(laps, session);
  const nextLap = laps.length + 1;
  const pendingLap = [...laps].reverse().find(
    l => !l.battery_cap_mah && !l.battery_current_a
  );

  const handleSubmit = async () => {
    if (!batCap && !batCur) return;
    setSaving(true);
    try {
      const data = {
        battery_cap_mah: batCap ? parseFloat(batCap) : null,
        battery_current_a: batCur ? parseFloat(batCur) : null,
        entered_by: 'battery',
      };
      if (pendingLap) {
        await updateLap(pendingLap.id, data);
      } else {
        await addLap(data);
      }
      setMsg(`Logged for lap ${pendingLap?.lap_number || nextLap}`);
      setBatCap(''); setBatCur('');
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const last = laps[laps.length - 1];
  const batRem = session ? Math.max(0, session.battery_limit_mah - (last?.battery_cap_mah || 0)) : null;
  const batPct = session && last?.battery_cap_mah
    ? Math.max(0, 100 - (parseFloat(last.battery_cap_mah) / session.battery_limit_mah) * 100)
    : null;

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Role</div>
        <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)' }}>Battery Telemetry</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Read battery capacity (cumulative mAh) and current (A) from JETI screen</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 7, marginBottom: '1rem' }}>
        <Metric label="Battery used" value={last?.battery_cap_mah ? Math.round(last.battery_cap_mah) : 0} unit="mAh" />
        <Metric label="Battery remain" value={batRem !== null ? Math.round(batRem) : '—'} unit="mAh" />
        <Metric label="Remaining %" value={batPct !== null ? `${Math.round(batPct)}%` : '—'} />
        <Metric label="mAh/min" value={stats.mahPerMin ? stats.mahPerMin.toFixed(1) : '—'} />
      </div>

      {batPct !== null && batPct < 20 && (
        <Alert type="danger">Battery below 20% — alert strategy team</Alert>
      )}

      <Card>
        <SectionLabel style={{ marginTop: 0 }}>Enter reading (lap {pendingLap?.lap_number || nextLap})</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <Field label="Battery capacity (mAh) — cumulative" id="bc" value={batCap} onChange={setBatCap} placeholder="e.g. 1250" />
          <Field label="Battery current (A)" id="ba" value={batCur} onChange={setBatCur} placeholder="e.g. 3.5" step="0.1" />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Btn onClick={handleSubmit} disabled={saving || (!batCap && !batCur)}>
            {saving ? 'Saving…' : 'Log reading'}
          </Btn>
          {msg && <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{msg}</span>}
        </div>
      </Card>

      <SectionLabel>Last 5 readings</SectionLabel>
      <div style={{ fontSize: 12 }}>
        {[...laps].reverse().slice(0, 5).map(l => (
          <div key={l.id} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '5px 0', borderBottom: '0.5px solid var(--color-border-tertiary)',
          }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Lap {l.lap_number}</span>
            <span style={{ fontWeight: 500 }}>
              {l.battery_cap_mah ? `${Math.round(l.battery_cap_mah)} mAh` : '—'}
              {l.battery_current_a ? ` · ${parseFloat(l.battery_current_a).toFixed(1)}A` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Fuel cell entry (Student 3) ────────────────────────────────────────────────
export function FuelCellEntry({ session, laps, addLap, updateLap }) {
  const [fcCap, setFcCap] = useState('');
  const [fcCur, setFcCur] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const nextLap = laps.length + 1;
  const pendingLap = [...laps].reverse().find(
    l => !l.fc_cap_mah && !l.fc_current_a
  );
  const last = laps[laps.length - 1];

  const recentFC = laps.slice(-3).map(l => parseFloat(l.fc_current_a)).filter(v => !isNaN(v) && v > 0);
  const avgFC = recentFC.length > 0 ? recentFC.reduce((s, v) => s + v, 0) / recentFC.length : null;
  const fcLow = session?.fc_low_amps || 1.0;

  const handleSubmit = async () => {
    if (!fcCap && !fcCur) return;
    setSaving(true);
    try {
      const data = {
        fc_cap_mah: fcCap ? parseFloat(fcCap) : null,
        fc_current_a: fcCur ? parseFloat(fcCur) : null,
        entered_by: 'fuel-cell',
      };
      if (pendingLap) {
        await updateLap(pendingLap.id, data);
      } else {
        await addLap(data);
      }
      setMsg(`Logged for lap ${pendingLap?.lap_number || nextLap}`);
      setFcCap(''); setFcCur('');
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Role</div>
        <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)' }}>Fuel Cell Telemetry</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Read FC capacity (cumulative mAh) and current (A) from JETI screen</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 7, marginBottom: '1rem' }}>
        <Metric label="FC cumulative" value={last?.fc_cap_mah ? Math.round(last.fc_cap_mah) : 0} unit="mAh" />
        <Metric label="Last FC current" value={last?.fc_current_a ? parseFloat(last.fc_current_a).toFixed(1) : '—'} unit="A" />
        <Metric label="3-lap avg FC" value={avgFC ? avgFC.toFixed(2) : '—'} unit="A" />
        <Metric label="Low trigger" value={fcLow} unit="A" />
      </div>

      {avgFC !== null && avgFC <= fcLow && (
        <Alert type="danger">FC current at {avgFC.toFixed(2)}A — below {fcLow}A trigger. Notify strategy team!</Alert>
      )}
      {avgFC !== null && avgFC <= fcLow + 0.3 && avgFC > fcLow && (
        <Alert type="warn">FC current dropping ({avgFC.toFixed(2)}A) — approaching swap trigger</Alert>
      )}

      <Card>
        <SectionLabel style={{ marginTop: 0 }}>Enter reading (lap {pendingLap?.lap_number || nextLap})</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <Field label="FC capacity (mAh) — cumulative" id="fc" value={fcCap} onChange={setFcCap} placeholder="e.g. 850" />
          <Field label="FC current (A)" id="fa" value={fcCur} onChange={setFcCur} placeholder="e.g. 2.1" step="0.1" />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Btn onClick={handleSubmit} disabled={saving || (!fcCap && !fcCur)}>
            {saving ? 'Saving…' : 'Log reading'}
          </Btn>
          {msg && <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{msg}</span>}
        </div>
      </Card>

      <SectionLabel>Last 5 readings</SectionLabel>
      <div style={{ fontSize: 12 }}>
        {[...laps].reverse().slice(0, 5).map(l => (
          <div key={l.id} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '5px 0', borderBottom: '0.5px solid var(--color-border-tertiary)',
          }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Lap {l.lap_number}</span>
            <span style={{ fontWeight: 500 }}>
              {l.fc_cap_mah ? `${Math.round(l.fc_cap_mah)} mAh` : '—'}
              {l.fc_current_a ? ` · ${parseFloat(l.fc_current_a).toFixed(1)}A` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Voltage entry (Student 4) ─────────────────────────────────────────────────
export function VoltageEntry({ session, laps, addLap, updateLap }) {
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
      const data = {
        battery_voltage_v: parseFloat(voltage),
        stick_swap: stickSwap,
        entered_by: 'voltage',
      };
      if (pendingLap) {
        await updateLap(pendingLap.id, data);
      } else {
        await addLap(data);
      }
      setMsg(`Logged for lap ${pendingLap?.lap_number || nextLap}${stickSwap ? ' — STICK SWAP recorded' : ''}`);
      setVoltage(''); setStickSwap(false);
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Role</div>
        <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)' }}>Voltage + Swap</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Read battery voltage from JETI screen. Also log H2 stick swaps.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 7, marginBottom: '1rem' }}>
        <Metric label="Last voltage" value={last?.battery_voltage_v ? `${parseFloat(last.battery_voltage_v).toFixed(1)}` : '—'} unit="V" />
        <Metric label="Laps logged" value={laps.length} />
        <Metric label="Stick swaps" value={laps.filter(l => l.stick_swap).length} />
      </div>

      {last?.battery_voltage_v && parseFloat(last.battery_voltage_v) < 7.0 && (
        <Alert type="warn">Voltage at {parseFloat(last.battery_voltage_v).toFixed(1)}V — monitor closely</Alert>
      )}

      <Card>
        <SectionLabel style={{ marginTop: 0 }}>Enter reading (lap {pendingLap?.lap_number || nextLap})</SectionLabel>
        <div style={{ marginBottom: 10 }}>
          <Field label="Battery voltage (V)" id="v" value={voltage} onChange={setVoltage} placeholder="e.g. 7.4" step="0.1" />
        </div>

        {/* Stick swap toggle */}
        <div
          onClick={() => setStickSwap(!stickSwap)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', marginBottom: 10,
            borderRadius: 'var(--border-radius-md)',
            border: `0.5px solid ${stickSwap ? '#1D9E75' : 'var(--color-border-tertiary)'}`,
            background: stickSwap ? '#E1F5EE' : 'var(--color-background-secondary)',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: 18, height: 18, borderRadius: 3,
            border: `2px solid ${stickSwap ? '#1D9E75' : 'var(--color-border-secondary)'}`,
            background: stickSwap ? '#1D9E75' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {stickSwap && <span style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</span>}
          </div>
          <span style={{ fontSize: 13, color: stickSwap ? '#085041' : 'var(--color-text-primary)', fontWeight: stickSwap ? 500 : 400 }}>
            H2 stick swapped this lap
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Btn onClick={handleSubmit} disabled={saving || !voltage} variant={stickSwap ? 'secondary' : 'primary'}>
            {saving ? 'Saving…' : stickSwap ? 'Log + record swap' : 'Log reading'}
          </Btn>
          {msg && <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{msg}</span>}
        </div>
      </Card>

      <SectionLabel>Voltage trend (last 5)</SectionLabel>
      <div style={{ fontSize: 12 }}>
        {[...laps].reverse().slice(0, 5).map(l => (
          <div key={l.id} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '5px 0', borderBottom: '0.5px solid var(--color-border-tertiary)',
          }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Lap {l.lap_number}</span>
            <span style={{ fontWeight: 500, color: l.battery_voltage_v && parseFloat(l.battery_voltage_v) < 7.0 ? '#E24B4A' : 'var(--color-text-primary)' }}>
              {l.battery_voltage_v ? `${parseFloat(l.battery_voltage_v).toFixed(1)} V` : '—'}
              {l.stick_swap ? ' 🔄' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
