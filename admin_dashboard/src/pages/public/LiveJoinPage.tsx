import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Video, Sparkles, UserCheck } from 'lucide-react';
import { JitsiMeetEmbed } from '../../components/JitsiMeetEmbed';
import { subscribeToClasses } from '../../services/classService';
import { YogaClass } from '../../types';
import { sanitizeJitsiRoom, sanitizeText } from '../../utils/security';

export const LiveJoinPage: React.FC = () => {
  const { roomId } = useParams<{ roomId?: string }>();
  const [searchParams] = useSearchParams();
  const [classes, setClasses] = useState<YogaClass[]>([]);
  const [participantName, setParticipantName] = useState('');
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    return subscribeToClasses(setClasses);
  }, []);

  const onlineClasses = classes.filter((c) => c.bookingType === 'online' && c.status !== 'cancelled');
  const matchedClass = roomId
    ? onlineClasses.find((c) => c.meetingConfiguration?.jitsiRoom === roomId || c.classId === roomId)
    : onlineClasses[0];

  const activeRoom = sanitizeJitsiRoom(
    roomId || matchedClass?.meetingConfiguration?.jitsiRoom || 'gvya-live-meditation-room'
  );
  const classTitle = sanitizeText(
    searchParams.get('title') || matchedClass?.title || 'GVYA Live Online Yoga Sanctuary',
    120
  );
  const instructorName = sanitizeText(
    searchParams.get('instructor') || matchedClass?.instructorName || 'Master Vijay & GVYA Faculty',
    80
  );

  const handleEnterRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantName.trim()) return;
    setJoined(true);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-[#F5D77F] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to GVYA Home</span>
          </Link>

          <span className="px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[11px] font-bold text-[#F5D77F] flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5" />
            GVYA Live Classroom Bridge
          </span>
        </div>

        {!joined ? (
          <div className="max-w-xl mx-auto glass-gold rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/35 shadow-2xl space-y-6 my-8">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#F5D77F] mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">{classTitle}</h1>
              <p className="text-xs text-slate-300">
                Led by <strong className="text-[#F5D77F]">{instructorName}</strong> • Room: <code className="font-mono text-slate-200">{activeRoom}</code>
              </p>
            </div>

            <form onSubmit={handleEnterRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Your Full Name (for Attendance & Video Display) *
                </label>
                <input
                  type="text"
                  required
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="e.g. Ananya Iyer"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#AA820A] text-black font-bold text-sm shadow-xl shadow-[#D4AF37]/25 hover:brightness-110 transition-all flex items-center justify-center gap-2 btn-press"
              >
                <UserCheck className="w-4 h-4" />
                <span>Join Live Video Call Now &rarr;</span>
              </button>
            </form>
          </div>
        ) : (
          <JitsiMeetEmbed
            roomName={activeRoom}
            classTitle={classTitle}
            instructorName={instructorName}
            displayName={participantName}
            heightClass="h-[620px]"
            onClose={() => setJoined(false)}
          />
        )}
      </div>
    </div>
  );
};
