/** Номер текущего раздела внизу справа: § 03 / 07 */
export function initSectionCounter(): void {
  const out = document.getElementById('section-current');
  const sections = Array.from(document.querySelectorAll<HTMLElement>('section[data-index]'));
  if (!out || sections.length === 0) return;

  const visible = new Map<HTMLElement, number>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) visible.set(e.target as HTMLElement, e.intersectionRatio);
      let best: HTMLElement | null = null;
      let bestRatio = 0;
      visible.forEach((ratio, el) => {
        if (ratio > bestRatio) {
          best = el;
          bestRatio = ratio;
        }
      });
      if (best) out.textContent = String((best as HTMLElement).dataset.index).padStart(2, '0');
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] },
  );
  sections.forEach((s) => io.observe(s));
}
