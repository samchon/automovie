/**
 * The finite accumulated-area domain refusal of areaWeightedNormals.
 *
 * The existing guard and Error message remain unchanged. A local nonlinear
 * caller can distinguish an undefined candidate normal field from programmer,
 * Source and solver exceptions without matching text or supplying a substitute.
 * Other callers retain ordinary Error compatibility and the inherited name.
 *
 * @evidence contracts/common.md#principled-implementation The subtype identifies nonfinite accumulated area in the shared normal builder, preserving the existing message and inherited Error name; callers distinguish numerical-domain refusal by type without changing the guard.
 * @evidence contracts/common.md#clear-and-simple-design One failure type separates candidate-domain refusal from source/solver/programmer exceptions while remaining compatible with ordinary Error consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No substitute normal, text matching or specimen branch hides invalid accumulated area, and no foreign method is replaced.
 * @evidence contracts/common.md#meaningful-documentation The class and constructor prose give the precise refusal role, unchanged message/name and compatibility boundary.
 * @evidence contracts/performance.md#efficient-algorithms One Error has fixed application data but runtime stack capture depends on call depth; the subtype performs no mesh scan.
 * @evidence contracts/performance.md#reuse-equivalent-work The normal builder and nonlinear callers share this failure type without caching equivalent-looking thrown errors.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each error/stack lives with its throw/catch owner until released; the class retains no population, native handle or task.
 */
export class HumanMeshNormalDomainError extends Error {
  /** Retain the original finite accumulated-area refusal message and inherited Error name. */
  constructor() {
    super("Model normals require finite accumulated areas.");
  }
}
