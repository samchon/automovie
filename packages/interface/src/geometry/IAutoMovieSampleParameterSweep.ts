import type { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";

/**
 * Fixed Cartesian sampling footprint bound to a live sweep frame and scale
 * slots.
 */
export namespace IAutoMovieSampleParameterSweep {
  /**
   * Register a fixed-cell Cartesian section average for parameter
   * correspondence.
   *
   * Parameter correspondence pairs the curve parameter, so an off-axis, concave
   * section or an authored origin cannot be reconstructed from a polar radius.
   * The tensor trapezoid first averages the unscaled two-dimensional shape over
   * v, then its scaled points over u, in the centre frame just as the radial
   * writer does. The u-dependent scale belongs inside that second average.
   * Direction-correspondence radius averaging remains with rigSweep.
   *
   * Each signed coordinate is normalized by its largest magnitude before the
   * weighted sum. This avoids overflow in the sum and preserves an ordinary
   * positive subnormal constant. A genuine cancelling mean may be the origin;
   * only a nonzero normalized result lost in multiplication is refused. Scale
   * products, positive weights and world coordinates are admitted before output
   * publication. A rejected write leaves the caller's output buffer unchanged.
   */
  export type IProps = {
    /**
     * Compiled rest sweep whose unscaled section-plane shape returns metre
     * coordinates. Registration samples at most nine shape points and retains
     * their weighted values, rather than re-reading shapes per pose.
     */
    surface: IAutoMovieSweepSurface;
    /**
     * Center normalized chord-length coordinate. Offset quadrature stations
     * clamp into [0,1] before shape and scale registration.
     */
    u: number;
    /**
     * Center section parameter in turns; angular offsets are passed to the
     * compiled shape reader, which owns wrapping.
     */
    v: number;
    /**
     * Finite nonnegative sample spacings below/above u then below/above v, in
     * parameter units. Quadrature samples at minus half the lower spacing, the
     * center and plus half the upper spacing. A zero pair samples only its
     * center; unrepresentable span or positive weights throw during
     * registration.
     */
    cell: readonly [number, number, number, number];
    /**
     * Scalar offset into the live frame buffer, not a frame ordinal. Reads
     * origin XYZ then two section-axis XYZ vectors at offsets 0, 3 and 6;
     * origin uses model metres and axes are dimensionless.
     */
    frame: number;
    /**
     * Register a normalized u station and return its integer scale slot. Called
     * during compilation; the slot is retained for every later pose write.
     */
    scale: (u: number) => number;
    /**
     * Read the current dimensionless scale at a registered slot. Each write
     * requires positive finite scale and representable products; invalid values
     * throw before modifying output.
     */
    readScale: (slot: number) => number;
    /**
     * Return the current borrowed frame buffer after its owning rig has
     * updated. The writer reads the registered center frame and publishes three
     * finite metre coordinates; it does not retain an earlier returned buffer.
     */
    frames: () => Float64Array;
  };
}
