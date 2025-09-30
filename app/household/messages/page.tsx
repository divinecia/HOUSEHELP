"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Chat from "@/components/shared/Chat";

export default function HouseholdMessagesPage() {
  const [householdId, setHouseholdId] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem('hh-household-id') || '';
    setHouseholdId(saved);
  }, []);

  return (
    <div className="hh-page">
      <main className="hh-main">
        <h1 className="hh-title">Messages</h1>
        <p className="hh-subtitle">Chat with workers and admin</p>

        <div className="mt-4 flex items-center gap-3">
          <label className="hh-label">Household ID
            <input className="hh-input ml-2" placeholder="HH-..." value={householdId} onChange={(e)=>{ setHouseholdId(e.target.value); localStorage.setItem('hh-household-id', e.target.value); }} />
          </label>
          <Link href="/household/dashboard" className="hh-link ml-auto">← Back</Link>
        </div>

        <div className="mt-4" style={{ height: '500px' }}>
          {householdId ? (
            <Chat userId={householdId} userType="household" />
          ) : (
            <div className="hh-muted">Enter your Household ID to view messages.</div>
          )}
        </div>
      </main>
    </div>
  );
}
