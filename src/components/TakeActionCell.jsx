// src/components/TakeActionCell.jsx
import { useState } from 'react';
import { pushToShopify } from '../services/api';

const STATUS = {
  IDLE: 'idle',
  EDITING: 'editing',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function TakeActionCell({ skuId, recommendedSP, onPushed }) {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [varianceModal, setVarianceModal] = useState(null); // { sp, isManual, systemSP, percent }

  async function doPush(sp, isManual, confirmVariance = false) {
    setStatus(STATUS.LOADING);
    setError('');
    try {
      const result = await pushToShopify(skuId, sp, isManual, confirmVariance);
      setStatus(STATUS.SUCCESS);
      setVarianceModal(null);
      if (onPushed) onPushed(skuId, result);
      setTimeout(() => setStatus(STATUS.IDLE), 3000);
    } catch (err) {
      const data = err?.response?.data;

      if (data?.error === 'variance_check_failed') {
        const percent = data.systemSP > 0
          ? (((sp - data.systemSP) / data.systemSP) * 100).toFixed(1)
          : null;
        setVarianceModal({ sp, isManual, systemSP: data.systemSP, percent });
        setStatus(STATUS.IDLE); // buttons behind the modal go back to normal
        return;
      }

      setStatus(STATUS.ERROR);
      setError(data?.error || err.message || 'Push failed');
      setTimeout(() => { setStatus(STATUS.IDLE); setError(''); }, 4000);
    }
  }

  return (
    <>
      {/* ── Variance confirmation modal ─────────────────────────── */}
      {varianceModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setVarianceModal(null)}
        >
          <div
            className="bg-slate-800 border border-slate-600 rounded-lg p-6 w-[380px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-slate-100 font-semibold text-base mb-2">Confirm Price Change</h3>
            <p className="text-slate-300 text-sm mb-4">
  {varianceModal.systemSP != null ? (
    <>
      New price for <span className="font-mono text-slate-100">{skuId}</span>:{' '}
      <span className="font-semibold text-slate-100">₹{varianceModal.sp}</span>
      <br />
      System recommends:{' '}
      <span className="font-semibold text-slate-100">₹{varianceModal.systemSP}</span>
      <br />
      That's{' '}
      <span className={varianceModal.percent >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
        {varianceModal.percent >= 0 ? '+' : ''}{varianceModal.percent}%
      </span>{' '}
      {varianceModal.percent >= 0 ? 'higher' : 'lower'} than recommended. Are you sure?
    </>
  ) : (
    <>
      No system recommendation is saved yet for{' '}
      <span className="font-mono text-slate-100">{skuId}</span>.
      <br />
      You're about to push{' '}
      <span className="font-semibold text-slate-100">₹{varianceModal.sp}</span>. Please confirm this is correct.
    </>
  )}
</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setVarianceModal(null)}
                className="px-3 py-1.5 text-sm rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => doPush(varianceModal.sp, varianceModal.isManual, true)}
                className="px-3 py-1.5 text-sm rounded bg-amber-600 hover:bg-amber-500 text-white font-medium"
              >
                Save &amp; Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modify & Push editing state ───────────────────────────── */}
      {status === STATUS.EDITING ? (
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
      ) : (
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
      )}
    </>
  );
}