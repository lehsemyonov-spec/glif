import type { Font } from 'fontkit';
import { config } from '../config';

/** Точка контура в координатах SVG (y вниз, 0 — линия прописных + запас). */
export interface OutlineNode {
  x: number;
  y: number;
  /** on — узел на кривой, off — управляющая точка Безье */
  on: boolean;
}

export interface GlyphOutline {
  d: string;
  nodes: OutlineNode[];
  handles: [number, number, number, number][];
  contours: number;
  advance: number;
  /** Перевод y шрифта (вверх) в y SVG (вниз) */
  toY: (fontY: number) => number;
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
}

let fontPromise: Promise<Font> | null = null;

/** Загружает Roboto Flex тем же файлом, что и сайт: контур совпадает с тем, что видно на экране. */
export function loadGrotesk(): Promise<Font> {
  fontPromise ??= (async () => {
    const [{ create }, buf] = await Promise.all([
      import('fontkit'),
      fetch(new URL('fonts/RobotoFlex.woff2', document.baseURI)).then((r) => r.arrayBuffer()),
    ]);
    return create(new Uint8Array(buf));
  })();
  return fontPromise;
}

/** Контур буквы при заданных осях, с узлами и «усами» управляющих точек. */
export function getOutline(font: Font, char: string, axes: Record<string, number>): GlyphOutline {
  const variant = font.getVariation(axes);
  const glyph = variant.glyphForCodePoint(char.codePointAt(0)!);
  const top = config.metrics.ascender;
  const toY = (y: number) => top - y;

  const nodes: OutlineNode[] = [];
  const handles: [number, number, number, number][] = [];
  const parts: string[] = [];
  let cx = 0;
  let cy = 0;
  let contours = 0;
  const f = (n: number) => n.toFixed(1);

  for (const { command, args } of glyph.path.commands) {
    switch (command) {
      case 'moveTo':
        contours++;
        [cx, cy] = args;
        nodes.push({ x: cx, y: toY(cy), on: true });
        parts.push(`M${f(cx)} ${f(toY(cy))}`);
        break;
      case 'lineTo':
        [cx, cy] = args;
        nodes.push({ x: cx, y: toY(cy), on: true });
        parts.push(`L${f(cx)} ${f(toY(cy))}`);
        break;
      case 'quadraticCurveTo': {
        const [qx, qy, x, y] = args;
        nodes.push({ x: qx, y: toY(qy), on: false }, { x, y: toY(y), on: true });
        handles.push([cx, toY(cy), qx, toY(qy)], [qx, toY(qy), x, toY(y)]);
        parts.push(`Q${f(qx)} ${f(toY(qy))} ${f(x)} ${f(toY(y))}`);
        [cx, cy] = [x, y];
        break;
      }
      case 'bezierCurveTo': {
        const [c1x, c1y, c2x, c2y, x, y] = args;
        nodes.push({ x: c1x, y: toY(c1y), on: false }, { x: c2x, y: toY(c2y), on: false }, { x, y: toY(y), on: true });
        handles.push([cx, toY(cy), c1x, toY(c1y)], [c2x, toY(c2y), x, toY(y)]);
        parts.push(`C${f(c1x)} ${f(toY(c1y))} ${f(c2x)} ${f(toY(c2y))} ${f(x)} ${f(toY(y))}`);
        [cx, cy] = [x, y];
        break;
      }
      case 'closePath':
        parts.push('Z');
        break;
    }
  }

  // Узел, совпадающий с началом контура, рисуем один раз
  const unique = nodes.filter(
    (n, i) => nodes.findIndex((m) => m.on === n.on && Math.abs(m.x - n.x) < 0.5 && Math.abs(m.y - n.y) < 0.5) === i,
  );

  return {
    d: parts.join(''),
    nodes: unique,
    handles,
    contours,
    advance: glyph.advanceWidth,
    toY,
    bbox: glyph.bbox,
  };
}
