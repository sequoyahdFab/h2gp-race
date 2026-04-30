import React, { useState, useCallback } from 'react';
import { useRace } from '../hooks/useRace';
import { useLiveRCPoller } from '../hooks/useLiveRC';
import StrategyDashboard from '../components/StrategyDashboard';
import { LapTimeEntry, BatteryEntry, FuelCellEntry, VoltageEntry } from '../components/EntryPanels';
import { Btn, Alert } from '../components/UI';

const ROLES = [
  { id: 'strategy',  label: 'Strategy',  emoji: '📊' },
  { id: 'lap-timer', label: 'Lap Timer', emoji: '⏱' },
  { id: 'battery',   label: 'Battery',   emoji: '🔋' },
  { id: 'fuel-cell', label: 'Fuel Cell', emoji: '⚗️' },
  { id: 'voltage',   label: 'Voltage',   emoji: '⚡' },
];

export default function RacePage({ sessionId, initialRole = 'strategy', onBack }) {
  const [role, setRole] = useState(initialRole);
  const [showLiveRC, setShowLiveRC] = useState(false);
  const [liveRCUrl, setLiveRCUrl] = useState('');
  const [liveRCEnabled, setLiveRCEnabled] = useState(false);
  const [liveRCStatus, setLiveRCStatus] = useState('');
  const { session, laps, loading, error, addLap, updateLap } = useRace(sessionId);

  const handleNewLiveLap = useCallback(async (lapTime) => {
    try {
      await addLap({ lap_time: lapTime, source: 'LiveRC', entered_by: 'liverc' });
      setLiveRCStatus(`Imported lap — ${lapTime}s`);
    } catch { setLiveRCStatus('Import error'); }
  }, [addLap]);

  useLiveRCPoller({ url: liveRCUrl, enabled: liveRCEnabled, onNewLap: handleNewLiveLap });

  const exportCSV = () => {
    const header = 'lap_number,lap_time,battery_cap_mah,fc_cap_mah,battery_current_a,fc_current_a,battery_voltage_v,stick_swap,source\n';
    const rows = laps.map(l => [l.lap_number,l.lap_time,l.battery_cap_mah,l.fc_cap_mah,l.battery_current_a,l.fc_current_a,l.battery_voltage_v,l.stick_swap?1:0,l.source].join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([header + rows], { type: 'text/csv' }));
    a.download = `h2gp_${session?.name?.replace(/\s+/g,'_')||'race'}.csv`;
    a.click();
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Loading race data…</div>;
  if (error) return <div style={{ padding: '2rem' }}><Alert type="danger">Error: {error}</Alert></div>;

  const entryProps = { session, laps, addLap, updateLap };

  return (
    <div>
      <div className="race-header">
        <div>
          <div className="race-title">{session?.name || 'Race'}</div>
          <div className="race-subtitle">{session?.race_duration_mins}min · {session?.battery_limit_mah}mAh · {session?.total_sticks} sticks · {laps.length} laps logged</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px', color: liveRCEnabled ? '#059669' : undefined }} onClick={() => setShowLiveRC(!showLiveRC)}>
            LiveRC {liveRCEnabled ? '● live' : 'off'}
          </button>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={exportCSV}>Export CSV</button>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={onBack}>← Sessions</button>
        </div>
      </div>

      {showLiveRC && (
        <div style={{ background: '#F9FAFB', borderBottom: '1.5px solid #E5E7EB', padding: '12px 16px' }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>Paste your LiveRC live results URL — lap times auto-import every 5 seconds</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="text" value={liveRCUrl} onChange={e => setLiveRCUrl(e.target.value)} placeholder="https://yourtrack.liverc.com/results/?p=view_race_result&id=..." style={{ flex: 1, minWidth: 200, fontSize: 12 }} />
              <Btn onClick={() => setLiveRCEnabled(true)} disabled={!liveRCUrl || liveRCEnabled}>Start</Btn>
              <Btn variant="ghost" onClick={() => { setLiveRCEnabled(false); setLiveRCStatus('Stopped'); }}>Stop</Btn>
              {liveRCStatus && <span style={{ fontSize: 12, color: '#6B7280' }}>{liveRCStatus}</span>}
            </div>
          </div>
        </div>
      )}

      <div className="tab-bar">
        {ROLES.map(r => (
          <button key={r.id} className={`role-tab${role === r.id ? ' active' : ''}`} onClick={() => setRole(r.id)}>
            {r.emoji} {r.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px 16px 48px' }}>
        {role === 'strategy'  && <StrategyDashboard session={session} laps={laps} />}
        {role === 'lap-timer' && <LapTimeEntry {...entryProps} />}
        {role === 'battery'   && <BatteryEntry {...entryProps} />}
        {role === 'fuel-cell' && <FuelCellEntry {...entryProps} />}
        {role === 'voltage'   && <VoltageEntry {...entryProps} />}
      </div>
    </div>
  );
}
