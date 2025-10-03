"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  description: string;
  booking_id?: string;
  payment_method?: string;
  created_at: string;
  invoice_url?: string;
}

export default function PaymentHistoryPage() {
  const [householdId, setHouseholdId] = useState<string>("");
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem('hh-household-id') || '';
    setHouseholdId(saved);
  }, []);

  async function load() {
    if (!householdId) return;
    try {
      setErr(null);
      setLoading(true);
      const params = new URLSearchParams({ household_id: householdId });
      if (filter) params.set('status', filter);
      const res = await fetch(`/api/household/payments/history?${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('payment history ' + res.status);
      const js = await res.json();
      setPayments(js.payments || []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (householdId) load();
  }, [householdId, filter]);

  async function downloadInvoice(payment: PaymentHistory) {
    if (!payment.invoice_url) {
      alert('Invoice not available for this payment');
      return;
    }
    window.open(payment.invoice_url, '_blank');
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const formatAmount = (amount: number, currency: string = 'RWF') => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <AuthGuard requiredType="household">
      <div className="hh-page">
        <main className="hh-main">
          <h1 className="hh-title">Payment History & Invoices</h1>
          <p className="hh-subtitle">View your payment transactions and download invoices</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="hh-label">Household ID
              <input
                className="hh-input ml-2"
                placeholder="HH-..."
                value={householdId}
                onChange={(e)=>{
                  setHouseholdId(e.target.value);
                  localStorage.setItem('hh-household-id', e.target.value);
                }}
              />
            </label>
            <label className="hh-label">Status
              <select className="hh-select ml-2" value={filter} onChange={(e)=>setFilter(e.target.value)}>
                <option value="">All</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </label>
            <button className="hh-btn hh-btn-secondary" onClick={load} disabled={loading}>
              Refresh
            </button>
            <Link href="/household/payments" className="hh-link ml-auto">← Payment Methods</Link>
          </div>

          {err && <div className="hh-error mt-3">{err}</div>}

          <div className="mt-4 overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm" role="table" aria-label="Payment history">
              <caption className="sr-only">Payment transaction history and invoices</caption>
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th scope="col" className="p-3 text-left">Date</th>
                  <th scope="col" className="p-3 text-left">Description</th>
                  <th scope="col" className="p-3 text-left">Payment Method</th>
                  <th scope="col" className="p-3 text-right">Amount</th>
                  <th scope="col" className="p-3 text-left">Status</th>
                  <th scope="col" className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t hover:bg-slate-50">
                    <td className="p-3">
                      {new Date(payment.created_at).toLocaleDateString()}
                      <br />
                      <span className="text-xs text-slate-500">
                        {new Date(payment.created_at).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="p-3">
                      {payment.description}
                      {payment.booking_id && (
                        <div className="text-xs text-slate-500 mt-1">
                          Booking: {payment.booking_id}
                        </div>
                      )}
                    </td>
                    <td className="p-3">{payment.payment_method ?? '—'}</td>
                    <td className="p-3 text-right font-medium">
                      {formatAmount(payment.amount, payment.currency)}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-3">
                      {payment.invoice_url && payment.status === 'completed' && (
                        <button
                          className="hh-btn hh-btn-secondary text-xs"
                          onClick={() => downloadInvoice(payment)}
                          aria-label={`Download invoice for ${payment.description}`}
                        >
                          Download Invoice
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center hh-muted">
                      No payment history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {payments.length > 0 && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Total Transactions:</span>
                <span className="font-semibold text-slate-800">{payments.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-slate-600">Total Spent:</span>
                <span className="font-semibold text-slate-800">
                  {formatAmount(
                    payments
                      .filter(p => p.status === 'completed')
                      .reduce((sum, p) => sum + p.amount, 0)
                  )}
                </span>
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
