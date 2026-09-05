import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { reverseGeocode } from '@/lib/utils';
import type { PartnerLocation } from '@/types';

export function useLocation(coupleId: string | null, myId: string | null, partnerId: string | null) {
  const [mine, setMine] = useState<PartnerLocation | null>(null);
  const [partner, setPartner] = useState<PartnerLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!coupleId) return;
    const { data } = await supabase.from('locations').select('*').eq('couple_id', coupleId);
    for (const row of (data as PartnerLocation[]) ?? []) {
      if (row.user_id === myId) setMine(row);
      else if (row.user_id === partnerId) setPartner(row);
    }
    setLoading(false);
  }, [coupleId, myId, partnerId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!coupleId) return;
    const channel = supabase
      .channel(`locations:${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'locations', filter: `couple_id=eq.${coupleId}` },
        (payload) => {
          const row = payload.new as PartnerLocation;
          if (row.user_id === myId) setMine(row);
          else if (row.user_id === partnerId) setPartner(row);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, myId, partnerId]);

  const shareCurrentLocation = () => {
    if (!coupleId || !myId) return;
    if (!('geolocation' in navigator)) {
      setError('Location isn\u2019t supported on this device/browser.');
      return;
    }
    setSharing(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const basePayload = {
          couple_id: coupleId,
          user_id: myId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy_meters: pos.coords.accuracy,
          updated_at: new Date().toISOString()
        };

        // Save immediately so the partner sees a pin without waiting on geocoding,
        // then upgrade the row with a human-readable place name once it resolves.
        const { data, error: upsertError } = await supabase
          .from('locations')
          .upsert({ ...basePayload, label: null }, { onConflict: 'couple_id,user_id' })
          .select()
          .single();

        if (upsertError) {
          setSharing(false);
          setError('Couldn\u2019t save your location. Please try again.');
          return;
        }

        setMine((data as PartnerLocation) ?? ({ ...basePayload, label: null } as PartnerLocation));
        setSharing(false);

        try {
          const label = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (!label) return;

          const { data: labeled, error: labelError } = await supabase
            .from('locations')
            .update({ label })
            .eq('couple_id', coupleId)
            .eq('user_id', myId)
            .select()
            .single();

          // Only upgrade state if the label attach actually succeeded — never
          // clear a location that was already saved just because this step failed.
          if (!labelError && labeled) {
            setMine(labeled as PartnerLocation);
          }
        } catch {
          // Silently ignore geocoding/label failures — the coordinates are already saved.
        }
      },
      (err) => {
        setSharing(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission was denied. Enable it in your browser/site settings to share.');
        } else {
          setError('Couldn\u2019t get your location. Try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 }
    );
  };

  return { mine, partner, loading, sharing, error, shareCurrentLocation };
}
