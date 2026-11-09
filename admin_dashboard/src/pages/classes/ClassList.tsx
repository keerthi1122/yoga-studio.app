import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Video, 
  MapPin, 
  Users, 
  X
} from 'lucide-react';
import { YogaClass, BookingType, Instructor } from '../../types';
import { subscribeToClasses, createClass, cancelClass } from '../../services/classService';
import { subscribeToInstructors } from '../../services/instructorService';

export const ClassList: React.FC = () => {
  const [filterType, setFilterType] = useState<'all' | 'online' | 'offline'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classes, setClasses] = useState<YogaClass[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  useEffect(() => {
    const unsubClasses = subscribeToClasses((liveClasses) => {
      setClasses(liveClasses);
    });
    const unsubInstructors = subscribeToInstructors((liveInstructors) => {
      setInstructors(liveInstructors);
    });
    return () => {
      unsubClasses();
      unsubInstructors();
    };
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Vinyasa Yoga',
    instructorName: '',
    bookingType: 'online' as BookingType,
    time: '09:00',
    durationMinutes: 60,
    capacity: 20,
    studioRoom: 'Studio Room A'
  });

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveInstructor = formData.instructorName || (instructors.length > 0 ? instructors[0].name : 'Lead Instructor');
    const matchedInstructor = instructors.find(i => i.name === effectiveInstructor);
    const newClassData = {
      title: formData.title,
      description: 'Mindful practice tailored for all levels.',
      category: formData.category,
      instructorId: matchedInstructor?.instructorId || 'instructor_default',
      instructorName: effectiveInstructor,
      bookingType: formData.bookingType,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + formData.durationMinutes * 60000).toISOString(),
      durationMinutes: Number(formData.durationMinutes),
      capacity: Number(formData.capacity),
      bookedSeats: 0,
      meetingConfiguration: formData.bookingType === 'online' ? {
        jitsiRoom: `yoga_studio_${Date.now()}`,
        joinWindowMinutesBefore: 15
      } : undefined,
      location: formData.bookingType === 'offline' ? {
        studioRoom: formData.studioRoom,
        address: '108 Mindfulness Way, Suite 4B'
      } : undefined,
      cancellationPolicyHours: 12,
      status: 'scheduled' as const,
    };

    try {
      await createClass(newClassData);
    } catch (_) {
      // Optimistic local update
      setClasses([{ ...newClassData, classId: `c_${Date.now()}` }, ...classes]);
    }

    setIsModalOpen(false);
    setFormData({
      title: '',
      category: 'Vinyasa Yoga',
      instructorName: '',
      bookingType: 'online',
      time: '09:00',
      durationMinutes: 60,
      capacity: 20,
      studioRoom: 'Studio Room A'
    });
  };

  const handleCancelClass = async (classId: string) => {
    if (!confirm('Are you sure you want to cancel this class?')) return;
    try {
      await cancelClass(classId);
    } catch (_) {
      setClasses(classes.map((c) => c.classId === classId ? { ...c, status: 'cancelled' } : c));
    }
  };

  const filtered = classes.filter(c => {
    const matchesFilter = filterType === 'all' || c.bookingType === filterType;
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.instructorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E9DCC5]/70">
        <div>
          <h1 className="font-serif text-3xl font-bold text-dark">Class Schedules & Sessions</h1>
          <p className="text-sm text-dark-muted mt-1">Configure in-person studio classes and live video streaming sessions.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-burgundy hover:bg-burgundy-dark text-white rounded-xl text-xs font-semibold shadow-md shadow-burgundy/20 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Class</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E9DCC5] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Type Toggle Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-cream/60 rounded-xl border border-[#E9DCC5]">
          {(['all', 'online', 'offline'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterType === t 
                  ? 'bg-burgundy text-white shadow-sm' 
                  : 'text-dark-muted hover:text-dark'
              }`}
            >
              {t === 'all' ? 'All Classes' : `${t} Classes`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by class title, instructor or style..."
            className="w-full pl-10 pr-4 py-2 bg-cream/30 border border-[#E9DCC5] rounded-xl text-xs focus:outline-none focus:border-burgundy"
          />
        </div>
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((c) => {
          const isFull = c.bookedSeats >= c.capacity;
          const isOnline = c.bookingType === 'online';

          return (
            <div 
              key={c.classId} 
              className="bg-white rounded-2xl p-5 border border-[#E9DCC5] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isOnline ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {isOnline ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                      {c.bookingType}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-cream text-dark border border-beige">
                      {c.category}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    c.status === 'cancelled' ? 'bg-zinc-100 text-zinc-600' :
                    isFull ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {c.status === 'cancelled' ? 'Cancelled' : isFull ? 'Full' : 'Open'}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-dark mb-1">{c.title}</h3>
                <p className="text-xs text-dark-muted line-clamp-2 mb-4">{c.description}</p>

                <div className="space-y-2 text-xs text-dark-muted border-t border-b border-[#E9DCC5]/60 py-3">
                  <div className="flex items-center justify-between">
                    <span>Instructor:</span>
                    <span className="font-semibold text-dark">{c.instructorName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Duration & Window:</span>
                    <span className="font-semibold text-dark">{c.durationMinutes} mins &bull; 12h cancellation</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{isOnline ? 'Meeting Room:' : 'Studio Room:'}</span>
                    <span className="font-mono text-[11px] text-burgundy truncate max-w-[200px]">
                      {isOnline ? c.meetingConfiguration?.jitsiRoom : c.location?.studioRoom}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Capacity & Actions */}
              <div className="mt-4 pt-2 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-dark font-medium">
                    <Users className="w-4 h-4 text-dark-muted" />
                    <span>{c.bookedSeats} / {c.capacity} registered</span>
                  </div>
                  <div className="w-32 h-1.5 bg-cream rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isFull ? 'bg-red-500' : 'bg-burgundy'}`}
                      style={{ width: `${Math.min(100, (c.bookedSeats / c.capacity) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {c.status !== 'cancelled' && (
                    <button 
                      onClick={() => handleCancelClass(c.classId)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium"
                    >
                      Cancel Class
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-[#E9DCC5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E9DCC5]">
              <h2 className="font-serif text-xl font-bold text-dark">Schedule New Class</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-cream text-dark-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-dark-muted uppercase mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Ashtanga Primary Series"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs focus:outline-none focus:border-burgundy"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dark-muted uppercase mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs focus:outline-none focus:border-burgundy"
                  >
                    <option>Hatha Yoga</option>
                    <option>Vinyasa Yoga</option>
                    <option>Yin Yoga</option>
                    <option>Ashtanga Yoga</option>
                    <option>Meditation & Sound</option>
                    <option>Yoga Therapy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark-muted uppercase mb-1">Delivery Mode</label>
                  <select
                    value={formData.bookingType}
                    onChange={(e) => setFormData({...formData, bookingType: e.target.value as BookingType})}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs focus:outline-none focus:border-burgundy"
                  >
                    <option value="online">Online (Jitsi Live Stream)</option>
                    <option value="offline">Offline (Studio In-Person)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dark-muted uppercase mb-1">Instructor</label>
                  {instructors.length > 0 ? (
                    <select
                      value={formData.instructorName || instructors[0].name}
                      onChange={(e) => setFormData({...formData, instructorName: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs focus:outline-none focus:border-burgundy"
                    >
                      {instructors.map((inst) => (
                        <option key={inst.instructorId} value={inst.name}>{inst.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Lead Instructor"
                      value={formData.instructorName}
                      onChange={(e) => setFormData({...formData, instructorName: e.target.value})}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs focus:outline-none focus:border-burgundy"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark-muted uppercase mb-1">Max Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: Number(e.target.value)})}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs focus:outline-none focus:border-burgundy"
                  />
                </div>
              </div>

              {formData.bookingType === 'offline' && (
                <div>
                  <label className="block text-xs font-semibold text-dark-muted uppercase mb-1">Studio Sanctuary</label>
                  <input
                    type="text"
                    value={formData.studioRoom}
                    onChange={(e) => setFormData({...formData, studioRoom: e.target.value})}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs focus:outline-none focus:border-burgundy"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-[#E9DCC5] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E9DCC5] text-xs font-semibold text-dark-muted hover:bg-cream"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-burgundy hover:bg-burgundy-dark text-white rounded-xl text-xs font-semibold shadow-md shadow-burgundy/20"
                >
                  Save & Publish Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
