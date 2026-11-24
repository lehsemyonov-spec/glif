import { config } from '../config';

/** Счётчик «глифов отрисовано» плавно догоняет реальный прогресс загрузки шрифтов. */
export function createPreloader() {
  const out = document.getElementById('preloader-count');
  const total = config.preloaderGlyphs;
  let target = 0;
  let current = 0;
  let raf = 0;
  const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU');

  const tick = () => {
    current += (target - current) * 0.12;
    if (Math.abs(target - current) < 1) current = target;
    if (out) out.textContent = fmt(current);
    if (current !== target) raf = requestAnimationFrame(tick);
    else raf = 0;
  };

  return {
    progress(p: number) {
      target = Math.max(target, p * total);
      if (!raf) raf = requestAnimationFrame(tick);
    },
    /** Дожидается, пока счётчик дойдёт до конца, и снимает прелоадер */
    finish(): Promise<void> {
      this.progress(1);
      return new Promise((resolve) => {
        const wait = () => {
          if (current >= total) {
            document.body.classList.remove('is-loading');
            resolve();
          } else requestAnimationFrame(wait);
        };
        wait();
      });
    },
  };
}
