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
 * @evidence contracts/common.md#principled-implementation The proxy is defined by the difference of two declared skins and an explicit smoothing count.
 * @evidence contracts/common.md#clear-and-simple-design Four fields: lean shape, gain, sweep count and softness.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No measured tissue boundary is claimed; the proxy states its limits.
 * @evidence contracts/common.md#meaningful-documentation States what is read, how compliance and motion are formed, and the limits.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The policy belongs to an existing surface and defines no part.
 * @evidence contracts/modeling.md#parameter-channels `lean` is a weight record over existing body channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The policy emits no geometry; the posed surface owner applies it.
 * @evidence contracts/modeling.md#spatial-conventions Gravity is -Y in the basis frame; distances are metres.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The open boundary is held by the consumer.
 * @evidenceExclude contracts/modeling.md#rendered-observation The sagged surface is observed by its owner.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It is a numerical proxy, not a tissue measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Surface admission bounds its numbers.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is basis policy, not an authored human input.
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
