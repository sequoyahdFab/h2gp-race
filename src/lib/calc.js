// Format seconds to M:SS
export function fmtTime(s) {
  if (s === null || s === undefined || isNaN(s)) return '—';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// Format seconds to H:MM:SS
export function fmtDuration(s) {
  if (isNaN(s) || s < 0) return '0:00:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// Classify lap speed
export function lapSpeed(lapTime, fastThreshold, slowThreshold) {
  if (!lapTime) return null;
  const t = parseFloat(lapTime);
  if (t < fastThreshold) return 'fast';
  if (t > slowThreshold) return 'slow';
  return 'good';
}

// Core race calculations from lap array + session config
export function calcStats(laps, session) {
  if (!session) return {};

  const {
    battery_limit_mah: maxBat,
    race_duration_mins: raceMins,
    max_mah_per_min: maxMahMin,
    total_sticks: totalSticks,
    stick_min_mins: stickMinMins,
    stick_max_mins: stickMaxMins,
    fc_low_amps: fcLowAmps,
    fast_threshold: fastThreshold,
    slow_threshold: slowThreshold,
  } = session;

  const n = laps.length;
  const last = n > 0 ? laps[n - 1] : null;
  const batUsed = last?.battery_cap_mah ? parseFloat(last.battery_cap_mah) : 0;
  const batRem = Math.max(0, maxBat - batUsed);
  const fcCap = last?.fc_cap_mah ? parseFloat(last.fc_cap_mah) : 0;

  const validLaps = laps.filter(
    l => parseFloat(l.lap_time) > 0 && parseFloat(l.lap_time) < 300
  );
  const totalSec = validLaps.reduce((s, l) => s + parseFloat(l.lap_time), 0);
  const avgLap =
    validLaps.length > 0 ? totalSec / validLaps.length : null;
  const totalMins = totalSec / 60;

  const mahPerMin =
    totalMins > 0 && batUsed > 0 ? batUsed / totalMins : null;
  const fcPerMin =
    totalMins > 0 && fcCap > 0 ? fcCap / totalMins : null;

  const batPct = Math.min(100, (batRem / maxBat) * 100);
  const batTimeRem =
    mahPerMin && mahPerMin > 0 ? batRem / mahPerMin : null;
  const estTotalLaps =
    avgLap && batTimeRem
      ? Math.floor(n + (batTimeRem * 60) / avgLap)
      : null;

  // H2 stick advisor
  const sticksUsed = laps.filter(l => l.stick_swap).length;
  const lastSwapIdx = [...laps].reverse().findIndex(l => l.stick_swap);
  const lapsSinceSwap =
    lastSwapIdx >= 0 ? laps.slice(laps.length - lastSwapIdx) : laps;
  const timeSinceSwap =
    lapsSinceSwap.reduce((s, l) => s + (parseFloat(l.lap_time) || 0), 0) / 60;

  const recentFC = laps
    .slice(-3)
    .map(l => parseFloat(l.fc_current_a))
    .filter(v => !isNaN(v) && v > 0);
  const avgRecentFC =
    recentFC.length > 0
      ? recentFC.reduce((s, v) => s + v, 0) / recentFC.length
      : null;

  const timeOverMin = timeSinceSwap >= stickMinMins;
  const timeOverMax = timeSinceSwap >= stickMaxMins;
  const fcLow = avgRecentFC !== null && avgRecentFC <= fcLowAmps;
  const fcWarn = avgRecentFC !== null && avgRecentFC <= fcLowAmps + 0.3;

  let advisorState = 'hold';
  let advisorTitle = 'Hold — stick healthy';
  let advisorDetail = '';

  if (sticksUsed >= totalSticks) {
    advisorState = 'danger';
    advisorTitle = 'No sticks remaining';
    advisorDetail = `All ${totalSticks} sticks used.`;
  } else if (n === 0) {
    advisorState = 'hold';
    advisorTitle = 'Hold — waiting for data';
    advisorDetail = 'Log laps to enable advisor.';
  } else if (timeOverMax || fcLow) {
    advisorState = 'now';
    advisorTitle = 'SWAP STICK NOW';
    const reasons = [];
    if (timeOverMax)
      reasons.push(`${timeSinceSwap.toFixed(1)}min elapsed (max ${stickMaxMins}min)`);
    if (fcLow)
      reasons.push(`FC current ${avgRecentFC?.toFixed(2)}A (below ${fcLowAmps}A trigger)`);
    advisorDetail = reasons.join(' · ');
  } else if (timeOverMin && fcWarn) {
    advisorState = 'soon';
    advisorTitle = 'Swap soon — conditions met';
    advisorDetail = `${timeSinceSwap.toFixed(1)}min elapsed · FC avg ${avgRecentFC?.toFixed(2)}A — watch for drop below ${fcLowAmps}A`;
  } else {
    const remaining = stickMinMins - timeSinceSwap;
    advisorDetail = `Time on stick: ${timeSinceSwap.toFixed(1)}min${remaining > 0 ? ` · ${remaining.toFixed(1)}min until swap window` : ' · swap window open'} · FC avg: ${avgRecentFC ? avgRecentFC.toFixed(2) + 'A' : '—'}`;
  }

  // Pace assessment
  const pace = avgLap ? lapSpeed(avgLap, fastThreshold, slowThreshold) : null;

  // Per-lap mAh delta
  const lapsWithDelta = laps.map((l, i) => {
    const prev = laps[i - 1];
    const delta =
      l.battery_cap_mah && prev?.battery_cap_mah
        ? Math.round(
            parseFloat(l.battery_cap_mah) - parseFloat(prev.battery_cap_mah)
          )
        : null;
    return { ...l, mah_delta: delta };
  });

  return {
    n,
    batUsed,
    batRem,
    batPct,
    fcCap,
    totalSec,
    avgLap,
    mahPerMin,
    fcPerMin,
    batTimeRem,
    estTotalLaps,
    sticksUsed,
    timeSinceSwap,
    avgRecentFC,
    pace,
    advisorState,
    advisorTitle,
    advisorDetail,
    lapsWithDelta,
    raceMins,
    maxBat,
    maxMahMin,
    totalSticks,
  };
}

// ── Per-pack pace guidance ────────────────────────────────────────────────
// Calculates pace guidance based on current pack burn rate vs target pack duration
export function calcPackPaceGuidance({
  packMahUsed,        // mAh used on current pack (JETI reading, resets to 0 on swap)
  packElapsedSecs,    // seconds elapsed since pack was installed
  packCapacityMah,    // capacity of current pack (e.g. 4400 or 5200)
  targetPackMins,     // target minutes per pack (e.g. 80)
  maxMahPerMin,       // hard rulebook mAh/min limit
  totalMahUsed,       // total mAh across all packs
  totalBudgetMah,     // total race mAh budget (e.g. 14800)
}) {
  if (!packMahUsed || !packElapsedSecs || packElapsedSecs < 30) return null;

  const packElapsedMins = packElapsedSecs / 60;
  const currentBurnRate = packMahUsed / packElapsedMins; // mAh/min on this pack

  // How many mAh/min do we need to last exactly targetPackMins?
  const targetBurnRate = packCapacityMah / targetPackMins;

  // How long will this pack last at current rate?
  const projectedPackMins = packCapacityMah / currentBurnRate;

  // Time remaining on this pack at target rate
  const packTimeRemMins = targetPackMins - packElapsedMins;
  const packMahRem = packCapacityMah - packMahUsed;

  // Needed burn rate to use remaining mAh in remaining time
  const neededBurnRate = packTimeRemMins > 0 ? packMahRem / packTimeRemMins : currentBurnRate;

  // Lap time adjustment needed
  const burnRateDiff = neededBurnRate - currentBurnRate;
  const lapAdjustSecs = packElapsedMins > 0
    ? (burnRateDiff / currentBurnRate) * (packElapsedSecs / (packMahUsed / packCapacityMah * targetPackMins || 1))
    : 0;

  // Total budget check
  const totalPctUsed = totalBudgetMah > 0 ? (totalMahUsed / totalBudgetMah) * 100 : 0;
  const overTotalBudget = totalMahUsed > totalBudgetMah;

  // Over hard mAh/min limit
  const overRateLimit = currentBurnRate > maxMahPerMin;

  // Thresholds — within 8% of target = good
  const tooFast = currentBurnRate > neededBurnRate * 1.08;
  const tooSlow = currentBurnRate < neededBurnRate * 0.92;

  let state, title, detail;

  if (overTotalBudget) {
    state = 'slow_down';
    title = '⚠ SLOW DOWN — Over total race budget';
    detail = `Total used: ${Math.round(totalMahUsed)} mAh of ${totalBudgetMah} mAh budget`;
  } else if (overRateLimit) {
    state = 'slow_down';
    title = '⚠ SLOW DOWN — Over mAh/min limit';
    detail = `Burning ${currentBurnRate.toFixed(1)} mAh/min · limit is ${maxMahPerMin} mAh/min · pack projects ${projectedPackMins.toFixed(0)} min`;
  } else if (tooFast) {
    state = 'slow_down';
    title = '↓ SLOW DOWN';
    detail = `Pack projects ${projectedPackMins.toFixed(0)} min at current rate · target ${targetPackMins} min · ease off ~${Math.abs(lapAdjustSecs).toFixed(1)}s per lap`;
  } else if (tooSlow) {
    state = 'speed_up';
    title = '↑ SPEED UP — Under-utilizing pack';
    detail = `Pack projects ${projectedPackMins.toFixed(0)} min · target ${targetPackMins} min · push ~${Math.abs(lapAdjustSecs).toFixed(1)}s faster per lap`;
  } else {
    state = 'good';
    title = '✓ ON TARGET PACE';
    detail = `Pack on track for ${projectedPackMins.toFixed(0)} min · target ${targetPackMins} min · burn rate ${currentBurnRate.toFixed(1)} mAh/min`;
  }

  return {
    state, title, detail,
    currentBurnRate, neededBurnRate, targetBurnRate,
    projectedPackMins, packTimeRemMins, packMahRem,
    totalPctUsed, overTotalBudget, overRateLimit,
    lapAdjustSecs,
  };
}
