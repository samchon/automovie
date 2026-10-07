import type { IAutoMovieHumanPersonSkinCandidateRegion } from "./IAutoMovieHumanPersonSkinCandidateRegion";

/**
 * The part of a basis surface that skin selection reads: its ID and its
 * regions.
 *
 * @evidence contracts/common.md#principled-implementation Selecting the connected skin surface needs only each surface's regions.
 * @evidence contracts/common.md#clear-and-simple-design Two fields, a subset of every basis surface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Selection reads the surface's own regions; nothing is inferred from list position.
 * @evidence contracts/common.md#meaningful-documentation States both fields.
 * @evidence contracts/modeling.md#part-identity-and-grouping Surfaces are the basis's own; the skin is the one whose region draws the skin material.
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
export interface IAutoMovieHumanPersonSkinCandidate {
  /** The surface's ID. */
  id: string;

  /** The surface's material regions. */
  regions: IAutoMovieHumanPersonSkinCandidateRegion[];
}
