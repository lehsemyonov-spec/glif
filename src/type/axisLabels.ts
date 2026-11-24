/** Живые метки осей в углах hero. Обновляют DOM, только когда меняется видимое число. */
export function createAxisLabels(root: HTMLElement) {
  const els = {
    code: root.querySelector<HTMLElement>('[data-label="code"]'),
    wght: root.querySelector<HTMLElement>('[data-label="wght"]'),
    wdth: root.querySelector<HTMLElement>('[data-label="wdth"]'),
    slnt: root.querySelector<HTMLElement>('[data-label="slnt"]'),
  };
  const last: Record<string, string> = {};
  const put = (key: keyof typeof els, text: string) => {
    if (last[key] === text) return;
    last[key] = text;
    const el = els[key];
    if (el) el.textContent = text;
  };

  return {
    glyph(char: string) {
      const code = char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0');
      put('code', `U+${code} ${char}`);
    },
    axes(wght: number, wdth: number, slnt: number) {
      put('wght', `wght ${Math.round(wght)}`);
      put('wdth', `wdth ${Math.round(wdth)}`);
      // −0 выглядит странно: округляем до десятых и убираем знак у нуля
      const s = Math.round(slnt * 10) / 10;
      put('slnt', `slnt ${(s === 0 ? 0 : s).toFixed(1)}`);
    },
  };
}
