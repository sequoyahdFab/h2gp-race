import React, { useState } from 'react';
import SessionPage from './pages/SessionPage';
import RacePage from './pages/RacePage';

export default function App() {
  const [view, setView] = useState('sessions');
  const [sessionId, setSessionId] = useState(null);
  const [initialRole, setInitialRole] = useState('strategy');

  const handleSelect = (id, role = 'strategy') => {
    setSessionId(id);
    setInitialRole(role);
    setView('race');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');

        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', sans-serif;
          background: #F4F6F9;
          color: #111827;
          -webkit-font-smoothing: antialiased;
        }

        .app-wrap { animation: fadeIn 0.25s ease; }

        input, select, textarea {
          border: 1.5px solid #D1D5DB;
          border-radius: 7px;
          padding: 9px 12px;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          background: #FFFFFF;
          color: #111827;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          width: 100%;
        }
        input:focus {
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
        }
        input::placeholder { color: #9CA3AF; }

        /* Buttons */
        .btn { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px; border-radius: 7px; padding: 10px 20px; cursor: pointer; border: none; transition: all 0.15s; }
        .btn-primary { background: #059669; color: #ffffff; }
        .btn-primary:hover { background: #047857; }
        .btn-primary:disabled { background: #A7F3D0; color: #6EE7B7; cursor: not-allowed; }
        .btn-ghost { background: #ffffff; color: #374151; border: 1.5px solid #D1D5DB; }
        .btn-ghost:hover { background: #F9FAFB; border-color: #9CA3AF; }
        .btn-amber { background: #ffffff; color: #D97706; border: 1.5px solid #FCD34D; }
        .btn-amber:hover { background: #FFFBEB; }

        /* Cards */
        .card { background: #FFFFFF; border: 1.5px solid #E5E7EB; border-radius: 10px; padding: 16px; }

        /* Metric cards */
        .metric-card { background: #FFFFFF; border: 1.5px solid #E5E7EB; border-radius: 8px; padding: 11px 14px; }
        .metric-label { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
        .metric-value { font-family: 'DM Mono', monospace; font-size: 22px; color: #111827; line-height: 1; font-weight: 500; }
        .metric-unit { font-size: 10px; color: #9CA3AF; margin-top: 2px; }
        .metric-highlight .metric-value { color: #059669; }

        /* Section labels */
        .section-label { font-size: 11px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.08em; margin: 16px 0 8px; }

        /* Tabs */
        .tab-bar { display: flex; border-bottom: 2px solid #E5E7EB; overflow-x: auto; background: #FFFFFF; padding: 0 16px; }
        .role-tab { padding: 10px 16px; font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; border: none; background: none; color: #6B7280; border-bottom: 2.5px solid transparent; margin-bottom: -2px; transition: color 0.15s; white-space: nowrap; }
        .role-tab:hover { color: #374151; }
        .role-tab.active { color: #059669; border-bottom-color: #059669; }

        /* Alerts */
        .alert { padding: 10px 14px; border-radius: 7px; font-size: 13px; font-weight: 500; margin-bottom: 8px; border-left: 4px solid; }
        .alert-ok     { background: #ECFDF5; color: #065F46; border-color: #059669; }
        .alert-warn   { background: #FFFBEB; color: #92400E; border-color: #D97706; }
        .alert-danger { background: #FEF2F2; color: #991B1B; border-color: #DC2626; animation: pulse 1.5s infinite; }
        .alert-info   { background: #EFF6FF; color: #1E40AF; border-color: #3B82F6; }

        /* Advisor */
        .advisor { border-radius: 8px; padding: 14px 16px; margin-bottom: 14px; border-left: 5px solid; }
        .advisor-hold   { background: #ECFDF5; border-color: #059669; }
        .advisor-soon   { background: #FFFBEB; border-color: #D97706; }
        .advisor-now    { background: #FEF2F2; border-color: #DC2626; animation: pulse 1.5s infinite; }
        .advisor-danger { background: #FEF2F2; border-color: #DC2626; }
        .advisor-title  { font-size: 16px; font-weight: 700; margin-bottom: 3px; }
        .advisor-detail { font-size: 12px; opacity: 0.8; line-height: 1.5; font-family: 'DM Mono', monospace; }
        .advisor-hold .advisor-title   { color: #065F46; }
        .advisor-soon .advisor-title   { color: #92400E; }
        .advisor-now .advisor-title,
        .advisor-danger .advisor-title { color: #991B1B; }

        /* Sticks */
        .stick { width: 32px; height: 52px; border-radius: 7px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; transition: all 0.2s; border: 2px solid; }
        .stick-used   { background: #F3F4F6; border-color: #E5E7EB; color: #D1D5DB; }
        .stick-active { background: #ECFDF5; border-color: #059669; color: #065F46; }
        .stick-avail  { background: #F9FAFB; border-color: #D1D5DB; color: #9CA3AF; }

        /* Bar */
        .bar-track { flex: 1; height: 10px; background: #E5E7EB; border-radius: 5px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 5px; transition: width 0.5s ease; }

        /* Table */
        .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .data-table th { padding: 7px 9px; text-align: left; font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em; border-bottom: 1.5px solid #E5E7EB; background: #F9FAFB; position: sticky; top: 0; }
        .data-table td { padding: 6px 9px; border-bottom: 1px solid #F3F4F6; color: #374151; font-family: 'DM Mono', monospace; font-size: 11px; }
        .data-table tr:hover td { background: #F9FAFB; }
        .data-table tr.swap-row td { background: #ECFDF5; }

        /* Badges */
        .badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; }
        .badge-good { background: #ECFDF5; color: #065F46; }
        .badge-fast { background: #FEF3C7; color: #92400E; }
        .badge-slow { background: #EFF6FF; color: #1E40AF; }

        /* Proj rows */
        .proj-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px; }
        .proj-row:last-child { border-bottom: none; }
        .proj-label { color: #6B7280; }
        .proj-value { font-family: 'DM Mono', monospace; color: #111827; font-size: 12px; font-weight: 500; }

        /* Header */
        .race-header { background: #FFFFFF; border-bottom: 2px solid #E5E7EB; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .race-title { font-size: 17px; font-weight: 700; color: #111827; }
        .race-subtitle { font-size: 11px; color: #9CA3AF; font-family: 'DM Mono', monospace; margin-top: 2px; }

        /* Session page */
        .session-hero { background: #FFFFFF; border-bottom: 2px solid #E5E7EB; padding: 36px 24px 28px; text-align: center; }
        .session-logo { font-size: 44px; font-weight: 700; color: #059669; letter-spacing: -0.02em; line-height: 1; }
        .session-tagline { font-size: 12px; color: #9CA3AF; margin-top: 6px; font-family: 'DM Mono', monospace; }
        .session-item { background: #FFFFFF; border: 1.5px solid #E5E7EB; border-radius: 8px; padding: 13px 16px; margin-bottom: 8px; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s; display: flex; justify-content: space-between; align-items: center; }
        .session-item:hover { border-color: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,0.08); }
        .session-name { font-size: 14px; font-weight: 600; color: #111827; }
        .session-meta { font-size: 11px; color: #9CA3AF; font-family: 'DM Mono', monospace; margin-top: 3px; }

        .field-label { font-size: 12px; font-weight: 600; color: #374151; display: block; margin-bottom: 5px; }
        .role-header { margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1.5px solid #E5E7EB; }
        .role-name { font-size: 22px; font-weight: 700; color: #111827; }
        .role-desc { font-size: 13px; color: #6B7280; margin-top: 3px; }
        .big-timer { font-family: 'DM Mono', monospace; font-size: 38px; font-weight: 500; color: #059669; letter-spacing: 0.02em; line-height: 1; }
        .timer-rem { font-size: 13px; color: #9CA3AF; font-family: 'DM Mono', monospace; margin-top: 4px; }
      `}</style>
      <div className="app-wrap">
        {view === 'sessions' && <SessionPage onSelect={handleSelect} />}
        {view === 'race' && sessionId && (
          <RacePage sessionId={sessionId} initialRole={initialRole} onBack={() => setView('sessions')} />
        )}
      </div>
    </div>
  );
}
