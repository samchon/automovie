import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * An interval for the world-axis projection of one articulated point relative
 * to another.
 *
 * AdmitPhysicalPointBounds requires at least one finite interval end, ordered
 * ends when both exist, a unit axis within 1e-6, a contiguous actuator chain
 * and an existing reference carrier. It permits at most 256 bounds in a call
 * and 1 through 32 updates per bound. The source/reference points are local
 * metres; minimum, maximum and tolerance are metres after projection into the
 * explicit world axis. An omitted end leaves that side unbounded. The fitter
 * emits motor intent and retains unreachable residuals.
 */
export interface IAutoMoviePhysicalPointBound {
  /**
   * Unique relationship id within the sampled target, shared with collider
   * bindings.
   */ id: string;
  /** Contiguous proximal-to-distal actuator chain ending at source.bone. */ chain: string[];
  /** Candidate source point in its bone's local metre frame. */ source: {
    /** Existing source segment at the end of the actuator chain. */
    bone: string;

    /** Point relative to that bone origin, metres. */
    localPoint: IAutoMovieVector3;
  };
  /**
   * Same-body references follow the candidate; external references use the
   * simultaneous actual snapshot. A shape selects its support point along axis
   * on every evaluation, including shape offsets and rotation. Select exactly
   * one of localPoint and shape.
   */ reference: {
    /** Existing body identity in the simultaneous profile registry. */
    body: string;

    /** Existing carrier in that body's profile. */
    bone: string;
  } & (
    | {
        /** Fixed point in the reference bone's local metre frame. */
        localPoint: IAutoMovieVector3;

        /** A fixed point excludes a collider support selection. */
        shape?: never;
      }
    | {
        /**
         * Collider whose current support point along axis supplies the
         * reference.
         */
        shape: string;

        /** A collider support selection excludes a fixed local point. */
        localPoint?: never;
      }
  );
  /** Explicit world-space unit projection direction. */ axis: IAutoMovieVector3;
  /** Inclusive lower projection, metres; at least one bound must be present. */ minimum?: number;
  /** Inclusive upper projection, metres. */ maximum?: number;
  /** Positive bounded geometric updates, at most 32. */ iterations: number;
  /**
   * Positive metre residual early-out; an unreachable interval retains its
   * measured error.
   */ tolerance: number;
}
