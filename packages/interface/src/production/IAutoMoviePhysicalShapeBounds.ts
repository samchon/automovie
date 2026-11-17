import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * World-axis bounds of an already admitted physical shape placement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation World-axis bounds of an already admitted physical shape placement. min/max are scene-world metres after composing body and local shape poses. Unit rotations, valid dimensions and nonempty finite hulls are admission premises; physicalShapeBounds does not validate them again.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The box is a broad geometric extent, not proof of collision or support. Empty malformed hull input can produce infinite corners rather than a missing-result sentinel.
 * @evidence contracts/development/design.md#principled-representation min/max are scene-world metres after composing body and local shape poses. Unit rotations, valid dimensions and nonempty finite hulls are admission premises; physicalShapeBounds does not validate them again.
 * @evidence contracts/development/design.md#minimal-and-owned-surface physicalShapeBounds produces these fresh corners for floor checks, support/contact geometry and humanoid measurements.
 */
export namespace IAutoMoviePhysicalShapeBounds {
  /**
   * Exact world axis bounds of the admitted sphere, Y capsule, oriented box or
   * convex hull; a hull's bounds are those of its rotated points.
   *
   * @evidence contracts/development/design.md#principled-representation min/max are scene-world metres after composing body and local shape poses. Unit rotations, valid dimensions and nonempty finite hulls are admission premises; physicalShapeBounds does not validate them again.
   * @evidence contracts/development/design.md#minimal-and-owned-surface physicalShapeBounds produces these fresh corners for floor checks, support/contact geometry and humanoid measurements.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The box is a broad geometric extent, not proof of collision or support. Empty malformed hull input can produce infinite corners rather than a missing-result sentinel.
   * @evidence contracts/development/common.md#meaningful-documentation World-axis bounds of an already admitted physical shape placement. min/max are scene-world metres after composing body and local shape poses. Unit rotations, valid dimensions and nonempty finite hulls are admission premises; physicalShapeBounds does not validate them again.
   */
  export type IResult = {
    /**
     * New minimum world corner in metres, exact for the represented sphere, capsule, oriented box or hull under admitted transforms.
     */
    min: IAutoMovieVector3;
    /**
     * New maximum world corner in metres. Finite ordered components depend on admitted shapes and representable composed arithmetic; the caller owns both returned vectors.
     */
    max: IAutoMovieVector3;
  };
}
