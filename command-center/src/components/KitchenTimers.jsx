import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Check, Clock3, Pause, Play, X } from 'lucide-react';
import { finishElapsed, remainingMs, restoreTimers, TIMER_PRESETS, timerLabels } from '../lib/kitchenTimers.js';
import '../timers.css';

const STORAGE_KEY = 'uffda-kitchen-timers-v1';
function loadTimers() {
  try { return restoreTimers(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return []; }
}
function display(ms) {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
function playFinishChime(context) {
  // Three batches of three familiar two-note chimes; audio ends after about five seconds.
  for (const batch of [0, 1, 2]) {
    for (const ding of [0, .38, .76]) {
      for (const [offset, frequency, peak] of [[0, 740, .09], [.14, 990, .075]]) {
        const start = context.currentTime + batch * 1.85 + ding + offset;
        const oscillator = context.createOscillator();
        const volume = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        volume.gain.setValueAtTime(.0001, start);
        volume.gain.exponentialRampToValueAtTime(peak, start + .025);
        volume.gain.exponentialRampToValueAtTime(.0001, start + .22);
        oscillator.connect(volume).connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + .24);
      }
    }
  }
}

export function KitchenTimers() {
  const [timers, setTimers] = useState(loadTimers);
  const [now, setNow] = useState(Date.now);
  const [open, setOpen] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [storageError, setStorageError] = useState(false);
  const sound = useRef(null);
  const toggleRef = useRef(null);
  const panelRef = useRef(null);
  const announced = useRef(new Set(timers.filter(timer => timer.state === 'done').map(timer => timer.id)));

  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      panelRef.current.style.setProperty('--timer-panel-top', `${Math.ceil(toggleRef.current.getBoundingClientRect().bottom + 8)}px`);
    };
    position();
    window.addEventListener('resize', position);
    return () => window.removeEventListener('resize', position);
  }, [open]);
  useEffect(() => {
    panelRef.current.inert = !open;
    if (open) panelRef.current.querySelector('button:not(:disabled)')?.focus();
    else if (panelRef.current.contains(document.activeElement)) toggleRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = event => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); } };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    const update = () => setNow(Date.now());
    const sync = event => { if (event.key === STORAGE_KEY) setTimers(loadTimers()); };
    document.addEventListener('visibilitychange', update);
    window.addEventListener('focus', update);
    window.addEventListener('storage', sync);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', update); window.removeEventListener('focus', update); window.removeEventListener('storage', sync); sound.current?.close?.(); };
  }, []);

  useEffect(() => {
    const expired = timers.filter(timer => timer.state === 'running' && timer.endsAt <= now);
    if (!expired.length) return;
    setTimers(current => finishElapsed(current, Date.now()));
    const fresh = expired.filter(timer => !announced.current.has(timer.id));
    if (!fresh.length) return;
    fresh.forEach(timer => announced.current.add(timer.id));
    if (document.visibilityState === 'visible' && sound.current?.state === 'running') {
      try {
        playFinishChime(sound.current);
      } catch { /* The persistent visual alert remains available when audio is blocked. */ }
    }
  }, [now, timers]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(timers)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [timers]);

  const add = (label, durationSeconds) => {
    if (!label || !Number.isFinite(durationSeconds) || durationSeconds < 1 || durationSeconds > 4 * 60 * 60 || timers.length >= 30) return;
    const time = Date.now();
    try {
      if (!sound.current) sound.current = new (window.AudioContext || window.webkitAudioContext)();
      sound.current.resume?.().catch(() => {});
    } catch { /* Audio may be unavailable. The panel always shows completion. */ }
    setNow(time);
    setTimers(current => [...current, { id: crypto.randomUUID(), label: label.trim().slice(0, 40), state: 'running', endsAt: time + durationSeconds * 1000, remainingMs: durationSeconds * 1000 }]);
    setOpen(true);
  };
  const addCustom = event => {
    event.preventDefault();
    const duration = Number(minutes || 0) * 60 + Number(seconds || 0);
    if (!customLabel.trim()) return;
    add(customLabel.trim(), duration);
    setCustomLabel(''); setMinutes(''); setSeconds('');
  };
  const pause = timer => {
    const time = Date.now();
    setTimers(current => current.map(item => item.id === timer.id ? { ...item, state: 'paused', remainingMs: remainingMs(item, time) } : item));
  };
  const resume = timer => {
    const time = Date.now();
    setTimers(current => current.map(item => item.id === timer.id ? { ...item, state: 'running', endsAt: time + item.remainingMs } : item));
  };
  const remove = id => { announced.current.delete(id); setTimers(current => current.filter(timer => timer.id !== id)); };
  const labels = useMemo(() => timerLabels(timers), [timers]);
  const running = timers.filter(timer => timer.state === 'running');
  const completed = timers.filter(timer => timer.state === 'done');
  const next = running.length ? Math.min(...running.map(timer => remainingMs(timer, now))) : null;
  return <div className="kitchen-timers">
    <button ref={toggleRef} className={`live-quiet timer-toggle ${completed.length ? 'has-finished' : ''}`} type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="kitchen-timer-panel" aria-label={open ? 'Close kitchen timers' : `Open kitchen timers: ${running.length} running, ${completed.length} finished`} title={open ? 'Close kitchen timers' : completed.length ? `${completed.length} timer${completed.length === 1 ? '' : 's'} finished` : next === null ? 'Kitchen timers' : `${running.length} running · next in ${display(next)}`}><Clock3 size={19} aria-hidden="true"/></button>
    <aside ref={panelRef} className={`timer-panel ${open ? 'is-open' : ''}`} id="kitchen-timer-panel" aria-label="Kitchen timers" aria-hidden={!open}><div className="timer-panel-heading"><div><h2>Kitchen timers</h2><span>{running.length} running{completed.length ? ` · ${completed.length} finished` : ''}</span></div></div>
      <div className="timer-panel-content"><div className="timer-presets">{TIMER_PRESETS.map(preset => <button type="button" key={preset.label} onClick={() => add(preset.label, preset.seconds)} disabled={timers.length >= 30}>+ {preset.label} <small>{display(preset.seconds * 1000)}</small></button>)}</div>
        <form className="timer-custom" onSubmit={addCustom}><label htmlFor="timer-name">Custom timer</label><div><input id="timer-name" placeholder="Label" aria-label="Timer label" maxLength={40} required value={customLabel} onChange={event => setCustomLabel(event.target.value)}/><input aria-label="Minutes" title="Minutes" placeholder="min" type="number" min="0" max="240" value={minutes} onChange={event => setMinutes(event.target.value)}/><input aria-label="Seconds" title="Seconds" placeholder="sec" type="number" min="0" max="59" value={seconds} onChange={event => setSeconds(event.target.value)}/><button type="submit" disabled={timers.length >= 30 || !(Number(minutes || 0) * 60 + Number(seconds || 0))}>Start</button></div></form>
        {storageError ? <p className="timer-storage-warning" role="alert">Timers may not survive a page refresh because browser storage is unavailable.</p> : null}
        <div className="timer-list" aria-live="off">{timers.length ? timers.map((timer, index) => <div className={`timer-row ${timer.state}`} key={timer.id}><div className="timer-row-info"><strong>{labels[index]}</strong><span>{timer.state === 'done' ? 'Time is up' : timer.state === 'paused' ? 'Paused' : 'Cooking'}</span></div><strong className="timer-countdown">{timer.state === 'done' ? 'DONE' : display(remainingMs(timer, now))}</strong><div className="timer-row-actions">{timer.state === 'running' ? <button type="button" title={`Pause ${labels[index]}`} aria-label={`Pause ${labels[index]}`} onClick={() => pause(timer)}><Pause size={16} aria-hidden="true"/></button> : timer.state === 'paused' ? <button type="button" title={`Resume ${labels[index]}`} aria-label={`Resume ${labels[index]}`} onClick={() => resume(timer)}><Play size={16} aria-hidden="true"/></button> : null}<button type="button" title={timer.state === 'done' ? `Dismiss ${labels[index]}` : `Remove ${labels[index]}`} aria-label={timer.state === 'done' ? `Dismiss ${labels[index]}` : `Remove ${labels[index]}`} onClick={() => remove(timer.id)}>{timer.state === 'done' ? <Check size={17} aria-hidden="true"/> : <X size={16} aria-hidden="true"/>}</button></div></div>) : <p className="timer-empty">Start a preset to track cooking times.</p>}</div>
      </div></aside>
  </div>;
}
