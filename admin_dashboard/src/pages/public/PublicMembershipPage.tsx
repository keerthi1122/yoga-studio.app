import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Award,
  Clock,
  Users,
  Check,
  X,
  MessageCircle,
  Layers,
  Brain,
  Activity,
  Flame,
  Zap,
  Lock,
  MapPin,
  ChevronDown,
  Video,
  CreditCard,
  Smartphone,
  Building2,
  Tag,
  AlertCircle,
  Bell,
} from 'lucide-react';
import { MembershipPlan, MembershipCategory, YogaClass, StudioNotification } from '../../types';
import { subscribeToMembershipPlans, submitMembershipEnquiry } from '../../services/membershipService';
import { subscribeToClasses } from '../../services/classService';
import { createPublicBooking } from '../../services/bookingService';
import { subscribeToNotifications } from '../../services/notificationService';
import { ScrollReveal, useScrollProgress } from '../../hooks/useScrollReveal';
import { ParticleBackground } from '../../components/ParticleBackground';
import { Tilt3DCard } from '../../components/Tilt3DCard';
import { HeroMandala3D } from '../../components/HeroMandala3D';
import { JitsiMeetEmbed } from '../../components/JitsiMeetEmbed';
import { isValidPhone, isValidEmail, sanitizeText, sanitizeTransactionRef } from '../../utils/security';

const PROP_CHOICES = [
  'Aerial Silk Hammock',
  'Yoga Wheel Mobility',
  'Wall Alignment Harness',
  'Pranayama & Meditation',
  'Kids Agility & Focus',
];

