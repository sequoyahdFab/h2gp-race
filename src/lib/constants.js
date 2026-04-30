// Pit stop reasons grouped by category with colors
export const PIT_REASONS = [
  { category: 'Electronics', color: '#3B82F6', bg: '#EFF6FF', reasons: [
    'Comms Issue', 'Controller Disconnect', 'Telemetry Disconnect', 'Receiver Disconnect'
  ]},
  { category: 'Mechanical', color: '#65A30D', bg: '#F7FEE7', reasons: [
    'Differential', 'Motor Issues', 'Rear Tire', 'Spur Gear Stripped'
  ]},
  { category: 'Physical Damage', color: '#DC2626', bg: '#FEF2F2', reasons: [
    'Fan Broken', 'Stripped Nut/Bolt', 'Tire Broken', 'Tire Fell Off'
  ]},
  { category: 'Hydrogen / Body', color: '#9333EA', bg: '#FAF5FF', reasons: [
    'Hydrostik Fall Out', 'Shell Rubbing', 'Shell Lift'
  ]},
  { category: 'Electrical', color: '#D97706', bg: '#FFFBEB', reasons: [
    'Solder Snap', 'Wire Snap'
  ]},
];

export const ALL_PIT_REASONS = PIT_REASONS.flatMap(g => g.reasons);

export function reasonMeta(reason) {
  for (const g of PIT_REASONS) {
    if (g.reasons.includes(reason)) return { color: g.color, bg: g.bg, category: g.category };
  }
  return { color: '#6B7280', bg: '#F9FAFB', category: 'Other' };
}

// Pace guidance logic — mirrors your spreadsheet Battery Pace calculation
// Returns: 'speed_up' | 'good' | 'slow_down' | null
export function calcPaceGuidance(batUsed, batRemaining, mahPerMin, maxMahPerMin, raceTimeRemSecs, avgLapSecs) {
  if (!batRemaining || !raceTimeRemSecs || raceTimeRemSecs <= 0 || !avgLapSecs) return null;

  const raceTimeRemMins = raceTimeRemSecs / 60;

  // How much mAh per minute do we NEED to exactly finish at 0 battery?
  const neededMahPerMin = batRemaining / raceTimeRemMins;

  // Current burn rate vs needed
  const currentRate = mahPerMin || 0;

  // Margins: within 10% of needed = good
  const tooFast = currentRate > neededMahPerMin * 1.10; // burning too fast → slow down
  const tooSlow = currentRate < neededMahPerMin * 0.90; // burning too slow → speed up (underutilizing)
  const overLimit = currentRate > maxMahPerMin;

  // Target lap time adjustment
  // If we need to slow down, how many seconds to add per lap?
  const lapAdjustSecs = avgLapSecs
    ? ((neededMahPerMin - currentRate) / neededMahPerMin) * avgLapSecs * -1
    : 0;

  if (overLimit || tooFast) return { state: 'slow_down', neededMahPerMin, currentRate, lapAdjustSecs, overLimit };
  if (tooSlow) return { state: 'speed_up', neededMahPerMin, currentRate, lapAdjustSecs, overLimit: false };
  return { state: 'good', neededMahPerMin, currentRate, lapAdjustSecs: 0, overLimit: false };
}
