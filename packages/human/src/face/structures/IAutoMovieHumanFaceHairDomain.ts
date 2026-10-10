import type { IAutoMovieHumanFaceFacialHairSite } from "./IAutoMovieHumanFaceFacialHairSite";

/**
 * One shared anatomical hair-growth domain on a face basis surface.
 *
 * Triangle ordinals refer to the surface's complete indices, before material
 * or UV separation. A nonempty domain has unique ascending ordinals and a
 * finite neutral chart origin. Domains are common to every identity.
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
