"use client";

export default function RatingStars({ rating, onChange, readonly = false }: { rating: number; onChange?: (r: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-1" role="group" aria-label={`Rating: ${rating} out of 5 stars`}>
      {[1,2,3,4,5].map((r) => (
        <button
          key={r}
          type="button"
          disabled={readonly}
          onClick={()=>!readonly && onChange?.(r)}
          aria-label={`${readonly ? '' : 'Rate '}${r} star${r > 1 ? 's' : ''}${r <= rating ? ' (selected)' : ''}`}
          className={`text-2xl ${r <= rating ? 'text-yellow-400' : 'text-slate-300'} ${readonly ? '' : 'hover:text-yellow-300 cursor-pointer'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
