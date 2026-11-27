import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";
import type { AutoMovieBernsteinGrid64 } from "./AutoMovieBernsteinGrid64";

/** Data and callback contracts shared by the LocalHermiteField64 operations. */
export namespace IAutoMovieLocalHermiteField64 {
  /**
   * Exact analytic cell; rows run along station t, columns along normalized
   * phase u.
   */
  export type Cell = {
    /** First normalized course phase. */
    u0: number;
    /** Last normalized course phase, strictly greater than u0. */
    u1: number;
    /** Millimetre bicubic coefficient rows, station first and course second. */
    grid: AutoMovieBernsteinGrid64;
  };

  /**
   * Millimetre position and full partials per normalized phase and physical
   * station mm.
   */
  export type Jet = {
    /** Source curve position in millimetres. */
    position: AutoMovieVector3Tuple;
    /** Derivative per normalized course phase, millimetres. */
    coursePartial: AutoMovieVector3Tuple;
    /** Derivative per physical station millimetre. */
    stationPartial: AutoMovieVector3Tuple;
  };

  /**
   * Admitted field closures. Inputs must stay immutable until the caller
   * releases this object; only partitions and derivative weights are retained
   * in addition to inputs.
   */
  export type Prepared = {
    /** Increasing local phase cells for one admitted physical station interval. */
    interval: (index: number) => IAutoMovieLocalHermiteField64.Cell[];
    /**
     * Authoritative saved-course value and right-sided partials; u=1 uses the
     * left span.
     */
    station: (index: number, u: number) => IAutoMovieLocalHermiteField64.Jet;
  };
}
