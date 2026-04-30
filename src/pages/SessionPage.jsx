import React, { useState } from 'react';
import { useSessions } from '../hooks/useRace';
import { Btn, Card, SectionLabel, Alert } from '../components/UI';

export default function SessionPage({ onSelect }) {
  const { sessions, loading, createSession } = useSessions();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', race_duration_mins: 80, battery_limit_mah: 2200,
    total_sticks: 6, max_mah_per_min: 26.13, target_lap_time: 20,
    fast_threshold: 18, slow_threshold: 23, stick_min_mins: 12,
    stick_max_mins: 16, fc_low_amps: 1.0,
  });

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('Enter a session name'); return; }
    setCreating(true); setError('');
    try {
      const sess = await createSession(form);
      onSelect(sess.id, 'strategy');
    } catch (e) { setError(e.message); }
    finally { setCreating(false); }
  };

  const inp = (label, key, opts = {}) => (
    <div>
      <label className="field-label">{label}</label>
      <input type="number" value={form[key]} step={opts.step || 1}
        onChange={e => f(key, parseFloat(e.target.value) || 0)} />
    </div>
  );

  return (
    <div>
      {/* Hero with logo */}
      <div className="session-hero">
        <img
          src="/h2gplogo.png"
          alt="Sequoyah Racing"
          style={{ height: 120, width: 'auto', marginBottom: 12 }}
        />
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 13, fontWeight: 700,
          color: '#6B7280', letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}>
          Race Control Dashboard
        </div>
        <div className="session-tagline">hydrogen · fuel cell · endurance · real-time telemetry</div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
        <Card style={{ marginBottom: 24 }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 18, fontWeight: 800,
            color: '#111827', marginBottom: 14,
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            New Race Session
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="field-label">Session name</label>
            <input type="text" value={form.name} onChange={e => f('name', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Regional Championship — Endurance Race" />
          </div>

          <SectionLabel style={{ marginTop: 0 }}>Race limits</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 4 }}>
            {inp('Race duration (min)', 'race_duration_mins')}
            {inp('Battery limit (mAh)', 'battery_limit_mah')}
            {inp('Total H2 sticks', 'total_sticks')}
            {inp('Max mAh/min', 'max_mah_per_min', { step: 0.1 })}
          </div>

          <SectionLabel>Lap speed thresholds</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 4 }}>
            {inp('Target lap (s)', 'target_lap_time', { step: 0.1 })}
            {inp('Too fast below (s)', 'fast_threshold', { step: 0.1 })}
            {inp('Too slow above (s)', 'slow_threshold', { step: 0.1 })}
          </div>

          <SectionLabel>H2 stick advisor</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
            {inp('Min stick time (min)', 'stick_min_mins')}
            {inp('Max stick time (min)', 'stick_max_mins')}
            {inp('FC low trigger (A)', 'fc_low_amps', { step: 0.1 })}
          </div>

          {error && <Alert type="danger">{error}</Alert>}
          <Btn onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating…' : '+ Create Session'}
          </Btn>
        </Card>

        {!loading && sessions.length > 0 && (
          <div>
            <SectionLabel>Race Archive</SectionLabel>
            {sessions.map(s => {
              const isComplete = !!s.race_end_time;
              const isLive = !!s.race_start_time && !s.race_end_time;
              const statusClass = isComplete ? 'session-item-complete' : isLive ? 'session-item-active' : 'session-item-new';
              return (
                <div key={s.id} className={`session-item ${statusClass}`} onClick={() => onSelect(s.id, 'strategy')}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div className="session-name">{s.name}</div>
                      {isComplete && (
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, color: '#065F46', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Complete</span>
                      )}
                      {isLive && (
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, color: '#991B1B', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>● Live</span>
                      )}
                    </div>
                    <div className="session-meta">
                      {new Date(s.created_at).toLocaleDateString()} · {s.race_duration_mins}min · {s.battery_limit_mah}mAh · {s.total_sticks} sticks
                    </div>
                  </div>
                  <span style={{ color: '#9CA3AF', fontSize: 18, marginLeft: 8 }}>→</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
