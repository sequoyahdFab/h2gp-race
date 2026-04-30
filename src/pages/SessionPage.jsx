import React, { useState } from 'react';
import { useSessions } from '../hooks/useRace';
import { Btn, Card, SectionLabel, Alert } from '../components/UI';

export default function SessionPage({ onSelect }) {
  const { sessions, loading, createSession } = useSessions();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    race_duration_mins: 80,
    battery_limit_mah: 2200,
    total_sticks: 6,
    max_mah_per_min: 26.13,
    target_lap_time: 20,
    fast_threshold: 18,
    slow_threshold: 23,
    stick_min_mins: 12,
    stick_max_mins: 16,
    fc_low_amps: 1.0,
  });

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('Enter a session name'); return; }
    setCreating(true); setError('');
    try {
      const sess = await createSession(form);
      onSelect(sess.id, 'strategy');
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const inp = (label, key, opts = {}) => (
    <div>
      <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 3 }}>{label}</label>
      <input
        type="number"
        value={form[key]}
        step={opts.step || 1}
        onChange={e => f(key, parseFloat(e.target.value) || 0)}
        style={{ width: '100%' }}
      />
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 24, fontWeight: 500, color: 'var(--color-text-primary)' }}>H2GP Race Control</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>Select a session or start a new race</div>
      </div>

      {/* New session */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <SectionLabel style={{ marginTop: 0 }}>New race session</SectionLabel>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 3 }}>Session name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => f('name', e.target.value)}
            placeholder="e.g. Regional Championship — Endurance Race"
            style={{ width: '100%' }}
          />
        </div>

        <SectionLabel>Race limits</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 10 }}>
          {inp('Race duration (min)', 'race_duration_mins')}
          {inp('Battery limit (mAh)', 'battery_limit_mah')}
          {inp('Total H2 sticks', 'total_sticks')}
          {inp('Max mAh/min', 'max_mah_per_min', { step: 0.1 })}
        </div>

        <SectionLabel>Lap speed thresholds</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 10 }}>
          {inp('Target lap (s)', 'target_lap_time', { step: 0.1 })}
          {inp('Too fast below (s)', 'fast_threshold', { step: 0.1 })}
          {inp('Too slow above (s)', 'slow_threshold', { step: 0.1 })}
        </div>

        <SectionLabel>H2 stick advisor</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 12 }}>
          {inp('Min stick time (min)', 'stick_min_mins')}
          {inp('Max stick time (min)', 'stick_max_mins')}
          {inp('FC low trigger (A)', 'fc_low_amps', { step: 0.1 })}
        </div>

        {error && <Alert type="danger" style={{ marginBottom: 8 }}>{error}</Alert>}
        <Btn onClick={handleCreate} disabled={creating}>
          {creating ? 'Creating…' : 'Create session + open dashboard'}
        </Btn>
      </Card>

      {/* Past sessions */}
      {!loading && sessions.length > 0 && (
        <div>
          <SectionLabel>Past sessions</SectionLabel>
          {sessions.map(s => (
            <div
              key={s.id}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', marginBottom: 6,
                background: 'var(--color-background-secondary)',
                borderRadius: 'var(--border-radius-md)',
                cursor: 'pointer',
              }}
              onClick={() => onSelect(s.id, 'strategy')}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {new Date(s.created_at).toLocaleDateString()} · {s.race_duration_mins}min · {s.battery_limit_mah}mAh · {s.total_sticks} sticks
                </div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Open →</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
