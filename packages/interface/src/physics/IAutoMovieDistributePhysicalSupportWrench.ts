import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieWorldWrench } from "./IAutoMovieWorldWrench";

/** Bounded allocation of a world wrench over measured horizontal floor contacts. */
export namespace IAutoMovieDistributePhysicalSupportWrench {
  /**
   * Allocate a requested floating-base wrench at actual floor points.
   * Unilateral normal forces and the inscribed |fx|+|fz|<=mu*fy pyramid imply
   * Coulomb friction even for diagonal demand. Moments use each actual lever,
   * including yaw. Caron et al. 2015, Eqs.2–7, distinguish these conditions
   * from CoP alone. This bounded virtual-model allocation is not full inverse
   * dynamics: native constraints and motor caps still determine the actual
   * response. Returned wrench residuals expose infeasible demand rather than
   * inventing support.
   */
  export type IInput = IAutoMovieWorldWrench & {
    /** Finite world application point of the requested root wrench, metres. */ origin: IAutoMovieVector3;
    /**
     * Finite nonnegative cap on total upward normal force, newtons; zero
     * returns no allocations.
     */ maximumForce: number;
    /** Actual contact points; at most 1024, with nonnegative combined friction. */ points: readonly {
      /** Carrier bone identity, copied into the corresponding allocation row. */
      bone: string;
      /**
       * Finite world application point in metres; retained by reference in the
       * output row.
       */
      point: IAutoMovieVector3;
      /** Finite nonnegative coefficient mu for |fx| + |fz| <= mu * fy. */
      friction: number;
    }[];
  };

  /**
   * Allocate a requested floating-base wrench at actual floor points.
   * Unilateral normal forces and the inscribed |fx|+|fz|<=mu*fy pyramid imply
   * Coulomb friction even for diagonal demand. Moments use each actual lever,
   * including yaw. Caron et al. 2015, Eqs.2–7, distinguish these conditions
   * from CoP alone. This bounded virtual-model allocation is not full inverse
   * dynamics: native constraints and motor caps still determine the actual
   * response. Returned wrench residuals expose infeasible demand rather than
   * inventing support.
   */
  export type IResult = IAutoMovieWorldWrench & {
    /** New rows in input order, or empty for no contacts/zero envelope. */
    forces: {
      /** Original contact carrier bone. */
      bone: string;
      /** Borrowed world contact point in metres. */
      point: IAutoMovieVector3;
      /**
       * New allocated world force in newtons, after friction/normal-cap
       * projection.
       */
      force: IAutoMovieVector3;
      /** Original dimensionless contact friction coefficient. */
      friction: number;
    }[];
    /** Requested minus allocated wrench; nonzero components expose unmet demand. */
    residual: IAutoMovieWorldWrench;
  };
}
