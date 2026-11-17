import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * World point and all partials through total order two after frame placement.
 *
 * AutoMovieLoftWorldJet computes P = origin + local.u * frame.u + local.v * frame.v from local derivatives and three physical-station frame rows. Station uses millimetres. Phase retains the caller's clock: radians for a loft/view, or the normalized piece coordinate after ConstructionProfileSurface applies its clock scale. The operator returns six fresh mutable vectors, mutates no input and throws AutoMovieLoftAdmissionError for nonfinite outputs; malformed input/getter errors propagate. Lift and relief are added separately by the loft owner.
 *
 * @evidence contracts/development/design.md#principled-representation Each field is a spatial [x,y,z] vector for a named partial of the same world field; the derivative orders share physical station but preserve the caller's independently mapped phase coordinate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The frame product rule serves LoftJet, original ViewWorldJet and ConstructionProfileSurface; the latter two map these fields to the solid surface's u/v derivative names.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Finite vectors alone do not certify a regular chart, outward orientation or a valid query domain; those premises remain with the surface adapter.
 * @evidence contracts/development/common.md#meaningful-documentation Defines world frame, station versus caller phase units, derivative interpretation, fresh mutable results and numerical failure ownership.
 */
export type IAutoMovieLoftWorldJetWorld = {
  /** Surface point in the publishing frame's world millimetres, freshly allocated by the frame product rule. */
  p: AutoMovieVector3Tuple;

  /** First physical-station partial in millimetres per millimetre; includes frame motion and local station derivatives. */
  s: AutoMovieVector3Tuple;

  /** First phase partial in millimetres per caller clock unit; the original or explicitly re-expressed phase clock is preserved. */
  t: AutoMovieVector3Tuple;

  /** Second physical-station partial in inverse millimetres, including the frame product-rule cross terms. */
  ss: AutoMovieVector3Tuple;

  /** Mixed station/phase partial in inverse caller clock units. */
  st: AutoMovieVector3Tuple;

  /** Second phase partial in millimetres per squared caller clock unit; not an arc-length curvature vector. */
  tt: AutoMovieVector3Tuple;
};
