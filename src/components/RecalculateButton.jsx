// src/components/RecalculateButton.jsx
// ─────────────────────────────────────────────────────────────
// Triggers the recommendation engine on demand.
// Polls job status every 3s until done or error.
// ─────────────────────────────────────────────────────────────

import { useRef, useState } from 'react';
import { runRecommendationEngine, getRecommendationJobStatus } from '../services/api';

export default function RecalculateButton({ onDone }) {
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [msg, setMsg]       = useState('');
  const pollRef             = useRef(null);

  async function handleClick() {
    if (status === 'running') return;

    setStatus('running');
    setMsg('');

    try {
      // runRecommendationEngine() returns response.data = { success: true, jobId: '...' }
      // jobId is directly on the object, NOT nested under .data
      const response = await runRecommendationEngine();
      const jobId    = response.jobId;

      if (!jobId) {
        throw new Error('No job ID returned from server');
      }

      // Poll every 3 seconds until done or error
      pollRef.current = setInterval(async () => {
        try {
          const job = await getRecommendationJobStatus(jobId);

          if (job.status === 'done') {
            clearInterval(pollRef.current);
            setStatus('done');
            setMsg(`Updated ${job.updatedCount} products`);
            onDone(); // reload table
            setTimeout(() => { setStatus('idle'); setMsg(''); }, 5000);

          } else if (job.status === 'error') {
            clearInterval(pollRef.current);
            setStatus('error');
            setMsg(job.error?.substring(0, 80) || 'Engine failed');
            setTimeout(() => { setStatus('idle'); setMsg(''); }, 6000);
          }
          // status === 'running' → keep polling
        } catch (pollErr) {
          // Don't stop polling on a transient network error
          console.warn('Poll error (will retry):', pollErr.message);
        }
      }, 3000);

    } catch (err) {
      setStatus('error');
      setMsg(err?.response?.data?.error || err.message || 'Failed to start');
      setTimeout(() => { setStatus('idle'); setMsg(''); }, 6000);
    }
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        onClick={handleClick}
        disabled={status === 'running'}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg
          transition-colors
          ${status === 'running'
            ? 'bg-amber-600/80 text-white cursor-not-allowed'
            : status === 'done'
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
            : status === 'error'
            ? 'bg-red-700 hover:bg-red-600 text-white'
            : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
          }`}
      >
        <svg
          className={`w-3 h-3 ${status === 'running' ? 'animate-spin' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          {status === 'done' ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          ) : status === 'error' ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          )}
        </svg>
        {status === 'running' ? 'Recalculating...' :
         status === 'done'    ? '✓ Done' :
         status === 'error'   ? '✗ Failed' :
         'Recalculate SP'}
      </button>
      {msg && (
        <span className={`text-[10px] max-w-[180px] text-right leading-tight
          ${status === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
          {msg}
        </span>
      )}
    </div>
  );
}