/** Заполняет каждый .grid-lines двенадцатью колонками. */
export function initGridLines(columns = 12): void {
  document.querySelectorAll<HTMLElement>('.grid-lines').forEach((el) => {
    el.replaceChildren(...Array.from({ length: columns }, () => document.createElement('span')));
  });
}
