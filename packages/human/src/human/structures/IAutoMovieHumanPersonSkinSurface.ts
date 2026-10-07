/**
 * A basis's one connected skin surface, the surface that draws the skin
 * material, with its ordinal in the basis's surface list.
 *
 * @evidence contracts/common.md#principled-implementation Person assembly addresses the skin both as a surface and by its ordinal in the posed surface list, so both are kept.
 * @evidence contracts/common.md#clear-and-simple-design Two fields, generic over the basis's own surface type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The surface is selected by its skin material, never by position in the list.
 * @evidence contracts/common.md#meaningful-documentation States both fields and how the surface is selected.
 * @evidence contracts/modeling.md#part-identity-and-grouping The skin is the one surface that draws the skin material.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Names an existing surface and emits nothing.
 * @evidenceExclude contracts/modeling.md#spatial-conventions An ordinal carries no frame; the surface states its own.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Selecting a skin builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The person assembly owns what is displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Selected from the basis, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSkinSurface<T> {
  /** Ordinal of the skin surface in the basis's surface list. */
  index: number;

  /** The skin surface. */
  surface: T;
}
