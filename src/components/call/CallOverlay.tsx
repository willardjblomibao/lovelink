import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff } from 'lucide-react';
import { useCall } from '@/context/CallContext';
import { useCouple } from '@/context/CoupleContext';
import { Avatar } from '@/components/ui/Avatar';

function VideoTag({ stream, muted, mirrored }: { stream: MediaStream | null; muted?: boolean; mirrored?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className={mirrored ? 'h-full w-full scale-x-[-1] object-cover' : 'h-full w-full object-cover'}
    />
  );
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function CallOverlay() {
  const {
    callState,
    callType,
    localStream,
    remoteStream,
    muted,
    cameraOff,
    callDurationSec,
    error,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera
  } = useCall();
  const { partner } = useCouple();

  if (callState === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col bg-charcoal text-cream"
      >
        {callState === 'incoming' && (
          <IncomingCall
            partnerName={partner?.display_name ?? 'Your partner'}
            avatar={partner?.avatar_url}
            callType={callType}
            onAccept={acceptCall}
            onDecline={declineCall}
          />
        )}

        {callState === 'outgoing' && (
          <OutgoingCall
            partnerName={partner?.display_name ?? 'Your partner'}
            avatar={partner?.avatar_url}
            callType={callType}
            onCancel={endCall}
          />
        )}

        {callState === 'active' && (
          <ActiveCall
            partnerName={partner?.display_name ?? 'Your partner'}
            avatar={partner?.avatar_url}
            callType={callType}
            localStream={localStream}
            remoteStream={remoteStream}
            muted={muted}
            cameraOff={cameraOff}
            duration={callDurationSec}
            onToggleMute={toggleMute}
            onToggleCamera={toggleCamera}
            onHangup={endCall}
          />
        )}

        {error && (
          <div className="safe-bottom absolute bottom-24 left-1/2 -translate-x-1/2 rounded-pill bg-rose-500/90 px-4 py-2 text-xs text-white">
            {error}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function IncomingCall({
  partnerName,
  avatar,
  callType,
  onAccept,
  onDecline
}: {
  partnerName: string;
  avatar?: string | null;
  callType: 'audio' | 'video' | null;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-between py-16">
      <div className="flex flex-col items-center gap-4 pt-8">
        <p className="text-sm text-cream/60">Incoming {callType === 'video' ? 'video' : 'voice'} call</p>
        <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}>
          <Avatar name={partnerName} src={avatar} size={120} ring />
        </motion.div>
        <p className="font-display text-2xl">{partnerName}</p>
      </div>

      <div className="flex items-center gap-16">
        <button
          onClick={onDecline}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg active:scale-90 transition-transform"
          aria-label="Decline"
        >
          <PhoneOff size={26} />
        </button>
        <button
          onClick={onAccept}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg active:scale-90 transition-transform"
          aria-label="Accept"
        >
          {callType === 'video' ? <Video size={26} /> : <Phone size={26} />}
        </button>
      </div>
    </div>
  );
}

function OutgoingCall({
  partnerName,
  avatar,
  callType,
  onCancel
}: {
  partnerName: string;
  avatar?: string | null;
  callType: 'audio' | 'video' | null;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-between py-16">
      <div className="flex flex-col items-center gap-4 pt-8">
        <p className="text-sm text-cream/60">Calling {partnerName}…</p>
        <Avatar name={partnerName} src={avatar} size={120} ring />
        <p className="font-display text-2xl">{partnerName}</p>
        <p className="text-xs text-cream/40">{callType === 'video' ? 'Video call' : 'Voice call'}</p>
      </div>

      <button
        onClick={onCancel}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg active:scale-90 transition-transform"
        aria-label="Cancel"
      >
        <PhoneOff size={26} />
      </button>
    </div>
  );
}

function ActiveCall({
  partnerName,
  avatar,
  callType,
  localStream,
  remoteStream,
  muted,
  cameraOff,
  duration,
  onToggleMute,
  onToggleCamera,
  onHangup
}: {
  partnerName: string;
  avatar?: string | null;
  callType: 'audio' | 'video' | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  muted: boolean;
  cameraOff: boolean;
  duration: number;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onHangup: () => void;
}) {
  const isVideo = callType === 'video';

  return (
    <div className="relative flex flex-1 flex-col">
      {isVideo ? (
        <div className="relative flex-1 bg-black">
          {remoteStream ? (
            <VideoTag stream={remoteStream} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Avatar name={partnerName} src={avatar} size={100} />
            </div>
          )}
          <div className="absolute right-4 top-14 h-40 w-28 overflow-hidden rounded-2xl border-2 border-white/30 shadow-lg">
            {localStream && !cameraOff ? (
              <VideoTag stream={localStream} muted mirrored />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-charcoal-200">
                <Avatar name="You" size={36} />
              </div>
            )}
          </div>
          <div className="safe-top absolute left-0 right-0 top-0 flex flex-col items-center pt-4">
            <p className="font-display text-lg">{partnerName}</p>
            <p className="text-xs text-cream/60">{formatDuration(duration)}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Avatar name={partnerName} src={avatar} size={120} ring />
          <p className="font-display text-2xl">{partnerName}</p>
          <p className="text-sm text-cream/60">{formatDuration(duration)}</p>
        </div>
      )}

      <div className="safe-bottom flex items-center justify-center gap-6 pb-10 pt-6">
        <button
          onClick={onToggleMute}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 active:scale-90 transition-transform"
        >
          {muted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
        <button
          onClick={onHangup}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg active:scale-90 transition-transform"
        >
          <PhoneOff size={26} />
        </button>
        {isVideo && (
          <button
            onClick={onToggleCamera}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 active:scale-90 transition-transform"
          >
            {cameraOff ? <VideoOff size={22} /> : <Video size={22} />}
          </button>
        )}
      </div>
    </div>
  );
}
