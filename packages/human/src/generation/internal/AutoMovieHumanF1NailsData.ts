import type { IAutoMovieHumanF1Nails } from "@automovie/interface";

export namespace AutoMovieHumanF1NailsData {
  // A toe's row has no crown radius, so its plate is its bed's own arc (`AutoMovieHumanNail.IProportions.radius`). None was found
  // for a lesser toe; the mean of the fingers' shares, tried as an estimate, set the plate's edges up to 1.3 mm under a back that
  // falls 0.9 mm over the same chord. For the hallux, Jung DJ 2015 (read as extracted text) gives a nail height of 3.3 mm at its tip
  // on a width of 13.8 to 16.1 mm, 0.21 to 0.24 of the width: a height at the free edge, where the law gives every plate its bed's
  // arc, and not a radius midway. Taken as one (0.7 of the width) it left the plate 1.1 mm flatter than its bed midway, its edges
  // that far over the skin (run 15-45-18). It stays as a check of the bed at the free edge.

  /*
   * The fold's depth and the fingernails' mean thickness, mm (Bellinato 2023).
   */
  export const PLATE: number = 0.46;

  export const finger = (digit: string, segment: string, width: number, radius: number, thickness: number): IAutoMovieHumanF1Nails.IRow => ({
    digit,
    segment,
    hand: true,
    proportions: { width, aspect: 0.91, radius, thickness, fold: PLATE, lunula: 1, wrap: 0.4 },
  });

  export const toe = (digit: string, segment: string, aspect: number, radius: number | null, thickness: number, wrap: number): IAutoMovieHumanF1Nails.IRow => ({
    digit,
    segment,
    hand: false,
    proportions: { width: 0.65, aspect, radius, thickness, fold: PLATE, lunula: 1, wrap },
  });
}
