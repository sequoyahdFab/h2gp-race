import React, { useState } from 'react';
import { Btn, Card, SectionLabel, Alert, Metric } from './UI';
import { PIT_REASONS, reasonMeta } from '../lib/constants';

// ── Pit Stop Logger ────────────────────────────────────────────────────────
export function PitStopEntry({ laps, addPitStop, pitStops, locked }) {
  const [lapNum, setLapNum] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async () => {
    if (!lapNum || !reason) return;
    setSaving(true);
    try {
      await addPitStop(parseInt(lapNum), reason, notes);
      setMsg(`✓ Pit stop logged — Lap ${lapNum} · ${reason}`);
      setLapNum(''); setReason(''); setNotes('');
    } catch (e) { setMsg(`Error: ${e.message}`); }
    finally { setSaving(false); }
  };

  const meta = reason ? reasonMeta(reason) : null;

  return (
    <div>
      <div className="role-header">
        <div className="role-name">🔧 Pit Stop Log</div>
        <div className="role-desc">Record any lap where the car stopped or was serviced</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 8, marginBottom: 16 }}>
        <Metric label="Pit stops" value={pitStops.length} />
        <Metric label="Last pit" value={pitStops.length > 0 ? `Lap ${pitStops[pitStops.length-1].lap_number}` : '—'} />
        <Metric label="Total laps" value={laps.length} />
      </div>

      <Card>
        <SectionLabel style={{ marginTop: 0 }}>Log pit stop</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label className="field-label">Lap number</label>
            <input type="number" value={lapNum} onChange={e => setLapNum(e.target.value)}
              placeholder={laps.length > 0 ? `e.g. ${laps.length}` : 'e.g. 32'}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div>
            <label className="field-label">Reason</label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              style={{ width: '100%', color: reason ? '#111827' : '#9CA3AF' }}>
              <option value="">Select reason…</option>
              {PIT_REASONS.map(group => (
                <optgroup key={group.category} label={group.category}>
                  {group.reasons.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="field-label">Notes (optional)</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Any additional detail…"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        {reason && meta && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, background: meta.bg, border: `1px solid ${meta.color}20`, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: meta.color }}>{meta.category}</span>
            <span style={{ fontSize: 12, color: '#374151' }}>· {reason}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Btn onClick={handleSubmit} disabled={saving || !lapNum || !reason || locked}>
            {saving ? 'Saving…' : 'Log pit stop'}
          </Btn>
          {msg && <span style={{ fontSize: 12, color: '#059669', fontWeight: 500 }}>{msg}</span>}
        </div>
      </Card>

      <SectionLabel>Pit stop history</SectionLabel>
      {pitStops.length === 0 ? (
        <div style={{ fontSize: 13, color: '#9CA3AF', padding: '12px 0' }}>No pit stops logged yet</div>
      ) : (
        [...pitStops].reverse().map(p => {
          const m = reasonMeta(p.reason);
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Lap {p.lap_number} · {p.reason}
                </div>
                {p.notes && <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{p.notes}</div>}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: m.bg, color: m.color, fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {m.category}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Battery Swap Entry ─────────────────────────────────────────────────────
export function BatterySwapEntry({ laps, batteryPacks, addBatterySwap, locked }) {
  const [packName, setPackName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [swapLap, setSwapLap] = useState('');
  const [jetiReading, setJetiReading] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async () => {
    if (!packName || !capacity) return;
    setSaving(true);
    try {
      // Store the JETI reading at the time of swap as the capacity used by the previous pack
      await addBatterySwap(packName, parseFloat(jetiReading || capacity), parseInt(swapLap) || laps.length, notes);
      setMsg(`✓ ${packName} (${capacity}mAh) logged at lap ${swapLap || laps.length}`);
      setPackName(''); setCapacity(''); setSwapLap(''); setJetiReading(''); setNotes('');
    } catch (e) { setMsg(`Error: ${e.message}`); }
    finally { setSaving(false); }
  };

  const totalCapacity = batteryPacks.reduce((s, p) => s + parseFloat(p.capacity_mah || 0), 0);

  return (
    <div>
      <div className="role-header">
        <div className="role-name">🔋 Battery Swap</div>
        <div className="role-desc">Log each battery pack swap. The JETI resets to 0 on swap — enter the reading just before swapping so totals stay accurate.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 8, marginBottom: 16 }}>
        <Metric label="Packs used" value={batteryPacks.length} />
        <Metric label="Total capacity" value={totalCapacity > 0 ? Math.round(totalCapacity) : '—'} unit="mAh logged" />
        <Metric label="Current pack" value={batteryPacks.length > 0 ? batteryPacks[batteryPacks.length-1].pack_name : '—'} />
      </div>

      <Alert type="info">
        When swapping: first note the JETI mAh reading, then physically swap the battery, then log it here. This keeps the cumulative total accurate.
      </Alert>

      <Card>
        <SectionLabel style={{ marginTop: 0 }}>Log battery swap</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 10 }}>
          <div>
            <label className="field-label">Pack name / ID</label>
            <input type="text" value={packName} onChange={e => setPackName(e.target.value)} placeholder="e.g. Pack A" />
          </div>
          <div>
            <label className="field-label">Pack capacity (mAh)</label>
            <select value={capacity} onChange={e => setCapacity(e.target.value)} style={{ width: '100%' }}>
              <option value="">Select…</option>
              <option value="2200">2200 mAh</option>
              <option value="2600">2600 mAh</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {capacity === 'custom' && (
            <div>
              <label className="field-label">Custom capacity (mAh)</label>
              <input type="number" value={''} onChange={e => setCapacity(e.target.value)} placeholder="e.g. 3000" />
            </div>
          )}
          <div>
            <label className="field-label">JETI reading before swap (mAh)</label>
            <input type="number" value={jetiReading} onChange={e => setJetiReading(e.target.value)}
              placeholder="mAh shown on JETI" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div>
            <label className="field-label">Swap lap</label>
            <input type="number" value={swapLap} onChange={e => setSwapLap(e.target.value)}
              placeholder={`e.g. ${laps.length}`} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="field-label">Notes (optional)</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="e.g. swapped due to low voltage" />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Btn onClick={handleSubmit} disabled={saving || !packName || !capacity || locked}>
            {saving ? 'Saving…' : 'Log battery swap'}
          </Btn>
          {msg && <span style={{ fontSize: 12, color: '#059669', fontWeight: 500 }}>{msg}</span>}
        </div>
      </Card>

      <SectionLabel>Battery pack history</SectionLabel>
      {batteryPacks.length === 0 ? (
        <div style={{ fontSize: 13, color: '#9CA3AF', padding: '12px 0' }}>No packs logged yet</div>
      ) : (
        batteryPacks.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', marginBottom: 6, background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 8, borderLeft: `4px solid #3B82F6` }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EFF6FF', border: '2px solid #3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 800, color: '#1E40AF', flexShrink: 0 }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                {p.pack_name} · {p.capacity_mah} mAh
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                Swapped in at lap {p.swap_lap} · JETI read {p.capacity_mah} mAh
                {p.notes ? ` · ${p.notes}` : ''}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
