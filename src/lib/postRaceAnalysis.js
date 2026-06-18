// ── Post-race rule-based flag detection ────────────────────────────────────
// Pure functions, no API calls. Operates on the same laps/session/events/
// batteryPacks shape already loaded by ReviewPage. Each flag is deterministic
// and explainable — these feed both the on-page flag list and, summarized,
// the AI narrative prompt in postRaceSummary.js.

import { reasonMeta } from './constants';

const SUSTAINED_OVERAGE_MIN_LAPS = 8; // consecutive laps over target to flag, not just a blip

// ── Flag: sustained mAh/min overage ────────────────────────────────────────
// Looks for runs of consecutive laps where per-lap mAh delta, converted to a
// rate, exceeds session.max_mah_per_min — not a single noisy lap, a sustained
// stretch, since a single overshoot can be a fluke read or stick-swap edge case.
function flagSustainedOverage(laps, session) {
  const maxRate = session?.max_mah_per_min;
  if (!maxRate) return null;

  // Build per-lap mAh/min rate from consecutive battery_cap_mah deltas / lap_time
  const rates = [];
  for (let i = 1; i < laps.length; i++) {
    const prev = laps[i - 1], cur = laps[i];
    const delta = parseFloat(cur.battery_cap_mah) - parseFloat(prev.battery_cap_mah);
    const lapSecs = parseFloat(cur.lap_time);
    if (isNaN(delta) || isNaN(lapSecs) || lapSecs <= 0) { rates.push(null); continue; }
    rates.push({ lapNumber: cur.lap_number, rate: (delta / lapSecs) * 60 });
  }

  // Find the longest consecutive run over maxRate
  let longestRun = [];
  let currentRun = [];
  for (const r of rates) {
    if (r && r.rate > maxRate) {
      currentRun.push(r);
    } else {
      if (currentRun.length > longestRun.length) longestRun = currentRun;
      currentRun = [];
    }
  }
  if (currentRun.length > longestRun.length) longestRun = currentRun;

  if (longestRun.length < SUSTAINED_OVERAGE_MIN_LAPS) return null;

  const avgRate = longestRun.reduce((s, r) => s + r.rate, 0) / longestRun.length;
  const startLap = longestRun[0].lapNumber;
  const endLap = longestRun[longestRun.length - 1].lapNumber;

  return {
    id: 'sustained_overage',
    severity: 'warn',
    title: `Sustained mAh/min overage — laps ${startLap}–${endLap}`,
    detail: `${longestRun.length} consecutive laps averaged ${avgRate.toFixed(1)} mAh/min, above the ${maxRate} mAh/min limit. This stretch alone likely cost meaningful race-budget margin.`,
  };
}

// ── Flag: stick swap timing outside target window ──────────────────────────
// Compares each swap's time-on-stick against session.stick_min_mins /
// stick_max_mins. Early swaps waste stick life; late swaps risk an FC dropout
// before the swap actually happens.
function flagStickSwapTiming(laps, session) {
  const minMins = session?.stick_min_mins;
  const maxMins = session?.stick_max_mins;
  if (!minMins || !maxMins) return null;

  const swapLaps = laps.filter(l => l.stick_swap);
  if (swapLaps.length === 0) return null;

  const issues = [];
  let prevIdx = 0;
  swapLaps.forEach((swap, i) => {
    const swapIdx = laps.findIndex(l => l.id === swap.id);
    const stint = laps.slice(prevIdx, swapIdx + 1);
    const stintMins = stint.reduce((s, l) => s + (parseFloat(l.lap_time) || 0), 0) / 60;
    if (stintMins < minMins) {
      issues.push(`Stick ${i + 1} swapped early at ${stintMins.toFixed(1)}min (target min ${minMins}min) — left life on the stick`);
    } else if (stintMins > maxMins) {
      issues.push(`Stick ${i + 1} ran long at ${stintMins.toFixed(1)}min (target max ${maxMins}min) — risked FC dropout`);
    }
    prevIdx = swapIdx + 1;
  });

  if (issues.length === 0) return null;

  return {
    id: 'stick_swap_timing',
    severity: 'info',
    title: `${issues.length} stick swap${issues.length > 1 ? 's' : ''} outside target window`,
    detail: issues.join(' · '),
  };
}

