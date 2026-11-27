import type { IAutoMovieBoneBuffer } from "./IAutoMovieBoneBuffer";
import type { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";

/**
 * One sweep of a surface rig, from `rigSweep`: the frames, scale
 * factors and surface normals a cage reads from it, at parameters registered
 * once and refreshed per pose in place.
 *
 * Registration (`frame`, `scale`, `probe`, `sample`) runs while a cage is
 * planned and returns slot indices; `seal` then sizes the arrays and fills them
 * at rest. `pose` refreshes them for the current bone motions, or at rest for
 * `null`.
 */
export interface IAutoMovieSweepRig {
  /**
   * The sweep compiled at rest; its shape before the scale profile is the shape
   * in every pose.
   */
  surface: IAutoMovieSweepSurface;

  /**
   * Register a section plane.
   *
   * @param u Along the spine
   * @returns The slot: the plane is `frames[12 slot ...]`, origin, first axis,
   *   second axis, normal
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
   * Register a normal and spine derivative of the same geometric writer as
   * sample, with one fixed cell at all four finite-difference points. Omitted
   * or zero, the cell preserves the raw surface meaning; a nonzero cell
   * differentiates that local averaged field, not a spatial interpolation of
   * varying footprint sizes.
   *
   * @param u Along the spine
   * @param v Around it
   * @param cell Fixed below/above reaches along u and v, finite and
   *   nonnegative; omitted, all zero
   * @returns The slot: the unit normal is `probes[6 slot ...]` and the
   *   derivative along the spine the next three numbers
   * @throws Error if the rig is sealed or any cell reach is negative or
   *   nonfinite
   */
  probe(
    u: number,
    v: number,
    cell?: readonly [number, number, number, number],
  ): number;

  /**
   * Register a surface point and make its writer.
   *
   * The point is averaged over its cell, which reaches half the spacing to the
   * neighbouring sample on each side along `u` (clamped to the spine) and `v`,
   * by the trapezoid rule on the cell's two halves: weights `b / (2 (b + a))`,
   * `1/2` and `a / (2 (b + a))` at the lower end, the point and the upper end
   * for halves `b` below and `a` above, which is `1/4, 1/2, 1/4` on an even
   * grid. Direction correspondence averages radii about the authored direction,
   * so a round section keeps its size. Parameter correspondence averages the
   * actual Cartesian section points, with each u-dependent scale inside the
   * average; it preserves an off-origin curve and permits a legitimately
   * cancelling origin. Signed means and products that cannot be represented are
   * refused. A cell of zero extent is the section point itself, as
   * `IAutoMovieSweepSurface.point` places it. Shapes are read now; the writer
   * scales and places them in the current frame.
   *
   * @param u Along the spine
   * @param v Around it
   * @param cell Spacing to the neighbouring sample below and above along `u`,
   *   then below and above along `v`
   * @returns The writer, three numbers in metres at an offset
   */
  sample(
    u: number,
    v: number,
    cell: readonly [number, number, number, number],
  ): (out: Float64Array, at: number) => void;

  /** Size the arrays and fill them at rest. */
  seal(): void;

  /**
   * Multiply every scale slot by a fixed factor of its `u`, at rest and in
   * every pose from now on, the radial correction a surface network solves to
   * hold a measured girth. Each call replaces the previous factor, and the rest
   * slots and probes are refreshed after every factor, scale product and probe
   * is admitted. A rejected factor, product or probe leaves the previous scales
   * and probes in place.
   *
   * @param factor The factor at a spine parameter, positive and finite
   * @throws Error when called before `seal`, or the factor or its resulting
   *   scale is not positive and finite at a slot, or a probe is not
   *   representable
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
   */
  pose(bones: IAutoMovieBoneBuffer | null): void;
}
