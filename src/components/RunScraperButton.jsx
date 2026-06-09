// src/components/RunScraperButton.jsx
// ─────────────────────────────────────────────────────────────
// Triggers a full competitor price scrape on demand.
// Only rendered for admin and supervisor roles (checked in App.jsx).
//
// Behaviour mirrors RecalculateButton exactly:
//   1. POST /api/run-scraper          → get jobId
//   2. Poll GET /api/scraper-job/:id  every 5s (scraper takes minutes, not seconds)
//   3. Show running / done / error state with inline feedback
//
// Polling interval is 5s (vs 3s for recommendation engine) because
// a full scrape across all categories takes several minutes —
// polling faster would just add noise.
// ─────────────────────────────────────────────────────────────

import { useRef, useState } from 'react';
import { runScraper, getScraperJobStatus } from '../services/api';

// ── Spider / web icon for the scraper ────────────────────────
function SpiderIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 005 0" />
    </svg>
  );
}

export default function RunScraperButton({ onDone }) {
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [msg, setMsg]       = useState('');
  const [elapsed, setElapsed] = useState(0);   // seconds running — shown in button
  const pollRef             = useRef(null);
  const timerRef            = useRef(null);

  // ── Start elapsed timer ───────────────────────────────────
  function startTimer() {
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed(s => s + 1);
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function fmtElapsed(s) {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  }

  // ── Main handler ──────────────────────────────────────────
  async function handleClick() {
    if (status === 'running') return;

    setStatus('running');
    setMsg('');
    startTimer();

    try {
      const response = await runScraper();
      const jobId    = response.jobId;

      if (!jobId) throw new Error('No job ID returned from server');

      // Poll every 5 seconds — scrapes take minutes
      pollRef.current = setInterval(async () => {
        try {
          const job = await getScraperJobStatus(jobId);

          if (job.status === 'done') {
            clearInterval(pollRef.current);
            stopTimer();
            setStatus('done');
            setMsg('Scrape complete — competitor prices updated');
            if (onDone) onDone();
            setTimeout(() => { setStatus('idle'); setMsg(''); setElapsed(0); }, 8000);

          } else if (job.status === 'error') {
            clearInterval(pollRef.current);
            stopTimer();
            setStatus('error');
            setMsg(job.error?.substring(0, 100) || 'Scraper failed');
            setTimeout(() => { setStatus('idle'); setMsg(''); setElapsed(0); }, 8000);
          }
          // status === 'running' → keep polling
        } catch (pollErr) {
          // Transient network error — keep polling, don't abort
          console.warn('Scraper poll error (will retry):', pollErr.message);
        }
      }, 5000);

    } catch (err) {
      stopTimer();
      setStatus('error');
      const errMsg = err?.response?.data?.error || err.message || 'Failed to start';
      // Surface the "already running" conflict clearly
      setMsg(errMsg.includes('already running') ? 'Already running — check back soon' : errMsg.substring(0, 100));
      setTimeout(() => { setStatus('idle'); setMsg(''); setElapsed(0); }, 8000);
    }
  }

  // ── Colour / label logic ──────────────────────────────────
  const buttonClass = {
    idle   : 'bg-slate-700 hover:bg-slate-600 text-slate-200',
    running: 'bg-orange-700/80 text-white cursor-not-allowed',
    done   : 'bg-emerald-600 hover:bg-emerald-500 text-white',
    error  : 'bg-red-700 hover:bg-red-600 text-white',
  }[status];

  const label = {
    idle   : 'Run Scraper',
    running: `Scraping… ${fmtElapsed(elapsed)}`,
    done   : '✓ Done',
    error  : '✗ Failed',
  }[status];

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        onClick={handleClick}
        disabled={status === 'running'}
        title={
          status === 'running'
            ? 'Scraper is running — please wait'
            : 'Trigger a full competitor price scrape across all due categories'
        }
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg
          transition-colors ${buttonClass}`}
      >
        {/* Icon */}
        {status === 'running' ? (
          <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ) : status === 'done' ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : status === 'error' ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // Idle — use a "broadcast / signal" icon to suggest data fetching
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        )}
        {label}
      </button>

      {/* Status message shown below the button */}
      {msg && (
        <span className={`text-[10px] max-w-[200px] text-right leading-tight
          ${status === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
          {msg}
        </span>
      )}
    </div>
  );
}