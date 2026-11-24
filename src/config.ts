/**
 * Все числа, которые настраиваются «на ощущение», живут здесь.
 * В режиме ?debug их можно крутить через lil-gui.
 */
export const config = {
  /** Оси Roboto Flex («Глиф Гротеск»), которые использует сайт */
  axes: {
    wght: { min: 100, max: 1000, default: 412 },
    wdth: { min: 25, max: 151, default: 96 },
    slnt: { min: -10, max: 0, default: 0 },
    opsz: { min: 8, max: 144, default: 144 },
  },

  /** Пружина, через которую оси догоняют курсор (этап 2) */
  spring: {
    stiffness: 120,
    damping: 14,
    mass: 1,
  },

  /** Дыхание в покое (этап 2) */
  breath: {
    period: 4, // секунды
    amplitude: 30, // ±wght
  },

  /** Буквы hero по клику */
  heroGlyphs: ['Ж', 'Ф', 'Я', 'Щ', '&'],

  /** Сколько глифов «рисует» прелоадер */
  preloaderGlyphs: 2400,

  colors: {
    ink: '#0B0B0C',
    paper: '#F1EDE4',
    ultramarine: '#2A2EFF',
    warmGrey: '#8C887F',
  },

  /** Вертикальные метрики Roboto Flex, единицы шрифта */
  metrics: {
    unitsPerEm: 2048,
    ascender: 1900,
    descender: -500,
    capHeight: 1456,
    xHeight: 1052,
  },
} as const;

export type AxisName = keyof typeof config.axes;
