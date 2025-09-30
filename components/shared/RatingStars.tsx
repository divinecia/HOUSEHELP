"use client";

export default function RatingStars({ rating, onChange, readonly = false }: { rating: number; onChange?: (r: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((r) => (
        <button
          key={r}
          type="button"
          disabled={readonly}
          onClick={()=>!readonly && onChange?.(r)}
          className={`text-2xl ${r <= rating ? 'text-yellow-400' : 'text-slate-300'} ${readonly ? '' : 'hover:text-yellow-300 cursor-pointer'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
