import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Lanyard from './components/Lanyard.jsx';

function LanyardPortal({ initialOpen = false }) {
  const [open, setOpen] = useState(initialOpen);

  useEffect(() => {
    const toggle = document.querySelector('[data-lanyard-toggle]');
    if (!toggle) return undefined;

    const handleToggle = () => setOpen(value => !value);
    toggle.addEventListener('click', handleToggle);
    toggle.setAttribute('aria-expanded', String(open));

    return () => toggle.removeEventListener('click', handleToggle);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = event => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = event => {
      const drop = document.querySelector('.lanyard-drop');
      const toggle = document.querySelector('[data-lanyard-toggle]');
      if (drop?.contains(event.target) || toggle?.contains(event.target)) return;
      setOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  if (!open) return null;

  return (
    <div className="lanyard-drop" role="dialog" aria-modal="false" aria-label="Lanyard pendant">
      <button className="lanyard-close" type="button" aria-label="Close lanyard" onClick={() => setOpen(false)}>
        x
      </button>
      <Lanyard
        position={[0, 0, 43]}
        gravity={[0, -46, 0]}
        frontImage="/assets/lanyard-front.jpg"
        imageFit="cover"
        lanyardWidth={0.82}
        cardScale={1.68}
      />
    </div>
  );
}

let root = null;

export function mountLanyard({ initialOpen = false } = {}) {
  const mount = document.getElementById('lanyard-root');
  if (!mount) return;
  if (!root) root = ReactDOM.createRoot(mount);
  root.render(<LanyardPortal initialOpen={initialOpen} />);
}
