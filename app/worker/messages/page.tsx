"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Chat from "@/components/shared/Chat";
import AuthGuard from "@/components/AuthGuard";

export default function WorkerMessagesPage() {
  const [workerId, setWorkerId] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem('hh-worker-id') || '';
    setWorkerId(saved);
  }, []);

  return (
    <AuthGuard requiredType="worker">
      <div className="hh-page">
        <main className="hh-main">
          <h1 className="hh-title">Messages</h1>
          <p className="hh-subtitle">Chat with households and admin</p>

          <div className="mt-4 flex items-center gap-3">
            <label className="hh-label">Worker ID
              <input className="hh-input ml-2" placeholder="W-..." value={workerId} onChange={(e)=>{ setWorkerId(e.target.value); localStorage.setItem('hh-worker-id', e.target.value); }} />
            </label>
            <Link href="/worker/dashboard" className="hh-link ml-auto">← Back</Link>
          </div>

          <div className="mt-4" style={{ height: '500px' }}>
            {workerId ? (
              <Chat userId={workerId} userType="worker" />
            ) : (
              <div className="hh-muted">Enter your Worker ID to view messages.</div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
