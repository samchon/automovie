import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieImpactKind } from "./AutoMovieImpactKind";

/**
 * ResolveImpact's normal impulse advice: normalized a-to-b direction,
 * nonnegative closing speed, impulse delivered to b, both post-impact
 * velocities and a qualitative outcome. Separating-contact velocity values may
 * be borrowed inputs.
 */
export interface IAutoMovieImpact {
  /** Normalized world contact direction from a toward b. */
  normal: IAutoMovieVector3;

  /** Closing metres/second along the normal, zero for non-approaching bodies. */
  speed: number;

  /** World N-second impulse delivered to b; a receives its opposite. */
  impulse: IAutoMovieVector3;

  /**
   * Post-impact world metres/second for a; separating-contact output may borrow
   * its input vector.
   */
  velocityA: IAutoMovieVector3;

  /**
   * Post-impact world metres/second for b; separating-contact output may borrow
   * its input vector.
   */
  velocityB: IAutoMovieVector3;

  /**
   * Deterministic heuristic outcome rather than a full fracture/contact
   * simulation result.
   */
  kind: AutoMovieImpactKind;
}
