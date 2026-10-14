import type { IHumanFaceOcularSurface } from "./IHumanFaceOcularSurface";

/**
 * The analytic exterior of one eye in its two evaluated states, matching the
 * rest and posed hull meshes of the same optical assembly.
 *
 *
 * @evidence contracts/common.md#principled-implementation Shape-only rest and performed analytic exteriors retain the same profile carried by registered eye motion.
 * @evidence contracts/common.md#clear-and-simple-design buildHumanFaceOpticalAssembly owns both states matching its collider population.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither state is independently refitted to the visible aperture or granted a rest-penetration allowance.
 * @evidence contracts/common.md#meaningful-documentation Fields identify rest placement and performed motion ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceOcularSurfacePair is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceOcularSurfacePair declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceOcularSurfacePair acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
 *
 * @author Samchon
 */
export interface IHumanFaceOcularSurfacePair {
  /** Exterior in the shape-only rest placement. */
  rest: IHumanFaceOcularSurface;

  /** Exterior carried by the eye's performed motion. */
  posed: IHumanFaceOcularSurface;
}
