import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, X } from 'lucide-react';
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

export function KitchenTimers() {
  const [timers, setTimers] = useState(loadTimers);
  const [now, setNow] = useState(Date.now);
  const [open, setOpen] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [storageError, setStorageError] = useState(false);
  const sound = useRef(null);
  const announced = useRef(new Set(timers.filter(timer => timer.state === 'done').map(timer => timer.id)));

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
    setOpen(true);
    if (document.visibilityState === 'visible' && sound.current?.state === 'running') {
      try {
        [0, .25, .5].forEach(delay => {
          const oscillator = sound.current.createOscillator();
          const volume = sound.current.createGain();
          oscillator.type = 'sine'; oscillator.frequency.value = 880;
          volume.gain.setValueAtTime(.0001, sound.current.currentTime + delay);
          volume.gain.exponentialRampToValueAtTime(.16, sound.current.currentTime + delay + .02);
          volume.gain.exponentialRampToValueAtTime(.0001, sound.current.currentTime + delay + .18);
          oscillator.connect(volume).connect(sound.current.destination);
          oscillator.start(sound.current.currentTime + delay);
          oscillator.stop(sound.current.currentTime + delay + .2);
        });
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
    <button className={`live-quiet timer-toggle ${completed.length ? 'has-finished' : ''}`} type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="kitchen-timer-panel" aria-label={`Timers: ${running.length} running, ${completed.length} finished`} title={completed.length ? `${completed.length} timer${completed.length === 1 ? '' : 's'} finished` : next === null ? 'Kitchen timers' : `${running.length} running · next in ${display(next)}`}><Clock3 size={19} aria-hidden="true"/></button>
    {open ? <section className="timer-panel" id="kitchen-timer-panel" aria-label="Kitchen timers"><div className="timer-panel-heading"><div><h2>Kitchen timers</h2><span>{running.length} running{completed.length ? ` · ${completed.length} finished` : ''}</span></div><button className="timer-icon-button" type="button" onClick={() => setOpen(false)} aria-label="Close timers"><X size={18}/></button></div>
      <div className="timer-panel-content"><div className="timer-presets">{TIMER_PRESETS.map(preset => <button type="button" key={preset.label} onClick={() => add(preset.label, preset.seconds)} disabled={timers.length >= 30}>+ {preset.label} <small>{display(preset.seconds * 1000)}</small></button>)}</div>
        <form className="timer-custom" onSubmit={addCustom}><label htmlFor="timer-name">Custom timer</label><div><input id="timer-name" placeholder="Label" aria-label="Timer label" maxLength={40} required value={customLabel} onChange={event => setCustomLabel(event.target.value)}/><input aria-label="Minutes" title="Minutes" placeholder="min" type="number" min="0" max="240" value={minutes} onChange={event => setMinutes(event.target.value)}/><input aria-label="Seconds" title="Seconds" placeholder="sec" type="number" min="0" max="59" value={seconds} onChange={event => setSeconds(event.target.value)}/><button type="submit" disabled={timers.length >= 30 || !(Number(minutes || 0) * 60 + Number(seconds || 0))}>Start</button></div></form>
        {storageError ? <p className="timer-storage-warning" role="alert">Timers may not survive a page refresh because browser storage is unavailable.</p> : null}
        <div className="timer-list" aria-live="off">{timers.length ? timers.map((timer, index) => <div className={`timer-row ${timer.state}`} key={timer.id}><div className="timer-row-info"><strong>{labels[index]}</strong><span>{timer.state === 'done' ? 'Time is up' : timer.state === 'paused' ? 'Paused' : 'Cooking'}</span></div><strong className="timer-countdown">{timer.state === 'done' ? 'DONE' : display(remainingMs(timer, now))}</strong><div className="timer-row-actions">{timer.state === 'running' ? <button type="button" onClick={() => pause(timer)}>Pause</button> : timer.state === 'paused' ? <button type="button" onClick={() => resume(timer)}>Resume</button> : null}<button type="button" onClick={() => remove(timer.id)}>{timer.state === 'done' ? 'Dismiss' : 'Remove'}</button></div></div>) : <p className="timer-empty">Start a preset to track cooking times.</p>}</div>
      </div></section> : null}
  </div>;
}
