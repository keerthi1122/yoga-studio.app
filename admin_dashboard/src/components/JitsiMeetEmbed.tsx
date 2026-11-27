import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';
import { sanitizeJitsiRoom, sanitizeJitsiServer, sanitizeText } from '../utils/security';

interface JitsiMeetEmbedProps {
  roomName: string;
  classTitle: string;
  instructorName: string;
  displayName?: string;
  jitsiServer?: string;
  isHost?: boolean;
  onClose?: () => void;
  heightClass?: string;
}

export const JitsiMeetEmbed: React.FC<JitsiMeetEmbedProps> = ({
  roomName,
  classTitle,
  instructorName,
  displayName = 'GVYA Practitioner',
  jitsiServer = 'meet.jit.si',
  isHost = false,
  onClose,
  heightClass = 'h-[520px]',
}) => {
  const safeRoom = sanitizeJitsiRoom(roomName);
  const safeServer = sanitizeJitsiServer(jitsiServer);
  const safeDisplayName = sanitizeText(displayName, 60) || 'GVYA Practitioner';

  const [copied, setCopied] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showCameraCheck, setShowCameraCheck] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micMuted, setMicMuted] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => {
      clearInterval(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const encodedDisplay = encodeURIComponent(safeDisplayName);
  const directJitsiUrl = `https://${safeServer}/${safeRoom}#userInfo.displayName="${encodedDisplay}"&config.startWithAudioMuted=true&config.startWithVideoMuted=false&config.prejoinPageEnabled=false&config.disableDeepLinking=true`;
  const shareableLocalUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/live/${safeRoom}?title=${encodeURIComponent(classTitle)}&instructor=${encodeURIComponent(instructorName)}`;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(shareableLocalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const toggleHardwareCheck = async () => {
    if (showCameraCheck && previewActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setPreviewActive(false);
      setShowCameraCheck(false);
      return;
    }

    setShowCameraCheck(true);
    setPreviewError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Browser media API unavailable over this context.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      stream.getAudioTracks().forEach((t) => (t.enabled = !micMuted));
      stream.getVideoTracks().forEach((t) => (t.enabled = camOn));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPreviewActive(true);
    } catch (err: any) {
      setPreviewError(err?.message || 'Camera/microphone permission declined or unavailable.');
    }
  };

  const toggleCam = () => {
    const next = !camOn;
    setCamOn(next);
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
  };

  const toggleMic = () => {
    const nextMuted = !micMuted;
    setMicMuted(nextMuted);
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !nextMuted));
  };

  return (
    <div className="bg-[#0B0F18] rounded-3xl border border-[#D4AF37]/40 shadow-2xl overflow-hidden text-slate-100">
      {/* Top Studio Control Header */}
      <div className="px-5 py-4 bg-[#07090E] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-base sm:text-lg font-bold text-white">{classTitle}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {isHost ? 'Host Stream Active' : 'Live Student Joined'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3 flex-wrap">
              <span>Acharya: <strong className="text-[#F5D77F]">{instructorName}</strong></span>
              <span>Room: <code className="text-slate-300 font-mono">{safeRoom}</code></span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-mono">
                <Clock className="w-3 h-3" /> {formatDuration(elapsedSeconds)}
              </span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={toggleHardwareCheck}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all"
          >
            <Video className="w-3.5 h-3.5 text-[#F5D77F]" />
            <span>{showCameraCheck ? 'Close Cam Check' : 'Test Cam/Mic'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyInvite}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#F5D77F]" />}
            <span>{copied ? 'Link Copied!' : 'Copy Class Link'}</span>
          </button>

          <a
            href={directJitsiUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black text-xs font-bold flex items-center gap-1.5 hover:brightness-110 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Dedicated Jitsi Window</span>
          </a>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 transition-all"
            >
              <X className="w-3.5 h-3.5" />
              <span>Leave Class</span>
            </button>
          )}
        </div>
      </div>

      {/* Optional Local Camera/Mic Green-Room Test Drawer */}
      {showCameraCheck && (
        <div className="p-4 bg-[#0D1322] border-b border-white/10 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-48 h-32 rounded-xl bg-black border border-white/15 overflow-hidden relative flex items-center justify-center shrink-0">
            {previewActive && camOn ? (
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            ) : (
              <div className="text-center p-2">
                <VideoOff className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                <p className="text-[10px] text-slate-400">{previewError || 'Camera paused'}</p>
              </div>
            )}
          </div>
          <div className="space-y-2 text-xs flex-1">
            <p className="font-bold text-[#F5D77F] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Green-Room Posture & Audio Check
            </p>
            <p className="text-slate-300 text-[11px]">
              Position your yoga mat 6–8 feet back so Master can check spinal alignment during Aerial/Wheel postures. Audio enters muted to maintain pranayama stillness.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={toggleMic}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
                  micMuted ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {micMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                <span>{micMuted ? 'Mic Muted' : 'Mic Active'}</span>
              </button>
              <button
                type="button"
                onClick={toggleCam}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
                  !camOn ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {camOn ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                <span>{camOn ? 'Camera Active' : 'Camera Off'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Jitsi Video Container */}
      <div className={`w-full ${heightClass} bg-black relative`}>
        <iframe
          src={directJitsiUrl}
          title={`GVYA Live Video Class - ${classTitle}`}
          className="w-full h-full border-0"
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* Helpful Notice Footer */}
      <div className="px-5 py-2.5 bg-[#07090E] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>
          If your browser blocks embedded video permissions or prompts for moderator auth, click <strong className="text-[#F5D77F]">"Open Dedicated Jitsi Window"</strong> above.
        </span>
        <span className="text-emerald-400 font-semibold">End-to-End Encrypted WebRTC Bridge ({safeServer})</span>
      </div>
    </div>
  );
};
