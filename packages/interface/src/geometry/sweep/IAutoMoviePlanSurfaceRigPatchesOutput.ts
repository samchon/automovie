import type { IAutoMovieSurfaceLayout } from "./IAutoMovieSurfaceLayout";

/**
 * The checked face layout and the blend-control indices transferred to the
 * owning rig.
 */
export interface IAutoMoviePlanSurfaceRigPatchesOutput {
  /** Faces, UVs, chart coordinates and patch grids. */
  layout: IAutoMovieSurfaceLayout;

  /** Indices whose samples remain blend controls in the limit fit. */
  blend: Set<number>;
}
