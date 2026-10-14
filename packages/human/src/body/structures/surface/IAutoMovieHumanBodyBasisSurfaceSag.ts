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
 * @evidence contracts/common.md#principled-implementation A rest-minus-lean exterior difference supplies a compliance proxy, multiplied by gain and softness before gravity response and smoothing.
 * @evidence contracts/common.md#clear-and-simple-design The sag policy groups its reference shape and response factors independently of skinning.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Two exterior skins are not measured fat or muscle boundaries and cannot prove pose clearance.
 * @evidence contracts/common.md#meaningful-documentation The comment states gravity frame, compliance derivation, smoothing and open-boundary behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The surface sag proxy policy has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The surface sag proxy policy schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The surface sag proxy policy declaration allocates no runtime state or handles.
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
