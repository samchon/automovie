import type { AutoMovieVector2Tuple } from "../geometry/AutoMovieVector2Tuple";
import type { IAutoMovieConstructionKnownPort } from "./IAutoMovieConstructionKnownPort";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * Actual original field and chart-map owners of a known port.
 *
 * The immutable invocation owns these functions before either side is lofted.
 * Maps read original field-chart coordinates, with their actual parameter
 * units; their input order is (original clock, normalized transverse), while
 * the returned kernel surface uses (transverse, clock) and transposed total2.
 * world fields use kernel millimetres. A null map total2 stays unavailable.
 * Runtime evaluators preserve foreign callback/getter exceptions unchanged.
 */
export interface IAutoMovieConstructionKnownPortSource {
  /** Closed original-port declaration, immutable during consumption. */
  definition: IAutoMovieConstructionKnownPort;

  /**
   * Actual original neighboring fields, not completed-loft contact
   * reconstructions.
   */
  fields: ReadonlyMap<string, IAutoMovieSolidSurface>;

  /** Actual maps into those field charts, covering the whole declared rectangle. */
  maps: ReadonlyMap<string, IAutoMovieConstructionKnownPortSource.IMap>;
}

/**
 * Pullback maps from the authored port rectangle into original neighboring
 * charts.
 */
export namespace IAutoMovieConstructionKnownPortSource {
  /**
   * Complete total2 of the actual map from band clock u and normalized
   * transverse v.
   *
   * Each tuple component keeps the corresponding target field-chart unit;
   * derivative orders divide those units by the indicated source variables.
   * KnownPort reads these arrays without modifying or retaining the jet
   * record.
   */
  export interface IJet {
    /** Actual field-chart point. */
    p: AutoMovieVector2Tuple;

    /** First derivative per band tangential-clock unit. */
    u: AutoMovieVector2Tuple;

    /** First derivative per normalized band transverse unit. */
    v: AutoMovieVector2Tuple;

    /** Second derivative per squared original tangential-clock unit. */
    uu: AutoMovieVector2Tuple;

    /** Mixed derivative per original-clock unit and normalized transverse unit. */
    uv: AutoMovieVector2Tuple;

    /** Second derivative per squared normalized transverse unit. */
    vv: AutoMovieVector2Tuple;
  }

  /**
   * One original source-chart correspondence over the full band rectangle.
   *
   * KnownPort retains the map by reference. Keep its callbacks, domains and
   * dependencies immutable for the prepared surface's lifetime. Both methods
   * receive `(original clock, normalized transverse)` and return the target
   * field's chart coordinates or their derivatives; callback throws propagate.
   */
  export interface IMap {
    /** Actual tangential-clock domain in the same units as definition.domain. */
    domain: readonly [number, number];

    /**
     * Actual normalized transverse domain, containing the entire interval
     * [0,1].
     */
    transverse: readonly [number, number];

    /**
     * Target field-chart point at clock u and transverse v in [0,1],
     * independent of derivative availability. The consumer checks finite
     * components and the target field's declared u domain; it does not modify
     * the returned tuple.
     */
    point(u: number, v: number): AutoMovieVector2Tuple;

    /**
     * Complete derivatives of this map at clock u and transverse v, or null
     * where unavailable. KnownPort turns null into an admission exception for a
     * jet query; a point query remains independent. Foreign throws propagate.
     */
    jet(
      u: number,
      v: number,
    ): IAutoMovieConstructionKnownPortSource.IJet | null;
  }
}
