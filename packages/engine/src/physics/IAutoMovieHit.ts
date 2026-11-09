import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The first contact found by projectileSphereHit's piecewise straight-chord approximation: seconds since launch and a world-metre contact point. It is not a unitless segment parameter.
 *
 * @evidence contracts/development/design.md#principled-representation The hit reader converts a chord's segmentSphere parameter to its actual projectile-window seconds before constructing this record.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One time-and-point result is sufficient for the approximate first-hit consumer; chord stepping remains with the producer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This representation does not certify the exact curved trajectory's first hit or supply a contact normal; those are outside the sampled sphere test.
 * @evidence contracts/development/common.md#meaningful-documentation Members state launch-relative seconds and world metres, removing the former ambiguous time-or-parameter claim.
 */
export interface IAutoMovieHit {
  /** Seconds since launch at first detected chord contact. */
  time: number;

  /** Detected chord-contact point in world metres. */
  point: IAutoMovieVector3;
}
