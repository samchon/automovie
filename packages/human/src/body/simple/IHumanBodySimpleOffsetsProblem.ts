/**
 * One bounded offset solve for `solveHumanBodySimpleOffsets`: the interval of
 * each offset, the residual at zero, the residual reader, the caller's
 * acceptance predicate and, when there are more offsets than residuals, the
 * departure scale that chooses among the offsets that meet the targets.
 *
 * The trailing `secondary` residuals, when named, are lowered only within the
 * freedom the primary residuals leave.
 *
 * Offsets are dimensionless solve coordinates. Residuals are dimensionless
 * readings the caller forms (relative or scaled errors). `departure` returns
 * one positive scale per offset at a given offset vector: the cost of an
 * offset vector is the sum of squares of each offset times its scale, and
 * among the offsets that meet the targets the solver moves toward the one of
 * least cost. A square problem needs no scale; an underdetermined one without
 * a scale weighs every offset equally.
 *
 * @evidence contracts/common.md#principled-implementation Finite offset intervals containing zero, deterministic residuals and an acceptance predicate define a bounded dimensionless solve, with trailing secondary residuals outside success criteria.
 * @evidence contracts/common.md#clear-and-simple-design The numerical problem separates primary acceptance from optional departure cost and secondary optimization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unreadable trials return null rather than an invented residual; omitted departure scales weight offsets equally.
 * @evidence contracts/common.md#meaningful-documentation The prose gives dimensionless units, underdetermined tie-breaking and primary-versus-secondary semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The bounded offset solve contract is a type declaration without executable processing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The bounded offset solve contract coordinates no cross-call computation or caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The bounded offset solve contract type itself acquires no retained runtime resources.
 *
 * @author Samchon
 */
export interface IHumanBodySimpleOffsetsProblem {
  /** One finite interval containing zero per offset. */
  ranges: readonly (readonly [number, number])[];

  /** The residual at zero offsets, or null for an unreadable start. */
  initial: readonly number[] | null;

  /**
   * Deterministic residuals at the given offsets, or null for an unreadable trial.
   *
   * @evidence contracts/common.md#principled-implementation A deterministic callback returns the current dimensionless residual vector, or null when the trial cannot be read.
   * @evidence contracts/common.md#clear-and-simple-design The numerical solver receives residual evaluation through the problem's owning domain.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unreadable trials are explicit instead of being replaced by fabricated zero errors.
   * @evidence contracts/common.md#meaningful-documentation The property states dimensionless offsets, deterministic readings and null failure.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The offset residual callback defines a signature rather than an executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The offset residual callback signature implements no cache or coordination policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The offset residual callback declaration acquires no tasks, handles or retained buffers.
   */
  evaluate: (offsets: readonly number[]) => number[] | null;

  /**
   * Whether the primary residuals (all but the trailing secondary ones) meet the caller's acceptance.
   *
   * @evidence contracts/common.md#principled-implementation The predicate determines success from primary residuals, excluding any trailing secondary residuals.
   * @evidence contracts/common.md#clear-and-simple-design Acceptance belongs to the caller's measurement budgets rather than the generic least-squares solver.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Secondary improvements cannot turn a failed primary request into a successful solve.
   * @evidence contracts/common.md#meaningful-documentation The property distinguishes primary acceptance from secondary optimization.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The primary acceptance callback defines a signature rather than an executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The primary acceptance callback signature implements no cache or coordination policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The primary acceptance callback declaration acquires no tasks, handles or retained buffers.
   */
  met: (residuals: readonly number[]) => boolean;

  /**
   * How many trailing residuals are secondary: pursued by least squares only
   * within the freedom the primary residuals leave, and never a condition of
   * success. Omitted is none.
   */
  secondary?: number;

  /**
   * Positive cost scale per offset at the given offsets; omitted weighs every offset equally.
   *
   * @evidence contracts/common.md#principled-implementation A deterministic callback supplies a positive cost scale per offset at the current offset vector.
   * @evidence contracts/common.md#clear-and-simple-design The caller owns underdetermined tie-breaking; omission weights all offsets equally.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Cost scales choose among accepted solutions and do not weaken primary measurement acceptance.
   * @evidence contracts/common.md#meaningful-documentation The comment states positivity, per-offset output and the omitted equal-weight policy.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The offset departure cost callback defines a signature rather than an executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The offset departure cost callback signature implements no cache or coordination policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The offset departure cost callback declaration acquires no tasks, handles or retained buffers.
   */
  departure?: (offsets: readonly number[]) => readonly number[];
}
