import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminLayout } from '../layouts/AdminLayout';
import { Login } from '../pages/auth/Login';
import { Overview } from '../pages/dashboard/Overview';
import { ClassList } from '../pages/classes/ClassList';
import { BookingList } from '../pages/bookings/BookingList';
import { CustomerList } from '../pages/customers/CustomerList';
import { InstructorList } from '../pages/instructors/InstructorList';
import { PackageList } from '../pages/memberships/PackageList';
import { LiveSessions } from '../pages/live/LiveSessions';
import { PaymentList } from '../pages/payments/PaymentList';
import { ReportsAnalytics } from '../pages/reports/ReportsAnalytics';
import { NotificationManager } from '../pages/notifications/NotificationManager';
import { StudioSettingsPage } from '../pages/settings/StudioSettingsPage';
import { ShieldAlert } from 'lucide-react';

// Protected Route Guard for any authenticated staff (Admin or Instructor)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-burgundy border-t-transparent animate-spin" />
          <p className="text-xs text-dark-muted font-medium">Verifying studio security clearance...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Strict Admin-Only Route Guard
const AdminOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, isAdmin } = useAuth();

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-[#E9DCC5] max-w-lg mx-auto text-center my-12 shadow-sm">
        <div className="w-14 h-14 bg-red-50 text-red-700 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-dark">Administrative Clearance Required</h2>
        <p className="text-xs text-dark-muted mt-2 leading-relaxed">
          Your current account role is <strong className="text-burgundy uppercase font-semibold">{userProfile.role}</strong>. 
          Financial ledgers, pass configurations, and studio settings are restricted to Studio Directors.
        </p>
        <div className="mt-6">
          <a
            href="/classes"
            className="inline-block px-5 py-2.5 rounded-xl bg-burgundy hover:bg-burgundy-dark text-white text-xs font-semibold shadow-sm transition-all"
          >
            Go to My Assigned Classes &rarr;
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Overview />} />
        <Route path="classes" element={<ClassList />} />
        <Route path="live-sessions" element={<LiveSessions />} />
        
        {/* Admin-restricted routes */}
        <Route
          path="bookings"
          element={
            <AdminOnlyRoute>
              <BookingList />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="customers"
          element={
            <AdminOnlyRoute>
              <CustomerList />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="instructors"
          element={
            <AdminOnlyRoute>
              <InstructorList />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="packages"
          element={
            <AdminOnlyRoute>
              <PackageList />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="payments"
          element={
            <AdminOnlyRoute>
              <PaymentList />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="reports"
          element={
            <AdminOnlyRoute>
              <ReportsAnalytics />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <AdminOnlyRoute>
              <NotificationManager />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="settings"
          element={
            <AdminOnlyRoute>
              <StudioSettingsPage />
            </AdminOnlyRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
