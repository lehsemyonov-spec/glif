/** Минимальные типы fontkit: только то, что использует сайт. */
declare module 'fontkit' {
  export interface PathCommand {
    command: 'moveTo' | 'lineTo' | 'quadraticCurveTo' | 'bezierCurveTo' | 'closePath';
    args: number[];
  }
  export interface Glyph {
    advanceWidth: number;
    bbox: { minX: number; minY: number; maxX: number; maxY: number };
    path: { commands: PathCommand[] };
  }
  export interface Font {
    getVariation(settings: Record<string, number>): Font;
    glyphForCodePoint(codePoint: number): Glyph;
  }
  export function create(data: Uint8Array): Font;
}
