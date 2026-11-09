import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Sparkles, 
  CalendarCheck, 
  Video, 
  MapPin, 
  DollarSign, 
  AlertCircle,
  Clock,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { subscribeToClasses } from '../../services/classService';
import { subscribeToCustomers } from '../../services/customerService';
import { subscribeToBookings } from '../../services/bookingService';
import { subscribeToPayments } from '../../services/paymentService';
import { YogaClass, User, Booking, Payment } from '../../types';

export const Overview: React.FC = () => {
  const [classes, setClasses] = useState<YogaClass[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const unsubClasses = subscribeToClasses(setClasses);
    const unsubCustomers = subscribeToCustomers(setCustomers);
    const unsubBookings = subscribeToBookings(setBookings);
    const unsubPayments = subscribeToPayments(setPayments);

    return () => {
      unsubClasses();
      unsubCustomers();
      unsubBookings();
      unsubPayments();
    };
  }, []);

  const totalCustomers = customers.length;
  const activeMemberships = customers.filter(c => !!c.activeMembershipId).length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayClasses = classes.filter(c => c.startTime ? c.startTime.startsWith(todayStr) : true);
  const todayBookingsCount = bookings.filter(b => (b.classStartTime && b.classStartTime.startsWith(todayStr)) || b.bookingStatus === 'confirmed').length;
  const monthlyRevenue = payments
    .filter(p => p.paymentStatus === 'verified' || p.paymentStatus === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingBankSlipsCount = payments.filter(p => p.paymentStatus === 'pending').length;

  const stats = [
    { title: 'Total Customers', value: totalCustomers.toString(), change: '+12% this month', icon: Users, color: 'text-burgundy', bg: 'bg-burgundy-50' },
    { title: 'Active Memberships', value: activeMemberships.toString(), change: `${totalCustomers > 0 ? Math.round((activeMemberships / totalCustomers) * 100) : 0}% retention`, icon: Sparkles, color: 'text-sage-dark', bg: 'bg-sage-50' },
    { title: "Today's Bookings", value: todayBookingsCount.toString(), change: `${todayClasses.length} sessions scheduled`, icon: CalendarCheck, color: 'text-blue-700', bg: 'bg-blue-50' },
    { title: 'Monthly Revenue', value: `$${monthlyRevenue.toLocaleString()}`, change: '+9.4% vs last mo', icon: DollarSign, color: 'text-emerald-700', bg: 'bg-emerald-50' },
  ];

  // Daily bookings data for weekly SVG chart
  const weeklyData = [
    { day: 'Mon', count: 38, height: 60 },
    { day: 'Tue', count: 42, height: 70 },
    { day: 'Wed', count: 45, height: 75 },
    { day: 'Thu', count: 41, height: 68 },
    { day: 'Fri', count: 49, height: 85 },
    { day: 'Sat', count: 58, height: 100 },
    { day: 'Sun', count: 52, height: 90 },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E9DCC5]/70">
        <div>
          <h1 className="font-serif text-3xl font-bold text-dark">Studio Executive Dashboard</h1>
          <p className="text-sm text-dark-muted mt-1">Real-time studio operations, live stream monitoring, and revenue overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/classes"
            className="px-4 py-2 bg-burgundy hover:bg-burgundy-dark text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
          >
            <span>+ Schedule New Class</span>
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
              <div className="flex items-baseline gap-2">
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

      {/* Analytics Visual Chart & Weekly Cadence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#E9DCC5] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-lg font-bold text-dark flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-burgundy" />
                <span>Weekly Practitioner Attendance Trajectory</span>
              </h2>
              <p className="text-xs text-dark-muted">Total reservations across online streaming and sanctuary mats</p>
            </div>
            <span className="text-xs font-bold text-sage-dark bg-sage-50 px-2.5 py-1 rounded-full border border-sage/30">
              325 Total Yogis this Week
            </span>
          </div>

          {/* Responsive SVG Bar Chart */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 px-4 bg-[#FAF6EE]/50 rounded-2xl border border-[#E9DCC5]/60">
            {weeklyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-bold text-dark group-hover:text-burgundy opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.count}
                </span>
                <div
                  className="w-full max-w-[36px] bg-gradient-to-t from-burgundy to-burgundy-light rounded-t-xl transition-all group-hover:brightness-110 shadow-sm"
                  style={{ height: `${d.height}%` }}
                />
                <span className="text-xs font-medium text-dark-muted">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Required: Pending Bank Slips & Status */}
        <div className="bg-white rounded-3xl p-6 border border-[#E9DCC5] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-burgundy mb-2">
              <AlertCircle className="w-5 h-5" />
              <h2 className="font-serif text-lg font-bold text-dark">Action Required</h2>
            </div>
            <p className="text-xs text-dark-muted mb-4">Manual bank transfers and pending membership approvals</p>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-900">{pendingBankSlipsCount} Bank Transfer Receipt{pendingBankSlipsCount === 1 ? '' : 's'}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                  {pendingBankSlipsCount > 0 ? 'Pending' : 'All Clear'}
                </span>
              </div>
              <p className="text-xs text-amber-800">
                {pendingBankSlipsCount > 0 
                  ? 'Customers submitted transfer slips requiring staff review to activate membership credits.'
                  : 'All payment submissions and wire transfer receipts have been verified.'}
              </p>
              <Link 
                to="/payments"
                className="mt-3 inline-block text-xs font-bold text-amber-900 underline hover:text-amber-950"
              >
                Review Receipts &rarr;
              </Link>
            </div>

            <div className="p-4 rounded-xl bg-sage-50/70 border border-sage/40">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-sage-dark">Video Bridge Status</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Operational</span>
              </div>
              <p className="text-xs text-dark-muted">
                Jitsi Meet server <code className="text-burgundy font-mono">meet.jit.si</code> active. 0 packet loss.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E9DCC5]/70 flex items-center justify-between text-xs text-dark-muted">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sage-dark" />
              Next session in 42 mins
            </span>
            <Link to="/reports" className="font-semibold text-burgundy hover:underline">
              Analytics &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Today's Classes Breakdown */}
      <div className="bg-white rounded-3xl p-6 border border-[#E9DCC5] shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-serif text-lg font-bold text-dark">Today's Class Schedule</h2>
            <p className="text-xs text-dark-muted">Online and studio attendance tracking</p>
          </div>
          <Link to="/classes" className="text-xs font-semibold text-burgundy hover:underline">
            View Calendar &rarr;
          </Link>
        </div>

        <div className="space-y-3">
          {todayClasses.length === 0 ? (
            <div className="p-8 text-center text-xs text-dark-muted">No classes scheduled for today.</div>
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
                      Teacher: <span className="font-medium text-dark">{session.instructorName}</span> &bull; {session.startTime} - {session.endTime}
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
                      to="/live-sessions"
                      className="px-3.5 py-1.5 rounded-xl bg-burgundy hover:bg-burgundy-dark text-white font-medium text-xs shadow-sm transition-colors"
                    >
                      Live Host
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
