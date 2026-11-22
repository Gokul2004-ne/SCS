import { useEffect, useRef, type ReactNode } from 'react';

export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    let m = document.querySelector('meta[name="description"]');
    const prevDesc = m?.getAttribute('content') ?? null;
    if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'description'); document.head.appendChild(m); }
    m.setAttribute('content', description);
    return () => { document.title = prev; if (prevDesc !== null) m?.setAttribute('content', prevDesc); };
  }, [title, description]);
}

export function Mark365({ size = 34 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <path d="M16 2 L28 7 V16 C28 23 22.5 28 16 30 C9.5 28 4 23 4 16 V7 Z" fill="none" stroke="#F59E0B" strokeWidth="1.6" />
      <circle cx="16" cy="15.5" r="6.5" fill="none" stroke="rgba(245,158,11,.55)" strokeDasharray="2 2.2" />
      <path d="M12.5 16 L15 18.5 L19.5 13" fill="none" stroke="#EEF0F4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { el.classList.add('in'); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`scroll-rv ${className}`}>{children}</div>;
}
