"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { FileUpload } from "@/components/shared/FileUpload";

interface VerificationStatus {
  id_verified: boolean;
  background_check: boolean;
  address_verified: boolean;
  phone_verified: boolean;
  email_verified: boolean;
  submitted_at?: string;
  verified_at?: string;
  status: 'pending' | 'verified' | 'rejected' | 'incomplete';
  rejection_reason?: string;
}

export default function HouseholdVerificationPage() {
  const [householdId, setHouseholdId] = useState<string>("");
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('hh-household-id') || '';
    setHouseholdId(saved);
  }, []);

  async function load() {
    if (!householdId) return;
    try {
      setErr(null);
      setLoading(true);
      const res = await fetch(`/api/household/verification?household_id=${encodeURIComponent(householdId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('verification ' + res.status);
      const js = await res.json();
      setVerification(js);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (householdId) load();
  }, [householdId]);

  async function uploadDocument(file: File, docType: string) {
    try {
      setErr(null);
      setUploadingDoc(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('household_id', householdId);
      formData.append('doc_type', docType);

      const res = await fetch('/api/household/verification/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('upload ' + res.status);
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setUploadingDoc(false);
    }
  }

  async function submitForReview() {
    try {
      setErr(null);
      const res = await fetch('/api/household/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ household_id: householdId, action: 'submit' })
      });
      if (!res.ok) throw new Error('submit ' + res.status);
      await load();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  const VerificationItem = ({ label, verified }: { label: string; verified: boolean }) => (
    <div className="flex items-center justify-between p-3 border-b border-slate-100">
      <span className="text-slate-700">{label}</span>
      <span className={`px-2 py-1 rounded text-xs font-medium ${verified ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
        {verified ? '✓ Verified' : 'Pending'}
      </span>
    </div>
  );

  return (
    <AuthGuard requiredType="household">
      <div className="hh-page">
        <main className="hh-main">
          <h1 className="hh-title">Verification</h1>
          <p className="hh-subtitle">Verify your identity and contact information</p>

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
            <Link href="/household/dashboard" className="hh-link ml-auto">← Back</Link>
          </div>

          {err && <div className="hh-error mt-3">{err}</div>}

          {loading && <div className="hh-muted mt-4">Loading...</div>}

          {!loading && verification && (
            <div className="mt-4 space-y-4">
              <div className="hh-panel">
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-slate-800">Verification Status</h2>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      verification.status === 'verified' ? 'bg-green-100 text-green-800' :
                      verification.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      verification.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
                    </span>
                  </div>
                  {verification.submitted_at && (
                    <p className="text-sm text-slate-600 mt-2">
                      Submitted: {new Date(verification.submitted_at).toLocaleString()}
                    </p>
                  )}
                  {verification.verified_at && (
                    <p className="text-sm text-slate-600">
                      Verified: {new Date(verification.verified_at).toLocaleString()}
                    </p>
                  )}
                  {verification.rejection_reason && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-800">
                        <strong>Rejection Reason:</strong> {verification.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <VerificationItem label="Email Verification" verified={verification.email_verified} />
                  <VerificationItem label="Phone Verification" verified={verification.phone_verified} />
                  <VerificationItem label="ID Verification" verified={verification.id_verified} />
                  <VerificationItem label="Address Verification" verified={verification.address_verified} />
                  <VerificationItem label="Background Check" verified={verification.background_check} />
                </div>
              </div>

              <div className="hh-panel p-4">
                <h3 className="font-semibold text-slate-800 mb-3">Upload Verification Documents</h3>
                <div className="space-y-3">
                  <div>
                    <label className="hh-label mb-2 block">ID Document (National ID or Passport)</label>
                    <FileUpload
                      onFileSelect={(file) => uploadDocument(file, 'id')}
                      accept="image/*,.pdf"
                      disabled={uploadingDoc}
                    />
                  </div>
                  <div>
                    <label className="hh-label mb-2 block">Proof of Address (Utility bill, etc.)</label>
                    <FileUpload
                      onFileSelect={(file) => uploadDocument(file, 'address')}
                      accept="image/*,.pdf"
                      disabled={uploadingDoc}
                    />
                  </div>
                </div>
                {uploadingDoc && <p className="text-sm text-slate-600 mt-2">Uploading...</p>}
              </div>

              {verification.status === 'incomplete' && (
                <button
                  className="hh-btn hh-btn-primary w-full"
                  onClick={submitForReview}
                >
                  Submit for Review
                </button>
              )}
            </div>
          )}

          {!loading && !verification && householdId && (
            <div className="hh-muted mt-4">No verification information found for this household ID.</div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
