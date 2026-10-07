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
 * @evidence contracts/common.md#principled-implementation The caller states the problem; the solver owns only the iteration, so one numerical owner serves the body's square solve and the person head's underdetermined one.
 * @evidence contracts/common.md#clear-and-simple-design Six fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The departure scale is the caller's stated convention; the solver selects no anatomical weight of its own.
 * @evidence contracts/common.md#meaningful-documentation States the units, the cost the departure scale defines and the default.
 * @evidence contracts/modeling.md#spatial-conventions Offsets, residuals and scales are dimensionless numerical coordinates.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record owns no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The caller maps offsets to channels; the record defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record owns no displayed part.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record carries no anatomical constant.
 * @evidenceExclude contracts/anatomy.md#permitted-range The intervals come from already admitted channel bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is internal solve state.
 *
 * @author Samchon
 */
export interface IHumanBodySimpleOffsetsProblem {
  /** One finite interval containing zero per offset. */
  ranges: readonly (readonly [number, number])[];

  /** The residual at zero offsets, or null for an unreadable start. */
  initial: readonly number[] | null;

  /** Deterministic residuals at the given offsets, or null for an unreadable trial. */
  evaluate: (offsets: readonly number[]) => number[] | null;

  /** Whether the primary residuals (all but the trailing secondary ones) meet the caller's acceptance. */
  met: (residuals: readonly number[]) => boolean;

  /**
   * How many trailing residuals are secondary: pursued by least squares only
   * within the freedom the primary residuals leave, and never a condition of
   * success. Omitted is none.
   */
  secondary?: number;

  /** Positive cost scale per offset at the given offsets; omitted weighs every offset equally. */
  departure?: (offsets: readonly number[]) => readonly number[];
}
