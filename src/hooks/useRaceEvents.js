import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useRaceEvents(sessionId) {
  const [events, setEvents] = useState([]);
  const [batteryPacks, setBatteryPacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!sessionId) return;
    const [{ data: evts }, { data: packs }] = await Promise.all([
      supabase.from('race_events').select('*').eq('session_id', sessionId).order('lap_number'),
      supabase.from('battery_packs').select('*').eq('session_id', sessionId).order('swap_at'),
    ]);
    setEvents(evts || []);
    setBatteryPacks(packs || []);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Real-time subscriptions
  useEffect(() => {
    if (!sessionId) return;
    const evtChannel = supabase
      .channel(`events-${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'race_events', filter: `session_id=eq.${sessionId}` },
        payload => setEvents(prev => [...prev, payload.new].sort((a,b) => a.lap_number - b.lap_number))
      ).subscribe();

    const packChannel = supabase
      .channel(`packs-${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'battery_packs', filter: `session_id=eq.${sessionId}` },
        payload => setBatteryPacks(prev => [...prev, payload.new])
      ).subscribe();

    return () => {
      supabase.removeChannel(evtChannel);
      supabase.removeChannel(packChannel);
    };
  }, [sessionId]);

  const addPitStop = useCallback(async (lapNumber, reason, notes) => {
    const { error } = await supabase.from('race_events').insert({
      session_id: sessionId, lap_number: lapNumber,
      event_type: 'pit_stop', reason, notes,
    });
    if (error) throw error;
  }, [sessionId]);

  const addBatterySwap = useCallback(async (packName, capacityMah, swapLap, notes) => {
    const { error } = await supabase.from('battery_packs').insert({
      session_id: sessionId, pack_name: packName,
      capacity_mah: capacityMah, swap_lap: swapLap, notes,
    });
    if (error) throw error;
  }, [sessionId]);

  // Calculate the mAh offset for the current battery pack
  // When a battery is swapped, JETI resets to 0, so we need to add up all previous packs
  const getBatteryOffset = useCallback((lapNumber) => {
    const swapsBefore = batteryPacks
      .filter(p => p.swap_lap && p.swap_lap <= lapNumber)
      .sort((a, b) => a.swap_lap - b.swap_lap);
    // The offset is the sum of capacities of all packs that have been fully used
    // We track this by storing the mAh reading at the time of swap
    return swapsBefore.reduce((sum, p) => sum + (parseFloat(p.capacity_mah) || 0), 0);
  }, [batteryPacks]);

  // Get total cumulative mAh across all battery swaps + current pack reading
  const getTotalBatUsed = useCallback((currentJetiReading, currentLap) => {
    if (!currentJetiReading) return 0;
    const offset = getBatteryOffset(currentLap);
    return offset + parseFloat(currentJetiReading);
  }, [getBatteryOffset]);

  return {
    events, batteryPacks, loading,
    addPitStop, addBatterySwap,
    getBatteryOffset, getTotalBatUsed,
    pitStops: events.filter(e => e.event_type === 'pit_stop'),
    refetch: fetchAll,
  };
}
