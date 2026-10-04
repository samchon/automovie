/**
 * One face articulation owner's attachment weights continued below the cut
 * onto body-partition vertices of a source generation's neck band.
 *
 * `owner` is a face articulation owner (`jaw`); `rows` are `[bodyVertex,
 * weight]` pairs ascending by body skin vertex, weights in (0, 1]. They are
 * the same field the face surface's own attachment rows carry above the cut,
 * so the owner's rigid motion reaches the band with one definition.
 *
 * @evidence contracts/common.md#principled-implementation The rows continue the face attachment field across the cut instead of stopping it at the partition label.
 * @evidence contracts/common.md#clear-and-simple-design The face attachment row layout, addressed to body vertices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The weights are the source generation's, not fitted by the evaluator.
 * @evidence contracts/common.md#meaningful-documentation States the owner, the row layout and the domain.
 * @evidence contracts/modeling.md#shared-boundaries The field is continuous with the face rows at the shared cut samples.
 * @evidence contracts/modeling.md#spatial-conventions Dimensionless weights on body skin vertex ids.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The rows define no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The rows are not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The rows emit no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The rows are not observed alone.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rows are source rig data.
 * @evidenceExclude contracts/anatomy.md#permitted-range Weights are not an anatomical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The rows are compiled source data.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBandAttachment {
  /** The face articulation owner, such as `jaw`. */
  owner: string;

  /** `[bodyVertex, weight]` pairs ascending by body vertex. */
  rows: number[];
}
