/**
 * Planar ring classification, with its tolerance-qualified rim distinguished.
 *
 * @evidence contracts/development/design.md#principled-representation footprintRingPlacement checks segment distance against 1e-9 metres before the shared polygon boundary/parity test, whose own boundary check uses scale-relative tolerance; fewer than three points classify outside, subject to binary64 predicates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three closed outcomes let footprintContains include both outer and hole rims while excluding only open hole interiors.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Boundary is a declared geometric tolerance rather than a caller-specific margin; this classification does not certify exact predicates at extreme coordinate scales.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes the tolerance-qualified boundary from polygon interior/exterior; classification itself does not validate a ring or guarantee positive area.
 */
export type AutoMovieRingPlacement = "outside" | "boundary" | "inside";
