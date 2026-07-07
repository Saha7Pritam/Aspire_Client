// src/components/TakeActionCell.jsx
import { useState } from 'react';
import { pushToShopify } from '../services/api';

const STATUS = {
  IDLE: 'idle',
  EDITING: 'editing',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  VARIANCE_CONFIRM: 'variance_confirm',
};

export default function TakeActionCell({ skuId, recommendedSP, onPushed }) {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [pendingPush, setPendingPush] = useState(null); // { sp, isManual } waiting on variance confirm

  async function doPush(sp, isManual, confirmVariance = false) {
    setStatus(STATUS.LOADING);
    setError('');
    try {
      const result = await pushToShopify(skuId, sp, isManual, confirmVariance);
      setStatus(STATUS.SUCCESS);
      setPendingPush(null);
      if (onPushed) onPushed(skuId, result);
      setTimeout(() => setStatus(STATUS.IDLE), 3000);
    } catch (err) {
      const data = err?.response?.data;

      if (data?.error === 'variance_check_failed') {
        setStatus(STATUS.VARIANCE_CONFIRM);
        setError(data.message);
        setPendingPush({ sp, isManual });
        return; // don't auto-clear — wait for the user to confirm or cancel
      }

      setStatus(STATUS.ERROR);
      setError(data?.error || err.message || 'Push failed');
      setPendingPush(null);
      setTimeout(() => { setStatus(STATUS.IDLE); setError(''); }, 4000);
    }
  }

  // ── Variance confirmation prompt ──────────────────────────────
  if (status === STATUS.VARIANCE_CONFIRM) {
    return (
      <div className="flex flex-col items-center gap-1.5 max-w-[160px]">
        <span className="text-[10px] text-amber-400 text-center leading-tight">{error}</span>
        <div className="flex gap-1.5">
          <button
            onClick={() => doPush(pendingPush.sp, pendingPush.isManual, true)}
            className="px-2 py-0.5 text-xs rounded bg-amber-600 hover:bg-amber-500 text-white"
          >
            Push anyway
          </button>
          <button
            onClick={() => { setStatus(STATUS.IDLE); setError(''); setPendingPush(null); }}
            className="px-2 py-0.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Modify & Push editing state ───────────────────────────────
  if (status === STATUS.EDITING) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="New SP"
          className="w-24 px-2 py-1 text-xs rounded bg-slate-800 border border-slate-600 text-slate-200 text-center"
          autoFocus
        />
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              const val = parseFloat(inputValue);
              if (isNaN(val) || val <= 0) { setError('Enter a valid number'); return; }
              doPush(val, true);
            }}
            className="px-2 py-0.5 text-xs rounded bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            Save
          </button>
          <button
            onClick={() => { setStatus(STATUS.IDLE); setInputValue(''); setError(''); }}
            className="px-2 py-0.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
          >
            Cancel
          </button>
        </div>
        {error && <span className="text-[10px] text-red-400">{error}</span>}
      </div>
    );
  }

  // ── Default idle state ────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => doPush(recommendedSP, false)}
          disabled={status === STATUS.LOADING}
          className="px-2 py-1 text-xs rounded bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white"
        >
          {status === STATUS.LOADING ? '...' : 'Push'}
        </button>
        <button
          onClick={() => setStatus(STATUS.EDITING)}
          disabled={status === STATUS.LOADING}
          className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300"
        >
          Modify &amp; Push
        </button>
      </div>
      {status === STATUS.SUCCESS && <span className="text-[10px] text-emerald-400">Pushed ✓</span>}
      {status === STATUS.ERROR && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
}