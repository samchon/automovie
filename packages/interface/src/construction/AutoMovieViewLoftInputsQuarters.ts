import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/**
 * Read four raw dimensionless shares at a physical station in millimetres, in
 * +u, +v, −u, −v quarter order. Each call produces a fresh array. Missing
 * departures produce four zeros. A rejected read of a prepared outline reports
 * its source name and returns NaN in the corresponding slot.
 */
export type AutoMovieViewLoftInputsQuarters = (
  station: number,
) => IAutoMovieViewPart.IQuarters<number>;
