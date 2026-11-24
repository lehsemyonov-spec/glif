/** Номер текущего раздела внизу справа: § 03 / 07. Текущий — тот, что под серединой экрана. */
export function initSectionCounter(): void {
  const out = document.getElementById('section-current');
  const sections = Array.from(document.querySelectorAll<HTMLElement>('section[data-index]'));
  if (!out || sections.length === 0) return;

  let queued = false;
  const update = () => {
    queued = false;
    const mid = window.innerHeight / 2;
    const current = sections.find((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= mid && r.bottom > mid;
    });
    if (current) out.textContent = String(current.dataset.index).padStart(2, '0');
  };
  const queue = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  update();
}
