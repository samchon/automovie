import type { IAutoMovieConicArc } from "./IAutoMovieConicArc";
import type { IAutoMovieConicHermite } from "./IAutoMovieConicHermite";

/** Data and callback contracts shared by the ViewConic operations. */
export namespace IAutoMovieViewConic {
  /**
   * Native rational piece selected for one polar ray. The result preserves its
   * quarter, piece kind, quarter-local phase and evaluation angle in that
   * piece's own orientation.
   */
  export interface IRay extends IAutoMovieConicArc.IRay {
    /** Zero-based index of the originating quarter, from zero through three. */
    quarter: number;

    /**
     * Selected original quadratic, initial correction or final reflected
     * correction.
     */
    kind: "conic" | "start" | "end";

    /** Polar radians in the original quarter, increasing from its first guide. */
    angle: number;

    /**
     * Polar radians from the selected orientation's starting guide. A reflected
     * end reads distance from the original quarter's final guide.
     */
    distance: number;
  }

  /**
   * Original rational conic quarter and its endpoint guide corrections. The
   * adjacent positive extents are in chart millimetres. The dimensionless
   * shoulder controls the quadratic; a correction occupies only its prepared
   * endpoint support.
   */
  export interface IQuarter<T = number> {
    /**
     * Two positive support half-extents in chart millimetres, in quarter
     * start/end order.
     */
    extents: readonly [T, T];

    /**
     * Dimensionless source shoulder between zero and one for the quarter's
     * rational quadratic.
     */
    shoulder: T;

    /**
     * Initial guide's admitted G2 correction, or null when the original
     * quadratic extends to the guide.
     */
    start: IAutoMovieConicHermite.IPatch<T> | null;

    /**
     * Final guide's reflected G2 correction, or null when the original
     * quadratic extends to the guide.
     */
    end: IAutoMovieConicHermite.IPatch<T> | null;

    /**
     * Native quadratic partition parameters added by create for observations.
     * Geometry-only preparation leaves this array empty.
     */
    parameters: readonly number[];

    /**
     * Radial second derivatives at both cardinal guides in millimetres per
     * squared radian. First radial derivatives are zero there.
     */
    guides: readonly [T, T];

    /**
     * Shared geometric guide curvatures in inverse millimetres, in quarter
     * start/end order. A branch selected at a tie carries its own scalar
     * derivatives.
     */
    curvatures: readonly [T, T];
  }

  /**
   * Prepared four-quarter conic source. Success retains its cyclic quarters.
   * Failure carries the violated premise with an empty quarter array.
   */
  export interface ICurve<T = number> {
    /** Prepared quarters in cyclic cardinal order, empty on a failure. */
    quarters: readonly IAutoMovieViewConic.IQuarter<T>[];

    /**
     * Original preparation premise and numeric diagnostic, or null when the
     * source was admitted.
     */
    failure: string | null;
  }
}
