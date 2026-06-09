// src/components/StatusBadge.jsx
export default function StatusBadge({ status }) {
  if (!status) return <span className="text-slate-500">—</span>;

  const s = status.toLowerCase();

  if (s === 'in stock') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/60 text-emerald-400 border border-emerald-700">
        In Stock
      </span>
    );
  }

  if (s.includes('hurry') || s.includes('only')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-900/60 text-amber-400 border border-amber-700">
        {status}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/60 text-red-400 border border-red-700">
      Out of Stock
    </span>
  );
}