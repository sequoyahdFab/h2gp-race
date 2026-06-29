import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import SessionPage from './pages/SessionPage';
import RacePage from './pages/RacePage';
import ReviewPage from './pages/ReviewPage';
import { useRace } from './hooks/useRace';
import { useRaceEvents } from './hooks/useRaceEvents';

// Wrapper that decides live vs review based on race_end_time
function RaceRouter({ initialRole, darkMode, toggleDarkMode }) {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { session, laps, loading, error, addLap, updateLap, startRace, endRace, updateTargetLapTime } = useRace(sessionId);
  const { events, batteryPacks, addPitStop, addBatterySwap } = useRaceEvents(sessionId);

  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF', fontSize: 14, fontFamily: "'Barlow', sans-serif" }}>
      Loading…
    </div>
  );
  if (error) return (
    <div style={{ padding: '2rem', fontFamily: "'Barlow', sans-serif", color: '#DC2626' }}>Error: {error}</div>
  );

  if (session?.race_end_time) {
    return <ReviewPage session={session} laps={laps} events={events} batteryPacks={batteryPacks} onBack={() => navigate('/')} darkMode={darkMode} />;
  }

  return (
    <RacePage
      session={session}
      laps={laps}
      addLap={addLap}
      updateLap={updateLap}
      startRace={startRace}
      endRace={endRace}
      updateTargetLapTime={updateTargetLapTime}
      events={events}
      batteryPacks={batteryPacks}
      addPitStop={addPitStop}
      addBatterySwap={addBatterySwap}
      initialRole={initialRole}
      onBack={() => navigate('/')}
      darkMode={darkMode}
      toggleDarkMode={toggleDarkMode}
    />
  );
}

