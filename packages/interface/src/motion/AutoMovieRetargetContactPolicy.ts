/**
 * How a retarget treats the contacts the source clip made.
 *
 * "pin-source-contacts" fits limbs to source contacts mapped through rootScale,
 * subject to target reach and ROM; "carry-joint-angles" copies angles and can
 * slide contacts when rig proportions differ.
 */
export type AutoMovieRetargetContactPolicy =
  | "pin-source-contacts"
  | "carry-joint-angles";
