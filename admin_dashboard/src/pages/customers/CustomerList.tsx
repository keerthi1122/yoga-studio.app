import React, { useState, useEffect } from 'react';
import { Search, Sparkles, X, PlusCircle, MinusCircle } from 'lucide-react';
import { User } from '../../types';
import { 
  subscribeToCustomers, 
  updateCustomerStatus, 
  adjustCustomerCredits 
} from '../../services/customerService';

export const CustomerList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [customers, setCustomers] = useState<User[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToCustomers((liveList) => {
      setCustomers(liveList);
    });
    return () => unsubscribe();
  }, []);

  const toggleStatus = async (uid: string) => {
    const target = customers.find((c) => c.uid === uid);
    if (!target) return;
    const nextStatus = target.status === 'active' ? 'suspended' : 'active';

    try {
      await updateCustomerStatus(uid, nextStatus);
    } catch (_) {
      // Optimistic update
      setCustomers(customers.map((c) => c.uid === uid ? { ...c, status: nextStatus } : c));
    }

    if (selectedCustomer && selectedCustomer.uid === uid) {
      setSelectedCustomer({ ...selectedCustomer, status: nextStatus });
    }
  };

  const adjustCredits = async (uid: string, delta: number) => {
    const target = customers.find((c) => c.uid === uid);
    if (!target) return;
    const newBal = Math.max(0, target.remainingCredits + delta);

    try {
      await adjustCustomerCredits(uid, delta, target.remainingCredits);
    } catch (_) {
      setCustomers(customers.map((c) => c.uid === uid ? { ...c, remainingCredits: newBal } : c));
    }

    if (selectedCustomer && selectedCustomer.uid === uid) {
      setSelectedCustomer({ ...selectedCustomer, remainingCredits: newBal });
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E9DCC5]/70">
        <div>
          <h1 className="font-serif text-3xl font-bold text-dark">Customer Directory</h1>
          <p className="text-sm text-dark-muted mt-1">Manage registered practitioners, active passes, and remaining credits.</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#E9DCC5] flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search practitioners by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-cream/30 border border-[#E9DCC5] rounded-xl text-xs focus:outline-none focus:border-burgundy"
          />
        </div>
        <div className="text-xs text-dark-muted font-semibold">
          Total Registered: <span className="text-burgundy">{customers.length}</span>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-[#E9DCC5] shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF6EE] border-b border-[#E9DCC5] uppercase tracking-wider text-dark-muted font-bold">
            <tr>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Contact</th>
              <th className="py-3.5 px-4">Active Plan</th>
              <th className="py-3.5 px-4">Credits Remaining</th>
              <th className="py-3.5 px-4">Account Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9DCC5]/60">
            {filtered.map((c) => (
              <tr key={c.uid} className="hover:bg-[#FAF6EE]/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => setSelectedCustomer(c)}
                  >
                    <div className="w-8 h-8 rounded-full bg-cream border border-beige flex items-center justify-center font-bold text-burgundy group-hover:bg-burgundy group-hover:text-white transition-colors">
                      {c.fullName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-dark group-hover:text-burgundy transition-colors">{c.fullName}</p>
                      <p className="text-[11px] text-dark-muted font-mono">{c.uid}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <p className="text-dark font-medium">{c.email}</p>
                  <p className="text-[11px] text-dark-muted">{c.phone || 'No phone'}</p>
                </td>
                <td className="py-3.5 px-4">
                  {c.activeMembershipId ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-sage-50 text-sage-dark border border-sage/30">
                      <Sparkles className="w-3 h-3" />
                      Active Membership
                    </span>
                  ) : (
                    <span className="text-dark-muted italic">No Active Pass</span>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  <span className={`font-bold font-mono text-sm ${c.remainingCredits > 0 ? 'text-dark' : 'text-red-500'}`}>
                    {c.remainingCredits} Credits
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => setSelectedCustomer(c)}
                    className="text-xs font-semibold text-burgundy hover:underline mr-3"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => toggleStatus(c.uid)}
                    className="text-xs font-semibold text-dark-muted hover:text-red-700 transition-colors"
                  >
                    {c.status === 'active' ? 'Suspend' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E9DCC5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E9DCC5]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cream border border-beige flex items-center justify-center font-bold text-burgundy text-lg">
                  {selectedCustomer.fullName[0]}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-dark">{selectedCustomer.fullName}</h3>
                  <p className="text-xs text-dark-muted">{selectedCustomer.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 rounded-lg hover:bg-cream text-dark-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-cream/30 border border-[#E9DCC5]">
                <div>
                  <span className="text-dark-muted uppercase font-semibold text-[10px]">Phone Number</span>
                  <p className="text-dark font-medium">{selectedCustomer.phone || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-dark-muted uppercase font-semibold text-[10px]">Account Status</span>
                  <p className="font-bold capitalize text-emerald-700">{selectedCustomer.status}</p>
                </div>
              </div>

              {/* Credit Adjustment Tool */}
              <div className="p-4 rounded-xl bg-white border border-[#E9DCC5] flex items-center justify-between">
                <div>
                  <span className="text-dark-muted uppercase font-semibold text-[10px]">Available Class Credits</span>
                  <p className="text-xl font-bold font-mono text-dark">{selectedCustomer.remainingCredits} Credits</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustCredits(selectedCustomer.uid, -1)}
                    className="p-1.5 rounded-lg border border-[#E9DCC5] hover:bg-cream text-dark"
                    title="Deduct 1 credit"
                  >
                    <MinusCircle className="w-4 h-4 text-red-600" />
                  </button>
                  <button
                    onClick={() => adjustCredits(selectedCustomer.uid, 1)}
                    className="p-1.5 rounded-lg border border-[#E9DCC5] hover:bg-cream text-dark"
                    title="Grant 1 credit"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E9DCC5] flex items-center justify-between">
              <button
                onClick={() => toggleStatus(selectedCustomer.uid)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${
                  selectedCustomer.status === 'active'
                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {selectedCustomer.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
              </button>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-1.5 bg-burgundy text-white rounded-xl text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
