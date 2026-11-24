import { config } from '../config';

/** Панель lil-gui. Загружается только при ?debug в адресе. */
export async function initDebug(): Promise<void> {
  const { default: GUI } = await import('lil-gui');
  const gui = new GUI({ title: 'глиф · debug' });

  const hero = document.getElementById('hero');
  const glyph = document.getElementById('hero-glyph');
  const corners = {
    wght: hero?.querySelector('.corner--tr'),
    wdth: hero?.querySelector('.corner--bl'),
    slnt: hero?.querySelector('.corner--br'),
    code: hero?.querySelector('.corner--tl'),
  };

  const state = {
    grid: true,
    grain: 0.07,
    glyph: config.heroGlyphs[0] as string,
    wght: config.axes.wght.default as number,
    wdth: config.axes.wdth.default as number,
    slnt: config.axes.slnt.default as number,
  };

  const applyHero = () => {
    if (!hero || !glyph) return;
    hero.style.setProperty('--wght', String(state.wght));
    hero.style.setProperty('--wdth', String(state.wdth));
    hero.style.setProperty('--slnt', String(state.slnt));
    glyph.textContent = state.glyph;
    const code = state.glyph.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0');
    if (corners.code) corners.code.textContent = `U+${code} ${state.glyph}`;
    if (corners.wght) corners.wght.textContent = `wght ${Math.round(state.wght)}`;
    if (corners.wdth) corners.wdth.textContent = `wdth ${Math.round(state.wdth)}`;
    if (corners.slnt) corners.slnt.textContent = `slnt ${state.slnt.toFixed(1)}`;
  };

  const grid = gui.addFolder('Сетка');
  grid.add(state, 'grid').name('линии').onChange((v: boolean) => document.body.classList.toggle('no-grid', !v));
  grid
    .add(state, 'grain', 0, 0.3, 0.01)
    .name('зерно бумаги')
    .onChange((v: number) => document.documentElement.style.setProperty('--grain', String(v)));

  const axes = gui.addFolder('Буква hero (оси)');
  axes.add(state, 'glyph', [...config.heroGlyphs]).name('буква').onChange(applyHero);
  axes.add(state, 'wght', config.axes.wght.min, config.axes.wght.max, 1).onChange(applyHero);
  axes.add(state, 'wdth', config.axes.wdth.min, config.axes.wdth.max, 1).onChange(applyHero);
  axes.add(state, 'slnt', config.axes.slnt.min, config.axes.slnt.max, 0.1).onChange(applyHero);

  const spring = gui.addFolder('Пружина (этап 2)');
  const s = config.spring as { stiffness: number; damping: number; mass: number };
  spring.add(s, 'stiffness', 10, 400, 1);
  spring.add(s, 'damping', 1, 60, 0.5);
  spring.add(s, 'mass', 0.2, 5, 0.1);
  spring.close();

  const breath = gui.addFolder('Дыхание (этап 2)');
  const b = config.breath as { period: number; amplitude: number };
  breath.add(b, 'period', 1, 10, 0.1).name('период, с');
  breath.add(b, 'amplitude', 0, 120, 1).name('амплитуда wght');
  breath.close();
}
