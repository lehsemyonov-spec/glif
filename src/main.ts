import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';

import { loadFonts } from './fonts';
import { createPreloader } from './ui/preloader';
import { initGridLines } from './ui/grid';
import { initSectionCounter } from './ui/sectionCounter';
import { initEmBox } from './ui/emBox';
import { initCursor } from './ui/cursor';
import { initHeroGlyph } from './type/VariableGlyph';
import { initScroll } from './scroll/timeline';
import { initAnatomy } from './type/anatomy';

async function boot() {
  initGridLines();

  const preloader = createPreloader();
  await loadFonts((p) => preloader.progress(p));
  await preloader.finish();

  initSectionCounter();
  initEmBox();
  initHeroGlyph();
  initCursor();
  initScroll();
  initAnatomy().catch((err) => console.error('Анатомия не загрузилась:', err));

  // ?debug в адресе или #debug (на хостингах, где query-строка недоступна)
  if (new URLSearchParams(location.search).has('debug') || location.hash === '#debug') {
    const { initDebug } = await import('./ui/debug');
    await initDebug();
  }
}

boot();
