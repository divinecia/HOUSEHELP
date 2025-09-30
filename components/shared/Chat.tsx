"use client";

import { useState, useEffect, useRef } from "react";

type Message = { id: string; sender: string; content: string; created_at: string; is_me: boolean };

export default function Chat({ userId, userType, recipientId }: { userId: string; userType: 'household'|'worker'|'admin'; recipientId?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      setLoading(true);
      const q = new URLSearchParams({ user_id: userId, user_type: userType });
      if (recipientId) q.set('recipient_id', recipientId);
      const res = await fetch(`/api/${userType}/messages?${q.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('messages ' + res.status);
      const js = await res.json();
      setMessages(js.items || []);
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (userId) load(); }, [userId, recipientId]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send() {
    if (!draft.trim()) return;
    try {
      const res = await fetch(`/api/${userType}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, recipient_id: recipientId, content: draft }) });
      if (!res.ok) throw new Error('send ' + res.status);
      setDraft("");
      await load();
    } catch (e: any) { console.error(e); }
  }

  return (
    <div className="flex flex-col h-full border border-slate-200 rounded-lg bg-white">
      <div className="p-3 border-b border-slate-200 font-semibold text-slate-800">Messages</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.is_me ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-3 py-2 rounded-lg ${m.is_me ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-800'}`}>
              <div className="text-xs opacity-75">{m.sender}</div>
              <div>{m.content}</div>
              <div className="text-xs opacity-75 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t border-slate-200 flex gap-2">
        <input className="hh-input flex-1" placeholder="Type a message..." value={draft} onChange={(e)=>setDraft(e.target.value)} onKeyDown={(e)=>e.key==='Enter' && send()} />
        <button className="hh-btn hh-btn-primary" onClick={send} disabled={!draft.trim()}>Send</button>
      </div>
    </div>
  );
}
