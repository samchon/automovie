import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Borrowed finite world launch state: origin in metres, initial velocity in metres/second and constant acceleration in metres/second squared. Projectile readers evaluate the same ballistic state without mutating it.
 *
 * @evidence contracts/common.md#principled-implementation The three vectors supply the closed-form constant-acceleration law p(t)=origin+velocity*t+gravity*t*t/2 used by projectileAt and trajectory/hit readers.
 * @evidence contracts/common.md#clear-and-simple-design One launch-state record is sufficient for analytic sampling; it stores no redundant per-frame trajectory or integrator state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Acceleration is constant and may be arbitrary finite direction, not necessarily -Y gravity; drag, homing and collision response are outside this representation.
 * @evidence contracts/common.md#meaningful-documentation Members state world units, finite-vector premise and constant acceleration rather than an implicit terrestrial-gravity default.
 * @evidence contracts/performance.md#efficient-algorithms The type has constant-size storage and no algorithm; projectileAt evaluates one time in constant work while trajectory/hit sampling scales with caller step count.
 * @evidence contracts/performance.md#reuse-equivalent-work The same immutable-by-contract launch vectors are reused at each sampled time instead of accumulating stepwise integration error or copying launch state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns launch vectors for the sampling lifetime; the type retains no trajectory history, native physics world or running task.
 */
export interface IAutoMovieProjectile {
  /** Borrowed finite world launch position in metres. */
  origin: IAutoMovieVector3;

  /** Borrowed finite initial world velocity in metres/second. */
  velocity: IAutoMovieVector3;

  /** Borrowed finite constant world acceleration in metres/second squared; -Y terrestrial gravity is a caller choice. */
  gravity: IAutoMovieVector3;
}
