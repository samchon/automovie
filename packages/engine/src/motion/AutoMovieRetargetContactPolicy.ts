/**
 * How a retarget treats the contacts the source clip made.
 *
 * `"pin-source-contacts"` re-solves each contacting limb so the effector holds
 * the source contact mapped through `rootScale`; `"carry-joint-angles"` is v1's
 * verbatim angle copy, which foot-slides whenever the rigs differ in
 * proportion.
 */
export type AutoMovieRetargetContactPolicy =
  | "pin-source-contacts"
  | "carry-joint-angles";
