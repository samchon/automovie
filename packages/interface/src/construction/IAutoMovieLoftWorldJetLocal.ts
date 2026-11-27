import type { AutoMovieVector2Tuple } from "../geometry/AutoMovieVector2Tuple";

/**
 * Local total-order-two reading supplied to the frame product rule.
 *
 * Positions use millimetres and station uses physical millimetres. Phase keeps
 * the caller's original or exactly re-expressed clock: radians for section
 * readers, a normalized piece coordinate for ConstructionProfileSurface.
 * loftWorldJet borrows all six pairs without mutation and rejects
 * nonfinite computed world output; it does not reconstruct missing
 * derivatives.
 */
export interface IAutoMovieLoftWorldJetLocal {
  /** Local [u,v] point in millimetres. */
  p: AutoMovieVector2Tuple;

  /** First physical-station partial, millimetres per millimetre. */
  s: AutoMovieVector2Tuple;

  /** First phase partial, millimetres per caller clock unit. */
  t: AutoMovieVector2Tuple;

  /** Second physical-station partial, inverse millimetres. */
  ss: AutoMovieVector2Tuple;

  /** Mixed physical-station/phase partial, inverse caller clock units. */
  st: AutoMovieVector2Tuple;

  /** Second phase partial, millimetres per squared caller clock unit. */
  tt: AutoMovieVector2Tuple;
}
