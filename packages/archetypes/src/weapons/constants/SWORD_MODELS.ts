import type { AutoMovieArchetypeSword } from "../AutoMovieArchetypeSword";

/*
 * The read swords of each kind that has them, whole, the default first, with
 * the source each was read at; `createSword.MODELS` is this table.
 *
 * - Albion Swords' longswords: the Crecy (Oakeshott XVIa: 113.7 cm overall, 90 cm
 *   blade 5 cm wide, 1.39 kg, balance 10.16 cm,
 *   https://albion-swords.com/product/the-crecy/) and the Regent (XVIIIb: 122
 *   cm overall, 94 cm blade 5 cm wide, 1.59 kg, balance 13 cm,
 *   https://albion-swords.com/product/the-regent/).
 * - Albion Swords' single-hand swords: the Knight (Oakeshott XII: 96.8 cm
 *   overall, 80 cm blade 5.24 cm wide, 1.2 kg, balance 11.43 cm,
 *   https://albion-swords.com/product/the-knight/) and the Poitiers (XV: 94.77
 *   cm overall, 77.79 cm blade 5.56 cm wide, 1.19 kg, balance 8.57 cm,
 *   https://albion-swords.com/product/the-poitiers/).
 * - The Pattern 1796 light cavalry sabre's two patterns by weight: the officer's
 *   0.83 kg and the trooper's 0.96 kg (Wikipedia,
 *   https://en.wikipedia.org/wiki/Pattern_1796_light_cavalry_sabre), a
 *   secondary source.
 *
 * A hilt's length is the sword's overall length less its blade's.
 */
export const SWORD_MODELS: Readonly<
  Partial<
    Record<
      AutoMovieArchetypeSword.Kind,
      Readonly<
        Partial<
          Record<
            AutoMovieArchetypeSword.Model,
            Readonly<Partial<Record<AutoMovieArchetypeSword.Dimension, number>>>
          >
        >
      >
    >
  >
> = {
  longsword: {
    crecy: {
      bladeLength: 0.9,
      bladeWidth: 0.05,
      hiltLength: 1.137 - 0.9,
      balance: 0.1016,
      mass: 1.39,
    },
    regent: {
      bladeLength: 0.94,
      bladeWidth: 0.05,
      hiltLength: 1.22 - 0.94,
      balance: 0.13,
      mass: 1.59,
    },
  },
  armingSword: {
    knight: {
      bladeLength: 0.8,
      bladeWidth: 0.0524,
      hiltLength: 0.968 - 0.8,
      balance: 0.1143,
      mass: 1.2,
    },
    poitiers: {
      bladeLength: 0.7779,
      bladeWidth: 0.0556,
      hiltLength: 0.9477 - 0.7779,
      balance: 0.0857,
      mass: 1.19,
    },
  },
  sabre: {
    officer: { mass: 0.83 },
    trooper: { mass: 0.96 },
  },
};
