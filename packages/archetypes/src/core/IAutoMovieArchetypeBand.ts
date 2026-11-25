import type { AutoMovieArchetypeBandUnit } from "./AutoMovieArchetypeBandUnit";

/**
 * The band one free dimension of an archetype may take, with the source that
 * states it.
 *
 * A producer draws the dimension uniformly inside the band from its seed, takes
 * the middle of the band without a seed, and refuses a value an author fixes
 * outside it. The band is therefore the whole variation of that dimension:
 * nothing an act reads leaves it.
 */
export interface IAutoMovieArchetypeBand {
  /** The least value, in `unit`. */
  minimum: number;

  /**
   * The greatest value, in `unit`; equal to `minimum` for a dimension a
   * standard fixes.
   */
  maximum: number;

  /** The unit of both ends. */
  unit: AutoMovieArchetypeBandUnit;

  /**
   * Where the band comes from: the standard's clause or the measurement, with
   * the address it was read at.
   */
  source: string;

  /**
   * True when the band could not be read at its primary source, or is an
   * estimate from a secondary one.
   */
  provisional?: boolean;
}
