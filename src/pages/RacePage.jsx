import React, { useState, useCallback, useEffect } from 'react';
import { useLiveRCPoller } from '../hooks/useLiveRC';
import StrategyDashboard from '../components/StrategyDashboard';
import { LapTimeEntry, CapacityEntry, CurrentEntry, VoltageEntry } from '../components/EntryPanels';
import { PitStopEntry, BatterySwapEntry } from '../components/EventsPanel';
import { Btn } from '../components/UI';

const ROLES = [
  { id: 'strategy',     label: 'Strategy',    emoji: '📊' },
  { id: 'lap-timer',    label: 'Lap Timer',   emoji: '⏱' },
  { id: 'capacity',     label: 'Capacity',    emoji: '📊' },
  { id: 'current',      label: 'Current',     emoji: '⚡' },
  { id: 'voltage',      label: 'Voltage',     emoji: '🔋' },
  { id: 'pit-stop',     label: 'Pit Stops',   emoji: '🔧' },
  { id: 'battery-swap', label: 'Bat Swap',    emoji: '🔄' },
  { id: 'lap-log',      label: 'Lap Log',     emoji: '📋' },
];

const POST_RACE_WINDOW_SECS = 300;


// ── Lap Log Tab ───────────────────────────────────────────────────────────
function LapLogTab({ laps, pitStops }) {
  const pitLapNums = new Set((pitStops || []).map(p => p.lap_number));
  const bestTime = laps.reduce((best, l) => {
    const t = parseFloat(l.lap_time);
    return !isNaN(t) && t > 0 && t < best ? t : best;
  }, Infinity);

  const mono = { fontFamily: "'DM Mono', monospace" };
  const th = { padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F9FAFB', borderBottom: '1.5px solid #E5E7EB', whiteSpace: 'nowrap' };
  const td = (extra = {}) => ({ padding: '8px 12px', fontSize: 13, borderBottom: '1px solid #F3F4F6', ...mono, ...extra });

  if (!laps.length) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF', fontSize: 14 }}>
      No laps recorded yet
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '0.04em' }}>
            📋 Lap Log
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
            {laps.length} laps recorded · updates live
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>#</th>
                <th style={th}>Lap Time</th>
                <th style={th}>Bat Cap (mAh)</th>
                <th style={th}>FC Cap (mAh)</th>
                <th style={th}>Bat Current (A)</th>
                <th style={th}>FC Current (A)</th>
                <th style={th}>Voltage (V)</th>
                <th style={th}>Flags</th>
              </tr>
            </thead>
            <tbody>
              {[...laps].reverse().map(l => {
                const t = parseFloat(l.lap_time);
                const isBest = !isNaN(t) && t === bestTime;
                const isPit  = pitLapNums.has(l.lap_number);
                const rowBg  = isPit ? '#FEF2F2' : isBest ? '#F0FDF4' : '#fff';

                return (
                  <tr key={l.id} style={{ background: rowBg }}>
                    <td style={td({ color: '#6B7280', fontWeight: 600 })}>{l.lap_number}</td>
                    <td style={td({ color: isBest ? '#059669' : '#111827', fontWeight: isBest ? 700 : 400 })}>
                      {l.lap_time != null ? `${parseFloat(l.lap_time).toFixed(3)}s` : '—'}
                      {isBest && <span style={{ marginLeft: 5, fontSize: 10, background: '#059669', color: '#fff', borderRadius: 3, padding: '1px 5px', fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>BEST</span>}
                    </td>
                    <td style={td()}>{l.battery_cap_mah != null ? l.battery_cap_mah : '—'}</td>
                    <td style={td()}>{l.fc_cap_mah != null ? l.fc_cap_mah : '—'}</td>
                    <td style={td()}>{l.battery_current_a != null ? `${parseFloat(l.battery_current_a).toFixed(1)}` : '—'}</td>
                    <td style={td()}>{l.fc_current_a != null ? `${parseFloat(l.fc_current_a).toFixed(1)}` : '—'}</td>
                    <td style={td({
                      color: l.battery_voltage_v && parseFloat(l.battery_voltage_v) < 7.0 ? '#DC2626' : '#111827',
                      fontWeight: l.battery_voltage_v && parseFloat(l.battery_voltage_v) < 7.0 ? 700 : 400,
                    })}>
                      {l.battery_voltage_v != null ? `${parseFloat(l.battery_voltage_v).toFixed(1)}` : '—'}
                    </td>
                    <td style={td({ fontFamily: 'Inter, sans-serif', fontSize: 12 })}>
                      {l.stick_swap && <span style={{ background: '#DBEAFE', color: '#1D4ED8', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700, marginRight: 4 }}>H2</span>}
                      {isPit      && <span style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700, marginRight: 4 }}>PIT</span>}
                      {l.source === 'LiveRC' && <span style={{ background: '#F3F4F6', color: '#6B7280', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 600 }}>RC</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function RacePage({
  session, laps, addLap, updateLap, startRace, endRace,
  events, batteryPacks, addPitStop, addBatterySwap,
  initialRole = 'strategy', onBack
}) {
  const [role, setRole] = useState(initialRole);
  const [showLiveRC, setShowLiveRC] = useState(false);
  const [liveRCUrl, setLiveRCUrl] = useState('');
  const [liveRCEnabled, setLiveRCEnabled] = useState(false);
  const [liveRCStatus, setLiveRCStatus] = useState('');
  const [postRaceSecsLeft, setPostRaceSecsLeft] = useState(null);
  const [sessionIdCopied, setSessionIdCopied] = useState(false);

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
  const pitStops    = (events || []).filter(e => e.event_type === 'pit_stop');
  const entryProps  = { session, laps, addLap, updateLap, locked: entryLocked };

  return (
    <div>
      {/* Header */}
      <div className="race-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/h2gplogo.png" alt="Sequoyah Racing" style={{ height: 36, width: 'auto' }} />
          <div>
            <div className="race-title">{session.name || 'Race'}</div>
            <div className="race-subtitle">
              {session.race_duration_mins}min · {session.battery_limit_mah}mAh · {session.total_sticks} sticks · {laps.length} laps · {pitStops.length} pit stops
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session ID</span>
              <code style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#6B7280', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 4, padding: '2px 7px' }}>{session.id}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(session.id); setSessionIdCopied(true); setTimeout(() => setSessionIdCopied(false), 2000); }}
                style={{ fontSize: 10, fontWeight: 600, color: sessionIdCopied ? '#059669' : '#6B7280', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 4px', fontFamily: 'Inter, sans-serif' }}>
                {sessionIdCopied ? '✓ Copied' : 'Copy'}
              </button>
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

      {/* LiveRC panel */}
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

      {/* Locked banner */}
      {entryLocked && (
        <div style={{ background: '#F3F4F6', borderBottom: '1.5px solid #E5E7EB', padding: '10px 16px', textAlign: 'center' }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            🔒 Race data locked — Export CSV to download your data
          </span>
        </div>
      )}

      {/* Role tabs */}
      <div className="tab-bar">
        {ROLES.map(r => (
          <button key={r.id} className={`role-tab${role === r.id ? ' active' : ''}`} onClick={() => setRole(r.id)}>
            {r.emoji} {r.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px 48px' }}>
        {role === 'strategy'     && <StrategyDashboard session={session} laps={laps} pitStops={pitStops} batteryPacks={batteryPacks || []} />}
        {role === 'lap-timer'    && <LapTimeEntry {...entryProps} />}
        {role === 'capacity'     && <CapacityEntry {...entryProps} />}
        {role === 'current'      && <CurrentEntry {...entryProps} />}
        {role === 'voltage'      && <VoltageEntry {...entryProps} />}
        {role === 'pit-stop'     && <PitStopEntry laps={laps} addPitStop={addPitStop} pitStops={pitStops} locked={entryLocked} />}
        {role === 'battery-swap' && <BatterySwapEntry laps={laps} batteryPacks={batteryPacks || []} addBatterySwap={addBatterySwap} locked={entryLocked} />}
        {role === 'lap-log'      && <LapLogTab laps={laps} pitStops={pitStops} />}
      </div>
    </div>
  );
}
