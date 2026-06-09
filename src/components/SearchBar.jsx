// src/components/SearchBar.jsx
import { useState } from 'react';

export default function SearchBar({ onSearch, value }) {
  const [inputVal, setInputVal] = useState(value || '');

  function handleKeyDown(e) {
    if (e.key === 'Enter') onSearch(inputVal.trim());
  }

  function handleClick() {
    onSearch(inputVal.trim());
  }

  function handleChange(e) {
    const val = e.target.value;
    setInputVal(val);
    // Clear search instantly when input is emptied
    if (val === '') onSearch('');
  }

  return (
    <div className="flex items-center gap-2 flex-1 max-w-sm">
      <div className="relative flex-1">
        <input
          type="text"
          value={inputVal}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search by SKU..."
          className="
            w-full pl-3 pr-10 py-1.5
            text-xs text-slate-200 placeholder-slate-500
            bg-slate-800 border border-slate-700
            rounded-lg outline-none
            focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40
            transition-colors
          "
        />
        {/* Clear button */}
        {inputVal && (
          <button
            onClick={() => { setInputVal(''); onSearch(''); }}
            className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {/* Search icon / button */}
        <button
          onClick={handleClick}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-violet-400 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}