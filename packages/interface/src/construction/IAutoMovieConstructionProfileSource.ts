import type { AutoMovieVector2Tuple } from "../geometry/AutoMovieVector2Tuple";
import type { IAutoMovieConstructionProfile } from "./IAutoMovieConstructionProfile";
import type { IAutoMovieViewAxis } from "./IAutoMovieViewAxis";

/**
 * Actual original curve families in one owned physical plane, before lofting.
 *
 * Declaration station lengths use metres; original queries and plane axes use
 * kernel millimetres. Curve-clock units stay with their original owner. The
 * caller keeps declarations, functions and dependencies immutable while any
 * prepared reader remains alive; changed revisions require a new preparation.
 */
export interface IAutoMovieConstructionProfileSource {
  /** Complete pure source declaration; no final chain or mesh supplies it. */
  definition: IAutoMovieConstructionProfile;

  /** Actual axis and its same-station derivatives, keyed by definition.plane. */
  plane: {
    /**
     * Must equal definition.plane; Profile.create rejects a different owner
     * address.
     */
    id: string;

    /**
     * Borrowed physical-station frame owner, queried in millimetres;
     * point/phase need at, total2 additionally needs jet.
     */
    axis: IAutoMovieViewAxis.IAxis;
  };

  /** Immutable actual local functions keyed by the declaration's source fields. */
  curves: ReadonlyMap<string, IAutoMovieConstructionProfileSource.ICurve>;

  /**
   * Actual original region membership owners, needed only for declared trim
   * keys.
   */
  regions?: ReadonlyMap<string, IAutoMovieConstructionProfileSource.IRegion>;
}

/** Original local curve and region capabilities used by profile preparation. */
export namespace IAutoMovieConstructionProfileSource {
  /**
   * Actual nonrectangular logical/material selection without fitting its
   * boundary.
   *
   * The source map retains this owner for prepared contains queries. Its domain
   * must cover the region's authored active domain after conversion to
   * millimetres. Callback exceptions propagate; preparation checks coverage,
   * not the geometric truth of membership or interval boundaries.
   */
  export interface IRegion {
    /** Actual physical station ownership, kernel millimetres. */
    domain: readonly [number, number];

    /**
     * Membership of the same original field at its physical station and
     * original curve clock.
     */
    contains(station: number, clock: number): boolean;

    /**
     * Exact retained intervals in the original curve-clock units at station
     * millimetres. Absence or null leaves boundary extraction unavailable; an
     * empty array means no retained interval. Consumers must treat returned
     * arrays as borrowed readonly data. Profile preparation does not call this
     * optional capability or validate its ordering.
     */
    intervals?(station: number): readonly (readonly [number, number])[] | null;
  }

  /**
   * Same original value and qualified phase derivatives at a fixed physical
   * station.
   */
  export interface IPhase {
    /** Actual local point, kernel millimetres. */
    p: AutoMovieVector2Tuple;

    /** First derivative per original curve-clock unit. */
    t: AutoMovieVector2Tuple;

    /**
     * Second original-clock derivative; null explicitly leaves this order
     * unavailable.
     */
    tt: AutoMovieVector2Tuple | null;
  }

  /** Complete local physical-station/original-clock total-order-two reading. */
  export interface IJet {
    /** Local point, millimetres. */
    p: AutoMovieVector2Tuple;

    /** First derivative per physical station millimetre. */
    s: AutoMovieVector2Tuple;

    /** First derivative per original curve-clock unit. */
    t: AutoMovieVector2Tuple;

    /** Second derivative per station millimetre squared. */
    ss: AutoMovieVector2Tuple;

    /** Mixed derivative per station millimetre and original-clock unit. */
    st: AutoMovieVector2Tuple;

    /** Second derivative per original-clock unit squared. */
    tt: AutoMovieVector2Tuple;
  }

  /**
   * An immutable generating owner, not boundary Taylor coefficients or a fit.
   *
   * Prepared surfaces retain this curve and its dependencies by reference.
   * Point, phase and jet query the same local function at station millimetres
   * and its original clock. Keep all three and their domains unchanged while
   * readers exist. Foreign callback/getter exceptions propagate.
   */
  export interface ICurve {
    /** Actual physical station interval, kernel millimetres. */
    domain: readonly [number, number];

    /** Actual supported original-clock interval, in the original units. */
    clock: readonly [number, number];

    /**
     * Actual original-clock period when the same function and available
     * derivatives support periodic aliases; absent leaves a bounded open
     * chart.
     */
    period?: number;

    /**
     * Actual local point in millimetres at physical station millimetres and
     * original clock. It may remain available at a collapsed tip where jet is
     * null. Readers validate finite pairs and build their own world vectors.
     */
    point(station: number, clock: number): AutoMovieVector2Tuple;

    /**
     * Prepare actual local Point0 for multiple original clocks at one fixed
     * physical station.
     */
    pointAt?(station: number): (clock: number) => AutoMovieVector2Tuple;

    /**
     * Actual fixed-station phase reading at station millimetres and original
     * clock. An absent method falls back to this owner's jet; an implemented
     * method returning null is a refusal and does not fall back. A nonnull
     * reading may still have tt=null. Readers do not mutate its arrays.
     */
    phase?(
      station: number,
      clock: number,
    ): IAutoMovieConstructionProfileSource.IPhase | null;

    /**
     * Complete local total2 at station millimetres and original clock, or null
     * where unavailable. A prepared surface jet request converts null into an
     * admission exception and requires a complete plane jet too. Consumers read
     * the returned arrays without mutation or long-term retention.
     */
    jet(
      station: number,
      clock: number,
    ): IAutoMovieConstructionProfileSource.IJet | null;

    /**
     * Prepare the actual physical total2 for multiple original clocks at one
     * fixed station.
     */
    jetAt?(
      station: number,
    ): (clock: number) => IAutoMovieConstructionProfileSource.IJet | null;
  }
}
