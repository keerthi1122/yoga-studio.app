import React, { useState, useEffect } from 'react';
import { Search, Download } from 'lucide-react';
import { Booking } from '../../types';
import { subscribeToBookings, cancelBookingByAdmin } from '../../services/bookingService';
import { escapeCsvCell } from '../../utils/security';

export const BookingList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToBookings((liveList) => {
      setBookings(liveList);
    });
    return () => unsubscribe();
  }, []);

  const handleCancelBooking = async (booking: Booking) => {
    if (!confirm(`Are you sure you want to cancel booking ${booking.bookingId} and restore credit?`)) return;

    try {
      await cancelBookingByAdmin(booking);
    } catch (_) {}
  };

  const filtered = bookings.filter(b => {
    const matchesSearch = b.userFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.classTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.bookingId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.bookingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportCSV = () => {
    const headers = ['Booking ID,Customer,Email,Class,Type,Start Time,Status,Payment'];
    const rows = filtered.map(b =>
      [
        b.bookingId,
        b.userFullName,
        b.userEmail,
        b.classTitle,
        b.bookingType,
        b.classStartTime,
        b.bookingStatus,
        b.paymentStatus,
      ].map(escapeCsvCell).join(',')
    );
    const blob = new Blob([[...headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gvya_bookings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E9DCC5]/70">
        <div>
          <h1 className="font-serif text-3xl font-bold text-dark">Bookings & Class Reservations</h1>
          <p className="text-sm text-dark-muted mt-1">Audit customer bookings, video/studio check-ins, and session credit debits.</p>
        </div>
        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-white border border-[#E9DCC5] hover:bg-cream text-dark rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4 text-dark-muted" />
          <span>Export Safe CSV Ledger</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#E9DCC5] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, booking ID, or class..."
            className="w-full pl-10 pr-4 py-2 bg-cream/30 border border-[#E9DCC5] rounded-xl text-xs text-dark focus:outline-none focus:border-burgundy"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-dark-muted">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#E9DCC5] bg-cream/30 text-xs text-dark focus:outline-none focus:border-burgundy"
          >
            <option value="all">All Bookings</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="attended">Attended</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-[#E9DCC5] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6EE] border-b border-[#E9DCC5] uppercase tracking-wider text-dark-muted font-bold">
              <tr>
                <th className="py-3.5 px-4">Booking Ref</th>
                <th className="py-3.5 px-4">Practitioner</th>
                <th className="py-3.5 px-4">Yoga Class</th>
                <th className="py-3.5 px-4">Mode</th>
                <th className="py-3.5 px-4">Scheduled Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9DCC5]/60">
              {filtered.map((b) => (
                <tr key={b.bookingId} className="hover:bg-[#FAF6EE]/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-burgundy">{b.bookingId}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-dark">{b.userFullName}</p>
                    <p className="text-[11px] text-dark-muted">{b.phone || b.userEmail}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-dark">{b.classTitle}</p>
                    <p className="text-[11px] text-dark-muted">Teacher: {b.instructorName}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      b.bookingType === 'online' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {b.bookingType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-dark font-medium">
                    {new Date(b.classStartTime).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      b.bookingStatus === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                      b.bookingStatus === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-cream text-dark'
                    }`}>
                      {b.bookingStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {b.bookingStatus === 'confirmed' && (
                      <button
                        onClick={() => handleCancelBooking(b)}
                        className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
