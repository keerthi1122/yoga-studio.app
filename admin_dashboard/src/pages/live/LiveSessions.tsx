import React, { useState, useEffect } from 'react';
import { Play, StopCircle, Radio, Clock, ShieldCheck, ExternalLink } from 'lucide-react';
import { subscribeToClasses } from '../../services/classService';
import { subscribeToBookings } from '../../services/bookingService';
import { subscribeToStudioSettings } from '../../services/studioService';
import { YogaClass, Booking } from '../../types';

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
        setJitsiServer(settings.jitsiDefaultServer);
      }
    }, {
      studioName: 'Prana Sanctuary',
      tagline: 'Mindful yoga',
      contactEmail: 'contact@pranasanctuary.com',
      contactPhone: '+1 555-0123',
      address: { street: '108 Mindfulness Way', city: 'SF', state: 'CA', postalCode: '94107', country: 'US' },
      currency: 'USD',
      currencySymbol: '$',
      timezone: 'America/Los_Angeles',
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

  const onlineClasses = classes.filter(c => c.bookingType === 'online');

  const sessions: LiveSessionData[] = onlineClasses.map(c => {
    const classBookings = bookings.filter(b => b.classId === c.classId);
    const students = classBookings.map(b => ({
      name: b.userFullName,
      email: b.userEmail || `${b.userFullName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      checkedIn: b.bookingStatus === 'attended' || c.status === 'live',
    }));

    const displayStudents = students;

    return {
      id: c.classId,
      classTitle: c.title,
      instructorName: c.instructorName,
      jitsiRoom: c.meetingConfiguration?.jitsiRoom || `yoga_studio_${c.classId}`,
      time: `${c.startTime} - ${c.endTime}`,
      status: (c.status === 'live' ? 'live' : 'scheduled') as 'scheduled' | 'live' | 'ended',
      registeredCount: c.bookedSeats || displayStudents.length,
      students: displayStudents,
    };
  });

  const handleStartMeeting = (session: LiveSessionData) => {
    setActiveSession(session);
    setIsMeetingOpen(true);
  };

  const handleEndMeeting = () => {
    if (confirm('End live stream for all practitioners and record attendance?')) {
      setIsMeetingOpen(false);
      setActiveSession(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E9DCC5]/70">
        <div>
          <h1 className="font-serif text-3xl font-bold text-dark">Live Video Streaming Console</h1>
          <p className="text-sm text-dark-muted mt-1">Instructor meeting host controls, participant attendance, and Jitsi live broadcast.</p>
        </div>
      </div>

      {/* Embedded Live Host Studio */}
      {isMeetingOpen && activeSession && (
        <div className="bg-white rounded-3xl p-6 border-2 border-burgundy shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-[#E9DCC5] mb-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
              <div>
                <h2 className="font-serif text-lg font-bold text-dark">{activeSession.classTitle} (Broadcasting)</h2>
                <p className="text-xs text-dark-muted">Instructor: {activeSession.instructorName} &bull; Room: {activeSession.jitsiRoom}</p>
              </div>
            </div>
            <button
              onClick={handleEndMeeting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
            >
              <StopCircle className="w-4 h-4" />
              <span>End Live Session</span>
            </button>
          </div>

          {/* Jitsi IFrame Container */}
          <div className="w-full h-[520px] bg-dark rounded-2xl overflow-hidden border border-[#E9DCC5] relative">
            <iframe
              src={`https://${jitsiServer}/${activeSession.jitsiRoom}#config.startWithAudioMuted=true&config.prejoinPageEnabled=false&interfaceConfig.TOOLBAR_BUTTONS=['microphone','camera','closedcaptions','desktop','embedmeeting','fullscreen','fodeviceselection','hangup','profile','chat','recording','livestreaming','etherpad','sharedvideo','settings','raisehand','videoquality','filmstrip','invite','feedback','stats','shortcuts','tileview','videobackgroundblur','download','help','mute-everyone']`}
              title="Jitsi Meet Instructor Portal"
              className="w-full h-full border-0"
              allow="camera; microphone; fullscreen; display-capture"
            />
          </div>
        </div>
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
                  {sess.status === 'live' ? 'In Progress' : 'Upcoming Stream'}
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
                  <span className="text-xs font-bold text-dark-muted uppercase tracking-wider">Registered Practitioners ({sess.registeredCount})</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://${jitsiServer}/${sess.jitsiRoom}`);
                      alert('Student join link copied to clipboard!');
                    }}
                    className="text-[11px] font-semibold text-burgundy hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Copy Room URL</span>
                  </button>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {sess.students.map((student, i) => (
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
                  ))}
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
                <span>Launch Host Studio</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

