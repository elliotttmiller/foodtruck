import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GENERIC_MODULES } from '../config/modules.js';
import { CUSTOMER_MENU, CUSTOMER_MENU_SEED_VERSION } from '../config/customerMenu.js';
import { SCHEMA_VERSION } from './finance.js';

const STORE_KEY = 'ftcc.live.v3';
const LEGACY_KEYS = ['ftcc.live.v2', 'ftcc.v1'];
const CHANNEL_NAME = 'ftcc-live-v3';
const CLIENT_ID = crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

function emptyState() {
  return {
    meta:{ schemaVersion:SCHEMA_VERSION, customerMenuSeedVersion:CUSTOMER_MENU_SEED_VERSION, revision:0, updatedAt:null },
    settings:{ businessName:'Uff-Da Eats', currency:'USD', defaultProcessingPct:'0', defaultProcessingFixed:'0', defaultOverhead:'0' },
    ingredients:[], jobSessions:[], dailyReports:[], sales:[], customers:[], events:[], inventory:[], menu:structuredClone(CUSTOMER_MENU), purchases:[], vendors:[], labor:[], expenses:[],
  };
}

export function normalizeState(input) {
  const base = emptyState();
  const next = { ...base, ...(input || {}), meta:{...base.meta,...(input?.meta || {})}, settings:{...base.settings,...(input?.settings || {})} };
  [...Object.keys(GENERIC_MODULES), 'ingredients', 'jobSessions', 'dailyReports'].forEach(key => { if (!Array.isArray(next[key])) next[key] = []; });
  if (!next.menu.length || Number(input?.meta?.customerMenuSeedVersion) < CUSTOMER_MENU_SEED_VERSION) {
    if (!next.menu.length) next.menu = structuredClone(CUSTOMER_MENU);
    next.meta.customerMenuSeedVersion = CUSTOMER_MENU_SEED_VERSION;
  }
  next.meta.schemaVersion = SCHEMA_VERSION;
  return next;
}

function migrate(old) {
  const next = normalizeState(old);
  next.meta = { schemaVersion:SCHEMA_VERSION, revision:Number(old?.meta?.revision) || 0, updatedAt:new Date().toISOString() };
  return next;
}

function loadInitialState() {
  try {
    const current = localStorage.getItem(STORE_KEY);
    if (current) return normalizeState(JSON.parse(current));
    for (const key of LEGACY_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) return migrate(JSON.parse(raw));
    }
  } catch {}
  return emptyState();
}

function saveState(normalized) {
  const serialized = JSON.stringify(normalized);
  try {
    localStorage.setItem(STORE_KEY, serialized);
    return true;
  } catch (error) {
    if (error?.name !== 'QuotaExceededError') {
      console.warn('Unable to save command center state.', error);
      return false;
    }
  }

  try {
    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
    localStorage.setItem(STORE_KEY, serialized);
    return true;
  } catch (error) {
    console.warn('Browser storage is full; keeping command center changes in memory for this session.', error);
    return false;
  }
}

const StoreContext = createContext(null);

export function AppStoreProvider({ children }) {
  const [state, setState] = useState(loadInitialState);
  const stateRef = useRef(state);
  const channelRef = useRef(null);
  stateRef.current = state;

  const persist = useCallback((next, announce = true) => {
    const normalized = normalizeState(next);
    saveState(normalized);
    if (announce) channelRef.current?.postMessage({ clientId:CLIENT_ID, state:normalized });
    return normalized;
  }, []);

  const commit = useCallback(mutator => {
    setState(previous => {
      const draft = structuredClone(previous);
      mutator(draft);
      draft.meta.revision = (Number(draft.meta.revision) || 0) + 1;
      draft.meta.updatedAt = new Date().toISOString();
      return persist(draft, true);
    });
  }, [persist]);

  const replaceState = useCallback(next => {
    const normalized = normalizeState(next);
    normalized.meta.revision = Math.max(Number(normalized.meta.revision) || 0, Number(stateRef.current.meta.revision) || 0) + 1;
    normalized.meta.updatedAt = new Date().toISOString();
    setState(persist(normalized, true));
  }, [persist]);

  useEffect(() => {
    persist(state, false);
    const channel = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : null;
    channelRef.current = channel;
    const apply = incoming => {
      const next = normalizeState(incoming);
      setState(current => Number(next.meta.revision) > Number(current.meta.revision) ? next : current);
    };
    const onStorage = event => {
      if (event.key !== STORE_KEY || !event.newValue) return;
      try { apply(JSON.parse(event.newValue)); } catch {}
    };
    window.addEventListener('storage', onStorage);
    if (channel) channel.onmessage = event => { if (event.data?.clientId !== CLIENT_ID && event.data?.state) apply(event.data.state); };
    return () => { window.removeEventListener('storage', onStorage); channel?.close(); channelRef.current = null; };
  }, [persist]);

  const value = useMemo(() => ({ state, commit, replaceState }), [state, commit, replaceState]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useAppStore must be used within AppStoreProvider');
  return value;
}
