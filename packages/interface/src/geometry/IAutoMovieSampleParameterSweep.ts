import type { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";

/** Fixed Cartesian quadrature footprint and live placement readers. */
export namespace IAutoMovieSampleParameterSweep {
  /**
   * Fixed local quadrature footprint and live frame and scale access for a
   * parameter-correspondence sample writer.
   *
   * U-dependent scale is applied inside the trapezoidal average. Signed
   * coordinates are normalized for the sum, preserving a genuinely cancelling
   * origin. The writer validates all components before publication.
   */
  export type IProps = {
    /**
     * Compiled rest sweep whose unscaled shape returns chart metre X and Y.
     * Registration samples and retains the needed shape coordinates.
     */
    surface: IAutoMovieSweepSurface;
    /**
     * Central normalized spine coordinate. Offset quadrature stations are
     * clamped to [0, 1].
     */
    u: number;
    /**
     * Central curve parameter in turns. The shape evaluator wraps around the
     * section seam.
     */
    v: number;
    /**
     * Finite nonnegative spacings below and above u, then below and above v.
     * Samples are at half-spacing offsets, with a zero pair taking the centre
     * only.
     */
    cell: readonly [number, number, number, number];
    /**
     * Scalar offset into the live frame buffer, addressing metre origin XYZ
     * followed by the first and second axis vectors.
     */
    frame: number;
    /**
     * Register each sampled spine coordinate and return its stable integer
     * scale slot.
     */
    scale: (u: number) => number;
    /**
     * Read the current positive finite dimensionless scale for a previously
     * registered slot. Invalid sampled products refuse before output writes.
     */
    readScale: (slot: number) => number;
    /**
     * Return the rig's current borrowed frame array. The writer obtains it anew
     * before applying the centre frame.
     */
    frames: () => Float64Array;
  };
}
