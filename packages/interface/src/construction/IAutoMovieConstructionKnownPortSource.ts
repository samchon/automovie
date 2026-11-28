import type { AutoMovieVector2Tuple } from "../geometry/AutoMovieVector2Tuple";
import type { IAutoMovieConstructionKnownPort } from "./IAutoMovieConstructionKnownPort";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * Actual field and map implementations supplied with a known-port declaration.
 * Map queries take original clock then normalized transverse position. Returned
 * components use the neighboring chart's units. Preserve these owners while the
 * band reads them.
 */
export interface IAutoMovieConstructionKnownPortSource {
  /**
   * Pure declaration naming the band and its two sides. The prepared band
   * copies it.
   */
  definition: IAutoMovieConstructionKnownPort;

  /** Original neighboring surfaces keyed by the declaration's field references. */
  fields: ReadonlyMap<string, IAutoMovieSolidSurface>;

  /**
   * Original correspondences keyed by the declaration's map references. Each
   * side covers the full band rectangle.
   */
  maps: ReadonlyMap<string, IAutoMovieConstructionKnownPortSource.IMap>;
}

/**
 * Pullback maps from the authored port rectangle into original neighboring
 * charts.
 */
export namespace IAutoMovieConstructionKnownPortSource {
  /**
   * Complete derivatives of a chart map with respect to original band clock u
   * and normalized transverse v. Each component retains the matching target
   * field-chart unit, divided by the indicated source coordinate for
   * derivatives.
   */
  export interface IJet {
    /** Target field-chart point in its actual two coordinate units. */
    p: AutoMovieVector2Tuple;

    /** First derivative of both target coordinates per original band-clock unit. */
    u: AutoMovieVector2Tuple;

    /**
     * First derivative of both target coordinates per normalized transverse
     * unit.
     */
    v: AutoMovieVector2Tuple;

    /** Second derivative in the original band clock, per squared clock unit. */
    uu: AutoMovieVector2Tuple;

    /** Mixed derivative in original clock and normalized transverse coordinates. */
    uv: AutoMovieVector2Tuple;

    /** Second derivative per squared normalized transverse unit. */
    vv: AutoMovieVector2Tuple;
  }

  /**
   * Actual coordinate correspondence into a neighboring field over the complete
   * source rectangle. Both queries take original clock and normalized
   * transverse coordinate. Keep the domains and callbacks unchanged during
   * reuse. Point reads can remain available when complete derivatives are
   * unavailable.
   */
  export interface IMap {
    /**
     * Supported tangential interval in the same clock units as the band
     * declaration.
     */
    domain: readonly [number, number];

    /** Supported interval of normalized transverse input, containing [0, 1]. */
    transverse: readonly [number, number];

    /**
     * Read the target chart point at original clock u and normalized transverse
     * v. The target chart defines both returned component units.
     */
    point(u: number, v: number): AutoMovieVector2Tuple;

    /**
     * Read all chart-map partials at original clock u and normalized transverse
     * v. Null causes a complete derivative query to fail. Callback exceptions
     * propagate.
     */
    jet(
      u: number,
      v: number,
    ): IAutoMovieConstructionKnownPortSource.IJet | null;
  }
}
