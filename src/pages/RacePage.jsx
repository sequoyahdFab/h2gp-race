import React, { useState, useCallback } from 'react';
import { useRace } from '../hooks/useRace';
import { useLiveRCPoller } from '../hooks/useLiveRC';
import StrategyDashboard from '../components/StrategyDashboard';
import {
  LapTimeEntry, BatteryEntry, FuelCellEntry, VoltageEntry,
} from '../components/EntryPanels';
import { Btn, Card, SectionLabel } from '../components/UI';

const ROLES = [
  { id: 'strategy', label: 'Strategy', emoji: '📊' },
  { id: 'lap-timer', label: 'Lap Timer', emoji: '⏱' },
  { id: 'battery', label: 'Battery', emoji: '🔋' },
  { id: 'fuel-cell', label: 'Fuel Cell', emoji: '⚗️' },
  { id: 'voltage', label: 'Voltage', emoji: '⚡' },
];

export default function RacePage({ sessionId, initialRole = 'strategy', onBack }) {
  const [role, setRole] = useState(initialRole);
  const [showLiveRC, setShowLiveRC] = useState(false);
  const [liveRCUrl, setLiveRCUrl] = useState('');
  const [liveRCEnabled, setLiveRCEnabled] = useState(false);
  const [liveRCStatus, setLiveRCStatus] = useState('');

  const { session, laps, loading, error, addLap, updateLap } = useRace(sessionId);

  // LiveRC auto-import: when a new lap time arrives, insert a new lap row
  const handleNewLiveLap = useCallback(async (lapTime) => {
    try {
      await addLap({ lap_time: lapTime, source: 'LiveRC', entered_by: 'liverc' });
      setLiveRCStatus(`LiveRC: imported lap ${laps.length + 1} — ${lapTime}s`);
    } catch {
      setLiveRCStatus('LiveRC: import error');
    }
  }, [addLap, laps.length]);

  useLiveRCPoller({
    url: liveRCUrl,
    enabled: liveRCEnabled,
    onNewLap: handleNewLiveLap,
  });

  // Export to CSV
  const exportCSV = () => {
    const header = 'lap_number,lap_time,battery_cap_mah,fc_cap_mah,battery_current_a,fc_current_a,battery_voltage_v,stick_swap,source,entered_by\n';
    const rows = laps
      .map(l =>
        [l.lap_number, l.lap_time, l.battery_cap_mah, l.fc_cap_mah,
         l.battery_current_a, l.fc_current_a, l.battery_voltage_v,
         l.stick_swap ? 1 : 0, l.source, l.entered_by].join(',')
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `h2gp_${session?.name?.replace(/\s+/g, '_') || 'race'}_laps.csv`;
    a.click();
  };

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
      Loading race data…
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem' }}>
      <Alert type="danger">Error: {error}</Alert>
    </div>
  );

  const entryProps = { session, laps, addLap, updateLap };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0.75rem 1rem 2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {session?.name || 'Race'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
            {session?.race_duration_mins}min · {session?.battery_limit_mah}mAh · {session?.total_sticks} sticks
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setShowLiveRC(!showLiveRC)}
            style={{
              fontSize: 11, padding: '4px 8px', cursor: 'pointer',
              borderRadius: 'var(--border-radius-md)',
              background: liveRCEnabled ? '#E1F5EE' : 'var(--color-background-secondary)',
              color: liveRCEnabled ? '#085041' : 'var(--color-text-secondary)',
              border: `0.5px solid ${liveRCEnabled ? '#9FE1CB' : 'var(--color-border-tertiary)'}`,
            }}
          >
            LiveRC {liveRCEnabled ? '● on' : 'off'}
          </button>
          <button onClick={exportCSV} style={{ fontSize: 11, padding: '4px 8px', cursor: 'pointer', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
            Export CSV
          </button>
          <button onClick={onBack} style={{ fontSize: 11, padding: '4px 8px', cursor: 'pointer', borderRadius: 'var(--border-radius-md)', background: 'none', color: 'var(--color-text-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
            ← Sessions
          </button>
        </div>
      </div>

      {/* LiveRC panel */}
      {showLiveRC && (
        <Card style={{ marginBottom: '0.75rem' }}>
          <SectionLabel style={{ marginTop: 0 }}>LiveRC auto-import</SectionLabel>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
            Paste your track's live results URL. Lap times will be imported automatically every 5 seconds.
          </div>
          <div style={{ display: 'flex', gap: 7, marginBottom: 8, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={liveRCUrl}
              onChange={e => setLiveRCUrl(e.target.value)}
              placeholder="https://yourtrack.liverc.com/results/?p=view_race_result&id=..."
              style={{ flex: 1, minWidth: 200, fontSize: 12 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
            <Btn onClick={() => setLiveRCEnabled(true)} disabled={!liveRCUrl || liveRCEnabled}>
              Start polling
            </Btn>
            <Btn variant="ghost" onClick={() => { setLiveRCEnabled(false); setLiveRCStatus('Stopped'); }}>
              Stop
            </Btn>
            {liveRCStatus && (
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{liveRCStatus}</span>
            )}
          </div>
        </Card>
      )}

      {/* Role tabs */}
      <div style={{
        display: 'flex', gap: 2, marginBottom: '1rem',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        overflowX: 'auto',
      }}>
        {ROLES.map(r => (
          <button
            key={r.id}
            onClick={() => setRole(r.id)}
            style={{
              padding: '7px 12px', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', border: 'none', background: 'none',
              whiteSpace: 'nowrap',
              color: role === r.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              borderBottom: `2px solid ${role === r.id ? '#1D9E75' : 'transparent'}`,
              marginBottom: -1,
            }}
          >
            {r.emoji} {r.label}
          </button>
        ))}
      </div>

      {/* Role content */}
      {role === 'strategy'  && <StrategyDashboard session={session} laps={laps} />}
      {role === 'lap-timer' && <LapTimeEntry {...entryProps} />}
      {role === 'battery'   && <BatteryEntry {...entryProps} />}
      {role === 'fuel-cell' && <FuelCellEntry {...entryProps} />}
      {role === 'voltage'   && <VoltageEntry {...entryProps} />}
    </div>
  );
}
