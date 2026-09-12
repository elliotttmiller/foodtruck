import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const DATABASE = 'uffda-menu-image-v1';
const STORE = 'menu';
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function menuFile(mode, file) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode === 'read' ? 'readonly' : 'readwrite');
    const request = mode === 'read' ? transaction.objectStore(STORE).get('current') : transaction.objectStore(STORE).put(file, 'current');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}

export function MenuQuickReference({ onClose }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const dialog = useRef(null);
  const closeButton = useRef(null);
  const upload = useRef(null);
  useEffect(() => {
    let mounted = true;
    menuFile('read').then(saved => { if (mounted) setFile(saved || null); }).catch(() => { if (mounted) setError('Menu image storage is unavailable in this browser.'); });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    const previous = document.activeElement;
    closeButton.current?.focus();
    const keydown = event => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'Tab') {
        const controls = [...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled)')];
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); previous?.focus?.(); };
  }, [onClose]);
  const [imageUrl, setImageUrl] = useState('');
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const choose = async event => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type)) { setError('Choose a PNG, JPG, or WebP menu image.'); return; }
    try { await menuFile('write', selected); setFile(selected); setError(''); }
    catch { setError('Could not save the menu image on this device. Check browser storage settings.'); }
    event.target.value = '';
  };
  return <div className="order-dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="menu-viewer" role="dialog" aria-modal="true" aria-labelledby="menu-viewer-title" ref={dialog}>
      <header className="menu-viewer-head"><h2 id="menu-viewer-title">Menu</h2><div><input ref={upload} type="file" accept="image/png,image/jpeg,image/webp" onChange={choose} aria-label="Choose menu image" hidden/><button type="button" className="menu-viewer-change" onClick={() => upload.current?.click()}>{file ? 'Replace menu' : 'Choose menu image'}</button><button ref={closeButton} type="button" className="order-dialog-x" aria-label="Close menu" onClick={onClose}><X size={20}/></button></div></header>
      {error ? <p className="menu-viewer-error" role="alert">{error}</p> : null}
      <div className="menu-viewer-body">{imageUrl ? <img src={imageUrl} alt="Current food truck menu"/> : <div className="menu-viewer-empty"><strong>No menu image saved on this laptop.</strong><p>Choose your current menu image once, then the header icon opens it instantly during service.</p><button type="button" onClick={() => upload.current?.click()}>Choose menu image</button></div>}</div>
    </section>
  </div>;
}
