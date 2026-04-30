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
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;1,700;1,800&family=Barlow:wght@400;500;600;700&display=swap');

        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Barlow', sans-serif;
          background: #F4F6F9;
          color: #111827;
          -webkit-font-smoothing: antialiased;
        }

        h1, h2, h3, .heading {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        .app-wrap { animation: fadeIn 0.25s ease; }

        /* ── Inputs ─────────────────────────────────────────────── */
        input, select, textarea {
          border: 1.5px solid #D1D5DB;
          border-radius: 7px;
          padding: 9px 12px;
          font-size: 15px;
          font-family: 'Barlow', sans-serif;
          font-weight: 500;
          background: #FFFFFF;
          color: #111827;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          width: 100%;
        }
        input:focus {
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5,150,105,0.12);
        }
        input::placeholder { color: #9CA3AF; font-weight: 400; }

        /* ── Buttons ────────────────────────────────────────────── */
        .btn {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.04em;
          border-radius: 7px;
          padding: 9px 20px;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
          text-transform: uppercase;
        }
        .btn-primary { background: #059669; color: #ffffff; }
        .btn-primary:hover { background: #047857; transform: translateY(-1px); }
        .btn-primary:active { transform: translateY(0); }
        .btn-primary:disabled { background: #A7F3D0; color: #6EE7B7; cursor: not-allowed; transform: none; }
        .btn-ghost { background: #ffffff; color: #374151; border: 1.5px solid #D1D5DB; font-size: 13px; }
        .btn-ghost:hover { background: #F9FAFB; border-color: #9CA3AF; }
        .btn-amber { background: #ffffff; color: #D97706; border: 1.5px solid #FCD34D; }
        .btn-amber:hover { background: #FFFBEB; }
        .btn-danger { background: #DC2626; color: #ffffff; }
        .btn-danger:hover { background: #B91C1C; transform: translateY(-1px); }

        /* ── Cards ──────────────────────────────────────────────── */
        .card { background: #FFFFFF; border: 1.5px solid #E5E7EB; border-radius: 10px; padding: 16px; }

        /* ── Metric cards ───────────────────────────────────────── */
        .metric-card { background: #FFFFFF; border: 1.5px solid #E5E7EB; border-radius: 8px; padding: 11px 14px; }
        .metric-label { font-family: 'Barlow', sans-serif; font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
        .metric-value { font-family: 'DM Mono', monospace; font-size: 22px; color: #111827; line-height: 1; font-weight: 500; }
        .metric-unit { font-family: 'Barlow', sans-serif; font-size: 10px; color: #9CA3AF; margin-top: 2px; }
        .metric-highlight .metric-value { color: #059669; }

        /* ── Section labels ─────────────────────────────────────── */
        .section-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 12px; font-weight: 700;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 16px 0 8px;
        }

        /* ── Role tabs ──────────────────────────────────────────── */
        .tab-bar { display: flex; border-bottom: 2px solid #E5E7EB; overflow-x: auto; background: #FFFFFF; padding: 0 16px; }
        .role-tab {
          padding: 10px 16px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 14px; font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer; border: none; background: none;
          color: #9CA3AF;
          border-bottom: 2.5px solid transparent;
          margin-bottom: -2px;
          transition: color 0.15s;
          white-space: nowrap;
        }
        .role-tab:hover { color: #374151; }
        .role-tab.active { color: #059669; border-bottom-color: #059669; }

        /* ── Alerts ─────────────────────────────────────────────── */
        .alert { padding: 10px 14px; border-radius: 7px; font-size: 13px; font-weight: 600; font-family: 'Barlow', sans-serif; margin-bottom: 8px; border-left: 4px solid; }
        .alert-ok     { background: #ECFDF5; color: #065F46; border-color: #059669; }
        .alert-warn   { background: #FFFBEB; color: #92400E; border-color: #D97706; }
        .alert-danger { background: #FEF2F2; color: #991B1B; border-color: #DC2626; animation: pulse 1.5s infinite; }
        .alert-info   { background: #EFF6FF; color: #1E40AF; border-color: #3B82F6; }

        /* ── Stick advisor ──────────────────────────────────────── */
        .advisor { border-radius: 8px; padding: 14px 16px; margin-bottom: 14px; border-left: 5px solid; }
        .advisor-hold   { background: #ECFDF5; border-color: #059669; }
        .advisor-soon   { background: #FFFBEB; border-color: #D97706; }
        .advisor-now    { background: #FEF2F2; border-color: #DC2626; animation: pulse 1.5s infinite; }
        .advisor-danger { background: #FEF2F2; border-color: #DC2626; }
        .advisor-title  { font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 800; letter-spacing: 0.04em; margin-bottom: 3px; text-transform: uppercase; }
        .advisor-detail { font-family: 'DM Mono', monospace; font-size: 11px; opacity: 0.8; line-height: 1.5; }
        .advisor-hold .advisor-title   { color: #065F46; }
        .advisor-soon .advisor-title   { color: #92400E; }
        .advisor-now .advisor-title,
        .advisor-danger .advisor-title { color: #991B1B; }

        /* ── H2 sticks ──────────────────────────────────────────── */
        .stick { width: 32px; height: 52px; border-radius: 7px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Barlow Condensed', sans-serif; font-size: 10px; font-weight: 700; transition: all 0.2s; border: 2px solid; }
        .stick-used   { background: #F3F4F6; border-color: #E5E7EB; color: #D1D5DB; }
        .stick-active { background: #ECFDF5; border-color: #059669; color: #065F46; }
        .stick-avail  { background: #F9FAFB; border-color: #D1D5DB; color: #9CA3AF; }

        /* ── Resource bars ──────────────────────────────────────── */
        .bar-track { flex: 1; height: 10px; background: #E5E7EB; border-radius: 5px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 5px; transition: width 0.5s ease; }
        .bar-label { font-family: 'Barlow', sans-serif; font-size: 12px; font-weight: 600; color: #6B7280; width: 82px; flex-shrink: 0; }
        .bar-value { font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500; color: #374151; width: 52px; text-align: right; }

        /* ── Data table ─────────────────────────────────────────── */
        .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .data-table th { padding: 7px 9px; text-align: left; font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1.5px solid #E5E7EB; background: #F9FAFB; position: sticky; top: 0; }
        .data-table td { padding: 6px 9px; border-bottom: 1px solid #F3F4F6; color: #374151; font-family: 'DM Mono', monospace; font-size: 11px; }
        .data-table tr:hover td { background: #F9FAFB; }
        .data-table tr.swap-row td { background: #ECFDF5; }

        /* ── Speed badges ───────────────────────────────────────── */
        .badge { font-family: 'Barlow Condensed', sans-serif; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
        .badge-good { background: #ECFDF5; color: #065F46; }
        .badge-fast { background: #FEF3C7; color: #92400E; }
        .badge-slow { background: #EFF6FF; color: #1E40AF; }

        /* ── Projection rows ────────────────────────────────────── */
        .proj-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #F3F4F6; }
        .proj-row:last-child { border-bottom: none; }
        .proj-label { font-family: 'Barlow', sans-serif; font-size: 13px; font-weight: 500; color: #6B7280; }
        .proj-value { font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500; color: #111827; }

        /* ── Race header ────────────────────────────────────────── */
        .race-header { background: #FFFFFF; border-bottom: 2px solid #E5E7EB; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .race-title { font-family: 'Barlow Condensed', sans-serif; font-size: 20px; font-weight: 800; color: #111827; letter-spacing: 0.02em; text-transform: uppercase; }
        .race-subtitle { font-family: 'DM Mono', monospace; font-size: 11px; color: #9CA3AF; margin-top: 2px; }

        /* ── Session page ───────────────────────────────────────── */
        .session-hero { background: #111827; border-bottom: 2px solid #E5E7EB; padding: 32px 24px 28px; text-align: center; }
        .session-tagline { font-family: 'DM Mono', monospace; font-size: 11px; color: #6B7280; margin-top: 8px; letter-spacing: 0.06em; }
        .session-item { background: #FFFFFF; border: 1.5px solid #E5E7EB; border-radius: 8px; padding: 13px 16px; margin-bottom: 8px; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s; display: flex; justify-content: space-between; align-items: center; }
        .session-item:hover { border-color: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,0.08); }
        .session-name { font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: 700; color: #111827; letter-spacing: 0.02em; text-transform: uppercase; }
        .session-meta { font-family: 'DM Mono', monospace; font-size: 11px; color: #9CA3AF; margin-top: 3px; }

        /* ── Form fields ────────────────────────────────────────── */
        .field-label { font-family: 'Barlow', sans-serif; font-size: 12px; font-weight: 600; color: #374151; display: block; margin-bottom: 5px; }

        /* ── Role view header ───────────────────────────────────── */
        .role-header { margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1.5px solid #E5E7EB; }
        .role-name { font-family: 'Barlow Condensed', sans-serif; font-size: 26px; font-weight: 800; color: #111827; letter-spacing: 0.03em; text-transform: uppercase; }
        .role-desc { font-family: 'Barlow', sans-serif; font-size: 13px; color: #6B7280; margin-top: 3px; }

        /* ── Race timer ─────────────────────────────────────────── */
        .big-timer { font-family: 'DM Mono', monospace; font-size: 40px; font-weight: 500; color: #059669; letter-spacing: 0.02em; line-height: 1; }
        .timer-rem { font-family: 'DM Mono', monospace; font-size: 13px; color: #9CA3AF; margin-top: 4px; }
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
