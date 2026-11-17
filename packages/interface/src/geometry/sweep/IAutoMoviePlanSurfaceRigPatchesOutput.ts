import type { IAutoMovieSurfaceLayout } from "./IAutoMovieSurfaceLayout";

/**
 * The checked face layout and the blend-control indices transferred to the owning rig.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The completed face/chart layout travels with the set of vertex indices held as blend controls during limit fitting. A Set expresses unique blend indices; bounds and correspondence to layout vertices are guaranteed by construction rather than by number.
 * @evidence contracts/development/design.md#principled-representation The completed face/chart layout travels with the set of vertex indices held as blend controls during limit fitting.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planAutoMovieSurfaceRigPatches transfers both products to rigAutoMovieSurfaceNetwork; IAutoMovieSurfaceLayout remains the topology owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A Set expresses unique blend indices; bounds and correspondence to layout vertices are guaranteed by construction rather than by number.
 */
export interface IAutoMoviePlanSurfaceRigPatchesOutput {
  /** Faces, UVs, chart coordinates and patch grids. */
  layout: IAutoMovieSurfaceLayout;

  /** Indices whose samples remain blend controls in the limit fit. */
  blend: Set<number>;
}
