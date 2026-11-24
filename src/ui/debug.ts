import { config } from '../config';

/** Панель lil-gui. Загружается только при ?debug или #debug в адресе. */
export async function initDebug(): Promise<void> {
  const { default: GUI } = await import('lil-gui');
  const gui = new GUI({ title: 'глиф · debug' });

  const view = { grid: true, grain: 0.07 };
  const grid = gui.addFolder('Сетка');
  grid.add(view, 'grid').name('линии').onChange((v: boolean) => document.body.classList.toggle('no-grid', !v));
  grid
    .add(view, 'grain', 0, 0.3, 0.01)
    .name('зерно бумаги')
    .onChange((v: number) => document.documentElement.style.setProperty('--grain', String(v)));
  grid.close();

  const spring = gui.addFolder('Пружина');
  spring.add(config.spring, 'stiffness', 10, 400, 1).name('жёсткость');
  spring.add(config.spring, 'damping', 1, 60, 0.5).name('затухание');
  spring.add(config.spring, 'mass', 0.2, 5, 0.1).name('масса');

  const breath = gui.addFolder('Дыхание');
  breath.add(config.breath, 'period', 1, 10, 0.1).name('период, с');
  breath.add(config.breath, 'amplitude', 0, 120, 1).name('амплитуда wght');
  breath.add(config.breath, 'idleDelay', 0.2, 5, 0.1).name('покой через, с');

  const tilt = gui.addFolder('Наклон от скорости');
  tilt.add(config.tilt, 'fullSpeed', 0.3, 6, 0.1).name('полный наклон, px/мс');
  tilt.add(config.tilt, 'decay', 0.5, 20, 0.5).name('затухание');

  const impulse = gui.addFolder('Клик');
  impulse.add(config.impulse, 'wght', 0, 8000, 50).name('толчок wght');
  impulse.add(config.impulse, 'wdth', -3000, 3000, 50).name('толчок wdth');
}
