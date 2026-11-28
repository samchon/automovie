import type { AutoMovieVector2Tuple } from "../geometry/AutoMovieVector2Tuple";

/**
 * Complete local section input to the frame product rule. Positions are in
 * chart millimetres and physical station is in millimetres. Phase uses the
 * caller's clock, such as polar radians or the normalized coordinate of a
 * construction profile piece. Supply all six pairs in that same coordinate.
 */
export interface IAutoMovieLoftWorldJetLocal {
  /** Local position [u, v] in chart millimetres. */
  p: AutoMovieVector2Tuple;

  /** First physical-station partial of [u, v], in millimetres per millimetre. */
  s: AutoMovieVector2Tuple;

  /**
   * First phase partial of [u, v], in millimetres per unit of the caller's
   * phase clock.
   */
  t: AutoMovieVector2Tuple;

  /** Second physical-station partial of [u, v], in inverse millimetres. */
  ss: AutoMovieVector2Tuple;

  /**
   * Mixed physical-station and phase partial of [u, v], in inverse phase clock
   * units.
   */
  st: AutoMovieVector2Tuple;

  /**
   * Second phase partial of [u, v], in millimetres per squared phase clock
   * unit.
   */
  tt: AutoMovieVector2Tuple;
}
