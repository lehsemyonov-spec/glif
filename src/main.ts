import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';

import { loadFonts } from './fonts';
import { createPreloader } from './ui/preloader';
import { initGridLines } from './ui/grid';
import { initSectionCounter } from './ui/sectionCounter';

async function boot() {
  initGridLines();

  const preloader = createPreloader();
  await loadFonts((p) => preloader.progress(p));
  await preloader.finish();

  initSectionCounter();

  // ?debug в адресе или #debug (на хостингах, где query-строка недоступна)
  if (new URLSearchParams(location.search).has('debug') || location.hash === '#debug') {
    const { initDebug } = await import('./ui/debug');
    await initDebug();
  }
}

boot();
