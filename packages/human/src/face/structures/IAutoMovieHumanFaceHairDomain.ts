import type { IAutoMovieHumanFaceFacialHairSite } from "./IAutoMovieHumanFaceFacialHairSite";

/**
 * One shared anatomical hair-growth domain on a face basis surface.
 *
 * Triangle ordinals refer to the surface's complete indices, before material
 * or UV separation. A nonempty domain has unique ascending ordinals and a
 * finite neutral chart origin. Domains are common to every identity.
 *
 * @evidence contracts/common.md#principled-implementation Growth domains address the shared surface's own triangles instead of a material or UV split.
 * @evidence contracts/common.md#clear-and-simple-design One named record holds a domain's ID, chart origin and triangles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Domains are shared basis data, never a personal selection or fixture list.
 * @evidence contracts/common.md#meaningful-documentation States the ordinal domain, ordering, uniqueness and the origin's unit.
 * @evidence contracts/modeling.md#spatial-conventions The origin is XYZ metres in the neutral Y-up head frame; triangle ordinals are dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A growth domain addresses existing triangles and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The domain is not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The hair builder emits geometry; the domain only selects where growth starts.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The domain builds no boundary between parts.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder and face builder observe emitted hair.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Its extent is source data on the shared surface, not a measured anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The domain bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Shared basis data is not a person-authoring input.
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
