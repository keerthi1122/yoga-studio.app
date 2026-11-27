import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Payment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  subscribeToPayments, 
  verifyBankTransferPayment, 
  rejectBankTransferPayment 
} from '../../services/paymentService';
import { formatCurrency, getSymbolForCurrency } from '../../utils/formatters';
import { sanitizeExternalUrl } from '../../utils/security';

export const PaymentList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const { userProfile } = useAuth();

  useEffect(() => {
    const unsubscribe = subscribeToPayments((liveList) => {
      setPayments(liveList);
    });
    return () => unsubscribe();
  }, []);

  const handleVerify = async (payment: Payment) => {
    const adminName = userProfile?.fullName || 'Master Vijay (Director)';
    try {
      await verifyBankTransferPayment(payment, adminName);
    } catch (_) {}
    setSelectedPayment(null);
  };

  const handleReject = async (paymentId: string, userId: string) => {
    const adminName = userProfile?.fullName || 'Master Vijay (Director)';
    try {
      await rejectBankTransferPayment(paymentId, userId, adminName);
    } catch (_) {}
    setSelectedPayment(null);
  };

  const filtered = payments.filter(p =>
    p.userFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.paymentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const safeProofUrl = selectedPayment ? sanitizeExternalUrl(selectedPayment.proofUrl) : undefined;

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E9DCC5]/70">
        <div>
          <h1 className="font-serif text-3xl font-bold text-dark">Financial Ledger & Payment Verification</h1>
          <p className="text-sm text-dark-muted mt-1">
            Audit every public checkout, member selection, UPI settlement, and manual bank transfer receipt.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#E9DCC5] flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by member, plan, ref or Txn ID..."
            className="w-full pl-10 pr-4 py-2 bg-cream/30 border border-[#E9DCC5] rounded-xl text-xs text-dark focus:outline-none focus:border-burgundy"
          />
        </div>
        <div className="text-xs font-semibold text-dark-muted">
          Total Ledger Entries: <span className="text-burgundy">{payments.length}</span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-[#E9DCC5] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6EE] border-b border-[#E9DCC5] uppercase tracking-wider text-dark-muted font-bold">
              <tr>
                <th className="py-3.5 px-4">Payment Ref</th>
                <th className="py-3.5 px-4">Member / Buyer</th>
                <th className="py-3.5 px-4">Plan & Selected Options</th>
                <th className="py-3.5 px-4">Amount Paid</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9DCC5]/60">
              {filtered.map((p) => (
                <tr key={p.paymentId} className="hover:bg-[#FAF6EE]/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-burgundy">{p.paymentId}</span>
                    <span className="block text-[10px] text-dark-muted font-mono">{p.transactionId}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-dark">{p.userFullName}</p>
                    {p.phone && <p className="text-[11px] text-dark-muted">{p.phone}</p>}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-dark font-semibold">{p.packageName}</p>
                    {p.selectedChoices && (
                      <p className="text-[11px] text-sage-dark mt-0.5">{p.selectedChoices}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-dark">
                    {formatCurrency(p.amount, getSymbolForCurrency(p.currency), p.currency)} {p.currency}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      p.paymentMethod === 'upi' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                      p.paymentMethod === 'bank_transfer' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      'bg-cream text-dark border border-beige'
                    }`}>
                      {p.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      p.paymentStatus === 'verified' || p.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                      p.paymentStatus === 'pending' ? 'bg-amber-100 text-amber-900 animate-pulse' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {p.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {p.paymentStatus === 'pending' ? (
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="px-3 py-1.5 rounded-lg bg-burgundy hover:bg-burgundy-dark text-white font-medium text-xs shadow-sm"
                      >
                        Review & Verify
                      </button>
                    ) : (
                      <span className="text-[11px] text-dark-muted">
                        {p.verifiedBy ? `By ${p.verifiedBy}` : 'Settled Online'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verify / Proof Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E9DCC5] relative modal-content">
            <button
              onClick={() => setSelectedPayment(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-cream text-dark-muted"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-xl font-bold text-dark mb-1">Verify Member Payment</h3>
            <p className="text-xs text-dark-muted mb-4">
              Member: <strong className="text-dark">{selectedPayment.userFullName}</strong> &bull; Amount:{' '}
              <strong className="text-dark">
                {formatCurrency(selectedPayment.amount, getSymbolForCurrency(selectedPayment.currency), selectedPayment.currency)} {selectedPayment.currency}
              </strong>
            </p>

            <div className="p-3.5 rounded-xl bg-cream/40 border border-[#E9DCC5] text-xs space-y-1 mb-4">
              <p><span className="text-dark-muted">Package:</span> <strong className="text-dark">{selectedPayment.packageName}</strong></p>
              {selectedPayment.selectedChoices && (
                <p><span className="text-dark-muted">Choices:</span> <span className="text-dark">{selectedPayment.selectedChoices}</span></p>
              )}
              <p><span className="text-dark-muted">Txn / UTR Ref:</span> <code className="text-burgundy font-mono">{selectedPayment.transactionId}</code></p>
            </div>

            {safeProofUrl ? (
              <div className="h-56 rounded-2xl bg-cream border border-[#E9DCC5] overflow-hidden mb-5">
                <img
                  src={safeProofUrl}
                  alt="Bank Receipt Slip"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 mb-5">
                No image receipt attached. Verify UTR/Transaction ID <code className="font-mono font-bold">{selectedPayment.transactionId}</code> against studio bank statement before approving.
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => handleReject(selectedPayment.paymentId, selectedPayment.userId)}
                className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
              >
                Reject Payment
              </button>
              <button
                onClick={() => handleVerify(selectedPayment)}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Approve & Activate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
