import { config } from '../config';
import { gsap, ScrollTrigger } from '../scroll/timeline';
import { getOutline, loadGrotesk, type GlyphOutline } from './glyphOutline';

const SVG = 'http://www.w3.org/2000/svg';
const CHAR = 'Ф';
const AXES = { wght: 412, wdth: 96 };

type Side = 'left' | 'right';
interface Callout {
  name: string;
  /** Точка на букве (координаты SVG) */
  x: number;
  y: number;
  side: Side;
  /** Линия метрики во всю ширину вместо выноски */
  metric?: boolean;
}

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, parent?: Element) {
  const node = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  parent?.append(node);
  return node;
}

/** 1 узел, 2 узла, 5 узлов */
function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  const word = m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
  return `${n} ${word}`;
}

/** Находит горизонтальные «пробеги» заливки на высоте y: [[x0, x1], …] */
function runsAt(path: SVGPathElement, y: number, x0: number, x1: number, step = 4): [number, number][] {
  const runs: [number, number][] = [];
  let start: number | null = null;
  const p = new DOMPoint(0, y);
  for (let x = x0; x <= x1; x += step) {
    p.x = x;
    const inside = path.isPointInFill(p);
    if (inside && start === null) start = x;
    if (!inside && start !== null) {
      runs.push([start, x - step]);
      start = null;
    }
  }
  if (start !== null) runs.push([start, x1]);
  return runs;
}

/** Точки для выносок считаются по самому контуру, а не вручную — выноски не разъедутся при смене осей. */
function findCallouts(path: SVGPathElement, o: GlyphOutline): Callout[] {
  const { bbox, toY } = o;
  const cap = toY(config.metrics.capHeight);
  const base = toY(0);
  const x0 = bbox.minX - 20;
  const x1 = bbox.maxX + 20;
  const out: Callout[] = [];

  // Штамп: вертикаль над овалом
  const stemY = toY(bbox.maxY - 90);
  const stem = runsAt(path, stemY, x0, x1)[0];
  const stemCx = stem ? (stem[0] + stem[1]) / 2 : o.advance / 2;
  if (stem) out.push({ name: 'штамп', x: stem[1], y: stemY, side: 'right' });

  // По середине овала: штамп → контрформа → овал
  const midY = (cap + base) / 2;
  const runs = runsAt(path, midY, x0, x1).sort((a, b) => a[0] - b[0]);
  const stemRun = runs.find((r) => r[0] <= stemCx && r[1] >= stemCx);
  const right = runs.filter((r) => r[0] > stemCx);
  if (stemRun && right[0]) {
    out.push({ name: 'контрформа', x: (stemRun[1] + right[0][0]) / 2, y: midY - 140, side: 'right' });
    out.push({ name: 'овал', x: (right[0][0] + right[0][1]) / 2, y: midY + 140, side: 'right' });
  }

  // Выносной элемент: штамп уходит ниже базовой линии
  if (bbox.minY < -40) out.push({ name: 'выносной элемент', x: stemCx, y: toY(bbox.minY + 50), side: 'left' });

  out.push({ name: 'рост прописных', x: bbox.minX, y: cap, side: 'left', metric: true });
  out.push({ name: 'базовая линия', x: bbox.minX, y: base, side: 'left', metric: true });
  return out;
}

