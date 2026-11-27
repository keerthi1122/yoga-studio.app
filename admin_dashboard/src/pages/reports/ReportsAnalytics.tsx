import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { YogaClass, Booking, User, Payment, MembershipEnquiry } from '../../types';
import { subscribeToClasses } from '../../services/classService';
import { subscribeToBookings } from '../../services/bookingService';
import { subscribeToCustomers } from '../../services/customerService';
import { subscribeToPayments } from '../../services/paymentService';
import { subscribeToEnquiries } from '../../services/membershipService';
import { escapeCsvCell } from '../../utils/security';

export const ReportsAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [classes, setClasses] = useState<YogaClass[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [enquiries, setEnquiries] = useState<MembershipEnquiry[]>([]);

  useEffect(() => {
    const unsubClasses = subscribeToClasses(setClasses);
    const unsubBookings = subscribeToBookings(setBookings);
    const unsubCustomers = subscribeToCustomers(setCustomers);
    const unsubPayments = subscribeToPayments(setPayments);
    const unsubEnquiries = subscribeToEnquiries(setEnquiries);
    return () => {
      unsubClasses();
      unsubBookings();
      unsubCustomers();
      unsubPayments();
      unsubEnquiries();
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

  const activePassHolders = customers.filter(c => c.status === 'active' && !!c.activeMembershipId).length;
  const suspendedOrZeroCredits = customers.filter(c => c.status === 'suspended' || (c.remainingCredits || 0) <= 0).length;
  const verifiedRevenue = payments
    .filter(p => p.paymentStatus === 'verified' || p.paymentStatus === 'paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const publicOrdersCount = enquiries.filter(e => e.submissionType === 'purchase').length;

  const popularClasses = [...classes]
    .sort((a, b) => (b.bookedSeats || 0) - (a.bookedSeats || 0))
    .slice(0, 4)
    .map(c => ({
      title: c.title,
      category: c.category,
      attendance: c.capacity > 0 ? `${Math.round(((c.bookedSeats || 0) / c.capacity) * 100)}% capacity (${c.bookedSeats}/${c.capacity})` : '0 booked',
      teacher: c.instructorName || 'Lead Instructor'
    }));

  const handleExportSummary = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Time Range', timeRange],
      ['Total Bookings', String(totalBookingsCount)],
      ['Online Video Check-ins', String(onlineBookingsCount)],
      ['Studio Check-ins', String(offlineBookingsCount)],
      ['Active Membership Holders', String(activePassHolders)],
      ['Public Website Purchases', String(publicOrdersCount)],
      ['Verified Revenue (INR)', String(verifiedRevenue)],
    ];
    const csvContent = rows.map(r => r.map(escapeCsvCell).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gvya_analytics_report_${timeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E9DCC5]/70">
        <div>
          <h1 className="font-serif text-3xl font-bold text-dark">Studio Analytics & Performance</h1>
          <p className="text-sm text-dark-muted mt-1">Real-time attendance channels, member conversions, and verified revenue trends.</p>
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

      {/* Online vs Offline Split & Membership Health */}
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
          <h3 className="font-serif text-lg font-bold text-dark mb-1">Live Revenue & Membership Health</h3>
          <p className="text-xs text-dark-muted mb-4">Synchronized across public purchases, enquiries, and active passes.</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-sage-50/70 border border-sage/40">
              <span className="text-xs text-dark-muted block">Active Pass Holders</span>
              <span className="font-serif text-2xl font-bold text-sage-dark">{activePassHolders}</span>
              <span className="text-[10px] text-sage-dark block mt-1">{publicOrdersCount} online web orders</span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
              <span className="text-xs text-dark-muted block">Settled Revenue</span>
              <span className="font-serif text-2xl font-bold text-emerald-800">₹{verifiedRevenue.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-emerald-700 block mt-1">{suspendedOrZeroCredits} need renewal</span>
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
            No class offerings or bookings recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};
