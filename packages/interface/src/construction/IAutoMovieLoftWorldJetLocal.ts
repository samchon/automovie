import type { AutoMovieVector2Tuple } from "../geometry/AutoMovieVector2Tuple";

/**
 * Local total-order-two reading supplied to the frame product rule.
 *
 * Positions use millimetres and station uses physical millimetres. Phase keeps
 * the caller's original or exactly re-expressed clock: radians for section
 * readers, a normalized piece coordinate for ConstructionProfileSurface.
 * AutoMovieLoftWorldJet borrows all six pairs without mutation and rejects
 * nonfinite computed world output; it does not reconstruct missing derivatives.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes physical station from caller-owned phase units and states complete-input, borrowing and numerical-failure premises.
 * @evidence contracts/development/design.md#principled-representation Six Cartesian pairs give every partial through total order two in one coherent local chart, without assuming a radian phase after clock mapping.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Native and legacy section jets fit this structural capability; ConstructionProfileSurface additionally supplies explicitly rescaled phase derivatives.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The broader phase clock remains distinct from IAutoMovieLoftSectionJet's radian contract; finite output does not prove regularity or source-domain admission.
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
