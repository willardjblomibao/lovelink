import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCouple } from '@/context/CoupleContext';
import { startRingtone, stopRingtone } from '@/lib/ringtone';
import type { CallRecord, CallType } from '@/types';

type CallState = 'idle' | 'outgoing' | 'incoming' | 'active';

interface CallContextValue {
  callState: CallState;
  currentCall: CallRecord | null;
  callType: CallType | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  muted: boolean;
  cameraOff: boolean;
  callDurationSec: number;
  error: string | null;
  startCall: (type: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
}

const CallContext = createContext<CallContextValue | undefined>(undefined);

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

const RING_TIMEOUT_MS = 45_000;

export function CallProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const { couple, partner } = useCouple();

  const [callState, setCallState] = useState<CallState>('idle');
  const [currentCall, setCurrentCall] = useState<CallRecord | null>(null);
  const [callType, setCallType] = useState<CallType | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [callDurationSec, setCallDurationSec] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const broadcastRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const durationIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const currentCallRef = useRef<CallRecord | null>(null);

  useEffect(() => {
    currentCallRef.current = currentCall;
  }, [currentCall]);

  // --- cleanup helpers -----------------------------------------------------

  const stopMedia = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
  };

  const teardown = () => {
    pcRef.current?.close();
    pcRef.current = null;
    stopMedia();
    if (broadcastRef.current) {
      supabase.removeChannel(broadcastRef.current);
      broadcastRef.current = null;
    }
    pendingCandidates.current = [];
    clearTimeout(ringTimeoutRef.current);
    clearInterval(durationIntervalRef.current);
    stopRingtone();
    setCallState('idle');
    setCurrentCall(null);
    setCallType(null);
    setMuted(false);
    setCameraOff(false);
    setCallDurationSec(0);
  };

  // --- signaling channel (ICE candidates only) ------------------------------

  const ensureBroadcastChannel = (coupleId: string) => {
    if (broadcastRef.current) return broadcastRef.current;
    const channel = supabase
      .channel(`webrtc:${coupleId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'ice' }, ({ payload }) => {
        if (payload.from === profile?.id) return;
        const candidate: RTCIceCandidateInit = payload.candidate;
        if (pcRef.current?.remoteDescription) {
          pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        } else {
          pendingCandidates.current.push(candidate);
        }
      })
      .subscribe();
    broadcastRef.current = channel;
    return channel;
  };

  const flushPendingCandidates = () => {
    if (!pcRef.current) return;
    for (const c of pendingCandidates.current) {
      pcRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
    }
    pendingCandidates.current = [];
  };

  // --- peer connection setup -------------------------------------------------

  const buildPeerConnection = (coupleId: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const channel = ensureBroadcastChannel(coupleId);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        channel.send({ type: 'broadcast', event: 'ice', payload: { from: profile?.id, candidate: e.candidate } });
      }
    };

    pc.ontrack = (e) => {
      setRemoteStream((prev) => {
        const stream = prev ?? new MediaStream();
        stream.addTrack(e.track);
        return new MediaStream(stream.getTracks());
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        setError('Call connection failed — your networks may not allow a direct connection.');
        endCall();
      }
    };

    pcRef.current = pc;
    return pc;
  };

  const startDurationTimer = () => {
    setCallDurationSec(0);
    durationIntervalRef.current = setInterval(() => setCallDurationSec((s) => s + 1), 1000);
  };

  // --- public actions ----------------------------------------------------

  const startCall = async (type: CallType) => {
    if (!couple?.id || !profile?.id || !partner?.id) {
      setError('You need to be linked with your partner to make a call.');
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCallType(type);

      const pc = buildPeerConnection(couple.id);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const { data, error: insertError } = await supabase
        .from('calls')
        .insert({
          couple_id: couple.id,
          caller_id: profile.id,
          callee_id: partner.id,
          call_type: type,
          status: 'ringing',
          offer_sdp: JSON.stringify(offer)
        })
        .select()
        .single();

      if (insertError || !data) {
        setError(insertError?.message ?? 'Could not start the call.');
        teardown();
        return;
      }

      setCurrentCall(data as CallRecord);
      setCallState('outgoing');

      ringTimeoutRef.current = setTimeout(async () => {
        if (currentCallRef.current?.status === 'ringing') {
          await supabase.from('calls').update({ status: 'missed', ended_at: new Date().toISOString() }).eq('id', data.id);
        }
      }, RING_TIMEOUT_MS);
    } catch {
      setError('Couldn\u2019t access your camera/microphone. Check permissions and try again.');
      teardown();
    }
  };

  const acceptCall = async () => {
    if (!currentCall || !couple?.id) return;
    stopRingtone();
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: currentCall.call_type === 'video'
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = buildPeerConnection(couple.id);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(currentCall.offer_sdp!)));
      flushPendingCandidates();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const { data } = await supabase
        .from('calls')
        .update({ answer_sdp: JSON.stringify(answer), status: 'active', answered_at: new Date().toISOString() })
        .eq('id', currentCall.id)
        .select()
        .single();

      setCurrentCall((data as CallRecord) ?? { ...currentCall, status: 'active' });
      setCallState('active');
      startDurationTimer();
    } catch {
      setError('Couldn\u2019t access your camera/microphone.');
      await supabase.from('calls').update({ status: 'failed', ended_at: new Date().toISOString() }).eq('id', currentCall.id);
      teardown();
    }
  };

  const declineCall = async () => {
    if (currentCall) {
      await supabase.from('calls').update({ status: 'declined', ended_at: new Date().toISOString() }).eq('id', currentCall.id);
    }
    teardown();
  };

  const endCall = async () => {
    const call = currentCallRef.current;
    if (call && call.status !== 'ended' && call.status !== 'declined') {
      await supabase.from('calls').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', call.id);
    }
    teardown();
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const next = !muted;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    const next = !cameraOff;
    localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !next));
    setCameraOff(next);
  };

  // --- global listener: incoming calls + remote state changes --------------

  useEffect(() => {
    if (!couple?.id || !profile?.id) return;

    const channel = supabase
      .channel(`calls:${couple.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'calls', filter: `couple_id=eq.${couple.id}` },
        (payload) => {
          const row = payload.new as CallRecord;
          if (row.callee_id === profile.id && row.status === 'ringing' && callState === 'idle') {
            setCurrentCall(row);
            setCallType(row.call_type);
            setCallState('incoming');
            startRingtone();
            ringTimeoutRef.current = setTimeout(() => {
              if (currentCallRef.current?.id === row.id) teardown();
            }, RING_TIMEOUT_MS);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'calls', filter: `couple_id=eq.${couple.id}` },
        async (payload) => {
          const row = payload.new as CallRecord;
          if (currentCallRef.current?.id !== row.id) return;

          if (row.status === 'active' && row.answer_sdp && pcRef.current && !pcRef.current.currentRemoteDescription) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(JSON.parse(row.answer_sdp)));
            flushPendingCandidates();
            clearTimeout(ringTimeoutRef.current);
            setCurrentCall(row);
            setCallState('active');
            startDurationTimer();
          } else if (['ended', 'declined', 'missed', 'failed'].includes(row.status)) {
            teardown();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couple?.id, profile?.id, callState]);

  // Clean up media on unmount.
  useEffect(() => () => teardown(), []);

  return (
    <CallContext.Provider
      value={{
        callState,
        currentCall,
        callType,
        localStream,
        remoteStream,
        muted,
        cameraOff,
        callDurationSec,
        error,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        toggleCamera
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within CallProvider');
  return ctx;
}
