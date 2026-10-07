/**
 * One source-star accumulation during normal transport: the reference-area
 * weighted sum of transported densities, the star's ancestral unit normal,
 * and whether any incident cell changed.
 *
 * @evidence contracts/common.md#principled-implementation An unchanged star keeps its ancestral normal exactly, so the sum is kept beside the reference and a change flag.
 * @evidence contracts/common.md#clear-and-simple-design Three fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Values accumulate from actual fixed cells; nothing is defaulted.
 * @evidence contracts/common.md#meaningful-documentation States each field.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A star defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A star emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Vectors are in the shared Y-up, +Z-forward frame.
 * @evidence contracts/modeling.md#shared-boundaries A star is keyed by canonical sample, so both halves read the same accumulation.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal accumulation that is not observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical geometry, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Evaluated geometry or compiled lineage, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalStar {
  /** Reference-area weighted sum of transported densities. */
  sum: number[];

  /** The star's ancestral unit normal. */
  reference: readonly number[];

  /** Whether any incident fixed cell moved. */
  changed: boolean;
}
