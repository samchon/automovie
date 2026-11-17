/**
 * Target bone constraints override canonical humanoid range-of-motion limits,
 * as getConstraint and validateMotion apply them during retarget admission.
 *
 * @evidence contracts/development/design.md#principled-representation Records getConstraint's target-bone override followed by humanoid fallback, preserving the distinction between a declared joint domain and the default table.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One result policy names the implemented validation priority without exposing configurable precedence unsupported by the pass.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Constraints apply by target bone data, without clip names changing admissible ranges.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies override precedence, humanoid fallback and both runtime owners applying the order.
 */
export type AutoMovieRetargetRomPolicy =
  "target-override-then-default-humanoid";
