import React from 'react';
import { calcPackPaceGuidance, fmtTime } from '../lib/calc';

export function PaceAdvisor({ session, laps, batteryPacks = [], elapsed }) {
  if (!session || laps.length < 3) return null;

  const maxMahPerMin = session.max_mah_per_min || 26.13;
  const targetPackMins = session.target_pack_mins || 80;
  const totalBudgetMah = session.battery_limit_mah || 14800;

  // Find when the current pack was installed
  const sortedPacks = [...batteryPacks].sort((a, b) => a.swap_lap - b.swap_lap);
  const currentPack = sortedPacks[sortedPacks.length - 1];
  const currentPackSwapLap = currentPack?.swap_lap || 1;
  const currentPackCapacity = currentPack
    ? parseFloat(currentPack.capacity_mah)
    : 4400; // default to first pack

  // Laps on current pack — from swap lap onwards
  const currentPackLaps = laps.filter(l =>
    l.lap_number >= currentPackSwapLap &&
    parseFloat(l.lap_time) > 0 && parseFloat(l.lap_time) < 300
  );

  // Time elapsed on current pack
  const packElapsedSecs = currentPackLaps.reduce((s, l) => s + parseFloat(l.lap_time), 0);

  // mAh used on current pack (JETI resets to 0 on swap, so use raw reading)
  const lastLapOnPack = currentPackLaps[currentPackLaps.length - 1];
  const packMahUsed = lastLapOnPack?.battery_cap_mah
    ? parseFloat(lastLapOnPack.battery_cap_mah)
    : 0;

  // Total mAh across all packs
  const prevPacksMah = sortedPacks.slice(0, -1).reduce((s, p) => s + parseFloat(p.capacity_mah || 0), 0);
  const totalMahUsed = prevPacksMah + packMahUsed;

  const guidance = calcPackPaceGuidance({
    packMahUsed,
    packElapsedSecs,
    packCapacityMah: currentPackCapacity,
    targetPackMins,
    maxMahPerMin,
    totalMahUsed,
    totalBudgetMah,
  });

  if (!guidance) {
    return (
      <div className="advisor advisor-hold" style={{ marginBottom: 16 }}>
        <div className="advisor-title">Waiting for pack data</div>
        <div className="advisor-detail">Log a battery swap to enable per-pack pace guidance · target {targetPackMins} min per pack</div>
      </div>
    );
  }

  const {
    state, title, detail,
    currentBurnRate, neededBurnRate, targetBurnRate,
    projectedPackMins, packTimeRemMins, packMahRem,
    totalPctUsed,
  } = guidance;

  const advisorClass = {
    slow_down: 'advisor advisor-now',
    speed_up: 'advisor advisor-soon',
    good: 'advisor advisor-hold',
  }[state] || 'advisor advisor-hold';

  const barPct = Math.min(100, (currentBurnRate / maxMahPerMin) * 100);
  const barColor = state === 'slow_down' ? '#DC2626' : state === 'speed_up' ? '#D97706' : '#059669';

  return (
    <div>
      <div className={advisorClass}>
        <div className="advisor-title">{title}</div>
        <div className="advisor-detail">{detail}</div>

        {/* Burn rate bar */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, opacity: 0.75, marginBottom: 3, fontFamily: "'DM Mono', monospace" }}>
            <span>Burn rate</span>
            <span>{currentBurnRate.toFixed(1)} mAh/min · limit {maxMahPerMin}</span>
          </div>
          <div style={{ height: 6, background: 'rgba(0,0,0,0.1)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${barPct}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
        </div>
      </div>

      {/* 4 key pack stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Pack projects</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 500, color: state === 'good' ? '#059669' : state === 'slow_down' ? '#DC2626' : '#D97706' }}>
            {projectedPackMins.toFixed(0)}
          </div>
          <div style={{ fontSize: 10, color: '#9CA3AF' }}>min (target {targetPackMins})</div>
        </div>
        <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Pack remain</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 500, color: '#111827' }}>{Math.round(packMahRem)}</div>
          <div style={{ fontSize: 10, color: '#9CA3AF' }}>mAh left</div>
        </div>
        <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Pack time left</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 500, color: '#111827' }}>
            {packTimeRemMins > 0 ? fmtTime(packTimeRemMins * 60) : '—'}
          </div>
          <div style={{ fontSize: 10, color: '#9CA3AF' }}>at target rate</div>
        </div>
        <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Race budget</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 500, color: totalPctUsed > 90 ? '#DC2626' : '#111827' }}>
            {totalPctUsed.toFixed(0)}%
          </div>
          <div style={{ fontSize: 10, color: '#9CA3AF' }}>of {totalBudgetMah} mAh used</div>
        </div>
      </div>

      {/* Pack timeline */}
      {sortedPacks.length > 0 && (
        <div style={{ background: '#FFFFFF', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: "'Barlow', sans-serif" }}>Battery pack timeline</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {sortedPacks.map((p, i) => {
              const isActive = i === sortedPacks.length - 1;
              return (
                <div key={p.id} style={{
                  flex: 1, minWidth: 80,
                  padding: '8px 10px', borderRadius: 6,
                  background: isActive ? '#ECFDF5' : '#F9FAFB',
                  border: `1.5px solid ${isActive ? '#059669' : '#E5E7EB'}`,
                }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: isActive ? '#065F46' : '#6B7280', textTransform: 'uppercase' }}>
                    {p.pack_name} {isActive ? '● active' : '✓ done'}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                    {p.capacity_mah} mAh · lap {p.swap_lap}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
