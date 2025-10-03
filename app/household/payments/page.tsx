"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";

interface PaymentMethod {
  id: string;
  type: 'card' | 'mobile_money' | 'bank';
  last_four?: string;
  phone?: string;
  bank_name?: string;
  is_default: boolean;
  created_at: string;
}

export default function HouseholdPaymentsPage() {
  const [householdId, setHouseholdId] = useState<string>("");
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newMethod, setNewMethod] = useState<Partial<PaymentMethod>>({ type: 'mobile_money' });

  useEffect(() => {
    const saved = localStorage.getItem('hh-household-id') || '';
    setHouseholdId(saved);
  }, []);

  async function load() {
    if (!householdId) return;
    try {
      setErr(null);
      setLoading(true);
      const res = await fetch(`/api/household/payments?household_id=${encodeURIComponent(householdId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('payments ' + res.status);
      const js = await res.json();
      setMethods(js.methods || []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (householdId) load();
  }, [householdId]);

  async function addPaymentMethod() {
    try {
      setErr(null);
      const res = await fetch('/api/household/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ household_id: householdId, ...newMethod })
      });
      if (!res.ok) throw new Error('add payment method ' + res.status);
      setShowAdd(false);
      setNewMethod({ type: 'mobile_money' });
      await load();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function setDefault(methodId: string) {
    try {
      setErr(null);
      const res = await fetch('/api/household/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ household_id: householdId, method_id: methodId, action: 'set_default' })
      });
      if (!res.ok) throw new Error('set default ' + res.status);
      await load();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function removeMethod(methodId: string) {
    if (!confirm('Remove this payment method?')) return;
    try {
      setErr(null);
      const res = await fetch('/api/household/payments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ household_id: householdId, method_id: methodId })
      });
      if (!res.ok) throw new Error('remove method ' + res.status);
      await load();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  const PaymentMethodCard = ({ method }: { method: PaymentMethod }) => {
    let displayInfo = '';
    if (method.type === 'card' && method.last_four) {
      displayInfo = `**** **** **** ${method.last_four}`;
    } else if (method.type === 'mobile_money' && method.phone) {
      displayInfo = method.phone;
    } else if (method.type === 'bank' && method.bank_name) {
      displayInfo = method.bank_name;
    }

    return (
      <div className="hh-panel p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800 capitalize">{method.type.replace('_', ' ')}</h3>
              {method.is_default && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Default</span>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-1">{displayInfo}</p>
            <p className="text-xs text-slate-500 mt-1">
              Added {new Date(method.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {!method.is_default && (
            <button className="hh-btn hh-btn-secondary text-xs" onClick={() => setDefault(method.id)}>
              Set Default
            </button>
          )}
          <button className="hh-btn hh-btn-secondary text-xs text-red-600" onClick={() => removeMethod(method.id)}>
            Remove
          </button>
        </div>
      </div>
    );
  };

  return (
    <AuthGuard requiredType="household">
      <div className="hh-page">
        <main className="hh-main">
          <h1 className="hh-title">Payment Methods</h1>
          <p className="hh-subtitle">Manage your payment methods for bookings</p>

          <div className="mt-4 flex items-center gap-3">
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
            <button className="hh-btn hh-btn-secondary" onClick={load} disabled={loading}>
              Refresh
            </button>
            <button className="hh-btn hh-btn-primary ml-auto" onClick={()=>setShowAdd(true)}>
              + Add Payment Method
            </button>
            <Link href="/household/dashboard" className="hh-link">← Back</Link>
          </div>

          {err && <div className="hh-error mt-3">{err}</div>}

          {showAdd && (
            <div className="hh-content-section mt-4">
              <h2 className="font-semibold text-slate-800 mb-3">Add Payment Method</h2>
              <div className="hh-form-grid">
                <div className="sm:col-span-2">
                  <label htmlFor="payment-type" className="hh-label">Payment Type</label>
                  <select
                    id="payment-type"
                    className="hh-select"
                    value={newMethod.type ?? 'mobile_money'}
                    onChange={(e)=>setNewMethod({...newMethod, type: e.target.value as any})}
                  >
                    <option value="mobile_money">Mobile Money</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="bank">Bank Account</option>
                  </select>
                </div>

                {newMethod.type === 'mobile_money' && (
                  <div className="sm:col-span-2">
                    <label htmlFor="phone" className="hh-label">Phone Number</label>
                    <input
                      id="phone"
                      className="hh-input"
                      placeholder="+250 XXX XXX XXX"
                      value={newMethod.phone ?? ''}
                      onChange={(e)=>setNewMethod({...newMethod, phone: e.target.value})}
                    />
                  </div>
                )}

                {newMethod.type === 'card' && (
                  <div className="sm:col-span-2">
                    <label htmlFor="last-four" className="hh-label">Last 4 Digits</label>
                    <input
                      id="last-four"
                      className="hh-input"
                      placeholder="1234"
                      maxLength={4}
                      value={newMethod.last_four ?? ''}
                      onChange={(e)=>setNewMethod({...newMethod, last_four: e.target.value})}
                    />
                  </div>
                )}

                {newMethod.type === 'bank' && (
                  <div className="sm:col-span-2">
                    <label htmlFor="bank-name" className="hh-label">Bank Name</label>
                    <input
                      id="bank-name"
                      className="hh-input"
                      placeholder="Bank of Kigali"
                      value={newMethod.bank_name ?? ''}
                      onChange={(e)=>setNewMethod({...newMethod, bank_name: e.target.value})}
                    />
                  </div>
                )}

                <div className="sm:col-span-2 flex gap-2">
                  <button className="hh-btn hh-btn-primary" onClick={addPaymentMethod}>Add</button>
                  <button className="hh-btn hh-btn-secondary" onClick={()=>{setShowAdd(false); setNewMethod({ type: 'mobile_money' });}}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {methods.map((method) => (
              <PaymentMethodCard key={method.id} method={method} />
            ))}
            {methods.length === 0 && !loading && (
              <div className="col-span-full p-4 hh-muted">No payment methods added yet.</div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
