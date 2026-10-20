import { IAutoMovieBoneBuffer } from "./IAutoMovieBoneBuffer";
import { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";

/**
 * One sweep of a surface rig, from `rigAutoMovieSweep`: the frames, scale
 * factors and surface normals a cage reads from it, at parameters registered
 * once and refreshed per pose in place.
 *
 * Registration (`frame`, `scale`, `probe`, `sample`) runs while a cage is planned and
 * returns slot indices; `seal` then sizes the arrays and fills them at rest.
 * `pose` refreshes them for the current bone motions, or at rest for `null`.
 *
 * @evidence contracts/common.md#principled-implementation A compiled evaluator over a fixed set of parameters, the standard split of a deformable surface into pose-invariant sampling and per-pose evaluation.
 * @evidence contracts/common.md#clear-and-simple-design Three slot kinds cover what a cage needs: section planes, scale factors and the normal and spine derivative at a point.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registering after `seal` is refused, so every slot has storage.
 * @evidence contracts/common.md#meaningful-documentation States the two phases, the slot kinds and the array layouts.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; costs are on `rigAutoMovieSweep`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record; it is the reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record whose arrays its producer sizes.
 */
export interface IAutoMovieSweepRig {
  /** The sweep compiled at rest; its shape before the scale profile is the shape in every pose. */
  surface: IAutoMovieSweepSurface;

  /**
   * Register a section plane.
   *
   * @param u Along the spine
   * @returns The slot: the plane is `frames[12 slot ...]`, origin, first axis, second axis, normal
   *
   * @evidence contracts/common.md#principled-implementation Registers a section plane slot by parameter, deduplicated.
   * @evidence contracts/common.md#clear-and-simple-design Returns the slot index.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Registration after `seal` is refused.
   * @evidence contracts/common.md#meaningful-documentation States the slot layout.
   * @evidence contracts/performance.md#efficient-algorithms One map operation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `rigAutoMovieSweep`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `rigAutoMovieSweep`.
   */
  frame(u: number): number;

  /**
   * Register a scale factor.
   *
   * @param u Along the spine
   * @returns The slot: the factor is `scales[slot]`
   *
   * @evidence contracts/common.md#principled-implementation Registers a scale factor slot.
   * @evidence contracts/common.md#clear-and-simple-design Returns the slot index.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Registration after `seal` is refused.
   * @evidence contracts/common.md#meaningful-documentation States the slot layout.
   * @evidence contracts/performance.md#efficient-algorithms One map operation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `rigAutoMovieSweep`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `rigAutoMovieSweep`.
   */
  scale(u: number): number;

  /**
   * Register a normal and spine derivative of the same geometric writer as sample, with one fixed cell at all four finite-difference points. Omitted or zero, the cell preserves the raw surface meaning; a nonzero cell differentiates that local averaged field, not a spatial interpolation of varying footprint sizes.
   *
   * @param u Along the spine
   * @param v Around it
   * @param cell Fixed below/above reaches along u and v, finite and nonnegative; omitted, all zero
   * @returns The slot: the unit normal is `probes[6 slot ...]` and the derivative along the spine the next three numbers
   * @throws Error if the rig is sealed or any cell reach is negative or nonfinite
   *
   * @evidence contracts/common.md#principled-implementation Uses the source surface's finite-difference step and four writers of the same fixed-cell geometric field for its normal and axial derivative.
   * @evidence contracts/common.md#clear-and-simple-design Returns the slot index.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The difference step is the surface's own.
   * @evidence contracts/common.md#meaningful-documentation States the slot layout.
   * @evidence contracts/performance.md#efficient-algorithms Four writers at registration, each with one to nine shape reads and one to three per-pose scale terms; frame and scale slots deduplicate with all other samples.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `rigAutoMovieSweep`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `rigAutoMovieSweep`.
   */
  probe(
    u: number,
    v: number,
    cell?: readonly [number, number, number, number],
  ): number;

  /**
   * Register a surface point and make its writer.
   *
   * The point is averaged over its cell, which reaches half the spacing to the neighbouring sample on each side along `u` (clamped to the spine) and `v`, by the trapezoid rule on the cell's two halves: weights `b / (2 (b + a))`, `1/2` and `a / (2 (b + a))` at the lower end, the point and the upper end for halves `b` below and `a` above, which is `1/4, 1/2, 1/4` on an even grid. Direction correspondence averages radii about the authored direction, so a round section keeps its size. Parameter correspondence averages the actual Cartesian section points, with each u-dependent scale inside the average; it preserves an off-origin curve and permits a legitimately cancelling origin. Signed means and products that cannot be represented are refused. A cell of zero extent is the section point itself, as `IAutoMovieSweepSurface.point` places it. Shapes are read now; the writer scales and places them in the current frame.
   *
   * @param u Along the spine
   * @param v Around it
   * @param cell Spacing to the neighbouring sample below and above along `u`, then below and above along `v`
   * @returns The writer, three numbers in metres at an offset
   *
   * @evidence contracts/common.md#principled-implementation Tensor trapezoid integration over the fixed cell: radial radii or parameter-correspondence Cartesian points, with scale inside the u integral.
   * @evidence contracts/common.md#clear-and-simple-design Shapes read now, scale and frame per pose.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The declared correspondence selects radial or Cartesian averaging; no Cartesian section is projected onto an unrelated polar direction.
   * @evidence contracts/common.md#meaningful-documentation States the weights and the zero cell.
   * @evidence contracts/performance.md#efficient-algorithms Up to nine shape reads at registration, three terms per pose.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `rigAutoMovieSweep`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `rigAutoMovieSweep`.
   */
  sample(
    u: number,
    v: number,
    cell: readonly [number, number, number, number],
  ): (out: Float64Array, at: number) => void;

  /**
   * Size the arrays and fill them at rest.
   *
   * @evidence contracts/common.md#principled-implementation Sizes the slot arrays and fills them at rest.
   * @evidence contracts/common.md#clear-and-simple-design One call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Later registration is refused.
   * @evidence contracts/common.md#meaningful-documentation States the effect.
   * @evidence contracts/performance.md#efficient-algorithms O(F + P) frame and probe evaluations.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `rigAutoMovieSweep`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `rigAutoMovieSweep`.
   */
  seal(): void;

  /**
   * Multiply every scale slot by a fixed factor of its `u`, at rest and in
   * every pose from now on, the radial correction a surface network solves
   * to hold a measured girth. Each call replaces the previous factor, and the
   * rest slots and probes are refreshed after every factor, scale product and probe is admitted. A rejected factor, product or probe leaves the previous scales and probes in place.
   *
   * @param factor The factor at a spine parameter, positive and finite
   * @throws Error when called before `seal`, or the factor or its resulting scale is not positive and finite at a slot, or a probe is not representable
   *
   * @evidence contracts/common.md#principled-implementation A shape correction folded into the scale, the one place every sample, probe and pose reads the radius from.
   * @evidence contracts/common.md#clear-and-simple-design One factor per scale slot, replaced rather than compounded.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A factor that is not positive and finite is refused instead of clamped.
   * @evidence contracts/common.md#meaningful-documentation States when the factor applies and that a call replaces the last.
   * @evidence contracts/performance.md#efficient-algorithms O(S + P) for S scale slots and P probes.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `rigAutoMovieSweep`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `rigAutoMovieSweep`.
   */
  girth(factor: (u: number) => number): void;

  /** Section planes by frame slot, twelve numbers each. */
  frames: Float64Array;

  /** Scale factors by scale slot. */
  scales: Float64Array;

  /** Normal and spine derivative by probe slot, six numbers each. */
  probes: Float64Array;

  /**
   * Refresh every slot.
   *
   * @param bones Current bone motions, or `null` for rest
   *
   * @evidence contracts/common.md#principled-implementation Re-sweeps the bound sweep and refreshes every slot.
   * @evidence contracts/common.md#clear-and-simple-design One call per pose.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An unbound sweep stays at rest.
   * @evidence contracts/common.md#meaningful-documentation States the rest case.
   * @evidence contracts/performance.md#efficient-algorithms As `rigAutoMovieSweep` details, no allocation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `rigAutoMovieSweep`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `rigAutoMovieSweep`.
   */
  pose(bones: IAutoMovieBoneBuffer | null): void;
}
