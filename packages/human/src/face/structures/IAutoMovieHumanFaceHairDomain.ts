import type { IAutoMovieHumanFaceFacialHairSite } from "./IAutoMovieHumanFaceFacialHairSite";

/**
 * One shared anatomical hair-growth domain on a face basis surface.
 *
 * Triangle ordinals refer to the surface's complete indices, before material
 * or UV separation. A nonempty domain has unique ascending ordinals and a
 * finite neutral chart origin. Domains are common to every identity.
 *
 * @evidence contracts/common.md#principled-implementation A basis-owned subset of complete surface triangle ordinals and a neutral origin establish reusable growth correspondence before material or UV splits.
 * @evidence contracts/common.md#clear-and-simple-design Domain identity, optional anatomical facial-hair site and resident triangles remain source metadata; numerical hairstyle documents select their names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A personal triangle list cannot be supplied through the named hairstyle input, and this type alone does not validate source topology, rights or anatomical registration.
 * @evidence contracts/common.md#meaningful-documentation The ordinal buffer, finite origin and unique ascending-domain premise are explicit so material-separated indices are not mistaken for source identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The domain record neither builds area distributions nor samples roots.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source correspondence is declared data rather than evaluated-pose reuse implemented here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The source owner retains the triangle array; this declaration creates no compiled query or geometry.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHairDomain {
  /** Domain identity a hair layer selects. */
  id: string;

  /** Optional source-authored facial anatomical site; no numerical document selects personal triangles. */
  facialHairSite?: IAutoMovieHumanFaceFacialHairSite;

  /** Finite neutral chart origin, XYZ metres. */
  origin: [number, number, number];

  /** Unique ascending triangle ordinals of the surface's complete indices. */
  triangles: number[];
}
