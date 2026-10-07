/**
 * One original source vertex in a sample's affine preimage: its ID and its
 * dimensionless positive weight. A sample's weights sum to one.
 *
 * @evidence contracts/common.md#principled-implementation An affine preimage over original source vertices is exactly a set of identity and weight pairs.
 * @evidence contracts/common.md#clear-and-simple-design Two fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Weights are evaluated from the compiled chart by the shared affine owner, never fitted or defaulted here.
 * @evidence contracts/common.md#meaningful-documentation States both fields and that they are dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A preimage defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A preimage emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions An ID and a dimensionless weight carry no frame or unit.
 * @evidence contracts/modeling.md#shared-boundaries Both complementary skins read the same preimage of a shared sample.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal source lineage that is not observed directly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical lineage, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiled or derived lineage, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceWeight {
  /** Original source vertex ID. */
  id: number;

  /** Dimensionless positive affine weight of that vertex. */
  weight: number;
}
