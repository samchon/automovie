import { AutoMovieHumanoidBone } from "@automovie/interface";

import { IAutoMovieResolvedBone } from "../../kinematics/IAutoMovieResolvedBone";
import { IAutoMovieSurfaceCage } from "./IAutoMovieSurfaceCage";
import { IAutoMovieSurfaceConstruction } from "./IAutoMovieSurfaceConstruction";

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
 * @evidence contracts/development/design.md#principled-representation The pose-invariant compile and per-pose evaluation split of a deformable surface, with the posed cage equal to sampling the network `poseAutoMovieSurfaceNetwork` makes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One shared rest cage, an optional rest construction snapshot and one pose writer that fills a buffer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The fit residual is returned on every pose, so a caller can refuse a pose whose fit did not converge.
 * @evidence contracts/development/common.md#meaningful-documentation States what compiles once, what moves per pose, the allocation and cache guarantees and the residual.
 */
export interface IAutoMovieSurfaceRig {
  /** The cage at rest: topology, UVs, coordinates, rings, targets and fitted positions. */
  cage: IAutoMovieSurfaceCage;

  /** Requested rest construction polylines, after the girth solve; empty when not requested. These unfiltered generating curves stay at rest after pose updates. */
  construction: readonly IAutoMovieSurfaceConstruction[];

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
   *
   * @evidence contracts/development/implementation.md#principled-implementation Per-pose evaluation of a compiled surface: re-sweep, blends and limit fit written into caller memory.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call per frame with the posed bones and the output buffers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Wrong buffer lengths and out-of-order bones are refused, and the residual is returned for every pose.
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, outputs, return value and refusals.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(V) writers plus bound sweeps' and curves' updates and the fit, with no allocation, as `rigAutoMovieSurfaceNetwork` details.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature; reuse is answered on `rigAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature; retention is answered on `rigAutoMovieSurfaceNetwork`.
   */
  pose(
    posed: readonly IAutoMovieResolvedBone[],
    positions: Float64Array,
    targets?: Float64Array,
  ): number;
}
