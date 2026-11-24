import { config } from '../config';
import { Spring } from './spring';
import { createAxisLabels } from './axisLabels';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Гигантская буква в hero.
 * X курсора → ширина, Y → толщина, скорость → наклон. Значения догоняют цели
 * через пружину, поэтому буква слегка «перелетает» и ощущается живой.
 * Без курсора (и на телефоне) буква дышит: толщина медленно колеблется.
 */
export class VariableGlyph {
  private wght = new Spring(config.axes.wght.default);
  private wdth = new Spring(config.axes.wdth.default);
  private slnt = new Spring(config.axes.slnt.default);

  private px = 0.5;
  private py = 0.5;
  private speed = 0; // px/мс, сглаженная
  private lastMove = -Infinity;
  private lastPoint: { x: number; y: number; t: number } | null = null;
  private pointerInside = false;

  private glyphIndex = 0;
  private running = false;
  private raf = 0;
  private prevTime = 0;
  private readonly reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  private readonly labels;

  constructor(
    private readonly section: HTMLElement,
    private readonly glyph: HTMLElement,
    trigger: HTMLElement,
  ) {
    this.labels = createAxisLabels(section);
    this.labels.glyph(this.glyph.textContent || config.heroGlyphs[0]);

    section.addEventListener('pointermove', this.onMove);
    section.addEventListener('pointerdown', this.onMove);
    section.addEventListener('pointerenter', () => (this.pointerInside = true));
    section.addEventListener('pointerleave', () => {
      this.pointerInside = false;
      this.lastPoint = null;
    });
    // Клик в любом месте hero, кроме текста-ссылок, меняет букву
    section.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('a')) return;
      this.next();
    });
    // Клавиатура: кнопка-буква (Enter/Space дают click сами)
    trigger.addEventListener('click', (e) => e.stopPropagation());
    trigger.addEventListener('click', () => this.next());

    // Не считаем кадры, пока hero не виден
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? this.start() : this.stop())).observe(section);
  }

  private onMove = (e: PointerEvent) => {
    const r = this.section.getBoundingClientRect();
    this.px = clamp((e.clientX - r.left) / r.width, 0, 1);
    this.py = clamp((e.clientY - r.top) / r.height, 0, 1);
    this.pointerInside = true;

    const now = performance.now();
    if (this.lastPoint) {
      const dt = Math.max(1, now - this.lastPoint.t);
      const v = Math.hypot(e.clientX - this.lastPoint.x, e.clientY - this.lastPoint.y) / dt;
      this.speed = lerp(this.speed, v, 0.35);
    }
    this.lastPoint = { x: e.clientX, y: e.clientY, t: now };
    this.lastMove = now;
  };

  /** Следующая буква: Ж → Ф → Я → Щ → & → Ж … */
  next(): void {
    const list = config.heroGlyphs;
    this.glyphIndex = (this.glyphIndex + 1) % list.length;
    const char = list[this.glyphIndex];
    this.glyph.textContent = char;
    this.labels.glyph(char);

    // Ультрамарин — только в момент, когда буква отвечает человеку
    this.glyph.classList.remove('is-flash');
    void this.glyph.offsetWidth;
    this.glyph.classList.add('is-flash');

    if (!this.reduceMotion.matches) {
      this.wght.velocity += config.impulse.wght;
      this.wdth.velocity += config.impulse.wdth;
    }
    this.start();
  }

  private start(): void {
    if (this.running) return;
    this.running = true;
    this.prevTime = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  private stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private tick = (now: number) => {
    if (!this.running) return;
    // Шаг ограничен: после вкладки в фоне пружина не «взрывается»
    const dt = Math.min(1 / 30, (now - this.prevTime) / 1000);
    this.prevTime = now;

    const { axes, breath, tilt } = config;
    const still = this.reduceMotion.matches;
    const idle = !this.pointerInside || (now - this.lastMove) / 1000 > breath.idleDelay;
    const breathe = still ? 0 : breath.amplitude * Math.sin((now / 1000) * ((2 * Math.PI) / breath.period));

    this.speed *= Math.exp(-tilt.decay * dt);

    if (idle) {
      this.wght.target = axes.wght.default + breathe;
      this.wdth.target = axes.wdth.default;
      this.slnt.target = 0;
    } else {
      this.wght.target = lerp(axes.wght.min, axes.wght.max, this.py);
      this.wdth.target = lerp(axes.wdth.min, axes.wdth.max, this.px);
      this.slnt.target = axes.slnt.min * clamp(this.speed / tilt.fullSpeed, 0, 1);
    }

    this.wght.step(dt);
    this.wdth.step(dt);
    this.slnt.step(dt);

    // Перелёт пружины не должен выходить за пределы осей шрифта
    const w = clamp(this.wght.value, axes.wght.min, axes.wght.max);
    const d = clamp(this.wdth.value, axes.wdth.min, axes.wdth.max);
    const s = clamp(this.slnt.value, axes.slnt.min, axes.slnt.max);

    const style = this.section.style;
    style.setProperty('--wght', w.toFixed(1));
    style.setProperty('--wdth', d.toFixed(2));
    style.setProperty('--slnt', s.toFixed(2));
    this.labels.axes(w, d, s);

    this.raf = requestAnimationFrame(this.tick);
  };
}

export function initHeroGlyph(): VariableGlyph | null {
  const section = document.getElementById('hero');
  const glyph = document.getElementById('hero-glyph');
  const trigger = section?.querySelector<HTMLElement>('.glyph-stage');
  if (!section || !glyph || !trigger) return null;

  const hint = section.querySelector<HTMLElement>('.hero__hint');
  if (hint && window.matchMedia('(hover: none), (pointer: coarse)').matches) {
    hint.textContent = 'проведите пальцем · касание — следующая буква';
  }
  return new VariableGlyph(section, glyph, trigger);
}
