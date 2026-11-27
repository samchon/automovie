import type { IAutoMovieResolvedBone } from "../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieSurfaceCage } from "./IAutoMovieSurfaceCage";
import type { IAutoMovieSurfaceConstruction } from "./IAutoMovieSurfaceConstruction";

/**
 * A surface network compiled at one tier for posing, from
 * `rigAutoMovieSurfaceNetwork`: the rest cage, and a per-pose update that
 * writes the posed cage's control positions into a caller buffer.
 *
 * Everything that does not depend on the pose is computed once when the rig
 * compiles: the cage's topology, UVs, coordinates and rings, every sample's
 * parameters and shape before the scale profile, Coons and bridge weights, the
 * limit-fit stencils and the rest volumes. `pose` then moves only what bones
 * move: spines, section planes, joint scales, curves, blends and the fit. It
 * allocates nothing; its only caches are the rig's own buffers, fixed in size
 * by the network and tier when the rig compiles and released with the rig, and
 * each sweep's row cache of `compileAutoMovieSweep`, which the rig fills while
 * compiling and `pose` does not touch.
 */
export interface IAutoMovieSurfaceRig {
  /**
   * The cage at rest: topology, UVs, coordinates, rings, targets and fitted
   * positions.
   */
  cage: IAutoMovieSurfaceCage;

  /**
   * Requested rest construction polylines, after the girth solve; empty when
   * not requested. These unfiltered generating curves stay at rest after pose
   * updates.
   */
  construction: readonly IAutoMovieSurfaceConstruction[];

  /**
   * The rest bones' names, in the order `pose` expects; empty for a rig without
   * bones.
   */
  bones: readonly AutoMovieHumanoidBone[];

  /**
   * Write the posed cage's control positions.
   *
   * @param posed The rest bones in the same order, posed; ignored by a rig
   *   without bones
   * @param positions Receives the packed control positions,
   *   `cage.cage.positions.length` numbers, metres
   * @param targets Optionally receives the packed limit targets, the same
   *   length
   * @returns The largest distance between a fitted vertex's limit point and its
   *   target, metres; 0 without the fit
   * @throws Error when a buffer has the wrong length, the posed bones differ
   *   from the rest bones, or a sweep or curve refuses the pose
   */
  pose(
    posed: readonly IAutoMovieResolvedBone[],
    positions: Float64Array,
    targets?: Float64Array,
  ): number;
}
