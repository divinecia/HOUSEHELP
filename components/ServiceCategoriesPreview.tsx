"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";

export default function ServiceCategoriesPreview() {
  const [items, setItems] = useState<{ id?: number; name?: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase
      .from("service_categories")
      .select("id,name")
      .limit(5)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        if (data) setItems(data);
      });
  }, []);

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-slate-800 mb-2">Popular service categories</h3>
      {error && <div className="hh-error">{error}</div>}
      <ul className="list-disc pl-5 text-slate-700">
        {items.map((c) => (
          <li key={String(c.id ?? c.name)}>{c.name ?? "Unnamed"}</li>
        ))}
        {items.length === 0 && !error && (
          <li className="hh-muted">No categories found.</li>
        )}
      </ul>
    </div>
  );
}
