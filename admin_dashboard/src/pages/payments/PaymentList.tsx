import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Payment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  subscribeToPayments, 
  verifyBankTransferPayment, 
  rejectBankTransferPayment 
} from '../../services/paymentService';
import { formatCurrency, getSymbolForCurrency } from '../../utils/formatters';

export const PaymentList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProof, setSelectedProof] = useState<Payment | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const { userProfile } = useAuth();

  useEffect(() => {
    const unsubscribe = subscribeToPayments((liveList) => {
      setPayments(liveList);
    });
    return () => unsubscribe();
  }, []);

  const handleVerify = async (payment: Payment) => {
    const adminName = userProfile?.fullName || 'Studio Director';
    try {
      await verifyBankTransferPayment(payment, adminName);
    } catch (_) {
      setPayments(payments.map(p => {
        if (p.paymentId === payment.paymentId) {
          return {
            ...p,
            paymentStatus: 'verified',
            verifiedBy: adminName,
            verifiedAt: new Date().toISOString()
          };
        }
        return p;
      }));
    }
    setSelectedProof(null);
  };

  const handleReject = async (paymentId: string, userId: string) => {
    const adminName = userProfile?.fullName || 'Studio Director';
    try {
      await rejectBankTransferPayment(paymentId, userId, adminName);
    } catch (_) {
      setPayments(payments.map(p => {
        if (p.paymentId === paymentId) {
          return { ...p, paymentStatus: 'rejected', verifiedBy: adminName };
        }
        return p;
      }));
    }
    setSelectedProof(null);
  };

  const filtered = payments.filter(p =>
    p.userFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.paymentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E9DCC5]/70">
        <div>
          <h1 className="font-serif text-3xl font-bold text-dark">Financial Ledger & Transfer Verification</h1>
          <p className="text-sm text-dark-muted mt-1">Review merchant card transactions, test payments, and verify manual wire receipts.</p>
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
            placeholder="Search transactions by reference or name..."
            className="w-full pl-10 pr-4 py-2 bg-cream/30 border border-[#E9DCC5] rounded-xl text-xs focus:outline-none focus:border-burgundy"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-[#E9DCC5] shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF6EE] border-b border-[#E9DCC5] uppercase tracking-wider text-dark-muted font-bold">
            <tr>
              <th className="py-3.5 px-4">Payment Ref</th>
              <th className="py-3.5 px-4">Practitioner</th>
              <th className="py-3.5 px-4">Package</th>
              <th className="py-3.5 px-4">Amount</th>
              <th className="py-3.5 px-4">Method</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9DCC5]/60">
            {filtered.map((p) => (
              <tr key={p.paymentId} className="hover:bg-[#FAF6EE]/40 transition-colors">
                <td className="py-3.5 px-4">
                  <span className="font-mono font-bold text-burgundy">{p.paymentId}</span>
                  <span className="block text-[10px] text-dark-muted font-mono">{p.transactionId}</span>
                </td>
                <td className="py-3.5 px-4 font-semibold text-dark">{p.userFullName}</td>
                <td className="py-3.5 px-4 text-dark font-medium">{p.packageName}</td>
                <td className="py-3.5 px-4 font-bold text-dark">{formatCurrency(p.amount, getSymbolForCurrency(p.currency), p.currency)} {p.currency}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    p.paymentMethod === 'simulated' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                    p.paymentMethod === 'bank_transfer' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                    'bg-cream text-dark border border-beige'
                  }`}>
                    {p.paymentMethod}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    p.paymentStatus === 'verified' ? 'bg-emerald-50 text-emerald-700' :
                    p.paymentStatus === 'pending' ? 'bg-amber-100 text-amber-900 animate-pulse' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {p.paymentStatus}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  {p.paymentStatus === 'pending' && p.proofUrl ? (
                    <button
                      onClick={() => setSelectedProof(p)}
                      className="px-3 py-1.5 rounded-lg bg-burgundy hover:bg-burgundy-dark text-white font-medium text-xs shadow-sm"
                    >
                      Inspect Slip & Verify
                    </button>
                  ) : (
                    <span className="text-[11px] text-dark-muted">
                      {p.verifiedBy ? `By ${p.verifiedBy}` : 'Automatic Cleared'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slip Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E9DCC5]">
            <h3 className="font-serif text-xl font-bold text-dark mb-1">Verify Bank Transfer Receipt</h3>
            <p className="text-xs text-dark-muted mb-4">
              Practitioner: <strong>{selectedProof.userFullName}</strong> &bull; Amount: <strong>{formatCurrency(selectedProof.amount, getSymbolForCurrency(selectedProof.currency), selectedProof.currency)} {selectedProof.currency}</strong>
            </p>

            <div className="h-64 rounded-2xl bg-cream border border-[#E9DCC5] overflow-hidden mb-5">
              <img
                src={selectedProof.proofUrl}
                alt="Bank Receipt Slip"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => handleReject(selectedProof.paymentId, selectedProof.userId)}
                className="flex-1 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
              >
                Reject Receipt
              </button>
              <button
                onClick={() => handleVerify(selectedProof)}
                className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Approve & Activate Credits
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
