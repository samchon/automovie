import { AutoMovieArchetypeUnits } from "../core";
import type { createStorage } from "./createStorage";

/**
 * The read models a storage kind is built as, each whole: a wardrobe's Blum
 * CLIP top hinge by its "95 and 110 degree opening angles"
 * (https://publications.blum.com/2022/catalogue/en/128/); a chest drawer's
 * Accuride 3832E slide by its technical sheet
 * (https://res.cloudinary.com/amerhart/image/upload/Documents/Product/3832E
 * Technical Sheet.pdf), the 300, 350 and 400 mm slides that fit a 450 mm deep
 * chest travelling 12, 14 and 16 in (305, 356 and 406 mm); a locker's Lyon 72
 * in single tier by its specification sheet's widths by depths, 12 x 12, 12 x
 * 15, 12 x 18, 15 x 18, 18 x 18 and 18 x 21 in.
 */
export const STORAGE_MODELS: Readonly<
  Partial<
    Record<
      createStorage.Kind,
      Readonly<
        Partial<
          Record<
            createStorage.Model,
            Readonly<Partial<Record<createStorage.Dimension, number>>>
          >
        >
      >
    >
  >
> = {
  wardrobe: {
    "CLIP top 95": { swing: 95 },
    "CLIP top 110": { swing: 110 },
  },
  chest: {
    "3832-E12": { travel: 12 * AutoMovieArchetypeUnits.INCH },
    "3832-E14": { travel: 14 * AutoMovieArchetypeUnits.INCH },
    "3832-E16": { travel: 16 * AutoMovieArchetypeUnits.INCH },
  },
  locker: {
    "12x12": {
      width: 12 * AutoMovieArchetypeUnits.INCH,
      depth: 12 * AutoMovieArchetypeUnits.INCH,
    },
    "12x15": {
      width: 12 * AutoMovieArchetypeUnits.INCH,
      depth: 15 * AutoMovieArchetypeUnits.INCH,
    },
    "12x18": {
      width: 12 * AutoMovieArchetypeUnits.INCH,
      depth: 18 * AutoMovieArchetypeUnits.INCH,
    },
    "15x18": {
      width: 15 * AutoMovieArchetypeUnits.INCH,
      depth: 18 * AutoMovieArchetypeUnits.INCH,
    },
    "18x18": {
      width: 18 * AutoMovieArchetypeUnits.INCH,
      depth: 18 * AutoMovieArchetypeUnits.INCH,
    },
    "18x21": {
      width: 18 * AutoMovieArchetypeUnits.INCH,
      depth: 21 * AutoMovieArchetypeUnits.INCH,
    },
  },
};