export async function initAnatomy(): Promise<void> {
  const scene = document.getElementById('anatomy-scene');
  const svg = document.getElementById('anatomy-svg') as SVGSVGElement | null;
  const list = document.getElementById('anatomy-steps');
  if (!scene || !svg || !list) return;

  const font = await loadGrotesk();
  const o = getOutline(font, CHAR, AXES);

  // Рамка: буква по центру, по бокам место под подписи
  const narrow = window.matchMedia('(max-width: 720px)').matches;
  const pad = o.advance * (narrow ? 0.32 : 0.5);
  const vbX = o.bbox.minX - pad;
  const vbW = o.bbox.maxX - o.bbox.minX + pad * 2;
  const vbY = o.toY(o.bbox.maxY) - 90;
  const vbH = o.toY(o.bbox.minY) + 90 - vbY;
  svg.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);
  svg.replaceChildren();

  const root = el('g', {}, svg);
  const metrics = el('g', { class: 'an-metrics' }, root);
  const fill = el('path', { d: o.d, class: 'an-fill' }, root);
  const outline = el('path', { d: o.d, class: 'an-outline', pathLength: 1 }, root);
  const handles = el('g', { class: 'an-handles' }, root);
  for (const [ax, ay, bx, by] of o.handles) el('line', { x1: ax, y1: ay, x2: bx, y2: by }, handles);
  const nodes = el('g', { class: 'an-nodes' }, root);
  const nodeEls = o.nodes.map((n) =>
    n.on ? el('rect', { class: 'an-node an-node--on', 'data-x': n.x, 'data-y': n.y }, nodes) : el('circle', { class: 'an-node an-node--off', cx: n.x, cy: n.y }, nodes),
  );
  const calloutsG = el('g', { class: 'an-callouts' }, root);

  const callouts = findCallouts(fill, o);
  // Подписи прижаты к краям сцены, выноска тянется от буквы до подписи
  const labelX = { left: vbX, right: vbX + vbW };

  const parts = callouts.map((c) => {
    const g = el('g', { class: 'an-callout' + (c.metric ? ' an-callout--metric' : '') }, c.metric ? metrics : calloutsG);
    const lx = c.metric ? vbX : labelX[c.side];
    const x2 = c.metric ? vbX + vbW : labelX[c.side];
    const line = el('line', { x1: c.metric ? vbX : c.x, y1: c.y, x2, y2: c.y, pathLength: 1 }, g);
    const dot = c.metric ? null : el('circle', { class: 'an-dot', cx: c.x, cy: c.y }, g);
    const text = el('text', { x: c.metric ? vbX : lx, y: c.y, 'text-anchor': c.side === 'right' && !c.metric ? 'end' : 'start' }, g);
    text.textContent = c.name;
    return { c, line, dot, text };
  });

  // Список шагов слева — в том же порядке, в каком рисуются выноски
  list.replaceChildren(
    ...callouts.map((c) => {
      const li = document.createElement('li');
      li.textContent = c.name;
      return li;
    }),
  );
  const items = Array.from(list.children) as HTMLElement[];

  const meta = document.getElementById('anatomy-meta');
  const onNodes = o.nodes.filter((n) => n.on).length;
  const offNodes = o.nodes.length - onNodes;
  const facts = `${plural(o.contours, 'контур', 'контура', 'контуров')} · ${plural(onNodes, 'узел', 'узла', 'узлов')} · ${plural(offNodes, 'управляющая точка', 'управляющие точки', 'управляющих точек')}`;
  if (meta) meta.textContent = `Глиф Гротеск · wght ${AXES.wght} · wdth ${AXES.wdth} · ${facts}`;
  const note = document.getElementById('anatomy-note');
  if (note) note.textContent = `↓ ниже — «${CHAR}» прямо из файла шрифта: ${facts}`;

  // Размеры в пикселях экрана → единицы шрифта (SVG масштабируется целиком)
  const resize = () => {
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const u = Math.max(vbW / r.width, vbH / r.height);
    svg.style.setProperty('--u', String(u));
    const s = 7 * u;
    nodeEls.forEach((n) => {
      if (n instanceof SVGRectElement) {
        n.setAttribute('x', String(+n.dataset.x! - s / 2));
        n.setAttribute('y', String(+n.dataset.y! - s / 2));
        n.setAttribute('width', String(s));
        n.setAttribute('height', String(s));
      } else n.setAttribute('r', String(3 * u));
    });
    parts.forEach(({ dot, text, c }) => {
      dot?.setAttribute('r', String(3 * u));
      // Подпись чуть выше линии, а у выноски — по центру
      text.setAttribute('dy', String(c.metric ? -6 * u : 0));
    });
    // Выноска кончается за 8 px до подписи: длина подписи известна только после отрисовки
    parts.forEach(({ line, text, c }) => {
      if (c.metric) return;
      const len = text.getComputedTextLength();
      const gap = 8 * u;
      line.setAttribute('x2', String(c.side === 'right' ? labelX.right - len - gap : labelX.left + len + gap));
    });
  };
  new ResizeObserver(resize).observe(svg);
  resize();

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    gsap.set(fill, { opacity: 0.22 });
    gsap.set([outline, ...parts.map((p) => p.line)], { strokeDashoffset: 0 });
    gsap.set([handles, nodes], { opacity: 0 });
    items.forEach((i) => i.classList.add('is-on'));
    return;
  }

  // Начальное состояние: залитая буква, всё остальное скрыто
  gsap.set([outline, ...parts.map((p) => p.line)], { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set([handles, ...nodeEls, ...parts.map((p) => p.text), ...parts.map((p) => p.dot).filter(Boolean)], { opacity: 0 });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: scene,
      start: 'top top',
      end: '+=180%',
      pin: true,
      scrub: 0.6,
    },
  });

  // 1. Буква въезжает на место справа (как будто сдвинулась из hero)
  tl.fromTo(svg, { xPercent: -22 }, { xPercent: 0, duration: 0.18, ease: 'power2.out' }, 0);
  // 2. Заливка уходит, проявляется контур и узлы Безье
  tl.to(outline, { strokeDashoffset: 0, duration: 0.18 }, 0.12);
  tl.to(fill, { opacity: 0.05, duration: 0.14 }, 0.14);
  tl.to(handles, { opacity: 1, duration: 0.08 }, 0.26);
  tl.to(nodeEls, { opacity: 1, duration: 0.1, stagger: { each: 0.12 / nodeEls.length } }, 0.24);
  // 3. «На миг»: узлы гаснут, буква снова набирает тело
  tl.to([handles, ...nodeEls], { opacity: 0, duration: 0.1 }, 0.56);
  tl.to(fill, { opacity: 0.22, duration: 0.12 }, 0.56);
  // 4. Выноски по одной
  const span = 0.5 / parts.length;
  parts.forEach(({ line, dot, text }, i) => {
    const at = 0.42 + i * span;
    tl.to(line, { strokeDashoffset: 0, duration: span * 0.8 }, at);
    if (dot) tl.to(dot, { opacity: 1, duration: span * 0.3 }, at);
    tl.to(text, { opacity: 1, duration: span * 0.4 }, at + span * 0.4);
    tl.call(() => items[i]?.classList.add('is-on'), undefined, at + span * 0.4);
    tl.call(() => items[i]?.classList.remove('is-on'), undefined, at + span * 0.39);
  });
  tl.to({}, { duration: 0.06 }); // короткая пауза в конце, прежде чем секция уедет

  ScrollTrigger.refresh();
}
