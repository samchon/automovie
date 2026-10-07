/**
 * The exact neutral reference rig an anatomical inspection evaluated.
 *
 * The basis names the compiled body basis whose neutral reference supplied the
 * rig centres. Its neutral is not the requested person's skin, and the record
 * is reference provenance, never a registered personal centre.
 *
 * @evidence contracts/common.md#principled-implementation Reference identity is recorded separately from the requested context, so a reference rig cannot certify the requested person.
 * @evidence contracts/common.md#clear-and-simple-design One named provenance record replaces the anonymous reference literal shared by inspection and export.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reference never claims a registered personal centre or a generated skin.
 * @evidence contracts/common.md#meaningful-documentation States what the basis names and what the evaluation does not establish.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Provenance defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Provenance defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Provenance emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Provenance carries no coordinate.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Provenance constructs no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The candidate model owner observes the displayed mesh.
 * @evidence contracts/anatomy.md#anatomical-source A neutral reference rig is a source approximation and establishes no person's imaging centre or tissue boundary.
 * @evidenceExclude contracts/anatomy.md#permitted-range Provenance bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Provenance is not a person-authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAnatomicalReference {
  /** Exact compiled body basis identity of the neutral reference rig. */
  basis: string;

  /** The neutral reference evaluation, not the requested person's skin. */
  evaluation: "neutral-reference";
}
