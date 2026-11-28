import type { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";
import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/** Input and output for radial section-plane inversion of a direction sweep. */
export namespace IAutoMovieLocateSweepPoint {
  /**
   * Finite model-space point and compiled direction-correspondence sweep
   * supplied for section-plane inversion.
   *
   * The solver samples 128 plane intervals and bisects detected sign changes 48
   * times. Tangential roots or several roots within one interval can escape
   * detection.
   */
  export type IProps = {
    /**
     * Compiled sweep under direction correspondence, including the default when
     * omitted. Explicit parameter correspondence is refused.
     */
    surface: IAutoMovieSweepSurface;

    /**
     * Finite position in the sweep's model frame in metres. Use coordinates for
     * which plane projections and radial evaluation remain representable.
     */
    point: IAutoMovieVector3;
  };

  /**
   * Selected normalized spine coordinate, polar turn and signed metre radial
   * residual.
   */
  export type IResult = {
    /**
     * Selected normalized chord coordinate in [0, 1]. It can be an end-plane
     * fallback when the sampled search detects no crossing.
     */
    u: number;

    /**
     * Polar turn in [0, 1), measured from the first section axis toward the
     * second.
     */
    v: number;

    /**
     * In-plane radial distance minus the compiled surface radius at the
     * selected address, in metres. Positive means outside the radial profile.
     *
     * The offset is measured in the selected slice plane. An end-plane fallback
     * can project a point lying outside the sweep's sampled span.
     */
    offset: number;
  };
}
