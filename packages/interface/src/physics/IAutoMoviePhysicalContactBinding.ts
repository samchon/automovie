import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A collider relationship fitted as articulated motor intent.
 *
 * AdmitPhysicalContactBindings resolves both colliders, checks a contiguous
 * actuator chain, finite weights and compression, and a nonzero receiver normal
 * when supplied. It rejects duplicate relationship identities and incompatible
 * same-bone contacts. Contact compression is bounded by both materials'
 * soft-layer allowance; separation requires zero. Simultaneous fitting retains
 * residual error when geometry or actuator limits prevent satisfying the
 * request.
 */
export interface IAutoMoviePhysicalContactBinding {
  /** Stable authoring relationship identity within this target. */
  id: string;
  /** Contact approaches a surface; separate only removes penetrating intent. */
  kind: "contact" | "separate";
  /** Proximal-to-distal actuator chain ending at the source bone. */
  chain: string[];
  /** Source collider on this body. */
  source: {
    /** Segment bone owning the source collider. */
    bone: string;

    /** Collider identity within that segment. */
    shape: string;
  };
  /** Receiver collider, read in its actual current world placement. */
  target: {
    /** Existing body identity in the simultaneous simulation input. */
    body: string;

    /** Segment bone owning the receiver collider. */
    bone: string;

    /** Collider identity within the receiver segment. */
    shape: string;

    /**
     * Optional nonzero bone-local outward direction selecting a receiver
     * surface; absent leaves the surface unconstrained. Allowed only for
     * contact.
     */
    normal?: IAutoMovieVector3;
  };
  /** Blend of the authored path toward this relationship, in [0,1]. */
  weight: number;
  /**
   * Intended soft-layer penetration, metres, bounded by both materials' total
   * compression allowance. Separate requires zero.
   */
  compression: number;
  /** Positive bounded updates in the simultaneous geometric solve, at most 32. */
  iterations: number;
  /** Positive metre residual early-out; unreachable requests remain residuals. */
  tolerance: number;
}
