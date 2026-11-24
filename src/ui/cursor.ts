/**
 * Кастомный курсор-кружок. Режим difference инвертирует всё под ним,
 * поэтому над буквами он сам становится «вырезом».
 * Только для мыши: на тач-экранах остаётся системное поведение.
 */
export function initCursor(): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const dot = document.createElement('div');
  dot.className = 'cursor';
  dot.setAttribute('aria-hidden', 'true');
  document.body.append(dot);
  document.documentElement.classList.add('has-cursor');

  let x = -100, y = -100, cx = x, cy = y;
  let visible = false;

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX;
    y = e.clientY;
    if (!visible) {
      cx = x;
      cy = y;
      visible = true;
      dot.classList.add('is-visible');
    }
    const t = e.target as HTMLElement;
    dot.classList.toggle('is-link', !!t.closest('a, button, input, label, [role="button"]'));
    dot.classList.toggle('is-glyph', !!t.closest('.glyph-stage'));
  });
  document.addEventListener('pointerleave', () => {
    visible = false;
    dot.classList.remove('is-visible');
  });
  window.addEventListener('pointerdown', () => dot.classList.add('is-down'));
  window.addEventListener('pointerup', () => dot.classList.remove('is-down'));

  const tick = () => {
    // Почти без задержки: курсор не должен отставать от руки
    cx += (x - cx) * 0.5;
    cy += (y - cy) * 0.5;
    dot.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
