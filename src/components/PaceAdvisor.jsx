import React from 'react';
import { calcPaceGuidance } from '../lib/constants';
import { fmtTime } from '../lib/calc';

export function PaceAdvisor({ session, laps, elapsed }) {
  if (!session || laps.length < 3) return null;

  const raceMins = session.race_duration_mins;
  const maxMahPerMin = session.max_mah_per_min;
  const last = laps[laps.length - 1];
  const batUsed = last?.battery_cap_mah ? parseFloat(last.battery_cap_mah) : 0;

  // Total battery available across all packs — use session limit as baseline
  const batLimit = session.battery_limit_mah;
  const batRemaining = Math.max(0, batLimit - batUsed);

  const totalSec = laps
    .filter(l => parseFloat(l.lap_time) > 0 && parseFloat(l.lap_time) < 300)
    .reduce((s, l) => s + parseFloat(l.lap_time), 0);
  const totalMins = totalSec / 60;
  const mahPerMin = totalMins > 0 && batUsed > 0 ? batUsed / totalMins : null;

  const validLaps = laps.filter(l => parseFloat(l.lap_time) > 0 && parseFloat(l.lap_time) < 300);
  const avgLap = validLaps.length > 0
    ? validLaps.reduce((s, l) => s + parseFloat(l.lap_time), 0) / validLaps.length
    : null;

  const raceTimeRemSecs = Math.max(0, raceMins * 60 - elapsed);

  const guidance = calcPaceGuidance(
    batUsed, batRemaining, mahPerMin, maxMahPerMin, raceTimeRemSecs, avgLap
  );

  if (!guidance) return null;

  const { state, neededMahPerMin, currentRate, lapAdjustSecs, overLimit } = guidance;

  const config = {
    slow_down: {
      title: overLimit ? '⚠ SLOW DOWN — Over limit' : '⚠ SLOW DOWN',
      detail: `Burning ${currentRate?.toFixed(1)} mAh/min · need ${neededMahPerMin?.toFixed(1)} mAh/min to finish · add ~${Math.abs(lapAdjustSecs).toFixed(1)}s per lap`,
      cls: 'advisor advisor-now',
      barColor: '#DC2626',
      barPct: Math.min(100, (currentRate / maxMahPerMin) * 100),
    },
    speed_up: {
      title: '↑ SPEED UP — Under-utilizing battery',
      detail: `Burning ${currentRate?.toFixed(1)} mAh/min · need ${neededMahPerMin?.toFixed(1)} mAh/min to finish · push ~${Math.abs(lapAdjustSecs).toFixed(1)}s faster per lap`,
      cls: 'advisor advisor-soon',
      barColor: '#D97706',
      barPct: Math.min(100, (currentRate / maxMahPerMin) * 100),
    },
    good: {
      title: '✓ GOOD PACE — On target',
      detail: `Burning ${currentRate?.toFixed(1)} mAh/min · target ${neededMahPerMin?.toFixed(1)} mAh/min · battery finishes with race`,
      cls: 'advisor advisor-hold',
      barColor: '#059669',
      barPct: Math.min(100, (currentRate / maxMahPerMin) * 100),
    },
  }[state];

  if (!config) return null;

  return (
    <div>
      <div className={config.cls}>
        <div className="advisor-title">{config.title}</div>
        <div className="advisor-detail">{config.detail}</div>
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'inherit', opacity: 0.7, marginBottom: 3, fontFamily: "'DM Mono', monospace" }}>
            <span>Current burn rate</span>
            <span>{currentRate?.toFixed(1)} / {maxMahPerMin} mAh/min max</span>
          </div>
          <div style={{ height: 6, background: 'rgba(0,0,0,0.1)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${config.barPct}%`, height: '100%', background: config.barColor, borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
        </div>
      </div>

      {/* Projected finish */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Battery remain</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 500, color: '#111827' }}>{Math.round(batRemaining)}</div>
          <div style={{ fontSize: 10, color: '#9CA3AF' }}>mAh</div>
        </div>
        <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Needed rate</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 500, color: state === 'good' ? '#059669' : '#D97706' }}>{neededMahPerMin?.toFixed(1)}</div>
          <div style={{ fontSize: 10, color: '#9CA3AF' }}>mAh/min</div>
        </div>
        <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Time remain</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 500, color: '#111827' }}>{fmtTime(raceTimeRemSecs)}</div>
          <div style={{ fontSize: 10, color: '#9CA3AF' }}>min:sec</div>
        </div>
      </div>
    </div>
  );
}
