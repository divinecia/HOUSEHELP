"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  age?: number;
  notes?: string;
}

export default function HouseholdFamilyPage() {
  const [householdId, setHouseholdId] = useState<string>("");
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newMember, setNewMember] = useState<Partial<FamilyMember>>({});

  useEffect(() => {
    const saved = localStorage.getItem('hh-household-id') || '';
    setHouseholdId(saved);
  }, []);

  async function load() {
    if (!householdId) return;
    try {
      setErr(null);
      setLoading(true);
      const res = await fetch(`/api/household/family?household_id=${encodeURIComponent(householdId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('family ' + res.status);
      const js = await res.json();
      setMembers(js.members || []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (householdId) load();
  }, [householdId]);

  async function addMember() {
    try {
      setErr(null);
      const res = await fetch('/api/household/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ household_id: householdId, ...newMember })
      });
      if (!res.ok) throw new Error('add member ' + res.status);
      setShowAdd(false);
      setNewMember({});
      await load();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm('Remove this family member?')) return;
    try {
      setErr(null);
      const res = await fetch('/api/household/family', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ household_id: householdId, member_id: memberId })
      });
      if (!res.ok) throw new Error('remove member ' + res.status);
      await load();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <AuthGuard requiredType="household">
      <div className="hh-page">
        <main className="hh-main">
          <h1 className="hh-title">Family Information</h1>
          <p className="hh-subtitle">Manage your family members and dependents</p>

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
              + Add Member
            </button>
            <Link href="/household/dashboard" className="hh-link">← Back</Link>
          </div>

          {err && <div className="hh-error mt-3">{err}</div>}

          {showAdd && (
            <div className="hh-content-section mt-4">
              <h2 className="font-semibold text-slate-800 mb-3">Add Family Member</h2>
              <div className="hh-form-grid">
                <div>
                  <label htmlFor="member-name" className="hh-label">Name</label>
                  <input
                    id="member-name"
                    className="hh-input"
                    placeholder="Full Name"
                    value={newMember.name ?? ''}
                    onChange={(e)=>setNewMember({...newMember, name: e.target.value})}
                  />
                </div>
                <div>
                  <label htmlFor="member-relationship" className="hh-label">Relationship</label>
                  <select
                    id="member-relationship"
                    className="hh-select"
                    value={newMember.relationship ?? ''}
                    onChange={(e)=>setNewMember({...newMember, relationship: e.target.value})}
                  >
                    <option value="">Select...</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="member-age" className="hh-label">Age (optional)</label>
                  <input
                    id="member-age"
                    type="number"
                    className="hh-input"
                    value={newMember.age ?? ''}
                    onChange={(e)=>setNewMember({...newMember, age: parseInt(e.target.value) || undefined})}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="member-notes" className="hh-label">Notes (optional)</label>
                  <textarea
                    id="member-notes"
                    className="hh-input"
                    rows={2}
                    value={newMember.notes ?? ''}
                    onChange={(e)=>setNewMember({...newMember, notes: e.target.value})}
                  />
                </div>
                <div className="sm:col-span-2 flex gap-2">
                  <button className="hh-btn hh-btn-primary" onClick={addMember}>Add</button>
                  <button className="hh-btn hh-btn-secondary" onClick={()=>{setShowAdd(false); setNewMember({});}}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <div key={member.id} className="hh-panel p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{member.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{member.relationship}</p>
                    {member.age && <p className="text-sm text-slate-500">Age: {member.age}</p>}
                  </div>
                  <button
                    className="text-red-600 hover:text-red-800 text-sm"
                    onClick={()=>removeMember(member.id)}
                  >
                    Remove
                  </button>
                </div>
                {member.notes && (
                  <p className="mt-2 text-sm text-slate-600 border-t border-slate-100 pt-2">
                    {member.notes}
                  </p>
                )}
              </div>
            ))}
            {members.length === 0 && !loading && (
              <div className="col-span-full p-4 hh-muted">No family members added yet.</div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
