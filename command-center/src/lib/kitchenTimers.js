export const TIMER_PRESETS = Object.freeze([
  { label: 'Fries', seconds: 4 * 60 },
  { label: 'Wings', seconds: 8 * 60 },
]);

export function restoreTimers(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(timer => timer && typeof timer.id === 'string' && typeof timer.label === 'string' && timer.label.length <= 40 && Number.isFinite(timer.remainingMs) && timer.remainingMs >= 0 && timer.remainingMs <= 4 * 60 * 60 * 1000 && (timer.state === 'running' || timer.state === 'paused' || timer.state === 'done') && (timer.state !== 'running' || Number.isFinite(timer.endsAt))).slice(0, 30);
}

export function remainingMs(timer, now) {
  return timer.state === 'running' ? Math.max(0, timer.endsAt - now) : timer.state === 'done' ? 0 : timer.remainingMs;
}

export function finishElapsed(timers, now) {
  return timers.map(timer => timer.state === 'running' && timer.endsAt <= now ? { ...timer, state: 'done', remainingMs: 0 } : timer);
}

export function timerLabels(timers) {
  const counts = new Map();
  const positions = new Map();
  for (const timer of timers) counts.set(timer.label.toLowerCase(), (counts.get(timer.label.toLowerCase()) || 0) + 1);
  return timers.map(timer => {
    const key = timer.label.toLowerCase();
    const index = (positions.get(key) || 0) + 1;
    positions.set(key, index);
    return counts.get(key) > 1 ? `${timer.label} ${index}` : timer.label;
  });
}
