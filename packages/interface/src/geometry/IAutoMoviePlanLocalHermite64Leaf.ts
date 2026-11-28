import type { IAutoMovieLocalHermiteField64 } from "./IAutoMovieLocalHermiteField64";

/**
 * Retained adaptive restriction of one physical Hermite interval. Inherited
 * u0/u1 refer to normalized course phase; the inherited grid contains
 * restricted millimetre Bernstein coefficients, with rows along station and
 * columns along u.
 */
export type IAutoMoviePlanLocalHermite64Leaf =
  IAutoMovieLocalHermiteField64.Cell &
    IAutoMoviePlanLocalHermite64Leaf.IRestriction;

/** Named supplemental values of the prepared record. */
export namespace IAutoMoviePlanLocalHermite64Leaf {
  /** Longitudinal bounds and bound measurement of one restricted cell. */
  export type IRestriction = {
    /**
     * Lower normalized longitudinal coordinate in [0,1]; physical station is
     * stations[j] + t0*(stations[j+1]-stations[j]).
     */
    t0: number;

    /**
     * Upper normalized longitudinal coordinate, strictly greater than t0 and at
     * most 1.
     */
    t1: number;

    /**
     * Muu/8 + Mut/4 + Mtt/8 from this restricted grid's derivative-control
     * norms, in millimetres. Retained leaves meet toleranceMm; zero is a
     * pending-work placeholder before evaluation.
     */
    error: number;

    /**
     * Name of the original common-partition cell, formed from run name,
     * interval index and root-cell index; descendants share it while bounds
     * distinguish their regions.
     */
    patch: string;
  };
}
