/** Буква в em-квадрате §02: на каждом обороте меняется Ж → Ф → Я. */
const GLYPHS = ['Ж', 'Ф', 'Я'];

export function initEmBox(): void {
  const glyph = document.getElementById('em-glyph');
  const code = document.getElementById('em-code');
  if (!glyph) return;
  let i = 0;
  glyph.addEventListener('animationiteration', () => {
    i = (i + 1) % GLYPHS.length;
    glyph.textContent = GLYPHS[i];
    if (code) code.textContent = 'U+' + GLYPHS[i].codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0');
  });
}
