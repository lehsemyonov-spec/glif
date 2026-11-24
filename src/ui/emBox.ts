/**
 * Em-квадрат в §02.
 * 1. Сторона квадрата равна высоте текстового блока слева (от заголовка до заглушки),
 *    но не больше свободного места в строке.
 * 2. Буква на каждом обороте меняется Ж → Ф → Я.
 */
const GLYPHS = ['Ж', 'Ф', 'Я'];

export function initEmBox(): void {
  const row = document.querySelector<HTMLElement>('.anatomy-top');
  const text = row?.querySelector<HTMLElement>('.anatomy-text');
  const box = row?.querySelector<HTMLElement>('.em-box');
  const glyph = document.getElementById('em-glyph');
  const code = document.getElementById('em-code');

  if (row && text && box) {
    const fit = () => {
      if (getComputedStyle(row).flexDirection === 'column') {
        box.style.removeProperty('--em-size');
        return;
      }
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const free = row.clientWidth - text.offsetWidth - gap;
      box.style.setProperty('--em-size', `${Math.max(0, Math.min(text.offsetHeight, free))}px`);
    };
    new ResizeObserver(fit).observe(text);
    new ResizeObserver(fit).observe(row);
    fit();
  }

  if (glyph) {
    let i = 0;
    glyph.addEventListener('animationiteration', () => {
      i = (i + 1) % GLYPHS.length;
      glyph.textContent = GLYPHS[i];
      if (code) code.textContent = 'U+' + GLYPHS[i].codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0');
    });
  }
}
