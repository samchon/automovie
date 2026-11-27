import type { AutoMovieArchetypeBed } from "./AutoMovieArchetypeBed";

/**
 * A loose mattress's sizes by the UK bed size it fits, by kind, metres, the
 * default first: the National Bed Federation's "single 90 x 190 cm" and "double
 * 135 x 190 cm"
 * (https://bedadvice.co.uk/bed-talk/bed-sizes-uk-bed-and-mattress-size-guide/).
 */
export const MATTRESS_SIZES: Readonly<
  Partial<
    Record<
      AutoMovieArchetypeBed.Kind,
      Readonly<
        Record<
          AutoMovieArchetypeBed.Mattress,
          Readonly<Partial<Record<AutoMovieArchetypeBed.Dimension, number>>>
        >
      >
    >
  >
> = {
  mattress: {
    single: { width: 0.9, length: 1.9 },
    double: { width: 1.35, length: 1.9 },
  },
};
