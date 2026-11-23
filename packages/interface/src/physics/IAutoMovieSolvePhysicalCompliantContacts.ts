import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Admitted soft-surface policies and measured per-side normal impulse
 * transfers.
 */
export namespace IAutoMovieSolvePhysicalCompliantContacts {
  /**
   * Admitted material and response policy associated with one native outer
   * collider.
   *
   * Compliance is m/N, damping seconds, friction a Coulomb coefficient and gain
   * a dimensionless explicit response multiplier. The native binding builds
   * this borrowed surface record; solvePhysicalCompliantContacts combines
   * material pairs and applies their response gains separately.
   * Material/profile admission owns finite nonnegative values and permitted
   * gains. Zero compliance alone does not initiate a soft pair; body identity
   * prevents duplicate same-owner soft response.
   */
  export interface ISurface {
    /** Scene owner; self-contact policy remains owned by the profile adapter. */
    body: string;

    /** Metres per newton, including any declared policy factor. */
    compliance: number;

    /** Dissipative time constant, seconds. */
    damping: number;

    /** Coulomb coefficient. */
    friction: number;

    /** Explicit post-solve impulse multiplier. */
    gain: number;
  }

  /**
   * One positive compliant-contact solve and the actual rounded transfer to
   * each body.
   *
   * Point is world metres, normal a world unit vector from handle to other,
   * impulse N s and signed separation metres at the supplied native instant.
   * solvePhysicalCompliantContacts emits a new record after applying rounded
   * impulses; recordPhysicalContact maps collider handles to scene endpoints
   * and merges the observation. impulse is the pre-gain solve while
   * appliedImpulse records transferred normal components, zero for a nondynamic
   * side. Handles identify the current world only and are not portable
   * checkpoint identities.
   */
  export interface IMeasurement {
    /** First outer collider. */
    handle: number;

    /** Second outer collider. */
    other: number;

    /** Local completed native-step second assigned by the simulation caller. */
    seconds: number;

    /** World application point in metres, in world metres. */
    point: IAutoMovieVector3;

    /** World unit normal pointing from the first outer collider to the second. */
    normal: IAutoMovieVector3;

    /** Normal impulse before explicit response gains, N s. */
    impulse: number;

    /**
     * Actual transferred normal impulse on each mapped side, after response
     * gain.
     */
    appliedImpulse: {
      /**
       * Normal impulse actually transferred to handle's dynamic parent in N s
       * after gain; zero without a dynamic parent.
       */
      a: number;

      /**
       * Normal impulse actually transferred to other's dynamic parent in N s
       * after its gain; may differ from a.
       */
      b: number;
    };

    /** Actual signed outer-surface separation, metres. */
    separation: number;
  }
}
