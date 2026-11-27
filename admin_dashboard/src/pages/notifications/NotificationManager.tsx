import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, Clock, Megaphone } from 'lucide-react';
import { StudioNotification } from '../../types';
import { subscribeToNotifications, sendStudioNotification } from '../../services/notificationService';

export const NotificationManager: React.FC = () => {
  const [notifications, setNotifications] = useState<StudioNotification[]>([]);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'announcement' | 'schedule_change' | 'reminder' | 'payment'>('announcement');
  const [targetAudience, setTargetAudience] = useState<'all_customers' | 'active_members' | 'today_attendees'>('all_customers');
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    return subscribeToNotifications(setNotifications);
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    await sendStudioNotification({
      title: title.trim(),
      message: message.trim(),
      type,
      targetAudience,
    });

    setTitle('');
    setMessage('');
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 4000);
  };

  return (
    <div className="space-y-8 page-enter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E9DCC5]/70">
        <div>
          <h1 className="font-serif text-3xl font-bold text-dark">Studio Broadcast & Push Notifications</h1>
          <p className="text-sm text-dark-muted mt-1">
            Dispatch real-time announcements synced directly to the public website ticker and practitioner apps.
          </p>
        </div>
      </div>

      {sentSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Notification broadcasted and persisted to live public ticker!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Notification Composer Form */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-[#E9DCC5] shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-burgundy">
            <Megaphone className="w-5 h-5" />
            <h2 className="font-serif text-lg font-bold text-dark">Compose Broadcast</h2>
          </div>
          <p className="text-xs text-dark-muted mb-6">
            The latest broadcast appears on the top announcement bar of the public GVYA website and mobile clients.
          </p>

          <form onSubmit={handleSendNotification} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-dark-muted mb-1">Alert Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs text-dark focus:outline-none focus:border-burgundy"
              >
                <option value="announcement">Studio Announcement</option>
                <option value="schedule_change">Class Schedule Change</option>
                <option value="reminder">Booking / Expiry Reminder</option>
                <option value="payment">Payment & Offer Notice</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-dark-muted mb-1">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs text-dark focus:outline-none focus:border-burgundy"
              >
                <option value="all_customers">All Public Visitors & Yogis</option>
                <option value="active_members">Active Pass Holders Only</option>
                <option value="today_attendees">Today's Registered Students</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-dark-muted mb-1">Notification Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekend Aerial Silk Workshop Open!"
                className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs text-dark focus:outline-none focus:border-burgundy"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-dark-muted mb-1">Message Content</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter message to share with visitors and members..."
                className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs text-dark focus:outline-none focus:border-burgundy"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-burgundy hover:bg-burgundy-dark text-white rounded-xl text-xs font-semibold shadow-md shadow-burgundy/20 flex items-center justify-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Publish Broadcast</span>
            </button>
          </form>
        </div>

        {/* Sent Notification History */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#E9DCC5] shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-serif text-lg font-bold text-dark">Recent Broadcast History</h2>
              <p className="text-xs text-dark-muted">Persisted chronological record of active broadcasts</p>
            </div>
            <span className="text-xs font-semibold text-dark-muted">
              Total Sent: <strong className="text-burgundy">{notifications.length}</strong>
            </span>
          </div>

          <div className="space-y-3.5">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 rounded-2xl border border-[#E9DCC5]/70 bg-[#FAF6EE]/40 hover:border-burgundy/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        notif.type === 'announcement'
                          ? 'bg-purple-100 text-purple-800'
                          : notif.type === 'schedule_change'
                          ? 'bg-amber-100 text-amber-800'
                          : notif.type === 'reminder'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {notif.type.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-dark-muted font-medium">
                      Audience: {notif.targetAudience.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[11px] text-dark-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {notif.sentAt}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-dark mb-1">{notif.title}</h3>
                <p className="text-xs text-dark-muted leading-relaxed">{notif.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
