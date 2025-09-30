"use client";

import { useState } from "react";

export default function FileUpload({ onUpload, accept = "image/*,application/pdf", label = "Upload File" }: { onUpload: (file: File) => Promise<void>; accept?: string; label?: string }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setErr(null); setUploading(true);
      await onUpload(file);
    } catch (e: any) { setErr(e.message); }
    finally { setUploading(false); }
  }

  return (
    <div>
      <label className="hh-btn hh-btn-secondary cursor-pointer">
        {uploading ? 'Uploading...' : label}
        <input type="file" accept={accept} onChange={handleChange} disabled={uploading} className="hidden" />
      </label>
      {err && <div className="hh-error mt-2">{err}</div>}
    </div>
  );
}
