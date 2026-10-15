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
 * @author Samchon
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
   * Register a probe of the surface's normal and spine derivative, as `IAutoMovieSweepSurface.normal` and `along` compute them.
   *
   * @param u Along the spine
   * @param v Around it
   * @returns The slot: the unit normal is `probes[6 slot ...]` and the derivative along the spine the next three numbers
   *
   * @evidence contracts/common.md#principled-implementation Registers the central-difference normal and spine derivative at a point.
   * @evidence contracts/common.md#clear-and-simple-design Returns the slot index.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The difference step is the surface's own.
   * @evidence contracts/common.md#meaningful-documentation States the slot layout.
   * @evidence contracts/performance.md#efficient-algorithms Four shape reads at registration.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `rigAutoMovieSweep`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `rigAutoMovieSweep`.
   */
  probe(u: number, v: number): number;

  /**
   * Register a surface point and make its writer.
   *
   * The point's radius is averaged over its cell, which reaches half the spacing to the neighbouring sample on each side along `u` (clamped to the spine) and `v`, by the trapezoid rule on the cell's two halves: weights `b / (2 (b + a))`, `1/2` and `a / (2 (b + a))` at the lower end, the point and the upper end for halves `b` below and `a` above, which is `1/4, 1/2, 1/4` on an even grid. It averages radii rather than positions, so a round section keeps its size. A cell of zero extent is the section point itself, as `IAutoMovieSweepSurface.point` places it. Shapes are read now; the writer scales and places them in the current frame.
   *
   * @param u Along the spine
   * @param v Around it
   * @param cell Spacing to the neighbouring sample below and above along `u`, then below and above along `v`
   * @returns The writer, three numbers in metres at an offset
   *
   * @evidence contracts/common.md#principled-implementation The trapezoid average of radius over the point's cell.
   * @evidence contracts/common.md#clear-and-simple-design Shapes read now, scale and frame per pose.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Radii, not positions, are averaged.
   * @evidence contracts/common.md#meaningful-documentation States the weights and the zero cell.
   * @evidence contracts/performance.md#efficient-algorithms Up to nine shape reads at registration, three terms per pose.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `rigAutoMovieSweep`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `rigAutoMovieSweep`.
   */
  sample(u: number, v: number, cell: readonly [number, number, number, number]): (out: Float64Array, at: number) => void;

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
