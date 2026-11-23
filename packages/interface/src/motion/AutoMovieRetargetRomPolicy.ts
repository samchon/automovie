/**
 * Target bone constraints override canonical humanoid range-of-motion limits,
 * as getConstraint and validateMotion apply them during retarget admission.
 */
export type AutoMovieRetargetRomPolicy =
  "target-override-then-default-humanoid";
