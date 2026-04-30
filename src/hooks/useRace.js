import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useRace(sessionId) {
  const [session, setSession] = useState(null);
  const [laps, setLaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!sessionId) return;
    try {
      const [{ data: sess, error: sessErr }, { data: lapData, error: lapErr }] =
        await Promise.all([
          supabase.from('sessions').select('*').eq('id', sessionId).single(),
          supabase.from('laps').select('*').eq('session_id', sessionId).order('lap_number', { ascending: true }),
        ]);
      if (sessErr) throw sessErr;
      if (lapErr) throw lapErr;
      setSession(sess);
      setLaps(lapData || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!sessionId) return;

    const lapChannel = supabase
      .channel(`laps-${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'laps', filter: `session_id=eq.${sessionId}` },
        payload => {
          if (payload.eventType === 'INSERT') {
            setLaps(prev => {
              const exists = prev.find(l => l.id === payload.new.id);
              if (exists) return prev;
              return [...prev, payload.new].sort((a, b) => a.lap_number - b.lap_number);
            });
          } else if (payload.eventType === 'UPDATE') {
            setLaps(prev => prev.map(l => l.id === payload.new.id ? payload.new : l));
          }
        }
      ).subscribe();

    const sessChannel = supabase
      .channel(`session-${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        payload => setSession(payload.new)
      ).subscribe();

    return () => {
      supabase.removeChannel(lapChannel);
      supabase.removeChannel(sessChannel);
    };
  }, [sessionId]);

  const addLap = useCallback(async lapData => {
    const lapNumber = laps.length + 1;
    const { error } = await supabase.from('laps').insert({ session_id: sessionId, lap_number: lapNumber, ...lapData });
    if (error) throw error;
  }, [sessionId, laps.length]);

  const updateLap = useCallback(async (lapId, updates) => {
    const { error } = await supabase.from('laps').update(updates).eq('id', lapId);
    if (error) throw error;
  }, []);

  // Stamps race_start_time — syncs to all clients instantly via realtime
  const startRace = useCallback(async () => {
    const { error } = await supabase
      .from('sessions')
      .update({ race_start_time: new Date().toISOString() })
      .eq('id', sessionId);
    if (error) throw error;
  }, [sessionId]);

  // Stamps race_end_time — entry stays open for 5 min after
  const endRace = useCallback(async () => {
    const { error } = await supabase
      .from('sessions')
      .update({ race_end_time: new Date().toISOString() })
      .eq('id', sessionId);
    if (error) throw error;
  }, [sessionId]);

  return { session, laps, loading, error, addLap, updateLap, startRace, endRace, refetch: fetchData };
}

export function useSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('sessions').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setSessions(data || []); setLoading(false); });
  }, []);

  const createSession = async config => {
    const { data, error } = await supabase.from('sessions').insert(config).select().single();
    if (error) throw error;
    setSessions(prev => [data, ...prev]);
    return data;
  };

  const deleteSession = async (id) => {
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) throw error;
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  return { sessions, loading, createSession, deleteSession };
}
