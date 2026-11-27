import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Globe, DollarSign, Video, AlertCircle } from 'lucide-react';
import { StudioSettings } from '../../types';
import { subscribeToStudioSettings, updateStudioSettings } from '../../services/studioService';

export const StudioSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<StudioSettings>({
    studioName: 'Guinness Vijay Yoga Academy (GVYA)',
    tagline: 'World-Record Yogic Alignment, Kids Agility & Pro Props Mastery.',
    contactEmail: 'admissions@gvyayoga.com',
    contactPhone: '+91 98400 12345',
    address: {
      street: '108 Temple Road, Mylapore',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '600004',
      country: 'India'
    },
    currency: 'INR',
    currencySymbol: '₹',
    timezone: 'Asia/Kolkata',
    cancellationPolicyHours: 12,
    allowSingleClassDropIn: true,
    jitsiDefaultServer: 'meet.jit.si'
  });

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToStudioSettings((liveSettings) => {
      setSettings(liveSettings);
    }, settings);

    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateStudioSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      console.error('Failed to update studio settings:', err);
      setError(err?.message || 'Could not update studio settings. Please verify Firestore access.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E9DCC5]/70">
        <div>
          <h1 className="font-serif text-3xl font-bold text-dark">Studio Configuration & Policies</h1>
          <p className="text-sm text-dark-muted mt-1">Configure global branding, localization currency, and live video domain.</p>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Studio settings updated and synchronized with mobile application!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Brand Details Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E9DCC5] shadow-sm space-y-4">
          <h3 className="font-serif text-lg font-bold text-dark flex items-center gap-2">
            <Globe className="w-5 h-5 text-burgundy" />
            <span>Studio Identity & Branding</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-dark-muted mb-1">Studio Name</label>
              <input
                type="text"
                value={settings.studioName}
                onChange={(e) => setSettings({...settings, studioName: e.target.value})}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs text-dark focus:outline-none focus:border-burgundy"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-dark-muted mb-1">Wellness Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({...settings, tagline: e.target.value})}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs text-dark focus:outline-none focus:border-burgundy"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-dark-muted mb-1">Contact Email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs text-dark focus:outline-none focus:border-burgundy"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-dark-muted mb-1">Contact Phone</label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({...settings, contactPhone: e.target.value})}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs text-dark focus:outline-none focus:border-burgundy"
              />
            </div>
          </div>
        </div>

        {/* Currency & Localization */}
        <div className="bg-white rounded-2xl p-6 border border-[#E9DCC5] shadow-sm space-y-4">
          <h3 className="font-serif text-lg font-bold text-dark flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-burgundy" />
            <span>Currency & Regional Localization</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-dark-muted mb-1">Currency Code</label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({
                  ...settings, 
                  currency: e.target.value,
                  currencySymbol: e.target.value === 'USD' ? '$' : e.target.value === 'HKD' ? 'HK$' : e.target.value === 'INR' ? '₹' : '€'
                })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs text-dark focus:outline-none focus:border-burgundy"
              >
                <option value="USD">USD - US Dollar ($)</option>
                <option value="HKD">HKD - Hong Kong Dollar (HK$)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="INR">INR - Indian Rupee (₹)</option>
                <option value="GBP">GBP - British Pound (£)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-dark-muted mb-1">Currency Symbol</label>
              <input
                type="text"
                value={settings.currencySymbol}
                onChange={(e) => setSettings({...settings, currencySymbol: e.target.value})}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs text-dark focus:outline-none focus:border-burgundy"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-dark-muted mb-1">Studio Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs text-dark focus:outline-none focus:border-burgundy"
              >
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Asia/Hong_Kong">Asia/Hong_Kong (HKT)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Video & Policies */}
        <div className="bg-white rounded-2xl p-6 border border-[#E9DCC5] shadow-sm space-y-4">
          <h3 className="font-serif text-lg font-bold text-dark flex items-center gap-2">
            <Video className="w-5 h-5 text-burgundy" />
            <span>Jitsi Video Bridge & Cancellation Policies</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-dark-muted mb-1">Jitsi Live Bridge Server</label>
              <input
                type="text"
                value={settings.jitsiDefaultServer}
                onChange={(e) => setSettings({...settings, jitsiDefaultServer: e.target.value})}
                placeholder="meet.jit.si or custom self-hosted domain"
                className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs text-dark focus:outline-none focus:border-burgundy"
              />
              <span className="text-[10px] text-dark-muted mt-1 block">Default: meet.jit.si (or self-hosted / 8x8 JaaS)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-dark-muted mb-1">Cancellation Cutoff (Hours)</label>
              <input
                type="number"
                min="0"
                max="72"
                value={settings.cancellationPolicyHours}
                onChange={(e) => setSettings({...settings, cancellationPolicyHours: Number(e.target.value)})}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs text-dark focus:outline-none focus:border-burgundy"
              />
              <span className="text-[10px] text-dark-muted mt-1 block">Cancel before this threshold to restore customer credit</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-burgundy hover:bg-burgundy-dark disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-burgundy/20 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Studio Settings'}</span>
        </button>
      </form>
    </div>
  );
};

