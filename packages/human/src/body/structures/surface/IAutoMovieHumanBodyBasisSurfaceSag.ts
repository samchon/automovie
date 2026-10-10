import type { IAutoMovieHumanBodyBasisSurfaceSagSoftness } from "./IAutoMovieHumanBodyBasisSurfaceSagSoftness";

/**
 * Soft-tissue sag proxy under gravity after skinning on one surface.
 *
 * A vertex reads the outward difference between the document's rest skin
 * and the same body's `lean` shape along the rest normal. This is a
 * difference between two exterior skins, not a measured fat or muscle
 * boundary; neither skin is guaranteed free of crossings in every pose.
 * Compliance is that difference times `gain` and the softness. It moves by
 * compliance times the change of gravity's direction (-Y) in its skin's
 * frame, smoothed over `sweeps` half-steps with the open boundary held.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisSurfaceSag {
  /** Body channel weights of the lean skin the rest skin is compared with. */
  lean: Record<string, number>;

  /** Factor on the rest-minus-lean difference forming compliance. */
  gain: number;

  /** Half-step smoothing sweeps with the open boundary held. */
  sweeps: number;

  /** Softness factor on compliance. */
  softness: IAutoMovieHumanBodyBasisSurfaceSagSoftness;
}
