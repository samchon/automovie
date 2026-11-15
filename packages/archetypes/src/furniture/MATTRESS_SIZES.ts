import type { createBed } from "./createBed";

/**
 * A loose mattress's sizes by the UK bed size it fits, by kind, metres, the default first: the National Bed Federation's "single 90 x 190 cm" and "double 135 x 190 cm" (https://bedadvice.co.uk/bed-talk/bed-sizes-uk-bed-and-mattress-size-guide/).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each size holds and its source.
 * @evidence contracts/development/design.md#principled-representation One record per read size, its width and length together.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Its own file beside the bands; read only by `createBed`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No size between two read is made.
 */
export const MATTRESS_SIZES: Readonly<
  Partial<
    Record<
      createBed.Kind,
      Readonly<
        Record<
          createBed.Mattress,
          Readonly<Partial<Record<createBed.Dimension, number>>>
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
