import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  GraduationCap, 
  Ticket, 
  CreditCard, 
  Video, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Sparkles,
  ChevronRight,
  Bell,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Class Schedule', path: '/classes', icon: Calendar },
  { name: 'Live Sessions', path: '/live-sessions', icon: Video },
  { name: 'Bookings', path: '/bookings', icon: Ticket, adminOnly: true },
  { name: 'Customers', path: '/customers', icon: Users, adminOnly: true },
  { name: 'Instructors', path: '/instructors', icon: GraduationCap, adminOnly: true },
  { name: 'Packages & Passes', path: '/packages', icon: Sparkles, adminOnly: true },
  { name: 'Payments & Proofs', path: '/payments', icon: CreditCard, adminOnly: true },
  { name: 'Reports & Analytics', path: '/reports', icon: BarChart3, adminOnly: true },
  { name: 'Notifications', path: '/notifications', icon: Bell, adminOnly: true },
  { name: 'Studio Settings', path: '/settings', icon: Settings, adminOnly: true },
];

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userProfile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const user = userProfile || { fullName: 'Studio Director', role: 'admin' };

  return (
    <div className="min-h-screen flex bg-[#FAF6EE]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#FFFFFF] border-r border-[#E9DCC5] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-[#E9DCC5]/60 bg-[#FDF6F5]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-burgundy flex items-center justify-center text-white shadow-md">
              <span className="font-serif text-xl font-bold">Y</span>
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg text-dark tracking-wide">PRANA STUDIO</h1>
              <p className="text-xs text-dark-muted uppercase tracking-wider font-medium">Administration</p>
            </div>
          </div>
          <button 
            className="p-1.5 rounded-lg text-dark-muted hover:bg-cream lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isLocked = item.adminOnly && !isAdmin;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-burgundy text-white shadow-sm shadow-burgundy/20 font-semibold'
                      : isLocked
                      ? 'text-dark-muted/50 hover:bg-cream/40'
                      : 'text-dark-muted hover:bg-cream/60 hover:text-dark'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : isLocked ? 'text-dark-muted/40' : 'text-[#8F2F1B]'}`} />
                      <span className={isLocked ? 'line-through text-dark-muted/50' : ''}>{item.name}</span>
                    </div>
                    {isLocked ? (
                      <Lock className="w-3.5 h-3.5 text-dark-muted/40" />
                    ) : isActive ? (
                      <ChevronRight className="w-4 h-4 opacity-75" />
                    ) : null}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-[#E9DCC5]/70 bg-[#FAF6EE]/50">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-[#E9DCC5]/80">
            <div className="w-9 h-9 rounded-full bg-sage/20 border border-sage/40 flex items-center justify-center text-sage-dark font-bold text-sm">
              {user.fullName ? user.fullName[0] : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-dark truncate">{user.fullName}</p>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                user.role === 'admin' ? 'bg-burgundy-50 text-burgundy' : 'bg-sage-50 text-sage-dark'
              }`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-dark-muted hover:text-burgundy hover:bg-cream/80 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
        {/* Top Navbar */}
        <header className="h-16 px-6 bg-white/80 backdrop-blur-md border-b border-[#E9DCC5] sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-dark-muted hover:bg-cream rounded-lg lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-dark-muted">
                Studio Online &bull; Role: <strong className="text-burgundy uppercase">{user.role}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-cream text-dark text-xs font-medium border border-beige">
              USD ($) &bull; America/New_York
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
