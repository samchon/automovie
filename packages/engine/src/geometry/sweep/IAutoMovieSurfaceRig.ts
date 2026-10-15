import { AutoMovieHumanoidBone } from "@automovie/interface";

import { IAutoMovieResolvedBone } from "../../kinematics/IAutoMovieResolvedBone";
import { IAutoMovieSurfaceCage } from "./IAutoMovieSurfaceCage";

/**
 * A surface network compiled at one tier for posing, from
 * `rigAutoMovieSurfaceNetwork`: the rest cage, and a per-pose update that
 * writes the posed cage's control positions into a caller buffer.
 *
 * Everything that does not depend on the pose is computed once when the rig
 * compiles: the cage's topology, UVs, coordinates and rings, every sample's
 * parameters and shape before the scale profile, Coons and bridge weights,
 * the limit-fit stencils and the rest volumes. `pose` then moves only what
 * bones move: spines, section planes, joint scales, curves, blends and the
 * fit. It allocates nothing; its only caches are the rig's own buffers,
 * fixed in size by the network and tier when the rig compiles and released
 * with the rig, and each sweep's row cache of `compileAutoMovieSweep`, which
 * the rig fills while compiling and `pose` does not touch.
 *
 * @evidence contracts/common.md#principled-implementation The pose-invariant compile and per-pose evaluation split of a deformable surface, with the posed cage equal to sampling the network `poseAutoMovieSurfaceNetwork` makes.
 * @evidence contracts/common.md#clear-and-simple-design One rest cage record shared with `sampleAutoMovieSurfaceNetwork` and one update that fills a buffer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fit residual is returned on every pose, so a caller can refuse a pose whose fit did not converge.
 * @evidence contracts/common.md#meaningful-documentation States what compiles once, what moves per pose, the allocation and cache guarantees and the residual.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; costs are on `rigAutoMovieSurfaceNetwork`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record; it is the reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record whose buffers its producer sizes, stated above.
 * @author Samchon
 */
export interface IAutoMovieSurfaceRig {
  /** The cage at rest: topology, UVs, coordinates, rings, targets and fitted positions. */
  cage: IAutoMovieSurfaceCage;

  /** The rest bones' names, in the order `pose` expects; empty for a rig without bones. */
  bones: readonly AutoMovieHumanoidBone[];

  /**
   * Write the posed cage's control positions.
   *
   * @param posed The rest bones in the same order, posed; ignored by a rig without bones
   * @param positions Receives the packed control positions, `cage.cage.positions.length` numbers, metres
   * @param targets Optionally receives the packed limit targets, the same length
   * @returns The largest distance between a fitted vertex's limit point and its target, metres; 0 without the fit
   * @throws Error when a buffer has the wrong length, the posed bones differ from the rest bones, or a sweep or curve refuses the pose
   */
  pose(posed: readonly IAutoMovieResolvedBone[], positions: Float64Array, targets?: Float64Array): number;
}
