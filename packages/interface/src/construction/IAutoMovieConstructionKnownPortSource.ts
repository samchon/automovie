import type { AutoMovieVector2Tuple } from "../geometry/AutoMovieVector2Tuple";
import type { IAutoMovieConstructionKnownPort } from "./IAutoMovieConstructionKnownPort";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * Actual original field and chart-map owners of a known port.
 *
 * The immutable invocation owns these functions before either side is lofted.
 * Maps read original field-chart coordinates, with their actual parameter units;
 * their input order is (original clock, normalized transverse), while the
 * returned kernel surface uses (transverse, clock) and transposed total2.
 * world fields use kernel millimetres. A null map total2 stays unavailable.
 * Runtime evaluators preserve foreign callback/getter exceptions unchanged.
 *
 * @evidence contracts/development/design.md#principled-representation Both existing SolidSurface fields and exact chart maps supply the actual whole neighboring functions needed by composition's total2 chain rule. Map jets use original-clock u and normalized transverse v, before the prepared surface transposes those axes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Explicit lookup maps connect the pure closed band descriptor to actual generating owners without a second sampled representation. KnownPort consumes these maps with its original fields to differentiate their composition.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither a map key nor a matching rail position proves C2 or shared binding; supplied maps must differentiate their own actual point map on the full rectangle, and sources must be original owned fields. Map derivative availability is explicit and cannot be reconstructed from matching boundary positions.
 * @evidence contracts/development/common.md#meaningful-documentation States clock/chart/world units, immutable source lifetime and unavailable/exception behavior. Defines map argument order and the prepared-surface transposition.
 */
export interface IAutoMovieConstructionKnownPortSource {
  /** Closed original-port declaration, immutable during consumption. */
  definition: IAutoMovieConstructionKnownPort;

  /** Actual original neighboring fields, not completed-loft contact reconstructions. */
  fields: ReadonlyMap<string, IAutoMovieSolidSurface>;

  /** Actual maps into those field charts, covering the whole declared rectangle. */
  maps: ReadonlyMap<string, IAutoMovieConstructionKnownPortSource.IMap>;
}

/**
 * Pullback maps from the authored port rectangle into original neighboring charts.
 *
 */
export namespace IAutoMovieConstructionKnownPortSource {
  /**
   * Complete total2 of the actual map from band clock u and normalized transverse v.
   *
   * Each tuple component keeps the corresponding target field-chart unit;
   * derivative orders divide those units by the indicated source variables.
   * KnownPort reads these arrays without modifying or retaining the jet record.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States target-chart component units and the original-clock/transverse derivative variables.
   * @evidence contracts/development/design.md#principled-representation All six total-order-two terms are required for the exact two-variable chain rule.
   * @evidence contracts/development/design.md#minimal-and-owned-surface KnownPort.pullback consumes every term with the original field's surface jet.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts KnownPort checks two finite components per term; agreement with the actual map and validity throughout the rectangle remain source-owner obligations.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines argument order, target units, retained ownership and unavailable/throw behavior.
   * @evidence contracts/development/design.md#principled-representation Separate point and nullable total2 capabilities allow position queries without inventing derivatives.
   * @evidence contracts/development/design.md#minimal-and-owned-surface KnownPort checks rectangle coverage and evaluates both original maps in its interior blend.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Construction checks finite increasing coverage intervals and query data; it cannot prove that supplied derivatives differentiate point everywhere.
   */
  export interface IMap {
    /** Actual tangential-clock domain in the same units as definition.domain. */
    domain: readonly [number, number];

    /** Actual normalized transverse domain, containing the entire interval [0,1]. */
    transverse: readonly [number, number];

    /**
     * Target field-chart point at clock u and transverse v in [0,1], independent
     * of derivative availability. The consumer checks finite components and
     * the target field's declared u domain; it does not modify the returned tuple.
     */
    point(u: number, v: number): AutoMovieVector2Tuple;

    /**
     * Complete derivatives of this map at clock u and transverse v, or null
     * where unavailable. KnownPort turns null into an admission exception for
     * a jet query; a point query remains independent. Foreign throws propagate.
     */
    jet(
      u: number,
      v: number,
    ): IAutoMovieConstructionKnownPortSource.IJet | null;
  }
}
