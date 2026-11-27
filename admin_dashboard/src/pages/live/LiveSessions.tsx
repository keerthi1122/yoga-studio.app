import React, { useState, useEffect } from 'react';
import { Play, Radio, Clock, ShieldCheck, ExternalLink } from 'lucide-react';
import { subscribeToClasses, updateClass } from '../../services/classService';
import { subscribeToBookings } from '../../services/bookingService';
import { subscribeToStudioSettings } from '../../services/studioService';
import { useAuth } from '../../context/AuthContext';
import { YogaClass, Booking } from '../../types';
import { JitsiMeetEmbed } from '../../components/JitsiMeetEmbed';
import { sanitizeJitsiRoom, sanitizeJitsiServer } from '../../utils/security';

interface LiveSessionData {
  id: string;
  classTitle: string;
  instructorName: string;
  jitsiRoom: string;
  time: string;
  status: 'scheduled' | 'live' | 'ended';
  registeredCount: number;
  students: { name: string; email: string; checkedIn: boolean }[];
}

export const LiveSessions: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeSession, setActiveSession] = useState<LiveSessionData | null>(null);
  const [isMeetingOpen, setIsMeetingOpen] = useState(false);
  const [classes, setClasses] = useState<YogaClass[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [jitsiServer, setJitsiServer] = useState<string>('meet.jit.si');

  useEffect(() => {
    const unsubClasses = subscribeToClasses(setClasses);
    const unsubBookings = subscribeToBookings(setBookings);

    const unsubSettings = subscribeToStudioSettings((settings) => {
      if (settings.jitsiDefaultServer) {
        setJitsiServer(sanitizeJitsiServer(settings.jitsiDefaultServer));
      }
    }, {
      studioName: 'Guinness Vijay Yoga Academy (GVYA)',
      tagline: 'World-Record Yogic Alignment & Props Mastery',
      contactEmail: 'admissions@gvyayoga.com',
      contactPhone: '+91 98400 12345',
      address: { street: '108 Temple Road, Mylapore', city: 'Chennai', state: 'TN', postalCode: '600004', country: 'India' },
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata',
      cancellationPolicyHours: 12,
      allowSingleClassDropIn: true,
      jitsiDefaultServer: 'meet.jit.si'
    });

    return () => {
      unsubClasses();
      unsubBookings();
      unsubSettings();
    };
  }, []);

  const onlineClasses = classes.filter(c => c.bookingType === 'online' && c.status !== 'cancelled');

  const sessions: LiveSessionData[] = onlineClasses.map(c => {
    const classBookings = bookings.filter(b => b.classId === c.classId && b.bookingStatus !== 'cancelled');
    const students = classBookings.map(b => ({
      name: b.userFullName,
      email: b.userEmail || `${b.userFullName.toLowerCase().replace(/\s+/g, '.')}@member.gvya.in`,
      checkedIn: b.bookingStatus === 'attended' || c.status === 'live',
    }));

    return {
      id: c.classId,
      classTitle: c.title,
      instructorName: c.instructorName,
      jitsiRoom: sanitizeJitsiRoom(c.meetingConfiguration?.jitsiRoom || `GVYA_${c.classId}`),
      time: new Date(c.startTime).toLocaleString(),
      status: (c.status === 'live' ? 'live' : 'scheduled') as 'scheduled' | 'live' | 'ended',
      registeredCount: Math.max(c.bookedSeats || 0, students.length),
      students,
    };
  });

  const handleStartMeeting = async (session: LiveSessionData) => {
    await updateClass(session.id, { status: 'live' });
    setActiveSession({ ...session, status: 'live' });
    setIsMeetingOpen(true);
  };

  const handleEndMeeting = async () => {
    if (confirm('End live stream for all practitioners?')) {
      if (activeSession) {
        await updateClass(activeSession.id, { status: 'scheduled' });
      }
      setIsMeetingOpen(false);
      setActiveSession(null);
    }
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E9DCC5]/70">
        <div>
          <h1 className="font-serif text-3xl font-bold text-dark">Live Video Streaming Console</h1>
          <p className="text-sm text-dark-muted mt-1">
            Instructor meeting host controls, participant rosters, and HD Jitsi live broadcast rooms.
          </p>
        </div>
      </div>

      {/* Embedded Live Host Studio */}
      {isMeetingOpen && activeSession && (
        <JitsiMeetEmbed
          roomName={activeSession.jitsiRoom}
          classTitle={activeSession.classTitle}
          instructorName={activeSession.instructorName}
          displayName={userProfile?.fullName || activeSession.instructorName}
          jitsiServer={jitsiServer}
          isHost={true}
          onClose={handleEndMeeting}
        />
      )}

      {/* Scheduled Live Streams List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sessions.map((sess) => (
          <div key={sess.id} className="bg-white rounded-2xl p-6 border border-[#E9DCC5] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  sess.status === 'live' ? 'bg-red-100 text-red-700' : 'bg-indigo-50 text-indigo-700'
                }`}>
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  {sess.status === 'live' ? 'Broadcasting Live' : 'Ready to Stream'}
                </span>
                <span className="text-xs font-semibold text-dark-muted flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {sess.time}
                </span>
              </div>

              <h3 className="font-serif text-xl font-bold text-dark">{sess.classTitle}</h3>
              <p className="text-xs text-dark-muted mt-1">Lead Instructor: <strong className="text-dark">{sess.instructorName}</strong></p>

              <div className="mt-4 p-3 rounded-xl bg-cream/40 border border-[#E9DCC5] flex items-center justify-between text-xs">
                <span className="text-dark-muted">Secure Jitsi Room:</span>
                <code className="text-burgundy font-mono text-[11px] font-semibold">{sess.jitsiRoom}</code>
              </div>

              {/* Registered Student Roster */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-dark-muted uppercase tracking-wider">
                    Registered Practitioners ({sess.registeredCount})
                  </span>
                  <button
                    onClick={() => {
                      const joinUrl = `${window.location.origin}/live/${sess.jitsiRoom}?title=${encodeURIComponent(sess.classTitle)}`;
                      navigator.clipboard.writeText(joinUrl);
                      alert('Direct Student Join URL copied to clipboard!');
                    }}
                    className="text-[11px] font-semibold text-burgundy hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Copy Student Join URL</span>
                  </button>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {sess.students.length === 0 ? (
                    <p className="text-xs text-dark-muted italic py-2">Students booking online classes will appear here live.</p>
                  ) : (
                    sess.students.map((student, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#FAF6EE] text-xs">
                        <div>
                          <span className="font-semibold text-dark">{student.name}</span>
                          <span className="text-[10px] text-dark-muted block">{student.email}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          student.checkedIn ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-700'
                        }`}>
                          {student.checkedIn ? 'Attending' : 'Booked'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E9DCC5]/70 flex items-center justify-between">
              <span className="text-xs text-sage-dark font-medium flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Host Authorized
              </span>
              <button
                onClick={() => handleStartMeeting(sess)}
                className="px-4 py-2 bg-burgundy hover:bg-burgundy-dark text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{sess.status === 'live' ? 'Open Active Broadcast' : 'Launch Host Studio'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