function AppInner() {
  const [initialRole, setInitialRole] = useState('strategy');
  const [darkMode, setDarkMode] = useState(() =>
    typeof localStorage !== 'undefined' && localStorage.getItem('h2gp-theme') === 'dark'
  );
  const navigate = useNavigate();

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('h2gp-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(d => !d);

  const handleSelect = (id, role = 'strategy') => {
    setInitialRole(role);
    navigate(`/race/${id}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-page)', fontFamily: "'Barlow', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;1,700;1,800&family=Barlow:wght@400;500;600;700&display=swap');

        :root {
          --color-bg-page: #F4F6F9;
          --color-bg-card: #FFFFFF;
          --color-bg-surface: #F9FAFB;
          --color-bg-surface-2: #F3F4F6;
          --color-border: #E5E7EB;
          --color-border-md: #D1D5DB;
          --color-text-primary: #111827;
          --color-text-secondary: #374151;
          --color-text-muted: #6B7280;
          --color-text-subtle: #9CA3AF;
          --color-tab-bg: #FFFFFF;
          --color-tab-border: #E5E7EB;
          --color-success-bg: #ECFDF5;
          --color-success-text: #065F46;
          --color-success-border: #059669;
          --color-success-muted: #A7F3D0;
          --color-warning-bg: #FFFBEB;
          --color-warning-text: #92400E;
          --color-warning-border: #D97706;
          --color-warning-muted: #FCD34D;
          --color-danger-bg: #FEF2F2;
          --color-danger-text: #991B1B;
          --color-danger-border: #DC2626;
          --color-info-bg: #EFF6FF;
          --color-info-text: #1E40AF;
          --color-info-border: #3B82F6;
          --color-badge-fast-bg: #FEF3C7;
          --color-badge-fast-text: #92400E;
          --color-badge-slow-bg: #EFF6FF;
          --color-badge-slow-text: #1E40AF;
          --color-input-bg: #FFFFFF;
          --color-proj-border: #F3F4F6;
        }

        [data-theme="dark"] {
          --color-bg-page: #0d1117;
          --color-bg-card: #1c2333;
          --color-bg-surface: #262f3e;
          --color-bg-surface-2: #1a2233;
          --color-border: #30394a;
          --color-border-md: #4a5568;
          --color-text-primary: #e6edf3;
          --color-text-secondary: #c9d1d9;
          --color-text-muted: #8b949e;
          --color-text-subtle: #6e7681;
          --color-tab-bg: #1c2333;
          --color-tab-border: #30394a;
          --color-success-bg: #064e3b;
          --color-success-text: #6ee7b7;
          --color-success-border: #059669;
          --color-success-muted: #065f46;
          --color-warning-bg: #451a03;
          --color-warning-text: #fcd34d;
          --color-warning-border: #d97706;
          --color-warning-muted: #92400e;
          --color-danger-bg: #450a0a;
          --color-danger-text: #fca5a5;
          --color-danger-border: #dc2626;
          --color-info-bg: #1e3a5f;
          --color-info-text: #93c5fd;
          --color-info-border: #3b82f6;
          --color-badge-fast-bg: #451a03;
          --color-badge-fast-text: #fcd34d;
          --color-badge-slow-bg: #1e3a5f;
          --color-badge-slow-text: #93c5fd;
          --color-input-bg: #1a2035;
          --color-proj-border: #2d3748;
        }

        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { font-family: 'Barlow', sans-serif; background: var(--color-bg-page); color: var(--color-text-primary); -webkit-font-smoothing: antialiased; }
        .app-wrap { animation: fadeIn 0.25s ease; }

        input, select, textarea { border: 1.5px solid var(--color-border-md); border-radius: 7px; padding: 9px 12px; font-size: 15px; font-family: 'Barlow', sans-serif; font-weight: 500; background: var(--color-input-bg); color: var(--color-text-primary); outline: none; transition: border-color 0.15s, box-shadow 0.15s; width: 100%; }
        input:focus { border-color: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,0.12); }
        input::placeholder { color: var(--color-text-subtle); font-weight: 400; }

        .btn { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 15px; letter-spacing: 0.04em; border-radius: 7px; padding: 9px 20px; cursor: pointer; border: none; transition: all 0.15s; text-transform: uppercase; }
        .btn-primary { background: #059669; color: #ffffff; }
        .btn-primary:hover { background: #047857; transform: translateY(-1px); }
        .btn-primary:active { transform: translateY(0); }
        .btn-primary:disabled { background: #A7F3D0; color: #6EE7B7; cursor: not-allowed; transform: none; }
        .btn-ghost { background: var(--color-bg-card); color: var(--color-text-secondary); border: 1.5px solid var(--color-border-md); font-size: 13px; text-transform: none; letter-spacing: 0; }
        .btn-ghost-dark { background: transparent; color: #D1D5DB; border: 1.5px solid #374151; font-size: 13px; text-transform: none; letter-spacing: 0; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; border-radius: 7px; padding: 9px 20px; cursor: pointer; transition: all 0.15s; }
        .btn-ghost-dark:hover { background: #1a1a1a; border-color: #4B5563; color: #FFFFFF; }
        .btn-ghost:hover { background: var(--color-bg-surface); border-color: var(--color-text-subtle); }
        .btn-amber { background: var(--color-bg-card); color: #D97706; border: 1.5px solid #FCD34D; }
        .btn-amber:hover { background: var(--color-warning-bg); }
        .btn-danger { background: #DC2626; color: #ffffff; }
        .btn-danger:hover { background: #B91C1C; transform: translateY(-1px); }

        .card { background: var(--color-bg-card); border: 1.5px solid var(--color-border); border-radius: 10px; padding: 16px; }
        .metric-card { background: var(--color-bg-card); border: 1.5px solid var(--color-border); border-radius: 8px; padding: 11px 14px; }
        .metric-label { font-family: 'Barlow', sans-serif; font-size: 10px; font-weight: 700; color: var(--color-text-subtle); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
        .metric-value { font-family: 'Barlow', sans-serif; font-size: 22px; color: var(--color-text-primary); line-height: 1; font-weight: 500; }
        .metric-unit { font-family: 'Barlow', sans-serif; font-size: 10px; color: var(--color-text-subtle); margin-top: 2px; }
        .metric-highlight .metric-value { color: #059669; }

        .section-label { font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; color: var(--color-text-subtle); text-transform: uppercase; letter-spacing: 0.1em; margin: 16px 0 8px; }

        .tab-bar { display: flex; border-bottom: 2px solid var(--color-tab-border); overflow-x: auto; background: var(--color-tab-bg); padding: 0 16px; }
        .role-tab { padding: 10px 16px; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; border: none; background: none; color: var(--color-text-subtle); border-bottom: 2.5px solid transparent; margin-bottom: -2px; transition: color 0.15s; white-space: nowrap; }
        .role-tab:hover { color: var(--color-text-secondary); }
        .role-tab.active { color: #059669; border-bottom-color: #059669; }

        .alert { padding: 10px 14px; border-radius: 7px; font-size: 13px; font-weight: 600; font-family: 'Barlow', sans-serif; margin-bottom: 8px; border-left: 4px solid; }
        .alert-ok     { background: var(--color-success-bg); color: var(--color-success-text); border-color: var(--color-success-border); }
        .alert-warn   { background: var(--color-warning-bg); color: var(--color-warning-text); border-color: var(--color-warning-border); }
        .alert-danger { background: var(--color-danger-bg); color: var(--color-danger-text); border-color: var(--color-danger-border); animation: pulse 1.5s infinite; }
        .alert-info   { background: var(--color-info-bg); color: var(--color-info-text); border-color: var(--color-info-border); }

        .advisor { border-radius: 8px; padding: 14px 16px; margin-bottom: 14px; border-left: 5px solid; }
        .advisor-hold   { background: var(--color-success-bg); border-color: var(--color-success-border); }
        .advisor-soon   { background: var(--color-warning-bg); border-color: var(--color-warning-border); }
        .advisor-now    { background: var(--color-danger-bg); border-color: var(--color-danger-border); animation: pulse 1.5s infinite; }
        .advisor-danger { background: var(--color-danger-bg); border-color: var(--color-danger-border); }
        .advisor-title  { font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 800; letter-spacing: 0.04em; margin-bottom: 3px; text-transform: uppercase; }
        .advisor-detail { font-family: 'Barlow', sans-serif; font-size: 11px; opacity: 0.8; line-height: 1.5; }
        .advisor-hold .advisor-title   { color: var(--color-success-text); }
        .advisor-soon .advisor-title   { color: var(--color-warning-text); }
        .advisor-now .advisor-title,
        .advisor-danger .advisor-title { color: var(--color-danger-text); }

        .stick { width: 32px; height: 52px; border-radius: 7px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Barlow Condensed', sans-serif; font-size: 10px; font-weight: 700; transition: all 0.2s; border: 2px solid; }
        .stick-used   { background: var(--color-bg-surface-2); border-color: var(--color-border); color: var(--color-border-md); }
        .stick-active { background: var(--color-success-bg); border-color: #059669; color: var(--color-success-text); }
        .stick-avail  { background: var(--color-bg-surface); border-color: var(--color-border-md); color: var(--color-text-subtle); }

        .bar-track { flex: 1; height: 10px; background: var(--color-border); border-radius: 5px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 5px; transition: width 0.5s ease; }

        .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .data-table th { padding: 7px 9px; text-align: left; font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; color: var(--color-text-subtle); text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1.5px solid var(--color-border); background: var(--color-bg-surface); position: sticky; top: 0; }
        .data-table td { padding: 6px 9px; border-bottom: 1px solid var(--color-bg-surface-2); color: var(--color-text-secondary); font-family: 'Barlow', sans-serif; font-size: 11px; }
        .data-table tr:hover td { background: var(--color-bg-surface); }
        .data-table tr.swap-row td { background: var(--color-warning-bg); }

        .badge { font-family: 'Barlow Condensed', sans-serif; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
        .badge-good { background: var(--color-success-bg); color: var(--color-success-text); }
        .badge-fast { background: var(--color-badge-fast-bg); color: var(--color-badge-fast-text); }
        .badge-slow { background: var(--color-badge-slow-bg); color: var(--color-badge-slow-text); }

        .proj-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--color-proj-border); }
        .proj-row:last-child { border-bottom: none; }
        .proj-label { font-family: 'Barlow', sans-serif; font-size: 13px; font-weight: 500; color: var(--color-text-muted); }
        .proj-value { font-family: 'Barlow', sans-serif; font-size: 12px; font-weight: 500; color: var(--color-text-primary); }

        .race-header { background: #000000; border-bottom: 2px solid #1a1a1a; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .race-title { font-family: 'Barlow Condensed', sans-serif; font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: 0.02em; text-transform: uppercase; }
        .race-subtitle { font-family: 'Barlow', sans-serif; font-size: 11px; color: #9CA3AF; margin-top: 2px; }

        .session-hero { background: #000000; border-bottom: 2px solid #1a1a1a; padding: 32px 24px 28px; text-align: center; }
        .session-tagline { font-family: 'Barlow', sans-serif; font-size: 11px; color: #9CA3AF; margin-top: 8px; letter-spacing: 0.06em; }

        .session-item { background: var(--color-bg-card); border: 1.5px solid var(--color-border); border-radius: 10px; padding: 14px 16px; margin-bottom: 8px; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s; display: flex; justify-content: space-between; align-items: center; }
        .session-item:hover { border-color: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,0.08); }
        .session-item-complete { border-left: 4px solid #059669; }
        .session-item-active { border-left: 4px solid #DC2626; }
        .session-item-new { border-left: 4px solid var(--color-border-md); }
        .session-name { font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: 700; color: var(--color-text-primary); letter-spacing: 0.02em; text-transform: uppercase; }
        .session-meta { font-family: 'Barlow', sans-serif; font-size: 11px; color: var(--color-text-subtle); margin-top: 3px; }

        .field-label { font-family: 'Barlow', sans-serif; font-size: 12px; font-weight: 600; color: var(--color-text-secondary); display: block; margin-bottom: 5px; }
        .role-header { margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1.5px solid var(--color-border); }
        .role-name { font-family: 'Barlow Condensed', sans-serif; font-size: 26px; font-weight: 800; color: var(--color-text-primary); letter-spacing: 0.03em; text-transform: uppercase; }
        .role-desc { font-family: 'Barlow', sans-serif; font-size: 13px; color: var(--color-text-muted); margin-top: 3px; }

        .big-timer { font-family: 'Barlow', sans-serif; font-size: 40px; font-weight: 500; color: #059669; letter-spacing: 0.02em; line-height: 1; }
        .timer-rem { font-family: 'Barlow', sans-serif; font-size: 13px; color: var(--color-text-subtle); margin-top: 4px; }
      `}</style>
      <div className="app-wrap">
        <Routes>
          <Route path="/" element={<SessionPage onSelect={handleSelect} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
          <Route path="/race/:sessionId" element={<RaceRouter initialRole={initialRole} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
