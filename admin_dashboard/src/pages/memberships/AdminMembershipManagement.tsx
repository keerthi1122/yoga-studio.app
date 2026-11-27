import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Users, 
  Layers, 
  Award, 
  Search, 
  Phone, 
  Mail, 
  MessageCircle, 
  RefreshCw, 
  AlertCircle,
  ExternalLink,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { MembershipPlan, MembershipCategory, MembershipEnquiry } from '../../types';
import { 
  subscribeToMembershipPlans, 
  createMembershipPlan, 
  updateMembershipPlan, 
  deleteMembershipPlan, 
  toggleMembershipPlanActive, 
  seedDefaultMembershipPlans,
  subscribeToEnquiries,
  updateEnquiryStatus,
  convertEnquiryToActiveMember
} from '../../services/membershipService';

export const AdminMembershipManagement: React.FC = () => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [enquiries, setEnquiries] = useState<MembershipEnquiry[]>([]);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'all' | 'kids' | 'pro' | 'enquiries'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);

  // Delete Confirmation State
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<MembershipCategory>('kids');
  const [formDurationMonths, setFormDurationMonths] = useState(1);
  const [formDurationLabel, setFormDurationLabel] = useState('1 MONTH');
  const [formMonthlyPrice, setFormMonthlyPrice] = useState(2500);
  const [formTotalPrice, setFormTotalPrice] = useState(2500);
  const [autoCalculateTotal, setAutoCalculateTotal] = useState(true);
  const [formWeeklyFrequency, setFormWeeklyFrequency] = useState('Weekly 3 Days');
  const [formIncludedClasses, setFormIncludedClasses] = useState('Kids Foundation Yoga, Posture Alignment');
  const [formFeatures, setFormFeatures] = useState('Posture & Flexibility, Breathwork, Assessment');
  const [formBestValue, setFormBestValue] = useState(false);
  const [formFreeTrialAvailable, setFormFreeTrialAvailable] = useState(true);
  const [formSpecialOfferText, setFormSpecialOfferText] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formOrder, setFormOrder] = useState(1);

  // Toast / notification
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    const unsubPlans = subscribeToMembershipPlans((livePlans) => {
      setPlans(livePlans);
    });

    const unsubEnquiries = subscribeToEnquiries((liveEnquiries) => {
      setEnquiries(liveEnquiries);
    });

    return () => {
      unsubPlans();
      unsubEnquiries();
    };
  }, []);

  // Recalculate total price when monthly price or duration changes if autoCalculate is on
  useEffect(() => {
    if (autoCalculateTotal) {
      setFormTotalPrice(formMonthlyPrice * formDurationMonths);
    }
  }, [formMonthlyPrice, formDurationMonths, autoCalculateTotal]);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormName('Kids Foundation — 1 Month');
    setFormCategory('kids');
    setFormDurationMonths(1);
    setFormDurationLabel('1 MONTH');
    setFormMonthlyPrice(2500);
    setFormTotalPrice(2500);
    setAutoCalculateTotal(true);
    setFormWeeklyFrequency('Weekly 3 Days');
    setFormIncludedClasses('Kids Foundation Yoga, Posture Alignment, Fun & Focus Asanas');
    setFormFeatures('Posture & Flexibility Training\nBreathwork & Mindfulness\nCertified Instructors');
    setFormBestValue(false);
    setFormFreeTrialAvailable(true);
    setFormSpecialOfferText('');
    setFormActive(true);
    setFormOrder(plans.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setFormName(plan.name);
    setFormCategory(plan.category);
    setFormDurationMonths(plan.durationMonths);
    setFormDurationLabel(plan.durationLabel);
    setFormMonthlyPrice(plan.monthlyPrice);
    setFormTotalPrice(plan.totalPrice);
    setAutoCalculateTotal(false);
    setFormWeeklyFrequency(plan.weeklyFrequency);
    setFormIncludedClasses(plan.includedClasses.join(', '));
    setFormFeatures(plan.features.join('\n'));
    setFormBestValue(plan.bestValue);
    setFormFreeTrialAvailable(plan.freeTrialAvailable);
    setFormSpecialOfferText(plan.specialOfferText || '');
    setFormActive(plan.active);
    setFormOrder(plan.order);
    setIsModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();

    const includedClassesList = formIncludedClasses
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const featuresList = formFeatures
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const planPayload: Omit<MembershipPlan, 'planId'> = {
      name: formName.trim(),
      category: formCategory,
      durationMonths: Number(formDurationMonths),
      durationLabel: formDurationLabel.trim().toUpperCase(),
      monthlyPrice: Number(formMonthlyPrice),
      totalPrice: Number(formTotalPrice),
      currency: 'INR',
      weeklyFrequency: formWeeklyFrequency.trim(),
      includedClasses: includedClassesList,
      features: featuresList,
      bestValue: formBestValue,
      freeTrialAvailable: formFreeTrialAvailable,
      specialOfferText: formSpecialOfferText.trim() || undefined,
      active: formActive,
      order: Number(formOrder),
    };

    try {
      if (editingPlan) {
        await updateMembershipPlan(editingPlan.planId, planPayload);
        showNotification(`Updated "${formName}" successfully!`);
      } else {
        await createMembershipPlan(planPayload);
        showNotification(`Created "${formName}" successfully!`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showNotification(err.message || 'Failed to save plan', 'error');
    }
  };

  const handleDelete = async (planId: string) => {
    try {
      await deleteMembershipPlan(planId);
      setDeletingPlanId(null);
      showNotification('Plan deleted successfully.');
    } catch (err: any) {
      showNotification('Failed to delete plan', 'error');
    }
  };

  const handleToggleActive = async (plan: MembershipPlan) => {
    try {
      await toggleMembershipPlanActive(plan.planId, plan.active);
      showNotification(`Plan ${!plan.active ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      showNotification('Failed to update status', 'error');
    }
  };

  const handleSeedDefaults = async () => {
    if (window.confirm('Reset/Sync the 8 official Guinness Vijay Yoga Academy (GVYA) default plans? Existing matching IDs will be refreshed.')) {
      await seedDefaultMembershipPlans();
      showNotification('GVYA official plans synced successfully!');
    }
  };

  // Filter plans based on category tab & search query
  const filteredPlans = plans.filter((plan) => {
    const matchesCategory = selectedCategoryTab === 'all' || plan.category === selectedCategoryTab;
    const matchesSearch = 
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.durationLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.includedClasses.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const filteredEnquiries = enquiries.filter((enq) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      enq.fullName.toLowerCase().includes(q) ||
      enq.phone.toLowerCase().includes(q) ||
      (enq.planName || '').toLowerCase().includes(q) ||
      (enq.transactionId || '').toLowerCase().includes(q) ||
      (enq.selectedProps || []).some((p) => p.toLowerCase().includes(q))
    );
  });

  const handleQuickEnroll = async (enq: MembershipEnquiry) => {
    const matchedPlan = plans.find((p) => p.planId === enq.planId);
    const defaultAmt = enq.amountPaid || enq.totalPlanPrice || matchedPlan?.totalPrice || 2500;
    const input = window.prompt(
      `Confirm fee collected (₹ INR) to activate ${enq.fullName} as an enrolled member & credit their account:`,
      String(defaultAmt)
    );
    if (input === null) return;
    const parsed = Math.max(0, Number(input) || 0);
    await convertEnquiryToActiveMember(enq, parsed);
    showNotification(`${enq.fullName} activated with ₹${parsed.toLocaleString('en-IN')} payment recorded!`);
  };
  const totalPlansCount = plans.length;
  const activePlansCount = plans.filter((p) => p.active).length;
  const inactivePlansCount = totalPlansCount - activePlansCount;
  const kidsPlansCount = plans.filter((p) => p.category === 'kids').length;
  const proPlansCount = plans.filter((p) => p.category === 'pro').length;
  const newEnquiriesCount = enquiries.filter((e) => e.status === 'new').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-semibold transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-600 text-white shadow-emerald-600/30' 
            : 'bg-red-600 text-white shadow-red-600/30'
        }`}>
          {notification.type === 'success' ? <Check className="w-4 h-4 stroke-[3]" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header & Quick Links */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-dark tracking-tight">
              Membership Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-burgundy/10 text-burgundy text-[11px] font-bold uppercase tracking-wider">
              GVYA Academy
            </span>
          </div>
          <p className="text-xs sm:text-sm text-dark-muted mt-1">
            Configure Kids & Pro Class subscription tiers, pricing, promotional offers, and free trial enquiries.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <a
            href="/membership"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl border border-beige bg-white text-dark text-xs font-semibold hover:border-burgundy hover:text-burgundy transition-all flex items-center gap-2 shadow-sm"
          >
            <span>View Public Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-xl bg-burgundy hover:bg-burgundy-dark text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-burgundy/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Plan</span>
          </button>
        </div>
      </div>

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-beige shadow-sm">
          <div className="flex items-center justify-between text-dark-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Plans</span>
            <Sparkles className="w-4 h-4 text-burgundy" />
          </div>
          <p className="text-2xl font-serif font-bold text-dark">{totalPlansCount}</p>
          <p className="text-[11px] text-dark-muted mt-1">{activePlansCount} active &bull; {inactivePlansCount} inactive</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-beige shadow-sm">
          <div className="flex items-center justify-between text-dark-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Public</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-emerald-700">{activePlansCount}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Live on website</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-beige shadow-sm">
          <div className="flex items-center justify-between text-dark-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Kids Plans</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-dark">{kidsPlansCount}</p>
          <p className="text-[11px] text-dark-muted mt-1">1M, 3M, 6M, 1Y</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-beige shadow-sm">
          <div className="flex items-center justify-between text-dark-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pro Props</span>
            <Layers className="w-4 h-4 text-sage-dark" />
          </div>
          <p className="text-2xl font-serif font-bold text-dark">{proPlansCount}</p>
          <p className="text-[11px] text-dark-muted mt-1">Aerial & Wheel Props</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-beige shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-dark-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Trial Leads</span>
            <MessageCircle className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-dark">{enquiries.length}</p>
          <p className="text-[11px] text-blue-600 font-medium mt-1">
            {newEnquiriesCount} awaiting contact
          </p>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-beige shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-cream/60 rounded-xl w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setSelectedCategoryTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategoryTab === 'all'
                ? 'bg-burgundy text-white shadow-sm'
                : 'text-dark-muted hover:text-dark hover:bg-white/60'
            }`}
          >
            All Plans ({plans.length})
          </button>

          <button
            onClick={() => setSelectedCategoryTab('kids')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategoryTab === 'kids'
                ? 'bg-burgundy text-white shadow-sm'
                : 'text-dark-muted hover:text-dark hover:bg-white/60'
            }`}
          >
            Kids Membership ({kidsPlansCount})
          </button>

          <button
            onClick={() => setSelectedCategoryTab('pro')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategoryTab === 'pro'
                ? 'bg-burgundy text-white shadow-sm'
                : 'text-dark-muted hover:text-dark hover:bg-white/60'
            }`}
          >
            Pro Classes ({proPlansCount})
          </button>

          <button
            onClick={() => setSelectedCategoryTab('enquiries')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategoryTab === 'enquiries'
                ? 'bg-burgundy text-white shadow-sm'
                : 'text-dark-muted hover:text-dark hover:bg-white/60'
            }`}
          >
            <span>Purchases & Trial Leads ({enquiries.length})</span>
            {newEnquiriesCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {newEnquiriesCount}
              </span>
            )}
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-dark-muted/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={selectedCategoryTab === 'enquiries' ? 'Search buyers, plans, Txn ID...' : 'Search plans by name, class...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-cream/40 border border-beige rounded-xl text-xs text-dark placeholder-dark-muted/60 focus:outline-none focus:border-burgundy"
            />
          </div>

          <button
            onClick={handleSeedDefaults}
            title="Sync / Reset default 8 GVYA plans"
            className="p-2 rounded-xl border border-beige text-dark-muted hover:text-burgundy hover:border-burgundy transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {selectedCategoryTab === 'enquiries' ? (
        /* ======================================================== */
        /* ENQUIRIES, PURCHASES & TRIAL LEADS TABLE                 */
        /* ======================================================== */
        <div className="bg-white rounded-3xl border border-beige shadow-sm overflow-hidden">
          <div className="p-6 border-b border-beige flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-dark">
                Member Purchases, Selections & Free Trial Leads
              </h3>
              <p className="text-xs text-dark-muted mt-0.5">
                Shows exactly what members bought, which mode &amp; props they selected, and how much they paid on the public site.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cream text-dark self-start sm:self-auto">
              {filteredEnquiries.length} Records &bull; ₹{filteredEnquiries.reduce((s, e) => s + (e.amountPaid || 0), 0).toLocaleString('en-IN')} Total
            </span>
          </div>

          {filteredEnquiries.length === 0 ? (
            <div className="text-center py-16 text-dark-muted">
              <MessageCircle className="w-10 h-10 mx-auto text-dark-muted/40 mb-3" />
              <p className="text-sm font-semibold">No matching purchases or enquiries yet.</p>
              <p className="text-xs mt-1 max-w-sm mx-auto">
                When visitors enroll, pay, book classes, or request trials on the public page, all selections and payment amounts appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream/40 border-b border-beige text-dark-muted uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Member / Lead</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Bought Plan &amp; Selections</th>
                    <th className="py-3 px-4">Amount Paid &amp; Method</th>
                    <th className="py-3 px-4">Schedule</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige/50">
                  {filteredEnquiries.map((enq) => {
                    const cleanPhone = enq.phone.replace(/[^0-9]/g, '');
                    const waText = encodeURIComponent(`Hi ${enq.fullName}, greetings from Guinness Vijay Yoga Academy! We received your request for ${enq.planName || 'Free Trial'}.`);
                    const waUrl = `https://wa.me/${cleanPhone}?text=${waText}`;

                    return (
                      <tr key={enq.enquiryId} className="hover:bg-cream/20 transition-colors">
                        <td className="py-4 px-4">
                          <p className="font-bold text-dark text-sm">{enq.fullName}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              enq.category === 'kids' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {enq.category === 'kids' ? 'Kids' : 'Pro Props'}
                            </span>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              enq.submissionType === 'purchase'
                                ? 'bg-purple-100 text-purple-800'
                                : enq.submissionType === 'class_booking'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {enq.submissionType || (enq.isFreeTrial ? 'trial' : 'enquiry')}
                            </span>
                          </div>
                          {enq.ageOrGroup && (
                            <p className="text-[10px] text-dark-muted mt-0.5">Age/Group: {enq.ageOrGroup}</p>
                          )}
                        </td>

                        <td className="py-4 px-4 space-y-1">
                          <div className="flex items-center gap-1.5 text-dark font-medium">
                            <Phone className="w-3.5 h-3.5 text-dark-muted" />
                            <span>{enq.phone}</span>
                          </div>
                          {enq.email && (
                            <div className="flex items-center gap-1.5 text-dark-muted text-[11px]">
                              <Mail className="w-3 h-3" />
                              <span>{enq.email}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <p className="font-semibold text-dark">{enq.planName || 'Free Trial Session'}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {enq.selectedMode && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase border border-indigo-200">
                                {enq.selectedMode}
                              </span>
                            )}
                            {enq.selectedProps?.map((p, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-cream text-dark text-[10px] border border-beige">
                                {p}
                              </span>
                            ))}
                          </div>
                          {enq.notes && (
                            <p className="text-[11px] text-dark-muted mt-1 italic max-w-xs truncate">
                              &quot;{enq.notes}&quot;
                            </p>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          {(enq.amountPaid || 0) > 0 ? (
                            <div>
                              <span className="font-serif font-bold text-sm text-emerald-700">
                                ₹{(enq.amountPaid || 0).toLocaleString('en-IN')}
                              </span>
                              <span className="block text-[10px] font-bold uppercase text-dark-muted">
                                {enq.paymentMethod || 'UPI'} &bull; {enq.paymentStatus || 'verified'}
                              </span>
                              {enq.transactionId && (
                                <code className="text-[10px] font-mono text-burgundy block">{enq.transactionId}</code>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] font-semibold text-blue-700">₹0 (Trial / Spot)</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-dark-muted">
                          <p className="font-medium text-dark">{enq.preferredDays || 'Flexible'}</p>
                          <p className="text-[11px]">{enq.preferredTime || 'Any Time'}</p>
                        </td>

                        <td className="py-4 px-4">
                          <select
                            value={enq.status}
                            onChange={(e) => updateEnquiryStatus(enq.enquiryId, e.target.value as any)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                              enq.status === 'new' 
                                ? 'bg-amber-50 border-amber-300 text-amber-800'
                                : enq.status === 'contacted'
                                ? 'bg-blue-50 border-blue-300 text-blue-800'
                                : enq.status === 'enrolled'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : 'bg-gray-100 border-gray-300 text-gray-700'
                            }`}
                          >
                            <option value="new">New Lead</option>
                            <option value="contacted">Contacted</option>
                            <option value="enrolled">Enrolled</option>
                            <option value="archived">Archived</option>
                          </select>
                        </td>

                        <td className="py-4 px-4 text-right space-y-1.5">
                          <div className="flex items-center justify-end gap-1.5">
                            {enq.status !== 'enrolled' && (
                              <button
                                onClick={() => handleQuickEnroll(enq)}
                                className="px-2.5 py-1.5 rounded-xl bg-burgundy hover:bg-burgundy-dark text-white font-bold text-[10px] shadow-sm transition-all"
                              >
                                Activate &amp; Record Fee
                              </button>
                            )}
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-sm transition-all"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* MEMBERSHIP PLANS GRID & TABLE                            */
        /* ======================================================== */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPlans.map((plan) => (
              <div
                key={plan.planId}
                className={`rounded-3xl p-6 bg-white border transition-all flex flex-col justify-between ${
                  plan.bestValue 
                    ? 'border-amber-400 shadow-lg shadow-amber-500/10' 
                    : 'border-beige shadow-sm hover:shadow-md'
                } ${!plan.active ? 'opacity-60 bg-gray-50' : ''}`}
              >
                <div>
                  {/* Badges Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      plan.category === 'kids' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {plan.category === 'kids' ? 'Kids Yoga' : 'Pro Props'}
                    </span>

                    <div className="flex items-center gap-1">
                      {plan.bestValue && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-bold text-[10px] uppercase flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          <span>Best Value</span>
                        </span>
                      )}
                      {!plan.active && (
                        <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 text-[10px] font-semibold">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Plan Name & Duration */}
                  <h4 className="font-serif text-lg font-bold text-dark">{plan.name}</h4>
                  <p className="text-xs text-dark-muted mt-0.5 uppercase tracking-wider font-medium">
                    {plan.durationLabel} ({plan.durationMonths} Month{plan.durationMonths > 1 ? 's' : ''})
                  </p>

                  {/* Pricing Box */}
                  <div className="my-4 p-3.5 rounded-2xl bg-cream/50 border border-beige">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-dark-muted">Monthly Rate:</span>
                      <span className="font-bold text-dark text-sm">₹{plan.monthlyPrice.toLocaleString('en-IN')}/mo</span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-beige/60">
                      <span className="text-xs font-semibold text-burgundy">Total Payable:</span>
                      <span className="font-serif font-bold text-lg text-burgundy">
                        ₹{plan.totalPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Special Offer Text */}
                  {plan.specialOfferText && (
                    <div className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
                      {plan.specialOfferText}
                    </div>
                  )}

                  {/* Included Classes & Features */}
                  <div className="space-y-2 mb-4">
                    <p className="text-[11px] font-semibold text-dark uppercase tracking-wider">
                      Schedule & Disciplines:
                    </p>
                    <p className="text-xs text-dark-muted font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-burgundy shrink-0" />
                      <span>{plan.weeklyFrequency}</span>
                    </p>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {plan.includedClasses.slice(0, 3).map((cls, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-beige text-[10px] text-dark font-medium">
                          {cls}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Bottom Controls */}
                <div className="pt-4 border-t border-beige/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleActive(plan)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      plan.active 
                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {plan.active ? 'Active' : 'Inactive'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(plan)}
                      className="p-2 rounded-xl text-dark-muted hover:text-burgundy hover:bg-cream transition-colors"
                      title="Edit Plan"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeletingPlanId(plan.planId)}
                      className="p-2 rounded-xl text-dark-muted hover:text-red-700 hover:bg-red-50 transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPlans.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-beige">
              <Sparkles className="w-10 h-10 mx-auto text-dark-muted/40 mb-3" />
              <p className="text-sm font-semibold text-dark">No membership plans match your search.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategoryTab('all'); }}
                className="mt-3 text-xs font-bold text-burgundy hover:underline"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* CREATE / EDIT MEMBERSHIP PLAN MODAL                      */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div 
            className="w-full max-w-2xl bg-white rounded-3xl border border-beige shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-beige pb-4 mb-6">
              <div>
                <h3 className="font-serif text-xl font-bold text-dark">
                  {editingPlan ? 'Edit Membership Plan' : 'Create New Membership Plan'}
                </h3>
                <p className="text-xs text-dark-muted mt-0.5">
                  Configure plan details, pricing, duration, and promotional badges.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-dark-muted hover:bg-cream"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-dark-muted mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Kids Yoga — 3 Months"
                    className="w-full px-3.5 py-2.5 bg-cream/30 border border-beige rounded-xl text-sm text-dark focus:outline-none focus:border-burgundy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-dark-muted mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as MembershipCategory)}
                    className="w-full px-3.5 py-2.5 bg-cream/30 border border-beige rounded-xl text-sm text-dark focus:outline-none focus:border-burgundy"
                  >
                    <option value="kids">Kids Membership</option>
                    <option value="pro">Pro Classes with Props</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-dark-muted mb-1">
                    Duration (Months) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={36}
                    required
                    value={formDurationMonths}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      setFormDurationMonths(m);
                      setFormDurationLabel(m >= 12 ? `${m / 12} YEAR` : `${m} MONTH${m > 1 ? 'S' : ''}`);
                    }}
                    className="w-full px-3.5 py-2.5 bg-cream/30 border border-beige rounded-xl text-sm text-dark focus:outline-none focus:border-burgundy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-dark-muted mb-1">
                    Duration Label
                  </label>
                  <input
                    type="text"
                    required
                    value={formDurationLabel}
                    onChange={(e) => setFormDurationLabel(e.target.value)}
                    placeholder="e.g. 1 MONTH, 1 YEAR"
                    className="w-full px-3.5 py-2.5 bg-cream/30 border border-beige rounded-xl text-sm text-dark focus:outline-none focus:border-burgundy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-dark-muted mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-cream/30 border border-beige rounded-xl text-sm text-dark focus:outline-none focus:border-burgundy"
                  />
                </div>
              </div>

              {/* Pricing Section with Auto-Calculation */}
              <div className="p-4 rounded-2xl bg-cream/30 border border-beige space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-burgundy">
                    Pricing Configuration (INR ₹)
                  </span>
                  <label className="flex items-center gap-2 text-xs text-dark-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoCalculateTotal}
                      onChange={(e) => setAutoCalculateTotal(e.target.checked)}
                      className="rounded text-burgundy focus:ring-burgundy"
                    />
                    <span>Auto-calculate total amount</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-dark-muted mb-1">
                      Monthly Price (₹) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={formMonthlyPrice}
                      onChange={(e) => setFormMonthlyPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-white border border-beige rounded-xl text-sm text-dark focus:outline-none focus:border-burgundy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dark-muted mb-1">
                      Total Payable Amount (₹) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      disabled={autoCalculateTotal}
                      value={formTotalPrice}
                      onChange={(e) => setFormTotalPrice(Number(e.target.value))}
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-bold text-dark ${
                        autoCalculateTotal ? 'bg-cream/70 border-beige text-dark-muted' : 'bg-white border-beige'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-dark-muted mb-1">
                    Weekly Schedule / Frequency
                  </label>
                  <input
                    type="text"
                    value={formWeeklyFrequency}
                    onChange={(e) => setFormWeeklyFrequency(e.target.value)}
                    placeholder="e.g. Weekly 3 Days, Flexible Batches"
                    className="w-full px-3.5 py-2.5 bg-cream/30 border border-beige rounded-xl text-sm text-dark focus:outline-none focus:border-burgundy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-dark-muted mb-1">
                    Included Classes (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formIncludedClasses}
                    onChange={(e) => setFormIncludedClasses(e.target.value)}
                    placeholder="Aerial Yoga, Wheel Yoga, Wheel & Wall Yoga"
                    className="w-full px-3.5 py-2.5 bg-cream/30 border border-beige rounded-xl text-sm text-dark focus:outline-none focus:border-burgundy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-dark-muted mb-1">
                  Features & Curriculum Highlights (one per line)
                </label>
                <textarea
                  rows={3}
                  value={formFeatures}
                  onChange={(e) => setFormFeatures(e.target.value)}
                  placeholder="Certified Instructors&#10;Posture & Flexibility&#10;Props Included"
                  className="w-full px-3.5 py-2.5 bg-cream/30 border border-beige rounded-xl text-xs text-dark focus:outline-none focus:border-burgundy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-dark-muted mb-1">
                  Special Offer Banner Text (Optional)
                </label>
                <input
                  type="text"
                  value={formSpecialOfferText}
                  onChange={(e) => setFormSpecialOfferText(e.target.value)}
                  placeholder="e.g. Only for first 50 kids — Limited Seats"
                  className="w-full px-3.5 py-2.5 bg-cream/30 border border-beige rounded-xl text-xs text-dark focus:outline-none focus:border-burgundy"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <label className="flex items-center gap-2 p-3 rounded-xl bg-cream/30 border border-beige cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formBestValue}
                    onChange={(e) => setFormBestValue(e.target.checked)}
                    className="rounded text-burgundy focus:ring-burgundy"
                  />
                  <span className="text-xs font-semibold text-dark">Best Value Ribbon</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-cream/30 border border-beige cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formFreeTrialAvailable}
                    onChange={(e) => setFormFreeTrialAvailable(e.target.checked)}
                    className="rounded text-burgundy focus:ring-burgundy"
                  />
                  <span className="text-xs font-semibold text-dark">Free Trial Available</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-cream/30 border border-beige cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="rounded text-burgundy focus:ring-burgundy"
                  />
                  <span className="text-xs font-semibold text-dark">Active on Public Page</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-beige flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-beige text-dark text-xs font-semibold hover:bg-cream"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-burgundy hover:bg-burgundy-dark text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-burgundy/25 transition-all"
                >
                  {editingPlan ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPlanId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-beige shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-700 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-dark">Delete Membership Plan?</h3>
            <p className="text-xs text-dark-muted">
              Are you sure you want to permanently remove this plan? It will no longer be available for public enrollment.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingPlanId(null)}
                className="px-5 py-2.5 rounded-xl border border-beige text-dark text-xs font-semibold hover:bg-cream"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingPlanId)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
