/**
 * The part of a basis surface region that skin selection reads: its ID and
 * the material it draws.
 *
 * @evidence contracts/common.md#principled-implementation The skin surface is identified by the material its regions draw.
 * @evidence contracts/common.md#clear-and-simple-design Two fields, a subset of every basis region.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Selection reads the region's own material; nothing is inferred from names.
 * @evidence contracts/common.md#meaningful-documentation States both fields.
 * @evidence contracts/modeling.md#part-identity-and-grouping Regions are the basis's own material groups; the skin is the surface whose region draws the skin material.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Identifiers carry no frame or unit.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Not observed directly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Read from a basis, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSkinCandidateRegion {
  /** The region's ID. */
  id: string;

  /** The material the region draws. */
  material: string;
}
