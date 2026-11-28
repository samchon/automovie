import type { IAutoMovieBoneBuffer } from "./IAutoMovieBoneBuffer";
import type { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";

/**
 * Live compiled sweep used by cage readers through frame, scale and probe
 * slots.
 */
export interface IAutoMovieSweepRig {
  /** Compiled rest sweep whose unscaled section shape supplies all pose samples. */
  surface: IAutoMovieSweepSurface;

  /**
   * Register a normalized spine coordinate and return its deduplicated
   * section-frame ordinal.
   *
   * @param u Normalized spine coordinate, clamped to [0, 1].
   * @returns Frame slot whose first scalar is at 12 times the slot.
   */
  frame(u: number): number;

  /**
   * Register a normalized spine coordinate and return its deduplicated scale
   * ordinal.
   *
   * @param u Normalized spine coordinate, clamped to [0, 1].
   * @returns Scale slot in the current scale array.
   */
  scale(u: number): number;

  /**
   * Register a unit normal and spine derivative using four finite-difference
   * point writers with one shared footprint.
   *
   * A zero footprint differentiates the raw surface. A nonzero footprint
   * differentiates the same fixed average at all four finite-difference sites.
   *
   * @param u Normalized spine coordinate.
   * @param v Section direction or curve parameter in turns.
   * @param cell Finite nonnegative lower and upper spacings for u then v.
   *   Omission uses zero spacings.
   * @returns Probe slot addressing six consecutive scalars.
   */
  probe(
    u: number,
    v: number,
    cell?: readonly [number, number, number, number],
  ): number;

  /**
   * Register a surface point or fixed-cell average and return a writer for
   * three model-metre coordinates.
   *
   * Direction correspondence averages metre radii at the authored angle.
   * Parameter correspondence averages signed chart coordinates under the live
   * station scales. Zero spacing writes the unaveraged point.
   *
   * @param u Normalized spine coordinate.
   * @param v Section direction or curve parameter in turns.
   * @param cell Finite nonnegative sample spacings below and above u then below
   *   and above v.
   * @returns Writer taking a borrowed numeric destination and scalar offset.
   */
  sample(
    u: number,
    v: number,
    cell: readonly [number, number, number, number],
  ): (out: Float64Array, at: number) => void;

  /**
   * Complete registration, size the live arrays and initialize their rest
   * values.
   */
  seal(): void;

  /**
   * Replace the radial correction profile after sealing. Factors, resulting
   * scales and dependent probes must pass admission before the rig publishes
   * the new state.
   *
   * @param factor Positive finite dimensionless radial multiplier at each
   *   registered spine coordinate.
   * @throws Error before seal or when a new factor, scaled value or probe
   *   cannot be admitted.
   */
  girth(factor: (u: number) => number): void;

  /**
   * Current packed frame data with twelve scalars per slot, in origin,
   * first-axis, second-axis and normal order.
   */
  frames: Float64Array;

  /** Current positive dimensionless scales, one per registered slot. */
  scales: Float64Array;

  /**
   * Six scalars per probe, first unit normal XYZ and then the derivative along
   * the normalized spine parameter.
   */
  probes: Float64Array;

  /**
   * Refresh geometric slots from the current pose buffer, or use the rest sweep
   * when passed null.
   *
   * @param bones Compiled current bone motions, or null to apply rest geometry.
   */
  pose(bones: IAutoMovieBoneBuffer | null): void;
}
