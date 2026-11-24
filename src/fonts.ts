/** Загружает все гарнитуры и сообщает о прогрессе от 0 до 1. */
const FACES = [
  '400 1em "Glif Grotesk"',
  '400 1em "Glif Mono"',
  '400 1em "Glif Antiqua"',
  'italic 400 1em "Glif Antiqua"',
];

export async function loadFonts(onProgress: (p: number) => void, timeoutMs = 6000): Promise<void> {
  let done = 0;
  const all = Promise.all(
    FACES.map((face) =>
      document.fonts
        .load(face, 'ЖжAa')
        .catch(() => [])
        .then(() => onProgress(++done / FACES.length)),
    ),
  ).then(() => document.fonts.ready);

  const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
  await Promise.race([all, timeout]);
}
