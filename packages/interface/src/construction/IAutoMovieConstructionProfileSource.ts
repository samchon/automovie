import type { AutoMovieVector2Tuple } from "../geometry/AutoMovieVector2Tuple";
import type { IAutoMovieConstructionProfile } from "./IAutoMovieConstructionProfile";
import type { IAutoMovieViewAxis } from "./IAutoMovieViewAxis";

/**
 * Invocation-owned local curve functions and their common section frame. The
 * pure definition records station lengths in metres. The live frame and curve
 * readers take physical station in kernel millimetres and keep each curve's own
 * clock. Preserve dependencies while prepared readers use them.
 */
export interface IAutoMovieConstructionProfileSource {
  /** Complete pure profile declaration for these live source functions. */
  definition: IAutoMovieConstructionProfile;

  /**
   * Actual section frame owner keyed by definition.plane. Point and phase reads
   * use its frame value; complete surface derivatives also need its
   * physical-station jet.
   */
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

  /** Original curve functions indexed by the declared piece source keys. */
  curves: ReadonlyMap<string, IAutoMovieConstructionProfileSource.ICurve>;

  /** Optional map of original membership functions for referenced trim keys. */
  regions?: ReadonlyMap<string, IAutoMovieConstructionProfileSource.IRegion>;
}

/** Original local curve and region capabilities used by profile preparation. */
export namespace IAutoMovieConstructionProfileSource {
  /**
   * Original membership field for a trimmed region. Its physical station domain
   * in millimetres must cover the region's authored interval after conversion.
   * Keep the callbacks unchanged while prepared readers use them.
   */
  export interface IRegion {
    /**
     * Supported physical station bounds of this membership owner, in kernel
     * millimetres.
     */
    domain: readonly [number, number];

    /**
     * Test original region membership using station in kernel millimetres and
     * the source curve's own clock. Callback exceptions propagate.
     */
    contains(station: number, clock: number): boolean;

    /**
     * Read retained intervals in original curve-clock units at a
     * kernel-millimetre station. Null or an absent method leaves interval
     * extraction unavailable. An empty array means no retained intervals.
     * Borrow the returned arrays for reading.
     */
    intervals?(station: number): readonly (readonly [number, number])[] | null;
  }

  /**
   * Original local point and phase derivatives at one fixed physical station.
   * The curve's clock determines derivative units. A null second derivative
   * leaves value and first derivative available.
   */
  export interface IPhase {
    /** Actual local [u, v] point in kernel millimetres. */
    p: AutoMovieVector2Tuple;

    /** First local derivative in millimetres per original curve-clock unit. */
    t: AutoMovieVector2Tuple;

    /**
     * Second local derivative in millimetres per squared original clock unit,
     * or null when unavailable.
     */
    tt: AutoMovieVector2Tuple | null;
  }

  /**
   * Complete local derivatives through total order two in physical station and
   * original curve clock. The point uses chart millimetres and physical station
   * uses kernel millimetres.
   */
  export interface IJet {
    /** Local [u, v] point in millimetres. */
    p: AutoMovieVector2Tuple;

    /** First local partial in millimetres per millimetre of station. */
    s: AutoMovieVector2Tuple;

    /** First local partial in millimetres per original clock unit. */
    t: AutoMovieVector2Tuple;

    /** Second local partial in inverse millimetres of physical station. */
    ss: AutoMovieVector2Tuple;

    /**
     * Mixed local partial, in inverse original-clock units after one station
     * and one clock derivative.
     */
    st: AutoMovieVector2Tuple;

    /** Second local partial in millimetres per squared original clock unit. */
    tt: AutoMovieVector2Tuple;
  }

  /**
   * Live original local curve at station in kernel millimetres and its own
   * clock. Preserve it and its declared domains while prepared readers retain
   * it. Point, phase and complete derivatives follow the same underlying
   * geometry.
   */
  export interface ICurve {
    /** Original physical station bounds in kernel millimetres. */
    domain: readonly [number, number];

    /** Supported original parameter interval in the curve's own units. */
    clock: readonly [number, number];

    /**
     * Original clock period when the same source supports periodic aliases.
     * Omission leaves its original clock bounded.
     */
    period?: number;

    /**
     * Read the actual local point in millimetres at the requested physical
     * millimetre station and original clock. A collapsed tip can still supply a
     * point.
     */
    point(station: number, clock: number): AutoMovieVector2Tuple;

    /**
     * Read local phase derivatives at the same station and clock. Omission uses
     * jet. An implemented callback returning null refuses this read. A
     * successful result can carry null second phase derivative.
     */
    phase?(
      station: number,
      clock: number,
    ): IAutoMovieConstructionProfileSource.IPhase | null;

    /**
     * Read all local partials in physical millimetre station and original curve
     * clock. Null leaves complete derivatives unavailable. A surface jet
     * additionally needs the frame's station derivatives.
     */
    jet(
      station: number,
      clock: number,
    ): IAutoMovieConstructionProfileSource.IJet | null;
  }
}
