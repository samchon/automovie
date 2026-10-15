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
   */
  frame(u: number): number;

  /**
   * Register a scale factor.
   *
   * @param u Along the spine
   * @returns The slot: the factor is `scales[slot]`
   */
  scale(u: number): number;

  /**
   * Register a probe of the surface's normal and spine derivative, as `IAutoMovieSweepSurface.normal` and `along` compute them.
   *
   * @param u Along the spine
   * @param v Around it
   * @returns The slot: the unit normal is `probes[6 slot ...]` and the derivative along the spine the next three numbers
   */
  probe(u: number, v: number): number;

  /**
   * Register a surface point and make its writer.
   *
   * With a spacing, the point's radius is averaged over its cell by a three-by-three tent of weights `1/4, 1/2, 1/4` reaching half the spacing along `u` (clamped to the spine) and `v`, an average of radii rather than positions so a round section keeps its size; with zero spacing the point is the section point itself, as `IAutoMovieSweepSurface.point` places it. Shapes are read now; the writer scales and places them in the current frame.
   *
   * @param u Along the spine
   * @param v Around it
   * @param du Cell spacing along the spine, or 0
   * @param dv Cell spacing around it, or 0
   * @returns The writer, three numbers in metres at an offset
   */
  sample(u: number, v: number, du: number, dv: number): (out: Float64Array, at: number) => void;

  /** Size the arrays and fill them at rest. */
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
   */
  pose(bones: IAutoMovieBoneBuffer | null): void;
}
