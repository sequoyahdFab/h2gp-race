import React, { useState, useCallback, useEffect } from 'react';
import { useLiveRCPoller } from '../hooks/useLiveRC';
import StrategyDashboard from '../components/StrategyDashboard';
import { LapTimeEntry, BatteryEntry, FuelCellEntry, VoltageEntry } from '../components/EntryPanels';
import { Btn } from '../components/UI';

const ROLES = [
  { id: 'strategy',  label: 'Strategy',  emoji: '📊' },
  { id: 'lap-timer', label: 'Lap Timer', emoji: '⏱' },
  { id: 'battery',   label: 'Battery',   emoji: '🔋' },
  { id: 'fuel-cell', label: 'Fuel Cell', emoji: '⚗️' },
  { id: 'voltage',   label: 'Voltage',   emoji: '⚡' },
];

const POST_RACE_WINDOW_SECS = 300;

export default function RacePage({ session, laps, addLap, updateLap, startRace, endRace, initialRole = 'strategy', onBack }) {
  const [role, setRole] = useState(initialRole);
  const [showLiveRC, setShowLiveRC] = useState(false);
  const [liveRCUrl, setLiveRCUrl] = useState('');
  const [liveRCEnabled, setLiveRCEnabled] = useState(false);
  const [liveRCStatus, setLiveRCStatus] = useState('');
  const [postRaceSecsLeft, setPostRaceSecsLeft] = useState(null);

  useEffect(() => {
    if (!session?.race_end_time) { setPostRaceSecsLeft(null); return; }
    const tick = () => {
      const elapsed = (Date.now() - new Date(session.race_end_time).getTime()) / 1000;
      setPostRaceSecsLeft(Math.max(0, Math.floor(POST_RACE_WINDOW_SECS - elapsed)));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [session?.race_end_time]);

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
    a.href = URL.createObjectURL(new Blob([header+rows],{type:'text/csv'}));
    a.download = `h2gp_${session?.name?.replace(/\s+/g,'_')||'race'}.csv`;
    a.click();
  };

  const fmtMSS = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  if (!session) return null;

  const raceStarted = !!session.race_start_time;
  const raceEnded   = !!session.race_end_time;
  const entryLocked = raceEnded && postRaceSecsLeft === 0;
  const entryProps  = { session, laps, addLap, updateLap, locked: entryLocked };

  return (
    <div>
      <div className="race-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/h2gplogo.png" alt="Sequoyah Racing" style={{ height: 36, width: 'auto' }} />
          <div>
            <div className="race-title">{session.name || 'Race'}</div>
            <div className="race-subtitle">
              {session.race_duration_mins}min · {session.battery_limit_mah}mAh · {session.total_sticks} sticks · {laps.length} laps
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {!raceStarted && (
            <button className="btn btn-danger" style={{ fontSize: 13, padding: '7px 16px' }}
              onClick={() => { if (window.confirm('Start the race timer? This cannot be undone.')) startRace(); }}>
              🏁 Start Race
            </button>
          )}
          {raceStarted && !raceEnded && (
            <>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, color: '#059669', background: '#ECFDF5', border: '1.5px solid #A7F3D0', borderRadius: 6, padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ● Live
              </span>
              <button className="btn-ghost-dark" style={{ fontSize: 12, padding: '6px 10px', color: '#F87171', borderColor: '#7F1D1D' }}
                onClick={() => { if (window.confirm('End the race? Lap entry stays open for 5 minutes after.')) endRace(); }}>
                🏁 End Race
              </button>
            </>
          )}
          {raceEnded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, color: '#065F46', background: '#ECFDF5', border: '1.5px solid #A7F3D0', borderRadius: 6, padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ✓ Race Complete
              </span>
              {postRaceSecsLeft > 0 && (
                <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: '#D97706', background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: 6, padding: '4px 10px' }}>
                  Entry closes in {fmtMSS(postRaceSecsLeft)}
                </span>
              )}
              {entryLocked && (
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, color: '#6B7280', background: '#F3F4F6', border: '1.5px solid #E5E7EB', borderRadius: 6, padding: '4px 10px', textTransform: 'uppercase' }}>
                  🔒 Locked
                </span>
              )}
            </div>
          )}
          <button className="btn-ghost-dark" style={{ fontSize: 12, padding: '6px 10px', color: liveRCEnabled ? '#1fc98a' : undefined }} onClick={() => setShowLiveRC(!showLiveRC)}>
            LiveRC {liveRCEnabled ? '● live' : 'off'}
          </button>
          <button className="btn-ghost-dark" style={{ fontSize: 12, padding: '6px 10px' }} onClick={exportCSV}>Export CSV</button>
          <button className="btn-ghost-dark" style={{ fontSize: 12, padding: '6px 10px' }} onClick={onBack}>← Sessions</button>
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

      {entryLocked && (
        <div style={{ background: '#F3F4F6', borderBottom: '1.5px solid #E5E7EB', padding: '10px 16px', textAlign: 'center' }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            🔒 Race data locked — post-race entry window closed · Export CSV to download your data
          </span>
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
