import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Sparkles, 
  CalendarCheck, 
  Video, 
  MapPin, 
  IndianRupee, 
  AlertCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  ShoppingBag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { subscribeToClasses } from '../../services/classService';
import { subscribeToCustomers } from '../../services/customerService';
import { subscribeToBookings } from '../../services/bookingService';
import { subscribeToPayments } from '../../services/paymentService';
import { subscribeToEnquiries } from '../../services/membershipService';
import { YogaClass, User, Booking, Payment, MembershipEnquiry } from '../../types';

export const Overview: React.FC = () => {
  const [classes, setClasses] = useState<YogaClass[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [enquiries, setEnquiries] = useState<MembershipEnquiry[]>([]);

  useEffect(() => {
    const unsubClasses = subscribeToClasses(setClasses);
    const unsubCustomers = subscribeToCustomers(setCustomers);
    const unsubBookings = subscribeToBookings(setBookings);
    const unsubPayments = subscribeToPayments(setPayments);
    const unsubEnquiries = subscribeToEnquiries(setEnquiries);

    return () => {
      unsubClasses();
      unsubCustomers();
      unsubBookings();
      unsubPayments();
      unsubEnquiries();
    };
  }, []);

  const totalCustomers = customers.length;
  const activeMemberships = customers.filter(c => !!c.activeMembershipId).length;
  const confirmedBookings = bookings.filter(b => b.bookingStatus === 'confirmed' || b.bookingStatus === 'attended');
  const todayClasses = classes.filter(c => c.status !== 'cancelled');
  const totalRevenue = payments
    .filter(p => p.paymentStatus === 'verified' || p.paymentStatus === 'paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const pendingPaymentsCount = payments.filter(p => p.paymentStatus === 'pending').length;
  const publicPurchasesCount = enquiries.filter(e => e.submissionType === 'purchase').length;
  const newTrialsCount = enquiries.filter(e => e.status === 'new').length;

  const stats = [
    {
      title: 'Total Members',
      value: totalCustomers.toString(),
      change: `${activeMemberships} with active plans`,
      icon: Users,
      color: 'text-burgundy',
      bg: 'bg-burgundy-50',
    },
    {
      title: 'Plan Conversion',
      value: `${totalCustomers > 0 ? Math.round((activeMemberships / totalCustomers) * 100) : 0}%`,
      change: `${publicPurchasesCount} public online orders`,
      icon: Sparkles,
      color: 'text-sage-dark',
      bg: 'bg-sage-50',
    },
    {
      title: 'Active Bookings',
      value: confirmedBookings.length.toString(),
      change: `${todayClasses.length} active sessions`,
      icon: CalendarCheck,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
    },
    {
      title: 'Collected Revenue',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      change: `${payments.filter(p => p.paymentStatus === 'verified' || p.paymentStatus === 'paid').length} settled payments`,
      icon: IndianRupee,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
  ];

  // Live class occupancy bar chart data
  const classChartData = classes.slice(0, 6).map((c) => {
    const pct = c.capacity > 0 ? Math.min(100, Math.round(((c.bookedSeats || 0) / c.capacity) * 100)) : 0;
    return {
      label: c.category.split(' ')[0] || 'Yoga',
      title: c.title,
      count: c.bookedSeats || 0,
      height: Math.max(12, pct),
    };
  });

  const recentPublicOrders = [...enquiries, ...payments.slice(0, 3).map((p): MembershipEnquiry => ({
    enquiryId: p.paymentId,
    submissionType: 'purchase',
    fullName: p.userFullName,
    phone: p.phone || 'Verified Member',
    email: p.email,
    category: p.packageId.includes('kid') ? 'kids' : 'pro',
    planId: p.packageId,
    planName: p.packageName,
    amountPaid: p.amount,
    paymentMethod: p.paymentMethod === 'bank_transfer' ? 'bank_transfer' : p.paymentMethod === 'card' ? 'card' : 'upi',
    transactionId: p.transactionId,
    paymentStatus: p.paymentStatus,
    selectedProps: p.selectedChoices ? [p.selectedChoices] : [],
    isFreeTrial: false,
    status: p.paymentStatus === 'verified' || p.paymentStatus === 'paid' ? 'enrolled' : 'new',
    createdAt: p.createdAt,
  }))].slice(0, 6);

  return (
    <div className="space-y-8 page-enter">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E9DCC5]/70">
        <div>
          <h1 className="font-serif text-3xl font-bold text-dark">Studio Executive Dashboard</h1>
          <p className="text-sm text-dark-muted mt-1">
            Live sync of public purchases, chosen plans, payments received, class bookings, and streaming rooms.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/memberships"
            className="px-4 py-2 bg-white border border-[#E9DCC5] hover:border-burgundy text-dark rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            View Member Purchases ({enquiries.length})
          </Link>
          <Link
            to="/admin/classes"
            className="px-4 py-2 bg-burgundy hover:bg-burgundy-dark text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
          >
            <span>+ Schedule Class</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl p-5 border border-[#E9DCC5] shadow-sm hover:shadow transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-dark-muted uppercase tracking-wider">{s.title}</span>
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-serif font-bold text-dark">{s.value}</span>
                <span className="text-[11px] font-medium text-sage-dark flex items-center">
                  <ArrowUpRight className="w-3 h-3 inline" />
                  {s.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Public Purchases & Selections Feed */}
      <div className="bg-white rounded-3xl p-6 border border-[#E9DCC5] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="font-serif text-lg font-bold text-dark flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-burgundy" />
              <span>What Members Bought, Chose & Paid (Live Public Sync)</span>
            </h2>
            <p className="text-xs text-dark-muted">
              Every plan purchase, training mode, prop selection, free trial, and payment submitted on the public site appears here immediately.
            </p>
          </div>
          <Link to="/admin/payments" className="text-xs font-semibold text-burgundy hover:underline">
            Full Payment Ledger &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6EE] border-b border-[#E9DCC5] uppercase tracking-wider text-dark-muted font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">Member / Buyer</th>
                <th className="py-3 px-4">Plan / Item Bought</th>
                <th className="py-3 px-4">Mode & Props Chosen</th>
                <th className="py-3 px-4">Paid Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9DCC5]/60">
              {recentPublicOrders.map((item) => (
                <tr key={item.enquiryId} className="hover:bg-[#FAF6EE]/40">
                  <td className="py-3 px-4">
                    <p className="font-bold text-dark">{item.fullName}</p>
                    <p className="text-[11px] text-dark-muted">{item.phone}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-dark">{item.planName || 'Consultation'}</p>
                    {item.transactionId && (
                      <span className="text-[10px] font-mono text-dark-muted">Ref: {item.transactionId}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {item.selectedMode && (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold uppercase text-[10px]">
                          {item.selectedMode}
                        </span>
                      )}
                      {item.selectedProps?.slice(0, 2).map((p, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-cream text-dark text-[10px] border border-beige">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-dark">
                    {(item.amountPaid || 0) > 0 ? (
                      <span className="text-emerald-700 font-serif text-sm">₹{(item.amountPaid || 0).toLocaleString('en-IN')}</span>
                    ) : (
                      <span className="text-blue-700 text-[11px]">₹0 (Trial / Booking)</span>
                    )}
                    {item.paymentMethod && item.paymentMethod !== 'free_trial' && (
                      <span className="block text-[10px] text-dark-muted uppercase">{item.paymentMethod}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.status === 'enrolled' || item.paymentStatus === 'verified'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Visual Chart & Action Required */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#E9DCC5] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-lg font-bold text-dark flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-burgundy" />
                <span>Live Batch Seat Occupancy</span>
              </h2>
              <p className="text-xs text-dark-muted">Real-time booked seats across active studio and video classes</p>
            </div>
            <span className="text-xs font-bold text-sage-dark bg-sage-50 px-2.5 py-1 rounded-full border border-sage/30">
              {classes.reduce((acc, c) => acc + (c.bookedSeats || 0), 0)} Total Enrolled Seats
            </span>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 px-4 bg-[#FAF6EE]/50 rounded-2xl border border-[#E9DCC5]/60">
            {classChartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group" title={d.title}>
                <span className="text-[10px] font-bold text-dark group-hover:text-burgundy transition-opacity">
                  {d.count}
                </span>
                <div
                  className="w-full max-w-[40px] bg-gradient-to-t from-burgundy to-burgundy-light rounded-t-xl transition-all group-hover:brightness-110 shadow-sm"
                  style={{ height: `${d.height}%` }}
                />
                <span className="text-[11px] font-medium text-dark-muted truncate max-w-full">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Required */}
        <div className="bg-white rounded-3xl p-6 border border-[#E9DCC5] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-burgundy mb-2">
              <AlertCircle className="w-5 h-5" />
              <h2 className="font-serif text-lg font-bold text-dark">Action Required</h2>
            </div>
            <p className="text-xs text-dark-muted mb-4">Pending payments, trial leads, and live broadcast controls</p>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-900">{pendingPaymentsCount} Pending Payment{pendingPaymentsCount === 1 ? '' : 's'}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                  {pendingPaymentsCount > 0 ? 'Review' : 'All Clear'}
                </span>
              </div>
              <p className="text-xs text-amber-800">
                {newTrialsCount} new trial enquiries &bull; {pendingPaymentsCount} payment verification(s) queued.
              </p>
              <Link
                to="/admin/payments"
                className="mt-3 inline-block text-xs font-bold text-amber-900 underline hover:text-amber-950"
              >
                Review Payments &rarr;
              </Link>
            </div>

            <div className="p-4 rounded-xl bg-sage-50/70 border border-sage/40">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-sage-dark">Video Bridge Status</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Operational</span>
              </div>
              <p className="text-xs text-dark-muted">
                Jitsi Meet server <code className="text-burgundy font-mono">meet.jit.si</code> active for live classes.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E9DCC5]/70 flex items-center justify-between text-xs text-dark-muted">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sage-dark" />
              {classes.filter(c => c.bookingType === 'online').length} online video rooms ready
            </span>
            <Link to="/admin/live-sessions" className="font-semibold text-burgundy hover:underline">
              Live Console &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Classes */}
      <div className="bg-white rounded-3xl p-6 border border-[#E9DCC5] shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-serif text-lg font-bold text-dark">Active Class Schedule</h2>
            <p className="text-xs text-dark-muted">Online video calls and in-studio attendance</p>
          </div>
          <Link to="/admin/classes" className="text-xs font-semibold text-burgundy hover:underline">
            Manage Schedule &rarr;
          </Link>
        </div>

        <div className="space-y-3">
          {todayClasses.length === 0 ? (
            <div className="p-8 text-center text-xs text-dark-muted">No classes scheduled.</div>
          ) : (
            todayClasses.map((session) => (
              <div
                key={session.classId}
                className="p-4 rounded-2xl border border-[#E9DCC5]/70 bg-[#FAF6EE]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-burgundy/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-2 rounded-xl ${session.bookingType === 'online' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-800'}`}>
                    {session.bookingType === 'online' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-dark">{session.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        session.status === 'live' ? 'bg-red-100 text-red-700 animate-pulse' :
                        session.bookedSeats >= session.capacity ? 'bg-zinc-100 text-zinc-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        {session.bookedSeats >= session.capacity ? 'Full' : session.status}
                      </span>
                    </div>
                    <p className="text-xs text-dark-muted mt-0.5">
                      Teacher: <span className="font-medium text-dark">{session.instructorName}</span> &bull; {new Date(session.startTime).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs self-end sm:self-auto">
                  <div className="text-right">
                    <span className="font-semibold text-dark">{session.bookedSeats} / {session.capacity}</span>
                    <p className="text-[10px] text-dark-muted">Registered</p>
                  </div>
                  {session.bookingType === 'online' && (
                    <Link
                      to="/admin/live-sessions"
                      className="px-3.5 py-1.5 rounded-xl bg-burgundy hover:bg-burgundy-dark text-white font-medium text-xs shadow-sm transition-colors"
                    >
                      Launch Host
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
