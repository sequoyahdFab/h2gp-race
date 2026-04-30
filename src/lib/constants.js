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

// ── Race presets ─────────────────────────────────────────────────────────
export const RACE_PRESETS = {
  regional: {
    label: 'Regionals',
    subtitle: '2 hour · 30Wh · 10 H2 sticks',
    color: '#3B82F6',
    bg: '#EFF6FF',
    config: {
      race_duration_mins: 120,
      battery_limit_mah: 8108,
      total_sticks: 10,
      max_mah_per_min: 26.13,
      target_pack_mins: 60,
      num_battery_packs: 2,
      target_lap_time: 20,
      fast_threshold: 18,
      slow_threshold: 23,
      stick_min_mins: 12,
      stick_max_mins: 16,
      fc_low_amps: 1.0,
    },
    packs: [
      { name: 'Pack A', capacity: 4100, cells: '2100 + 2000 mAh' },
      { name: 'Pack B', capacity: 4000, cells: '2000 + 2000 mAh' },
    ],
  },
  states: {
    label: 'States',
    subtitle: '4 hour · 55Wh · 18 H2 sticks',
    color: '#059669',
    bg: '#ECFDF5',
    config: {
      race_duration_mins: 240,
      battery_limit_mah: 14865,
      total_sticks: 18,
      max_mah_per_min: 26.13,
      target_pack_mins: 80,
      num_battery_packs: 3,
      target_lap_time: 20,
      fast_threshold: 18,
      slow_threshold: 23,
      stick_min_mins: 12,
      stick_max_mins: 16,
      fc_low_amps: 1.0,
    },
    packs: [
      { name: 'Pack A', capacity: 4400, cells: '2200 + 2200 mAh' },
      { name: 'Pack B', capacity: 5200, cells: '2600 + 2600 mAh' },
      { name: 'Pack C', capacity: 5200, cells: '2600 + 2600 mAh' },
    ],
  },
  worlds_4hr: {
    label: 'Worlds (4hr)',
    subtitle: '4 hour · 55Wh · 18 H2 sticks',
    color: '#D97706',
    bg: '#FFFBEB',
    config: {
      race_duration_mins: 240,
      battery_limit_mah: 14865,
      total_sticks: 18,
      max_mah_per_min: 26.13,
      target_pack_mins: 80,
      num_battery_packs: 3,
      target_lap_time: 20,
      fast_threshold: 18,
      slow_threshold: 23,
      stick_min_mins: 12,
      stick_max_mins: 16,
      fc_low_amps: 1.0,
    },
    packs: [
      { name: 'Pack A', capacity: 4400, cells: '2200 + 2200 mAh' },
      { name: 'Pack B', capacity: 5200, cells: '2600 + 2600 mAh' },
      { name: 'Pack C', capacity: 5200, cells: '2600 + 2600 mAh' },
    ],
  },
  practice: {
    label: 'Practice',
    subtitle: 'Open format · no limits',
    color: '#6B7280',
    bg: '#F9FAFB',
    config: {
      race_duration_mins: 60,
      battery_limit_mah: 99999,
      total_sticks: 6,
      max_mah_per_min: 99,
      target_lap_time: 20,
      fast_threshold: 18,
      slow_threshold: 23,
      stick_min_mins: 12,
      stick_max_mins: 16,
      fc_low_amps: 1.0,
      target_pack_mins: 60,
      num_battery_packs: 1,
    },
    packs: [],
    isPractice: true,
  },
  worlds_6hr: {
    label: 'Worlds (6hr)',
    subtitle: '6 hour · 82.5Wh · 22 H2 sticks',
    color: '#9333EA',
    bg: '#FAF5FF',
    config: {
      race_duration_mins: 360,
      battery_limit_mah: 22297,
      total_sticks: 22,
      max_mah_per_min: 26.13,
      target_pack_mins: 72,
      num_battery_packs: 5,
      target_lap_time: 20,
      fast_threshold: 18,
      slow_threshold: 23,
      stick_min_mins: 12,
      stick_max_mins: 16,
      fc_low_amps: 1.0,
    },
    packs: [
      { name: 'Pack A', capacity: 4200, cells: '2100 + 2100 mAh' },
      { name: 'Pack B', capacity: 4200, cells: '2100 + 2100 mAh' },
      { name: 'Pack C', capacity: 4200, cells: '2100 + 2100 mAh' },
      { name: 'Pack D', capacity: 4900, cells: '2100 + 2800 mAh' },
      { name: 'Pack E', capacity: 4700, cells: '2100 + 2600 mAh' },
    ],
  },
};