export const PublicMembershipPage: React.FC = () => {
  const { progress, scrollY } = useScrollProgress();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [classes, setClasses] = useState<YogaClass[]>([]);
  const [notifications, setNotifications] = useState<StudioNotification[]>([]);
  const [activeCategory, setActiveCategory] = useState<MembershipCategory>('kids');
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'online' | 'offline'>('all');

  // Scientific facts tab
  const [activeFactTab, setActiveFactTab] = useState<'spine' | 'brain' | 'cortisol' | 'antiaging'>('spine');

  // Interactive Plan Recommender Quiz State
  const [quizAgeGroup, setQuizAgeGroup] = useState<'kids' | 'adult'>('kids');
  const [quizGoal, setQuizGoal] = useState<'posture' | 'focus' | 'aerial' | 'strength'>('posture');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Checkout / Enquiry / Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanForEnquiry, setSelectedPlanForEnquiry] = useState<MembershipPlan | null>(null);
  const [selectedClassForBooking, setSelectedClassForBooking] = useState<YogaClass | null>(null);
  const [enrollmentMode, setEnrollmentMode] = useState<'purchase' | 'trial' | 'class_booking'>('purchase');

  // Live Jitsi Video Call Modal State
  const [activeVideoClass, setActiveVideoClass] = useState<YogaClass | null>(null);
  const [videoJoinName, setVideoJoinName] = useState('');
  const [videoCallStarted, setVideoCallStarted] = useState(false);

  // Checkout & Form Fields
  const [fullName, setFullName] = useState('');
  const [ageOrGroup, setAgeOrGroup] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredDays, setPreferredDays] = useState('Mon - Wed - Fri');
  const [preferredTime, setPreferredTime] = useState('Morning (7:00 AM - 8:30 AM)');
  const [selectedMode, setSelectedMode] = useState<'online' | 'offline' | 'hybrid'>('offline');
  const [selectedProps, setSelectedProps] = useState<string[]>(['Aerial Silk Hammock', 'Yoga Wheel Mobility']);
  const [paymentPlanOption, setPaymentPlanOption] = useState<'full' | 'monthly'>('full');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'bank_transfer'>('upi');
  const [promoCode, setPromoCode] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationReceipt, setConfirmationReceipt] = useState<{
    refId: string;
    planName: string;
    amountPaid: number;
    mode: string;
    props: string[];
    method: string;
    isPurchase: boolean;
    jitsiRoom?: string;
    classTitle?: string;
  } | null>(null);

  useEffect(() => {
    const unsubPlans = subscribeToMembershipPlans((livePlans) => {
      setPlans(livePlans.filter((p) => p.active));
    });
    const unsubClasses = subscribeToClasses((liveClasses) => {
      setClasses(liveClasses.filter((c) => c.status !== 'cancelled'));
    });
    const unsubNotifs = subscribeToNotifications(setNotifications);
    return () => {
      unsubPlans();
      unsubClasses();
      unsubNotifs();
    };
  }, []);

  const kidsPlans = plans.filter((p) => p.category === 'kids');
  const proPlans = plans.filter((p) => p.category === 'pro');
  const filteredClasses = classes.filter((c) => scheduleFilter === 'all' || c.bookingType === scheduleFilter);
  const latestNotice = notifications[0];

  const openPlanModal = (plan?: MembershipPlan, freeTrial = false) => {
    setSelectedPlanForEnquiry(plan || plans[0] || null);
    setSelectedClassForBooking(null);
    setEnrollmentMode(freeTrial ? 'trial' : 'purchase');
    setConfirmationReceipt(null);
    setFormError(null);
    if (plan) {
      if (plan.category === 'kids') {
        setSelectedProps(['Kids Agility & Focus', 'Pranayama & Meditation']);
      } else {
        setSelectedProps(['Aerial Silk Hammock', 'Yoga Wheel Mobility', 'Wall Alignment Harness']);
      }
    }
    setIsModalOpen(true);
  };

  const openClassBookingModal = (cls: YogaClass) => {
    setSelectedClassForBooking(cls);
    setSelectedPlanForEnquiry(null);
    setEnrollmentMode('class_booking');
    setSelectedMode(cls.bookingType === 'online' ? 'online' : 'offline');
    setConfirmationReceipt(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPlanForEnquiry(null);
    setSelectedClassForBooking(null);
    setConfirmationReceipt(null);
    setFormError(null);
  };

  const toggleProp = (prop: string) => {
    setSelectedProps((prev) =>
      prev.includes(prop) ? (prev.length > 1 ? prev.filter((p) => p !== prop) : prev) : [...prev, prop]
    );
  };

  // Dynamic Price Calculation
  const activePlanObj = selectedPlanForEnquiry;
  const baseTotal = activePlanObj
    ? paymentPlanOption === 'full'
      ? activePlanObj.totalPrice
      : activePlanObj.monthlyPrice
    : 0;
  const isPromoValid = promoCode.trim().toUpperCase() === 'GVYA10';
  const discountAmount = isPromoValid ? Math.round(baseTotal * 0.1) : 0;
  const finalPayableAmount = Math.max(0, baseTotal - discountAmount);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = sanitizeText(fullName, 100);
    const cleanPhone = sanitizeText(phone, 24);
    const cleanEmail = sanitizeText(email, 120);

    if (cleanName.length < 2) {
      setFormError('Please enter your full name (minimum 2 characters).');
      return;
    }
    if (!isValidPhone(cleanPhone)) {
      setFormError('Please enter a valid 10-digit WhatsApp/mobile number.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      if (enrollmentMode === 'class_booking' && selectedClassForBooking) {
        const booking = await createPublicBooking({
          yogaClass: selectedClassForBooking,
          fullName: cleanName,
          phone: cleanPhone,
          email: cleanEmail || undefined,
        });

        await submitMembershipEnquiry({
          submissionType: 'class_booking',
          fullName: cleanName,
          phone: cleanPhone,
          email: cleanEmail || undefined,
          category: selectedClassForBooking.category.toLowerCase().includes('kid') ? 'kids' : 'pro',
          classId: selectedClassForBooking.classId,
          classTitle: selectedClassForBooking.title,
          jitsiRoom: selectedClassForBooking.meetingConfiguration?.jitsiRoom,
          planName: `Session Spot: ${selectedClassForBooking.title}`,
          selectedMode: selectedClassForBooking.bookingType,
          isFreeTrial: false,
          amountPaid: 0,
          paymentMethod: 'free_trial',
          preferredDays,
          preferredTime,
          notes: notes.trim() || undefined,
        });

        setConfirmationReceipt({
          refId: booking.bookingId,
          planName: selectedClassForBooking.title,
          amountPaid: 0,
          mode: selectedClassForBooking.bookingType.toUpperCase(),
          props: [selectedClassForBooking.category],
          method: 'Seat Reserved',
          isPurchase: false,
          jitsiRoom: selectedClassForBooking.meetingConfiguration?.jitsiRoom,
          classTitle: selectedClassForBooking.title,
        });
      } else {
        const isPurchase = enrollmentMode === 'purchase' && Boolean(activePlanObj);
        const amountToPay = isPurchase ? finalPayableAmount : 0;
        const cleanTx = sanitizeTransactionRef(transactionRef);

        const enquiryId = await submitMembershipEnquiry({
          submissionType: isPurchase ? 'purchase' : 'trial',
          fullName: cleanName,
          ageOrGroup: sanitizeText(ageOrGroup, 40) || undefined,
          phone: cleanPhone,
          email: cleanEmail || undefined,
          category: activePlanObj ? activePlanObj.category : activeCategory,
          planId: activePlanObj?.planId,
          planName: activePlanObj?.name || 'Free Trial Consultation',
          durationMonths: activePlanObj?.durationMonths,
          monthlyPrice: activePlanObj?.monthlyPrice,
          totalPlanPrice: activePlanObj?.totalPrice,
          discountAmount: isPurchase ? discountAmount : 0,
          promoCode: isPromoValid ? 'GVYA10' : undefined,
          amountPaid: amountToPay,
          paymentMethod: isPurchase ? paymentMethod : 'free_trial',
          transactionId: cleanTx || undefined,
          paymentStatus: isPurchase
            ? paymentMethod === 'bank_transfer'
              ? 'pending'
              : 'verified'
            : undefined,
          selectedMode,
          selectedProps,
          isFreeTrial: !isPurchase,
          preferredDays,
          preferredTime,
          notes: sanitizeText(notes, 400) || undefined,
        });

        setConfirmationReceipt({
          refId: enquiryId,
          planName: activePlanObj?.name || '1-on-1 Free Trial Session',
          amountPaid: amountToPay,
          mode: selectedMode.toUpperCase(),
          props: selectedProps,
          method: isPurchase ? paymentMethod.toUpperCase() : 'FREE TRIAL',
          isPurchase,
        });
      }

      setFullName('');
      setAgeOrGroup('');
      setPhone('');
      setEmail('');
      setTransactionRef('');
      setNotes('');
    } catch (err: any) {
      setFormError(err?.message || 'Submission encountered an issue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Launch Video Call Modal for Online Class
  const openVideoCallModal = (cls: YogaClass, prefillName = '') => {
    setActiveVideoClass(cls);
    setVideoJoinName(prefillName);
    setVideoCallStarted(Boolean(prefillName.trim()));
  };

  // Scientific facts data
  const scientificFacts = {
    spine: {
      title: 'Spinal Traction & Biomechanical Alignment',
      stat: '84% Pain Relief',
      subtitle: 'Clinical Study: Journal of Spine Health & Rehabilitation',
      desc: 'Modern sedentary postures induce chronic disc compression and cervical lordosis flattening. Our proprietary Wall and Wheel props leverage targeted gravitational traction to decompress lumbar vertebrae, hydrate intervertebral discs, and realign muscular imbalances without spinal axial strain.',
      highlights: [
        'Passive lumbar traction restores natural lumbar curvature',
        'Wall harness suspension safely decompresses L4-S1 vertebrae',
        'Targeted shoulder thoracic opening reverses desk-slouch kyphosis',
      ],
    },
    brain: {
      title: 'Neuroplasticity & Child Cognitive Enhancement',
      stat: '3x Focus Surge',
      subtitle: 'Pediatric Neuroscience & Behavioral Development',
      desc: 'Complex balance asanas and rhythmic breathing stimulate the vestibular system and cerebellum, sparking rapid synaptogenesis. In growing children, this physical discipline enhances prefrontal cortex activity, boosts sustained attention span, and naturally balances screen-induced sensory overload.',
      highlights: [
        'Vestibular stimulation enhances bilateral brain integration',
        'Significant calming of hyperactivity and attention fatigue',
        'Improved motor agility, spatial awareness, and memory recall',
      ],
    },
    cortisol: {
      title: 'Vagus Nerve Reset & Stress Hormone Reduction',
      stat: '31% Cortisol Drop',
      subtitle: 'Harvard Health & Autonomic Nervous System Research',
      desc: 'Controlled pranayama and restorative inversions trigger the parasympathetic nervous system via the vagus nerve. Clinical trials demonstrate a sharp 31% reduction in salivary cortisol levels within 45 minutes, dramatically improving heart rate variability (HRV) and sleep architecture.',
      highlights: [
        'Ujjayi breathwork immediately lowers sympathetic fight-or-flight',
        'Boosts natural melatonin secretion for deep restorative sleep',
        'Reduces systemic inflammation biomarkers (hs-CRP)',
      ],
    },
    antiaging: {
      title: 'Zero-Gravity Decompression & Cellular Longevity',
      stat: '+28% Brain Oxygen',
      subtitle: 'Integrative Physiology & Circulation Studies',
      desc: 'Aerial silk suspension allows inverted asanas without compressing cervical joints. Inverting the body reverses hydrostatic pressure in veins, accelerating lymphatic drainage, purging cellular metabolic waste, and increasing cerebral microvascular blood flow for cellular rejuvenation.',
      highlights: [
        'Relieves venous pooling in legs and pelvic basin',
        'Boosts cerebral perfusion and facial dermal micro-circulation',
        'Rejuvenates core stabilizer muscles and pelvic floor tone',
      ],
    },
  };

  // Recommender logic
  const getRecommendedPlan = () => {
    if (quizAgeGroup === 'kids') {
      return {
        name: 'Kids Yoga — 1 Year Full Mastery',
        price: '₹1,500 / month (₹18,000/yr)',
        savings: 'Save ₹12,000 vs monthly renewal!',
        desc: 'Ideal for holistic brain development, posture alignment, and complete screen-detox.',
        plan: kidsPlans.find((p) => p.durationMonths === 12) || kidsPlans[0],
      };
    } else {
      if (quizGoal === 'aerial') {
        return {
          name: 'Pro Classes with Props — 1 Year (All Props Included)',
          price: '₹6,000 / month (₹72,000/yr)',
          savings: 'Save ₹48,000 over monthly rate!',
          desc: 'Comprehensive mastery of Aerial Silk, Yoga Wheel, and Wall Alignment with Master Vijay.',
          plan: proPlans.find((p) => p.durationMonths === 12) || proPlans[0],
        };
      }
      return {
        name: 'Pro Classes with Props — 6 Months Spine & Mobility',
        price: '₹7,000 / month (₹42,000 total)',
        savings: 'Save ₹18,000 over monthly rate!',
        desc: 'Deep thoracic mobility, sciatica relief, and core spine stabilization.',
        plan: proPlans.find((p) => p.durationMonths === 6) || proPlans[0],
      };
    }
  };

  const recommended = getRecommendedPlan();
  const liveOnlineClass = classes.find((c) => c.bookingType === 'online');

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 selection:bg-[#D4AF37] selection:text-black font-sans relative overflow-x-hidden">
      {/* Scroll Progress Indicator Bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] z-50 bg-transparent pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-[#8F2F1B] via-[#F5D77F] to-[#D4AF37] transition-[width] duration-75"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      {/* Interactive Particle Constellation Canvas */}
      <ParticleBackground />

      {/* Parallax Floating Yoga Glyphs */}
      <div
        className="yoga-symbol"
        style={{ top: '14%', left: '4%', transform: `translate3d(0, ${scrollY * -0.08}px, 0)` }}
      >
        🪷
      </div>
      <div
        className="yoga-symbol"
        style={{ top: '42%', right: '6%', transform: `translate3d(0, ${scrollY * 0.06}px, 0)` }}
      >
        ☸
      </div>
      <div
        className="yoga-symbol"
        style={{ top: '72%', left: '9%', transform: `translate3d(0, ${scrollY * -0.05}px, 0)` }}
      >
        ॐ
      </div>

      {/* 1. TOP ANNOUNCEMENT TICKER (Synchronized with Studio Broadcasts) */}
      <div className="bg-gradient-to-r from-[#8F2F1B] via-[#D4AF37] to-[#8F2F1B] py-2 px-4 text-center text-xs font-bold text-black tracking-wide shadow-md relative z-10">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {latestNotice ? (
            <>
              <Bell className="w-3.5 h-3.5 shrink-0" />
              <span>{latestNotice.title} • Use code GVYA10 for 10% Instant Online Discount!</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>LIMITED ADMISSIONS: STRICTLY 50 SEATS PER BATCH • USE CODE GVYA10 FOR 10% OFF!</span>
            </>
          )}
          <button
            onClick={() => openPlanModal(undefined, true)}
            className="underline ml-2 hover:opacity-80 transition-opacity hidden sm:inline btn-press"
          >
            Claim Free Trial &rarr;
          </button>
        </div>
      </div>

      {/* 2. STICKY LUXURY NAVIGATION */}
      <header className="sticky top-0 z-40 bg-[#0A0E17]/85 backdrop-blur-xl border-b border-white/10 px-4 lg:px-8 py-3.5 transition-all animate-fadeInDown">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5D77F] via-[#D4AF37] to-[#8F2F1B] p-[2px] shadow-lg shadow-[#D4AF37]/20 group-hover:scale-110 transition-transform duration-300">
              <div className="w-full h-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center">
                <span className="font-serif text-lg font-bold text-[#F5D77F]">G</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-black tracking-wider text-base sm:text-lg text-white">GVYA</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#D4AF37]/15 text-[#F5D77F] border border-[#D4AF37]/30 hidden sm:inline">
                  Guinness Academy
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider hidden sm:block">GUINNESS VIJAY YOGA ACADEMY</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
            {[
              { href: '#plans', label: 'Membership Plans' },
              { href: '#science', label: 'Yogic Science' },
              { href: '#recommender', label: 'Plan Finder' },
              { href: '#schedule', label: 'Live & Studio Timetable' },
              { href: '#founder', label: 'Guinness Founder' },
              { href: '#faq', label: 'FAQ' },
            ].map((link) => (
              <a key={link.href} href={link.href} className="hover:text-[#F5D77F] transition-colors relative group">
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#D4AF37] group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {liveOnlineClass && (
              <button
                onClick={() => openVideoCallModal(liveOnlineClass)}
                className="px-3 py-2 rounded-xl bg-red-600/20 border border-red-500/40 hover:bg-red-600/30 text-red-300 text-xs font-bold transition-all flex items-center gap-1.5 btn-press"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <Video className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Join Live Video</span>
              </button>
            )}

            <button
              onClick={() => openPlanModal(proPlans[3] || kidsPlans[3], false)}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA820A] hover:brightness-110 text-black text-xs font-bold shadow-lg shadow-[#D4AF37]/25 transition-all flex items-center gap-1.5 animate-pulse-gold btn-press"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enroll Now</span>
            </button>

            <Link
              to="/login"
              className="px-3 py-2 rounded-xl border border-white/10 hover:border-[#D4AF37]/50 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-[#F5D77F] text-xs font-semibold transition-all flex items-center gap-1.5 btn-press"
              title="Staff & Management Portal"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Staff Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION WITH 3D MANDALA & PARALLAX */}
      <section className="relative pt-10 pb-20 md:py-20 overflow-hidden wave-divider">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[380px] bg-[#D4AF37]/10 rounded-full blur-[140px] pointer-events-none animate-morph-blob"
          style={{ transform: `translate(-50%, calc(-50% + ${scrollY * 0.12}px))` }}
        />
        <div className="absolute top-1/3 right-10 w-[400px] h-[250px] bg-[#8F2F1B]/15 rounded-full blur-[120px] pointer-events-none animate-morph-blob" />

        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <ScrollReveal direction="left" className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-[#D4AF37]/30 text-[#F5D77F] text-xs font-semibold mb-6 shadow-sm backdrop-blur-md">
                <Award className="w-4 h-4 text-[#D4AF37]" />
                <span>Founded by Master Vijay — Official Guinness World Record Holder</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.12] tracking-tight">
                Master Your Spine, Focus & Longevity Through{' '}
                <span className="text-gradient-gold">World-Record</span> Yogic Science.
              </h1>

              <p className="mt-6 text-sm sm:text-base text-slate-300 leading-relaxed font-light max-w-2xl mx-auto lg:mx-0">
                Experience anatomical precision and therapeutic mastery. Choose{' '}
                <strong className="text-white font-semibold">Kids Agility Yoga (Ages 4–15)</strong> or{' '}
                <strong className="text-[#F5D77F] font-semibold">Pro Prop Classes (Aerial Silk, Wheel & Wall Alignment)</strong> — in-studio or via interactive HD live video.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
                <a
                  href="#plans"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#AA820A] text-black font-bold text-sm shadow-xl shadow-[#D4AF37]/25 hover:brightness-110 transition-all flex items-center gap-2 group btn-press"
                >
                  <span>Explore Plans & Enroll</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>

                <button
                  onClick={() => openPlanModal(undefined, true)}
                  className="px-5 py-3.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-all flex items-center gap-2 backdrop-blur-md btn-bounce"
                >
                  <Sparkles className="w-4 h-4 text-[#F5D77F]" />
                  <span>Book 1-on-1 Free Trial</span>
                </button>

                {liveOnlineClass && (
                  <button
                    onClick={() => openVideoCallModal(liveOnlineClass)}
                    className="px-5 py-3.5 rounded-xl bg-indigo-600/20 border border-indigo-400/40 hover:bg-indigo-600/30 text-indigo-300 font-semibold text-xs transition-all flex items-center gap-2 btn-press"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Live Video Class</span>
                  </button>
                )}
              </div>
            </ScrollReveal>

            <ScrollReveal direction="scale" delay={150} className="lg:col-span-5">
              <HeroMandala3D />
              <p className="text-center text-[11px] text-slate-400 mt-4 tracking-wider uppercase font-semibold">
                Move cursor over sacred mandala for 3D depth
              </p>
            </ScrollReveal>
          </div>

          {/* Credentials Bar */}
          <div className="mt-14 pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { value: '15,000+', label: 'Students Trained' },
              { value: '50 Seats', label: 'Strict Batch Cap' },
              { value: '4.98 / 5', label: '1,400+ Reviews' },
              { value: 'HD Live + Studio', label: 'Hybrid Prop Access' },
            ].map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 80} direction="up">
                <p className="font-serif text-2xl font-bold text-[#F5D77F]">{stat.value}</p>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">{stat.label}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SCIENTIFIC FACTS SECTION */}
      <section id="science" className="py-20 bg-[#0B0F18] border-y border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <ScrollReveal className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              Evidence-Based Yogic Science
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-4">
              Why GVYA Yoga Transforms Your Biology
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Our training integrates 5,000-year yogic traditions with clinical neurobiology and orthopedic biomechanics.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              {[
                { id: 'spine' as const, icon: Activity, label: 'Spine & Posture Relief (84%)' },
                { id: 'brain' as const, icon: Brain, label: 'Kids Focus & Neuroplasticity (3x)' },
                { id: 'cortisol' as const, icon: Flame, label: 'Stress & Cortisol Drop (31%)' },
                { id: 'antiaging' as const, icon: Zap, label: 'Anti-Gravity Decompression' },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFactTab(tab.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 btn-press ${activeFactTab === tab.id
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black shadow-lg shadow-[#D4AF37]/20'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </ScrollReveal>

          <ScrollReveal direction="scale">
            <Tilt3DCard intensity={6} className="rounded-3xl max-w-4xl mx-auto">
              <div className="glass-gold rounded-3xl p-6 sm:p-10 border border-[#D4AF37]/30 shadow-2xl relative">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-8 space-y-4">
                    <span className="text-xs font-mono font-bold text-[#F5D77F] uppercase tracking-wider block">
                      {scientificFacts[activeFactTab].subtitle}
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                      {scientificFacts[activeFactTab].title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                      {scientificFacts[activeFactTab].desc}
                    </p>
                    <div className="space-y-2 pt-2">
                      {scientificFacts[activeFactTab].highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-4 bg-[#0A0D14]/85 rounded-2xl p-6 border border-white/10 text-center flex flex-col items-center justify-center relative z-20">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Clinical Impact</span>
                    <div className="font-serif text-4xl sm:text-5xl font-black text-gradient-gold my-2">
                      {scientificFacts[activeFactTab].stat}
                    </div>
                    <p className="text-[11px] text-slate-300">Measured across registered GVYA cohorts</p>
                    <button
                      onClick={() => openPlanModal(undefined, true)}
                      className="mt-5 w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-all btn-bounce"
                    >
                      Experience in Free Trial &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </Tilt3DCard>
          </ScrollReveal>
        </div>
      </section>

      {/* 5. INTERACTIVE PLAN RECOMMENDER */}
      <section id="recommender" className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          <ScrollReveal className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              Personalized Consultation
            </span>
            <h2 className="font-serif text-3xl font-bold text-white mt-4">
              Find Your Ideal GVYA Yoga Plan in 10 Seconds
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Customize your profile below and enroll instantly with studio-synced savings.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="scale">
            <div className="glass-dark rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#F5D77F] mb-3">
                  Step 1: Who is enrolling for the program?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setQuizAgeGroup('kids')}
                    className={`p-4 rounded-2xl border text-left transition-all btn-press ${quizAgeGroup === 'kids'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-white shadow-md'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                      }`}
                  >
                    <p className="font-bold text-sm text-white">Child or Teen (Ages 4–15)</p>
                    <p className="text-[11px] text-slate-300 mt-1">Focus, screen-detox, flexibility, posture correction</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuizAgeGroup('adult')}
                    className={`p-4 rounded-2xl border text-left transition-all btn-press ${quizAgeGroup === 'adult'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-white shadow-md'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                      }`}
                  >
                    <p className="font-bold text-sm text-white">Adult (Professional / Senior)</p>
                    <p className="text-[11px] text-slate-300 mt-1">Spine decompression, Aerial & Props mastery, stress relief</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#F5D77F] mb-3">
                  Step 2: What is your primary wellness aspiration?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'posture', label: 'Spine & Back Care', desc: 'Reverse slouching & pain' },
                    { id: 'focus', label: 'Focus & Concentration', desc: 'Calm restlessness & brain fog' },
                    { id: 'aerial', label: 'Aerial & Prop Mastery', desc: 'Silk hammock & Wall yoga' },
                    { id: 'strength', label: 'Endurance & Longevity', desc: 'Total body agility' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setQuizGoal(g.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all btn-press ${quizGoal === g.id
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-white'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                        }`}
                    >
                      <p className="font-bold text-xs text-white">{g.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{g.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#D4AF37]/15 via-white/5 to-[#D4AF37]/10 border border-[#D4AF37]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#F5D77F] px-2 py-0.5 rounded bg-[#D4AF37]/20 border border-[#D4AF37]/40">
                    Recommended For You
                  </span>
                  <h4 className="font-serif text-lg font-bold text-white mt-1.5">{recommended.name}</h4>
                  <p className="text-xs text-slate-300 mt-0.5">{recommended.desc}</p>
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    <span className="text-sm font-bold text-[#F5D77F]">{recommended.price}</span>
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {recommended.savings}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => openPlanModal(recommended.plan, false)}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-bold text-xs shadow-lg shadow-[#D4AF37]/25 hover:brightness-110 transition-all flex items-center justify-center gap-1.5 btn-press"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Enroll Now</span>
                  </button>
                  <button
                    onClick={() => openPlanModal(recommended.plan, true)}
                    className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs transition-all btn-press"
                  >
                    Free Trial
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 6. OFFICIAL GVYA MEMBERSHIP PLANS WITH INTERACTIVE 3D TILT CARDS */}
      <section id="plans" className="py-20 bg-[#0A0D15] border-t border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <ScrollReveal className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] px-3.5 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30">
              Curated Admissions & Transparent Rates
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-black text-white mt-4">
              Guinness Vijay Yoga Academy Membership Plans
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-3">
              Select your category, customize online/studio props, and enroll directly — synced live with GVYA Academy Desk.
            </p>
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>STRICTLY 50 SEATS PER BATCH • PROMO CODE GVYA10 GIVES 10% OFF!</span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
              <button
                onClick={() => setActiveCategory('kids')}
                className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 btn-press ${activeCategory === 'kids'
                  ? 'bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#AA820A] text-black shadow-xl shadow-[#D4AF37]/25'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                  }`}
              >
                <Users className="w-4 h-4" />
                <span>Kids Yoga (Ages 4 to 15)</span>
              </button>

              <button
                onClick={() => setActiveCategory('pro')}
                className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 btn-press ${activeCategory === 'pro'
                  ? 'bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#AA820A] text-black shadow-xl shadow-[#D4AF37]/25'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                  }`}
              >
                <Layers className="w-4 h-4" />
                <span>Pro Classes with Props (Aerial, Wheel & Wall)</span>
              </button>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(activeCategory === 'kids' ? kidsPlans : proPlans).map((plan, index) => {
              const monthlyEquivalent = Math.round(plan.totalPrice / plan.durationMonths);
              const monthlyBase = activeCategory === 'kids' ? 2500 : 10000;
              const totalIfMonthly = monthlyBase * plan.durationMonths;
              const totalSavings = Math.max(0, totalIfMonthly - plan.totalPrice);

              return (
                <ScrollReveal key={plan.planId} delay={index * 90} direction="up" className="h-full">
                  <Tilt3DCard
                    intensity={8}
                    className={`rounded-3xl h-full ${plan.bestValue ? 'lg:-translate-y-2' : ''}`}
                  >
                    <div
                      className={`rounded-3xl p-6 flex flex-col justify-between h-full relative ${
                        plan.bestValue
                          ? 'glass-gold border-2 border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/20'
                          : 'glass-dark border border-white/10 hover:border-[#D4AF37]/40'
                      }`}
                    >
                      {plan.bestValue && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#F5D77F] to-[#AA820A] text-black text-[10px] font-black uppercase tracking-widest shadow-md whitespace-nowrap">
                          BEST VALUE • SAVE 40%
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400">
                            {plan.durationLabel}
                          </span>
                          {totalSavings > 0 && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              Save ₹{totalSavings.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        <h3 className="font-serif text-xl font-bold text-white tracking-tight">{plan.name}</h3>

                        <div className="mt-4 pb-4 border-b border-white/10">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl sm:text-4xl font-serif font-black text-white">
                              ₹{monthlyEquivalent.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">/ month</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Total: <strong className="text-white font-semibold">₹{plan.totalPrice.toLocaleString('en-IN')}</strong> for {plan.durationMonths}{' '}
                            {plan.durationMonths === 1 ? 'Month' : 'Months'}
                          </p>
                        </div>

                        <ul className="mt-5 space-y-2.5 text-xs text-slate-300">
                          {plan.features.map((f, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-6 pt-5 border-t border-white/10 space-y-2 relative z-20">
                        <button
                          onClick={() => openPlanModal(plan, false)}
                          className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 btn-press ${plan.bestValue
                            ? 'bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#AA820A] text-black shadow-lg shadow-[#D4AF37]/30 hover:brightness-110'
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                            }`}
                        >
                          <span>Enroll & Pay Online</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => openPlanModal(plan, true)}
                          className="w-full py-2 px-3 rounded-lg text-slate-400 hover:text-[#F5D77F] text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 btn-press"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Book Free Trial Class First</span>
                        </button>
                      </div>
                    </div>
                  </Tilt3DCard>
                </ScrollReveal>
              );
            })}
          </div>

          <ScrollReveal delay={200}>
            <div className="mt-12 p-6 rounded-2xl glass-dark border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#F5D77F] shrink-0 animate-float-slow">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-white">100% Satisfaction & Safety Guarantee</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Attend your first trial class with zero obligation. Biomechanically safe for kids & adults.
                  </p>
                </div>
              </div>

              <button
                onClick={() => openPlanModal(undefined, true)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-[#F5D77F] font-bold text-xs border border-[#D4AF37]/30 transition-all shrink-0 btn-press"
              >
                Reserve Free Trial Seat &rarr;
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 7. LIVE CLASS SCHEDULE & WORKING VIDEO CALL TIMETABLE */}
      <section id="schedule" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Live Academy & Video Call Timetable</span>
                <h2 className="font-serif text-3xl font-bold text-white mt-1">Upcoming Masterclasses & Live Video Streams</h2>
              </div>

              <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10 self-start">
                {(['all', 'online', 'offline'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setScheduleFilter(tab)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all btn-press ${
                      scheduleFilter === tab
                        ? 'bg-[#D4AF37] text-black shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {tab === 'all' ? 'All Sessions' : tab === 'online' ? 'Live Video Calls' : 'In-Studio'}
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClasses.map((c, index) => {
              const isOnline = c.bookingType === 'online';
              return (
                <ScrollReveal key={c.classId} delay={index * 70} direction="up">
                  <Tilt3DCard intensity={6} className="rounded-2xl h-full">
                    <div className="glass-dark rounded-2xl p-5 border border-white/10 hover:border-[#D4AF37]/40 transition-all flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded flex items-center gap-1.5 ${
                              isOnline
                                ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                                : 'bg-[#D4AF37]/15 text-[#F5D77F] border border-[#D4AF37]/25'
                            }`}
                          >
                            {isOnline && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
                            {isOnline ? 'LIVE VIDEO CLASS' : c.category}
                          </span>
                          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {c.durationMinutes} min
                          </span>
                        </div>

                        <h3 className="font-serif text-base font-bold text-white mt-2">{c.title}</h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.description}</p>

                        <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5 text-xs text-slate-300">
                          <div className="flex items-center gap-2">
                            <Award className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                            <span className="text-slate-200 font-medium">{c.instructorName}</span>
                          </div>
                          {isOnline ? (
                            <div className="flex items-center gap-2 text-indigo-300 text-[11px]">
                              <Video className="w-3.5 h-3.5 shrink-0" />
                              <span>HD Jitsi Room: {c.meetingConfiguration?.jitsiRoom || 'GVYA_Live_Room'}</span>
                            </div>
                          ) : (
                            c.location && (
                              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                <span>{c.location.studioRoom}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between gap-2 relative z-20">
                        <span className="text-[11px] text-slate-400">
                          <strong className="text-white font-semibold">{c.bookedSeats}</strong> / {c.capacity} booked
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openClassBookingModal(c)}
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-[#F5D77F] border border-white/10 btn-press"
                          >
                            Book Spot
                          </button>
                          {isOnline && (
                            <button
                              onClick={() => openVideoCallModal(c)}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 hover:brightness-110 text-xs font-bold text-white flex items-center gap-1 shadow-md btn-press"
                            >
                              <Video className="w-3 h-3" />
                              <span>Join Call</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Tilt3DCard>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. FOUNDER & MASTER ACHARYA SPOTLIGHT */}
      <section id="founder" className="py-20 bg-[#0B0F18] border-t border-white/10 relative">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <ScrollReveal direction="left" className="lg:col-span-5">
              <Tilt3DCard intensity={7} className="rounded-3xl">
                <div className="rounded-3xl overflow-hidden border-2 border-[#D4AF37]/40 shadow-2xl relative group">
                  <img
                    src="https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=800"
                    alt="Master Vijay Guinness World Record Holder"
                    className="w-full h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="font-serif text-2xl font-bold text-white">Master Vijay</p>
                    <p className="text-xs font-bold text-[#F5D77F] uppercase tracking-wider mt-0.5">
                      Guinness World Record Holder • Founder & Chief Guru
                    </p>
                  </div>
                </div>
              </Tilt3DCard>
            </ScrollReveal>

            <ScrollReveal direction="right" className="lg:col-span-7 space-y-5">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] px-3.5 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                Academy Legacy & Master Guidance
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-black text-white">
                "Yoga is not about touching your toes. It is about what you learn on the way down."
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                With over two decades of uncompromising practice and a recognized Guinness World Record in continuous yogic endurance, Master Vijay established GVYA to bring anatomical precision, therapeutic wall props, and child neuro-agility to practitioners of all ages.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl glass-dark border border-white/10 glass-card-hover">
                  <p className="font-serif text-xl font-bold text-[#F5D77F]">22+ Years</p>
                  <p className="text-xs text-slate-400 mt-1">Teaching & Lineage Mastery</p>
                </div>
                <div className="p-4 rounded-xl glass-dark border border-white/10 glass-card-hover">
                  <p className="font-serif text-xl font-bold text-[#F5D77F]">Guinness Certified</p>
                  <p className="text-xs text-slate-400 mt-1">World Record in Yogic Endurance</p>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => openPlanModal(undefined, true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-bold text-xs shadow-lg shadow-[#D4AF37]/25 hover:brightness-110 transition-all btn-press"
                >
                  Schedule an Assessment with Master Vijay &rarr;
                </button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section id="faq" className="py-20 border-t border-white/10 relative">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          <ScrollReveal className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              Clear Answers
            </span>
            <h2 className="font-serif text-3xl font-bold text-white mt-3">Frequently Asked Questions</h2>
          </ScrollReveal>

          <div className="space-y-3">
            {[
              {
                q: 'What is included in the Free Trial Class?',
                a: 'Your complimentary 1-on-1 session includes a personal flexibility & spinal posture assessment, trial access to our specialized props (Aerial silk, Wall or Wheel), and a personalized consultation with a senior instructor.',
              },
              {
                q: 'How do Live Online Video classes work?',
                a: 'Click "Join Call" on any Online Live Session in the timetable above to enter the encrypted Jitsi HD Yoga Sanctuary directly in your browser or mobile device with camera posture alignment checks.',
              },
              {
                q: 'Are Pro Classes suitable for absolute beginners?',
                a: 'Yes! Yoga Props (Wall Harness and Wheel) provide stable external support, allowing beginners to perform therapeutic postures safely without joint strain.',
              },
              {
                q: 'Why is there a strict cap of 50 students per batch?',
                a: 'Master Vijay enforces capped batches so every student receives direct biomechanical feedback and personalized prop adjustments.',
              },
              {
                q: 'What payment modes are accepted?',
                a: 'We support instant UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, and Net Banking/NEFT transfers. Apply code GVYA10 at checkout for 10% instant savings.',
              },
            ].map((faq, idx) => (
              <ScrollReveal key={idx} delay={idx * 50}>
                <div className="glass-dark rounded-2xl border border-white/10 overflow-hidden transition-all hover:border-white/20">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-white hover:text-[#F5D77F] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${openFaq === idx ? 'rotate-180 text-[#D4AF37]' : ''
                        }`}
                    />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${openFaq === idx ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/5 font-light">
                      {faq.a}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="bg-[#05070B] border-t border-white/10 py-12 px-4 lg:px-8 text-xs text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#8F2F1B] flex items-center justify-center font-serif text-sm font-bold text-black">
                G
              </div>
              <span className="font-serif font-bold text-white text-base">GVYA Academy</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Guinness Vijay Yoga Academy. Dedicated to transformative anatomical alignment, kids neuro-agility, and pro props mastery.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#plans" className="hover:text-white transition-colors">Kids & Pro Plans</a></li>
              <li><a href="#science" className="hover:text-white transition-colors">Scientific Facts</a></li>
              <li><a href="#schedule" className="hover:text-white transition-colors">Timetable & Live Video</a></li>
              <li><Link to="/live" className="hover:text-[#F5D77F] transition-colors">Direct Live Class Room</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-3">Academy Studio</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              GVYA Central Studio<br />
              108 Temple Road, Mylapore<br />
              Chennai, Tamil Nadu, India
            </p>
            <p className="text-xs text-[#F5D77F] mt-2">Admissions: +91 98400 12345</p>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-3">Administration</h4>
            <p className="text-xs text-slate-400 mb-3">
              Authorized studio directors, instructors, and operational staff:
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#F5D77F] border border-white/10 text-xs font-bold transition-all btn-press"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Staff Management Sign In &rarr;</span>
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>&copy; 2026 Guinness Vijay Yoga Academy (GVYA). All rights reserved.</p>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Direct Admission Desk & Live Video Active
          </span>
        </div>
      </footer>

      {/* 11. FULL CHECKOUT / ENROLLMENT / CLASS BOOKING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md modal-backdrop">
          <div className="glass-dark rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-[#D4AF37]/40 shadow-2xl relative max-h-[92vh] overflow-y-auto modal-content">
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors btn-press"
            >
              <X className="w-5 h-5" />
            </button>

            {!confirmationReceipt ? (
              <>
                <div className="mb-5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#F5D77F] px-2.5 py-1 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/30">
                    {enrollmentMode === 'class_booking'
                      ? 'Masterclass Spot Reservation'
                      : enrollmentMode === 'trial'
                      ? 'Complimentary 1-on-1 Trial'
                      : 'GVYA Membership Enrollment & Payment'}
                  </span>

                  <h3 className="font-serif text-2xl font-bold text-white mt-2">
                    {enrollmentMode === 'class_booking'
                      ? `Reserve: ${selectedClassForBooking?.title}`
                      : enrollmentMode === 'trial'
                      ? 'Book Your Free Trial Class'
                      : activePlanObj?.name || 'Enroll in GVYA'}
                  </h3>

                  {enrollmentMode !== 'class_booking' && (
                    <div className="flex gap-2 mt-4 p-1 rounded-xl bg-white/5 border border-white/10">
                      <button
                        type="button"
                        onClick={() => setEnrollmentMode('purchase')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                          enrollmentMode === 'purchase'
                            ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black shadow-sm'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Enroll & Pay Now
                      </button>
                      <button
                        type="button"
                        onClick={() => setEnrollmentMode('trial')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                          enrollmentMode === 'trial'
                            ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black shadow-sm'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Book Free Trial (₹0 Today)
                      </button>
                    </div>
                  )}
                </div>

                {formError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitForm} className="space-y-4">
                  {/* Personal Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                        Member / Student Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={100}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Ananya Iyer"
                        className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                        Phone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={24}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98400 12345"
                        className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                        Email Address (Receipt & Video Link)
                      </label>
                      <input
                        type="email"
                        maxLength={120}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    {enrollmentMode !== 'class_booking' && (
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                          Practitioner Age / Child Age
                        </label>
                        <input
                          type="text"
                          maxLength={40}
                          value={ageOrGroup}
                          onChange={(e) => setAgeOrGroup(e.target.value)}
                          placeholder="e.g. 9 yrs or Adult 32 yrs"
                          className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Plan & Training Choices */}
                  {enrollmentMode !== 'class_booking' && (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#F5D77F]">
                        Customize Your Training Choices
                      </p>

                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1.5">Preferred Training Mode:</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'offline', label: 'Studio Offline' },
                            { id: 'online', label: 'Online Video' },
                            { id: 'hybrid', label: 'Hybrid (Both)' },
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setSelectedMode(m.id as any)}
                              className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all btn-press ${
                                selectedMode === m.id
                                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F5D77F]'
                                  : 'bg-[#0B0F17] border-white/10 text-slate-400 hover:text-white'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1.5">Select Props / Focus Disciplines:</label>
                        <div className="flex flex-wrap gap-1.5">
                          {PROP_CHOICES.map((prop) => {
                            const active = selectedProps.includes(prop);
                            return (
                              <button
                                key={prop}
                                type="button"
                                onClick={() => toggleProp(prop)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all btn-press ${
                                  active
                                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                                    : 'bg-[#0B0F17] border-white/10 text-slate-400 hover:text-white'
                                }`}
                              >
                                {active ? '✓ ' : '+ '}
                                {prop}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Schedule Preferences */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                        Preferred Batch Days
                      </label>
                      <select
                        value={preferredDays}
                        onChange={(e) => setPreferredDays(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#0B0F17] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      >
                        <option>Mon - Wed - Fri</option>
                        <option>Tue - Thu - Sat</option>
                        <option>Weekend Batch (Sat & Sun)</option>
                        <option>Flexible / Daily</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                        Preferred Slot Time
                      </label>
                      <select
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#0B0F17] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      >
                        <option>Morning (7:00 AM - 8:30 AM)</option>
                        <option>Mid-Day (10:00 AM - 11:30 AM)</option>
                        <option>Evening (5:00 PM - 6:30 PM)</option>
                        <option>Night (7:00 PM - 8:30 PM)</option>
                      </select>
                    </div>
                  </div>

                  {/* Checkout Payment Section */}
                  {enrollmentMode === 'purchase' && activePlanObj && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#D4AF37]/10 to-[#0B0F17] border border-[#D4AF37]/35 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#F5D77F]">
                          Plan Selection & Payment Summary
                        </span>
                        <span className="text-xs font-mono font-bold text-white">
                          Payable: ₹{finalPayableAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Full vs Monthly installment option */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentPlanOption('full')}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                            paymentPlanOption === 'full'
                              ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-white'
                              : 'border-white/10 bg-black/30 text-slate-400'
                          }`}
                        >
                          <p className="font-bold">Full Plan ({activePlanObj.durationLabel})</p>
                          <p className="text-[11px] text-[#F5D77F]">₹{activePlanObj.totalPrice.toLocaleString('en-IN')}</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentPlanOption('monthly')}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                            paymentPlanOption === 'monthly'
                              ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-white'
                              : 'border-white/10 bg-black/30 text-slate-400'
                          }`}
                        >
                          <p className="font-bold">1st Month Activation</p>
                          <p className="text-[11px] text-[#F5D77F]">₹{activePlanObj.monthlyPrice.toLocaleString('en-IN')}</p>
                        </button>
                      </div>

                      {/* Promo Code */}
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            maxLength={20}
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder="Promo code (Try GVYA10)"
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                        {isPromoValid && (
                          <span className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                            -₹{discountAmount.toLocaleString('en-IN')} Applied!
                          </span>
                        )}
                      </div>

                      {/* Payment Method Tabs */}
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1.5">Select Payment Method:</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('upi')}
                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                              paymentMethod === 'upi'
                                ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F5D77F]'
                                : 'bg-black/30 border-white/10 text-slate-400'
                            }`}
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>UPI App</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('card')}
                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                              paymentMethod === 'card'
                                ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F5D77F]'
                                : 'bg-black/30 border-white/10 text-slate-400'
                            }`}
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Card</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('bank_transfer')}
                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                              paymentMethod === 'bank_transfer'
                                ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F5D77F]'
                                : 'bg-black/30 border-white/10 text-slate-400'
                            }`}
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>NEFT / Cash</span>
                          </button>
                        </div>
                      </div>

                      {paymentMethod === 'upi' && (
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="font-bold text-white">Studio UPI ID: <code className="text-[#F5D77F]">gvya.academy@okicici</code></p>
                            <p className="text-slate-400">Scan/pay via GPay/PhonePe & enter UTR or confirm instant online settlement.</p>
                          </div>
                          <a
                            href={`upi://pay?pa=gvya.academy@okicici&pn=GVYA%20Yoga&am=${finalPayableAmount}&cu=INR`}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold shrink-0 text-center"
                          >
                            Open UPI App &rarr;
                          </a>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          {paymentMethod === 'upi'
                            ? 'UPI / UTR Reference ID (Optional — auto-generated if paying now)'
                            : paymentMethod === 'bank_transfer'
                            ? 'NEFT / Receipt Reference Number'
                            : 'Payment Reference Note (Card processed via tokenized gateway)'}
                        </label>
                        <input
                          type="text"
                          maxLength={60}
                          value={transactionRef}
                          onChange={(e) => setTransactionRef(e.target.value)}
                          placeholder={paymentMethod === 'upi' ? 'e.g. UTR4291827361' : 'Optional ref #'}
                          className="w-full px-3.5 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Health Goals or Medical Notes
                    </label>
                    <textarea
                      rows={2}
                      maxLength={400}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Lower back stiffness relief, beginner aerial interest..."
                      className="w-full px-3.5 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#AA820A] text-black font-bold text-xs shadow-xl shadow-[#D4AF37]/30 hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-2 btn-press disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {submitting
                        ? 'Processing & Syncing with Studio...'
                        : enrollmentMode === 'purchase'
                        ? `Complete Enrollment & Pay ₹${finalPayableAmount.toLocaleString('en-IN')}`
                        : enrollmentMode === 'class_booking'
                        ? 'Confirm Class Spot Now'
                        : 'Confirm Free Trial Reservation'}
                    </span>
                  </button>
                </form>
              </>
            ) : (
              <div className="py-4 text-center space-y-4 animate-scaleIn">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto animate-pulse-emerald">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-white">
                  {confirmationReceipt.isPurchase ? 'Membership Activated & Recorded!' : 'Spot Successfully Reserved!'}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                  Your enrollment and preferences have been synced directly to the GVYA Studio Desk.
                </p>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/15 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reference ID:</span>
                    <span className="font-mono font-bold text-[#F5D77F]">#{confirmationReceipt.refId.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Selection:</span>
                    <span className="font-bold text-white">{confirmationReceipt.planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Training Mode:</span>
                    <span className="font-semibold text-emerald-300">{confirmationReceipt.mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Disciplines:</span>
                    <span className="text-slate-200 text-right max-w-[60%]">{confirmationReceipt.props.join(', ')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10">
                    <span className="text-slate-400">Amount Settled ({confirmationReceipt.method}):</span>
                    <span className="font-serif text-base font-black text-[#F5D77F]">
                      ₹{confirmationReceipt.amountPaid.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  {confirmationReceipt.jitsiRoom && (
                    <button
                      onClick={() => {
                        const target = selectedClassForBooking;
                        closeModal();
                        if (target) openVideoCallModal(target);
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg btn-press"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Video Call Room</span>
                    </button>
                  )}

                  <a
                    href={`https://wa.me/919840012345?text=${encodeURIComponent(
                      `Hello GVYA! Ref #${confirmationReceipt.refId.slice(-8).toUpperCase()} - Plan: ${confirmationReceipt.planName} (${confirmationReceipt.mode}) - Amount: ₹${confirmationReceipt.amountPaid}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all btn-press"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Receipt</span>
                  </a>

                  <button
                    onClick={closeModal}
                    className="py-3 px-5 rounded-xl border border-white/20 text-slate-300 hover:text-white font-semibold text-xs btn-press"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 12. WORKING JITSI LIVE VIDEO CALL MODAL */}
      {activeVideoClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md modal-backdrop">
          <div className="w-full max-w-6xl modal-content">
            {!videoCallStarted ? (
              <div className="max-w-lg mx-auto glass-dark rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/40 shadow-2xl space-y-5 relative">
                <button
                  onClick={() => setActiveVideoClass(null)}
                  className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Live HD Sanctuary</span>
                    <h3 className="font-serif text-xl font-bold text-white">{activeVideoClass.title}</h3>
                  </div>
                </div>
                <p className="text-xs text-slate-300">
                  Instructor: <strong className="text-[#F5D77F]">{activeVideoClass.instructorName}</strong> • Duration: {activeVideoClass.durationMinutes} mins
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!videoJoinName.trim()) return;
                    setVideoCallStarted(true);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Enter Your Name to Enter Class *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={videoJoinName}
                      onChange={(e) => setVideoJoinName(e.target.value)}
                      placeholder="e.g. Ramesh Sundaram"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#AA820A] text-black font-bold text-xs shadow-lg flex items-center justify-center gap-2 btn-press"
                  >
                    <Video className="w-4 h-4" />
                    <span>Enter Live Video Classroom &rarr;</span>
                  </button>
                </form>
              </div>
            ) : (
              <JitsiMeetEmbed
                roomName={activeVideoClass.meetingConfiguration?.jitsiRoom || `GVYA_${activeVideoClass.classId}`}
                classTitle={activeVideoClass.title}
                instructorName={activeVideoClass.instructorName}
                displayName={videoJoinName || 'GVYA Practitioner'}
                onClose={() => {
                  setActiveVideoClass(null);
                  setVideoCallStarted(false);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
