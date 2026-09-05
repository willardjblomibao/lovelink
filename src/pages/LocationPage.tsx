import { MapPin, Navigation, ExternalLink, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useCouple } from '@/context/CoupleContext';
import { useLocation } from '@/hooks/useLocation';
import { TopBar } from '@/components/ui/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { distanceKm, timeAgo, osmEmbedUrl, googleMapsUrl } from '@/lib/utils';
import type { PartnerLocation } from '@/types';

export default function LocationPage() {
  const { profile } = useAuth();
  const { couple, partner } = useCouple();
  const { mine, partner: partnerLoc, loading, sharing, error, shareCurrentLocation } = useLocation(
    couple?.id ?? null,
    profile?.id ?? null,
    partner?.id ?? null
  );

  const distance =
    mine && partnerLoc ? distanceKm(mine.latitude, mine.longitude, partnerLoc.latitude, partnerLoc.longitude) : null;

  return (
    <div className="min-h-screen bg-cream pb-10 dark:bg-charcoal">
      <TopBar title="Find Partner" showBack right={<span />} />

      <div className="space-y-4 px-5">
        {distance !== null && (
          <GlassCard className="text-center">
            <p className="text-sm text-ink-500 dark:text-cream/50">You're currently</p>
            <p className="mt-1 font-display text-2xl text-rose-500">
              {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`} apart
            </p>
          </GlassCard>
        )}

        <Button full onClick={shareCurrentLocation} loading={sharing} icon={<Navigation size={17} />}>
          Share my current location
        </Button>
        {error && <p className="text-center text-sm text-rose-700">{error}</p>}

        {loading ? (
          <div className="flex justify-center pt-10">
            <Spinner className="text-rose-500" />
          </div>
        ) : (
          <>
            <LocationCard
              label="You"
              name={profile?.display_name ?? 'You'}
              avatar={profile?.avatar_url}
              location={mine}
            />
            <LocationCard
              label={partner ? partner.display_name.split(' ')[0] : 'Partner'}
              name={partner?.display_name ?? 'Not linked yet'}
              avatar={partner?.avatar_url}
              location={partnerLoc}
            />
          </>
        )}

        <p className="px-1 text-center text-xs text-ink-500 dark:text-cream/40">
          Location is only shared when you tap "Share my current location" — LoveLink never
          tracks you in the background.
        </p>
      </div>
    </div>
  );
}

function LocationCard({
  label,
  name,
  avatar,
  location
}: {
  label: string;
  name: string;
  avatar?: string | null;
  location: PartnerLocation | null;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="space-y-3">
        <div className="flex items-center gap-3">
          <Avatar name={name} src={avatar} size={40} />
          <div className="flex-1">
            <p className="text-sm font-medium text-ink dark:text-cream">{label}</p>
            {location ? (
              <>
                <p className="flex items-center gap-1 text-[13px] font-medium text-rose-500">
                  <MapPin size={12} />
                  {location.label ?? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                </p>
                <p className="flex items-center gap-1 text-xs text-ink-500 dark:text-cream/50">
                  <RefreshCw size={11} /> Updated {timeAgo(location.updated_at)}
                </p>
              </>
            ) : (
              <p className="text-xs text-ink-500 dark:text-cream/40">No location shared yet</p>
            )}
          </div>
          {location && (
            <a
              href={googleMapsUrl(location.latitude, location.longitude)}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white/70 p-2 text-rose-500 dark:bg-white/10"
              aria-label="Open in Maps"
            >
              <ExternalLink size={15} />
            </a>
          )}
        </div>

        {location ? (
          <div className="overflow-hidden rounded-2xl border border-white/60 dark:border-white/10">
            <iframe
              title={`${label} location`}
              src={osmEmbedUrl(location.latitude, location.longitude)}
              className="h-40 w-full"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center gap-2 rounded-2xl bg-white/40 text-ink-500 dark:bg-white/5 dark:text-cream/30">
            <MapPin size={16} />
            <span className="text-xs">Waiting for a location share</span>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
