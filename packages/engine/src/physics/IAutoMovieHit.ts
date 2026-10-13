import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The first contact found by projectileSphereHit's piecewise straight-chord approximation: seconds since launch and a world-metre contact point. It is not a unitless segment parameter.
 *
 * @evidence contracts/common.md#principled-implementation The hit reader converts a chord's segmentSphere parameter to its actual projectile-window seconds before constructing this record.
 * @evidence contracts/common.md#clear-and-simple-design One time-and-point result is sufficient for the approximate first-hit consumer; chord stepping remains with the producer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This representation does not certify the exact curved trajectory's first hit or supply a contact normal; those are outside the sampled sphere test.
 * @evidence contracts/common.md#meaningful-documentation Members state launch-relative seconds and world metres, removing the former ambiguous time-or-parameter claim.
 * @evidence contracts/performance.md#efficient-algorithms The record is constant-size with no algorithm; projectileSphereHit's step count controls detection work and accuracy.
 * @evidence contracts/performance.md#reuse-equivalent-work The producer's detected contact point/time are reused directly instead of re-evaluating the projectile on the curved path.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the hit and point; no trajectory history, collision handle or simulation task remains.
 * @author Samchon
 */
export interface IAutoMovieHit {
  /** Seconds since launch at first detected chord contact. */
  time: number;

  /** Detected chord-contact point in world metres. */
  point: IAutoMovieVector3;
}
