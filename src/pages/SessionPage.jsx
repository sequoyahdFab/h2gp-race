import React, { useState } from 'react';
import { useSessions } from '../hooks/useRace';
import { Btn, Card, SectionLabel, Alert } from '../components/UI';
import { RACE_PRESETS } from '../lib/constants';

export default function SessionPage({ onSelect }) {
  const { sessions, loading, createSession, deleteSession } = useSessions();
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [form, setForm] = useState({
    name: '',
    race_duration_mins: 240,
    battery_limit_mah: 14865,
    total_sticks: 18,
    max_mah_per_min: 26.13,
    target_lap_time: 20,
    fast_threshold: 18,
    slow_threshold: 23,
    stick_min_mins: 12,
    stick_max_mins: 16,
    fc_low_amps: 1.0,
    target_pack_mins: 80,
    num_battery_packs: 3,
  });

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const applyPreset = (key) => {
    const preset = RACE_PRESETS[key];
    setSelectedPreset(key);
    setForm(prev => ({ ...prev, ...preset.config }));
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('Enter a session name'); return; }
    setCreating(true); setError('');
    try {
      const sess = await createSession({
        ...form,
        preset_key: selectedPreset,
        preset_packs: selectedPreset ? JSON.stringify(RACE_PRESETS[selectedPreset].packs) : null,
      });
      onSelect(sess.id, 'strategy');
    } catch (e) { setError(e.message); }
    finally { setCreating(false); }
  };

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    if (!window.confirm(`Permanently delete "${name}" and all its lap data? This cannot be undone.`)) return;
    setDeletingId(id);
    try { await deleteSession(id); }
    catch (err) { alert('Error deleting session: ' + err.message); }
    finally { setDeletingId(null); }
  };

  const inp = (label, key, opts = {}) => (
    <div>
      <label className="field-label">{label}</label>
      <input type="number" value={form[key]} step={opts.step || 1}
        onChange={e => f(key, parseFloat(e.target.value) || 0)} />
    </div>
  );

  const activePreset = selectedPreset ? RACE_PRESETS[selectedPreset] : null;

  return (
    <div>
      <div className="session-hero">
        <img src="/h2gplogo.png" alt="Sequoyah Racing" style={{ height: 120, width: 'auto', marginBottom: 12 }} />
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, color: '#D1D5DB', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Race Control Dashboard
        </div>
        <div className="session-tagline">hydrogen · fuel cell · endurance · real-time telemetry</div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
        <Card style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            New Race Session
          </div>

          {/* Race preset selector */}
          <SectionLabel style={{ marginTop: 0 }}>Select race type</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 16 }}>
            {Object.entries(RACE_PRESETS).map(([key, preset]) => {
              const isSelected = selectedPreset === key;
              return (
                <div
                  key={key}
                  onClick={() => applyPreset(key)}
                  style={{
                    padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                    border: `2px solid ${isSelected ? preset.color : '#E5E7EB'}`,
                    background: isSelected ? preset.bg : '#F9FAFB',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 800, color: isSelected ? preset.color : '#374151', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    {preset.label}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: isSelected ? preset.color : '#9CA3AF', marginTop: 3, lineHeight: 1.4 }}>
                    {preset.subtitle}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pack preview */}
          {activePreset && !activePreset.isPractice && (
            <div style={{ background: activePreset.bg, border: `1px solid ${activePreset.color}30`, borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, color: activePreset.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Optimal battery configuration
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {activePreset.packs.map((p, i) => (
                  <div key={i} style={{ background: '#FFFFFF', border: `1px solid ${activePreset.color}40`, borderRadius: 6, padding: '6px 10px', fontSize: 11 }}>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: '#111827', textTransform: 'uppercase' }}>{p.name}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", color: '#6B7280', marginTop: 1 }}>{p.capacity} mAh</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", color: '#9CA3AF', fontSize: 10 }}>{p.cells}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: activePreset.color, marginTop: 8 }}>
                Total: {activePreset.packs.reduce((s, p) => s + p.capacity, 0).toLocaleString()} mAh · {activePreset.packs.length} packs · {form.target_pack_mins} min/pack
              </div>
            </div>
          )}

          {/* Session name */}
          <div style={{ marginBottom: 14 }}>
            <label className="field-label">Session name</label>
            <input type="text" value={form.name} onChange={e => f('name', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder={activePreset ? `e.g. ${activePreset.label} 2026 — Endurance Race` : 'e.g. Regional Championship — Endurance Race'} />
          </div>

          {/* Advanced config — collapsed by default */}
          <details style={{ marginBottom: 16 }}>
            <summary style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', userSelect: 'none' }}>
              Advanced configuration ▾
            </summary>
            <div style={{ marginTop: 12 }}>
              <SectionLabel style={{ marginTop: 0 }}>Race limits</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 4 }}>
                {inp('Race duration (min)', 'race_duration_mins')}
                {inp('Total mAh budget', 'battery_limit_mah')}
                {inp('Battery packs', 'num_battery_packs')}
                {inp('Target mins/pack', 'target_pack_mins')}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                {inp('Min stick time (min)', 'stick_min_mins')}
                {inp('Max stick time (min)', 'stick_max_mins')}
                {inp('FC low trigger (A)', 'fc_low_amps', { step: 0.1 })}
              </div>
            </div>
          </details>

          {/* Practice mode note */}
          {activePreset?.isPractice && (
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 7, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#6B7280', fontFamily: "'Barlow', sans-serif" }}>
              <strong style={{ color: '#374151' }}>Practice mode</strong> — no mAh budget enforcement or race limits. All telemetry and lap data is still logged. Duration and config are fully adjustable in Advanced configuration above.
            </div>
          )}

          {error && <Alert type="danger">{error}</Alert>}
          <Btn onClick={handleCreate} disabled={creating || !selectedPreset}>
            {creating ? 'Creating…' : selectedPreset ? `+ Create ${activePreset.label} Session` : 'Select a race type first'}
          </Btn>
          {!selectedPreset && (
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>Select a race type above to continue</div>
          )}
        </Card>

        {/* Past sessions */}
        {!loading && sessions.length > 0 && (
          <div>
            <SectionLabel>Race Archive</SectionLabel>
            {sessions.map(s => {
              const isComplete = !!s.race_end_time;
              const isLive = !!s.race_start_time && !s.race_end_time;
              const presetKey = s.preset_key;
              const preset = presetKey ? RACE_PRESETS[presetKey] : null;
              const statusClass = isComplete ? 'session-item-complete' : isLive ? 'session-item-active' : 'session-item-new';
              return (
                <div key={s.id} className={`session-item ${statusClass}`} onClick={() => onSelect(s.id, 'strategy')}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <div className="session-name">{s.name}</div>
                      {preset && (
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, color: preset.color, background: preset.bg, border: `1px solid ${preset.color}40`, borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {preset.label}
                        </span>
                      )}
                      {isComplete && (
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, color: '#065F46', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Complete</span>
                      )}
                      {isLive && (
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, color: '#991B1B', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>● Live</span>
                      )}
                    </div>
                    <div className="session-meta">
                      {new Date(s.created_at).toLocaleDateString()} · {s.race_duration_mins}min · {s.battery_limit_mah?.toLocaleString()}mAh · {s.total_sticks} sticks
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8, flexShrink: 0 }}>
                    <span style={{ color: '#9CA3AF', fontSize: 18 }}>→</span>
                    <button
                      onClick={e => handleDelete(e, s.id, s.name)}
                      disabled={deletingId === s.id}
                      style={{ background: 'none', border: '1px solid #FECACA', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#DC2626', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em', opacity: deletingId === s.id ? 0.5 : 1 }}
                    >
                      {deletingId === s.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
