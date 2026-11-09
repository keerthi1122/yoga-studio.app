import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { YogaClass, Booking } from '../../types';
import { subscribeToClasses } from '../../services/classService';
import { subscribeToBookings } from '../../services/bookingService';

export const ReportsAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [classes, setClasses] = useState<YogaClass[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const unsubClasses = subscribeToClasses(setClasses);
    const unsubBookings = subscribeToBookings(setBookings);
    return () => {
      unsubClasses();
      unsubBookings();
    };
  }, []);

  const totalBookingsCount = bookings.length;
  const onlineBookingsCount = bookings.filter(b => b.bookingType === 'online').length;
  const offlineBookingsCount = bookings.filter(b => b.bookingType === 'offline').length;

  const onlinePercentage = totalBookingsCount > 0 ? Math.round((onlineBookingsCount / totalBookingsCount) * 100) : 0;
  const offlinePercentage = totalBookingsCount > 0 ? (100 - onlinePercentage) : 0;

  const attendanceBreakdown = [
    { label: 'Online Live Video Sessions', count: onlineBookingsCount, percentage: onlinePercentage },
    { label: 'In-Studio Offline Classes', count: offlineBookingsCount, percentage: offlinePercentage },
  ];

  const popularClasses = [...classes]
    .sort((a, b) => (b.bookedSeats || 0) - (a.bookedSeats || 0))
    .slice(0, 4)
    .map(c => ({
      title: c.title,
      category: c.category,
      attendance: c.capacity > 0 ? `${Math.round(((c.bookedSeats || 0) / c.capacity) * 100)}% capacity` : '0 booked',
      teacher: c.instructorName || 'Lead Instructor'
    }));

  const handleExportSummary = () => {
    const csvContent = `Metric,Value\nTotal Bookings,${totalBookingsCount}\nOnline Attendance,${onlineBookingsCount}\nStudio Attendance,${offlineBookingsCount}\nTotal Classes,${classes.length}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studio_analytics_report_${timeRange}.csv`;
    a.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E9DCC5]/70">
        <div>
          <h1 className="font-serif text-3xl font-bold text-dark">Studio Analytics & Performance</h1>
          <p className="text-sm text-dark-muted mt-1">Attendance metrics, revenue retention, and instructor workload trends.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E9DCC5] bg-white text-xs font-semibold text-dark focus:outline-none"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Quarter to Date</option>
          </select>
          <button
            onClick={handleExportSummary}
            className="px-4 py-2 bg-burgundy hover:bg-burgundy-dark text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Analytics</span>
          </button>
        </div>
      </div>

      {/* Online vs Offline Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#E9DCC5] shadow-sm">
          <h3 className="font-serif text-lg font-bold text-dark mb-1">Attendance Delivery Channels</h3>
          <p className="text-xs text-dark-muted mb-6">Distribution between live video attendees and physical studio visits.</p>

          <div className="space-y-4">
            {attendanceBreakdown.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-dark">
                  <span>{item.label}</span>
                  <span>{item.count} check-ins ({item.percentage}%)</span>
                </div>
                <div className="w-full h-2.5 bg-cream rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${idx === 0 ? 'bg-indigo-600' : 'bg-amber-700'}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E9DCC5] shadow-sm">
          <h3 className="font-serif text-lg font-bold text-dark mb-1">Pass & Membership Health</h3>
          <p className="text-xs text-dark-muted mb-4">Retention and credit consumption velocity.</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-sage-50/70 border border-sage/40">
              <span className="text-xs text-dark-muted block">Active Passes</span>
              <span className="font-serif text-2xl font-bold text-sage-dark">312</span>
              <span className="text-[10px] text-sage-dark block mt-1">+18 new this month</span>
            </div>
            <div className="p-4 rounded-xl bg-red-50/70 border border-red-200/60">
              <span className="text-xs text-dark-muted block">Expired in 30d</span>
              <span className="font-serif text-2xl font-bold text-red-700">24</span>
              <span className="text-[10px] text-red-600 block mt-1">79% renewed pass</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Classes List */}
      <div className="bg-white rounded-2xl p-6 border border-[#E9DCC5] shadow-sm">
        <h3 className="font-serif text-lg font-bold text-dark mb-4">Most Popular Class Offerings</h3>
        {popularClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popularClasses.map((c, i) => (
              <div key={i} className="p-4 rounded-xl border border-[#E9DCC5]/70 bg-[#FAF6EE]/40 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-dark">{c.title}</h4>
                  <p className="text-xs text-dark-muted mt-0.5">Style: {c.category} &bull; Lead: {c.teacher}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cream text-burgundy border border-beige">
                  {c.attendance}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-dark-muted">
            No class offerings or bookings recorded yet. New sessions will appear here as schedules are populated.
          </div>
        )}
      </div>
    </div>
  );
};

