/**
 * A canthus defined as an extreme of the joined margin rows: the margin vertex
 * whose final position has the minimum or maximum projection on a head-frame
 * axis.
 *
 * An extreme-type definition follows edits that move which vertex is the
 * corner, so the producer publishes it in place of a fixed vertex whenever
 * such a definition exists.
 *
 * @evidence contracts/common.md#principled-implementation An extreme of the margin rows along a stated axis is read on the final skin, so the corner follows edits.
 * @evidence contracts/common.md#clear-and-simple-design Three named members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Roles come from the source producer's registration, never from asset names.
 * @evidence contracts/common.md#meaningful-documentation States what each member identifies and who supplies it.
 * @evidence contracts/modeling.md#spatial-conventions The axis is a unit head-frame direction.
 * @evidenceExclude contracts/modeling.md#parameter-channels Registers identity; defines no channel.
 * @evidence contracts/modeling.md#part-identity-and-grouping Defines one canthus.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#shared-boundaries The canthus is a common endpoint of both margins.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder's consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The source manifest records the CC0 data or mesh reading each entry comes from.
 * @evidenceExclude contracts/anatomy.md#permitted-range Registers identity; bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Producer registration, not an authored control.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceCanthusExtreme {
  /** Discriminant of the extreme-type definition. */
  kind: "extreme";

  /** Unit head-frame axis the joined margin rows are projected on. */
  axis: [number, number, number];

  /** Whether the canthus is the minimum or maximum projection. */
  sense: "minimum" | "maximum";
}
