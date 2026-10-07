import type { IHumanFaceOcularSurface } from "./IHumanFaceOcularSurface";

/**
 * The analytic exterior of one eye in its two evaluated states, matching the
 * rest and posed hull meshes of the same optical assembly.
 *
 * @evidence contracts/common.md#principled-implementation Each state's surface is the same profile in that state's placement, so seating and measurement use the surface the hull of that state tessellates.
 * @evidence contracts/common.md#clear-and-simple-design Two fields mirroring the collider pair.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No state shares the other's placement.
 * @evidence contracts/common.md#meaningful-documentation Names the correspondence with the collider meshes.
 * @evidence contracts/modeling.md#spatial-conventions Both surfaces are head-frame metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reference surfaces, not parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The surface type answers for the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Geometry of an admitted optical profile.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no input.
 *
 * @author Samchon
 */
export interface IHumanFaceOcularSurfacePair {
  /** Exterior in the shape-only rest placement. */
  rest: IHumanFaceOcularSurface;

  /** Exterior carried by the eye's performed motion. */
  posed: IHumanFaceOcularSurface;
}
