/**
 * One boundary interval along an original parent-triangle side, as
 * dimensionless affine parameters from the side's start corner (0) toward its
 * end corner (1).
 *
 * @evidence contracts/common.md#principled-implementation Boundary coverage of a side is exactly a set of parameter intervals that must tile [0, 1].
 * @evidence contracts/common.md#clear-and-simple-design Two fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Parameters come from actual preimage weights; no tolerance closes a gap.
 * @evidence contracts/common.md#meaningful-documentation States both fields and their parameter range.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping An interval defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry An interval emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Affine parameters are dimensionless and carry no frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Internal bookkeeping of one coverage proof; it builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal source lineage that is not observed directly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical lineage, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiled or derived lineage, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceInterval {
  /** Dimensionless affine parameter where the interval starts. */
  start: number;

  /** Dimensionless affine parameter where the interval ends. */
  end: number;
}
