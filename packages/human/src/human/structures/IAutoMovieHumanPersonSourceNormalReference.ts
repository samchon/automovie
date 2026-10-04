import type { IAutoMovieHumanPersonPerformedSkin } from "./IAutoMovieHumanPersonPerformedSkin";

/**
 * The final mouthClose-zero reference skin normal transport starts from: a
 * performed skin of the same shape, pose and body build, labelled with the
 * source generation it was evaluated under.
 *
 * @evidence contracts/common.md#principled-implementation Transport carries an ancestral field from an actual final reference, so the reference is a performed skin plus its generation.
 * @evidence contracts/common.md#clear-and-simple-design Adds one field to the performed skin.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The generation must match the plan's; a mismatched or absent reference refuses rather than being replaced.
 * @evidence contracts/common.md#meaningful-documentation States what the reference is and what the label is for.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The reference is an existing skin; this carrier defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The carrier holds evaluated positions and emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Inherits metres in the shared Y-up, +Z-forward performed frame.
 * @evidence contracts/modeling.md#shared-boundaries Both reference halves are read together over the shared source boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation A reference is never displayed; only the transported field is.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical geometry, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Evaluated geometry or compiled lineage, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceNormalReference extends IAutoMovieHumanPersonPerformedSkin {
  /** Source generation the reference skin was evaluated under. */
  generation: string;
}
