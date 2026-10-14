/**
 * Target bone constraints override canonical humanoid range-of-motion limits,
 * as getConstraint and validateMotion apply them during retarget admission.
 *
 * @evidence contracts/common.md#principled-implementation Records getConstraint's target-bone override followed by humanoid fallback, preserving the distinction between a declared joint domain and the default table.
 * @evidence contracts/common.md#clear-and-simple-design One result policy names the implemented validation priority without exposing configurable precedence unsupported by the pass.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Constraints apply by target bone data, without clip names changing admissible ranges.
 * @evidence contracts/common.md#meaningful-documentation Identifies override precedence, humanoid fallback and both runtime owners applying the order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The ROM-policy literal performs neither joint lookup nor range checking at runtime.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This priority label does not cache findings or equate mutable constraint tables across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No range table is copied by the marker; its containing result owns only the literal.
 */
export type AutoMovieRetargetRomPolicy =
  "target-override-then-default-humanoid";
