import React, { useState, useEffect } from 'react';
import { Plus, Check, Edit2, X } from 'lucide-react';
import { Package, BookingType } from '../../types';
import { 
  subscribeToPackages, 
  createPackage, 
  updatePackage, 
  togglePackageActive 
} from '../../services/packageService';
import { formatCurrency, getSymbolForCurrency } from '../../utils/formatters';

export const PackageList: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState(100);
  const [formCredits, setFormCredits] = useState(10);
  const [formValidity, setFormValidity] = useState(60);
  const [formUnlimited, setFormUnlimited] = useState(false);
  const [formBookingTypes, setFormBookingTypes] = useState<BookingType[]>(['online', 'offline']);

  useEffect(() => {
    const unsubscribe = subscribeToPackages((liveList) => {
      setPackages(liveList);
    });
    return () => unsubscribe();
  }, []);

  const openCreateModal = () => {
    setEditingPkg(null);
    setFormName('');
    setFormDescription('');
    setFormPrice(120);
    setFormCredits(5);
    setFormValidity(45);
    setFormUnlimited(false);
    setFormBookingTypes(['online', 'offline']);
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: Package) => {
    setEditingPkg(pkg);
    setFormName(pkg.name);
    setFormDescription(pkg.description);
    setFormPrice(pkg.price);
    setFormCredits(pkg.credits);
    setFormValidity(pkg.validityDays);
    setFormUnlimited(pkg.unlimited);
    setFormBookingTypes(pkg.eligibleBookingTypes);
    setIsModalOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPkg) {
      try {
        await updatePackage(editingPkg.packageId, {
          name: formName,
          description: formDescription,
          price: Number(formPrice),
          credits: formUnlimited ? -1 : Number(formCredits),
          validityDays: Number(formValidity),
          unlimited: formUnlimited,
          eligibleBookingTypes: formBookingTypes,
        });
      } catch (_) {
        setPackages(
          packages.map((p) =>
            p.packageId === editingPkg.packageId
              ? {
                  ...p,
                  name: formName,
                  description: formDescription,
                  price: Number(formPrice),
                  credits: formUnlimited ? -1 : Number(formCredits),
                  validityDays: Number(formValidity),
                  unlimited: formUnlimited,
                  eligibleBookingTypes: formBookingTypes,
                }
              : p
          )
        );
      }
    } else {
      const newPkgData = {
        name: formName,
        description: formDescription,
        price: Number(formPrice),
        currency: 'USD',
        credits: formUnlimited ? -1 : Number(formCredits),
        validityDays: Number(formValidity),
        unlimited: formUnlimited,
        eligibleCategories: ['all'],
        eligibleBookingTypes: formBookingTypes,
        startDateRules: 'immediate' as const,
        active: true,
      };

      try {
        await createPackage(newPkgData);
      } catch (_) {
        setPackages([...packages, { ...newPkgData, packageId: `pkg_${Date.now()}` }]);
      }
    }
    setIsModalOpen(false);
  };

  const toggleArchive = async (pkg: Package) => {
    try {
      await togglePackageActive(pkg.packageId, pkg.active);
    } catch (_) {
      setPackages(
        packages.map((p) => (p.packageId === pkg.packageId ? { ...p, active: !p.active } : p))
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E9DCC5]/70">
        <div>
          <h1 className="font-serif text-3xl font-bold text-dark">Packages, Passes & Memberships</h1>
          <p className="text-sm text-dark-muted mt-1">Configure pricing tiers, session credit allotments, and validity durations.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-burgundy hover:bg-burgundy-dark text-white rounded-xl text-xs font-semibold shadow-md shadow-burgundy/20 flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Package</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.packageId}
            className={`bg-white rounded-3xl p-6 border flex flex-col justify-between shadow-sm transition-all ${
              !pkg.active
                ? 'border-zinc-200 opacity-60'
                : pkg.unlimited
                ? 'border-burgundy/50 ring-1 ring-burgundy/20 hover:shadow-md'
                : 'border-[#E9DCC5] hover:shadow-md'
            }`}
          >
            <div>
              {pkg.unlimited && (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-burgundy-50 text-burgundy mb-3">
                  Most Popular
                </span>
              )}
              <h3 className="font-serif text-xl font-bold text-dark">{pkg.name}</h3>
              <p className="text-xs text-dark-muted mt-1.5 min-h-[36px]">{pkg.description}</p>

              <div className="mt-4 mb-6">
                <span className="font-serif text-3xl font-bold text-dark">
                  {formatCurrency(pkg.price, getSymbolForCurrency(pkg.currency), pkg.currency)}
                </span>
                <span className="text-xs text-dark-muted ml-1">/ {pkg.validityDays} days</span>
              </div>

              <div className="space-y-2.5 text-xs text-dark-muted border-t border-[#E9DCC5]/70 pt-4">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sage-dark shrink-0" />
                  <span>{pkg.unlimited ? 'Unlimited class bookings' : `${pkg.credits} Session Credits`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sage-dark shrink-0" />
                  <span>Valid for {pkg.eligibleBookingTypes.join(' & ')} classes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sage-dark shrink-0" />
                  <span>Start rule: {pkg.startDateRules === 'immediate' ? 'Upon purchase' : 'First booked class'}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E9DCC5]/70 flex items-center justify-between">
              <button
                onClick={() => toggleArchive(pkg)}
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded transition-colors ${
                  pkg.active ? 'bg-emerald-50 text-emerald-700 hover:bg-zinc-100' : 'bg-zinc-100 text-zinc-600 hover:bg-emerald-50'
                }`}
              >
                {pkg.active ? 'Active on Mobile' : 'Archived (Hidden)'}
              </button>
              <button
                onClick={() => openEditModal(pkg)}
                className="text-xs font-semibold text-burgundy hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Package Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-[#E9DCC5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E9DCC5]">
              <h2 className="font-serif text-xl font-bold text-dark">
                {editingPkg ? 'Edit Package Configuration' : 'Create New Pass Tier'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-cream text-dark-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-dark-muted uppercase mb-1">Package Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. 5-Session Seasonal Pass"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs focus:outline-none focus:border-burgundy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-muted uppercase mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Description of eligible practices and perks..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs focus:outline-none focus:border-burgundy"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dark-muted uppercase mb-1">Price ($ USD)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs focus:outline-none focus:border-burgundy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark-muted uppercase mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formValidity}
                    onChange={(e) => setFormValidity(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs focus:outline-none focus:border-burgundy"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-cream/30 rounded-xl border border-[#E9DCC5]">
                <input
                  type="checkbox"
                  id="unlimitedCheck"
                  checked={formUnlimited}
                  onChange={(e) => setFormUnlimited(e.target.checked)}
                  className="rounded text-burgundy focus:ring-burgundy"
                />
                <label htmlFor="unlimitedCheck" className="text-xs font-semibold text-dark cursor-pointer">
                  Unlimited Class Access (No credit count limit)
                </label>
              </div>

              {!formUnlimited && (
                <div>
                  <label className="block text-xs font-semibold text-dark-muted uppercase mb-1">Session Credits Included</label>
                  <input
                    type="number"
                    min="1"
                    value={formCredits}
                    onChange={(e) => setFormCredits(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs focus:outline-none focus:border-burgundy"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-dark-muted uppercase mb-1">Applicable Delivery Modes</label>
                <div className="flex items-center gap-4 text-xs text-dark mt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formBookingTypes.includes('online')}
                      onChange={(e) => {
                        if (e.target.checked) setFormBookingTypes([...formBookingTypes, 'online']);
                        else setFormBookingTypes(formBookingTypes.filter((t) => t !== 'online'));
                      }}
                      className="rounded text-burgundy"
                    />
                    Online Live Streams
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formBookingTypes.includes('offline')}
                      onChange={(e) => {
                        if (e.target.checked) setFormBookingTypes([...formBookingTypes, 'offline']);
                        else setFormBookingTypes(formBookingTypes.filter((t) => t !== 'offline'));
                      }}
                      className="rounded text-burgundy"
                    />
                    In-Person Studio
                  </label>
                </div>
              </div>

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
                  {editingPkg ? 'Update Package' : 'Save & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