// ── Flag: lap-time consistency ─────────────────────────────────────────────
// Flags high variance in lap times, and separately checks whether slow laps
// cluster right after pit stops or stick swaps (a likely cause, worth calling
// out explicitly rather than leaving as an unexplained outlier).
function flagLapConsistency(laps, session, pitStops) {
  const validLaps = laps.filter(l => parseFloat(l.lap_time) > 0 && parseFloat(l.lap_time) < 300);
  if (validLaps.length < 10) return null;

  const times = validLaps.map(l => parseFloat(l.lap_time));
  const mean = times.reduce((s, t) => s + t, 0) / times.length;
  const variance = times.reduce((s, t) => s + (t - mean) ** 2, 0) / times.length;
  const stdDev = Math.sqrt(variance);
  const coefVar = stdDev / mean; // normalized — comparable across different target lap times

  const HIGH_VARIANCE_THRESHOLD = 0.12; // ~12% coefficient of variation
  if (coefVar < HIGH_VARIANCE_THRESHOLD) return null;

  // Check if slow laps cluster right after pit stops
  const pitLapNums = new Set((pitStops || []).map(p => p.lap_number));
  const slowThreshold = session?.slow_threshold || mean * 1.15;
  let slowAfterPit = 0, slowTotal = 0;
  validLaps.forEach(l => {
    if (parseFloat(l.lap_time) > slowThreshold) {
      slowTotal++;
      if (pitLapNums.has(l.lap_number - 1) || pitLapNums.has(l.lap_number)) slowAfterPit++;
    }
  });

  const clusterNote = slowTotal > 0 && slowAfterPit / slowTotal > 0.5
    ? ` ${slowAfterPit} of ${slowTotal} slow laps came right after a pit stop — re-entry pace may need attention.`
    : '';

  return {
    id: 'lap_consistency',
    severity: 'info',
    title: 'Inconsistent lap pace',
    detail: `Lap times varied ${(coefVar * 100).toFixed(0)}% around the ${mean.toFixed(1)}s average (std dev ${stdDev.toFixed(1)}s).${clusterNote}`,
  };
}

// ── Flag: pit stop reason patterns ─────────────────────────────────────────
// Groups pit stops by category (from constants.js reasonMeta) and flags any
// category with 2+ occurrences as a likely systemic issue, not a one-off.
function flagPitStopPatterns(pitStops) {
  if (!pitStops || pitStops.length === 0) return null;

  const byCategory = {};
  pitStops.forEach(p => {
    const cat = reasonMeta(p.reason).category;
    byCategory[cat] = byCategory[cat] || [];
    byCategory[cat].push(p);
  });

  const repeated = Object.entries(byCategory).filter(([, stops]) => stops.length >= 2);
  if (repeated.length === 0) return null;

  const detail = repeated
    .map(([cat, stops]) => `${cat} (${stops.length}x — laps ${stops.map(s => s.lap_number).join(', ')})`)
    .join(' · ');

  return {
    id: 'pit_stop_patterns',
    severity: repeated.some(([, s]) => s.length >= 3) ? 'warn' : 'info',
    title: `Repeated pit stop category: ${repeated.map(([c]) => c).join(', ')}`,
    detail: `${detail}. Worth investigating as a recurring issue rather than isolated incidents.`,
  };
}

// ── Main entry point ───────────────────────────────────────────────────────
// Returns an array of flag objects: { id, severity: 'warn'|'info', title, detail }
// Returns [] if nothing notable was found (not an error state — a clean race
// should produce few or no flags).
export function getPostRaceFlags(laps, session, pitStops = [], batteryPacks = []) {
  const flags = [
    flagSustainedOverage(laps, session),
    flagStickSwapTiming(laps, session),
    flagLapConsistency(laps, session, pitStops),
    flagPitStopPatterns(pitStops),
  ].filter(Boolean);

  return flags;
}
