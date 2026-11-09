import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Borrowed finite world launch state: origin in metres, initial velocity in metres/second and constant acceleration in metres/second squared. Projectile readers evaluate the same ballistic state without mutating it.
 *
 * @evidence contracts/development/design.md#principled-representation The three vectors supply the closed-form constant-acceleration law p(t)=origin+velocity*t+gravity*t*t/2 used by projectileAt and trajectory/hit readers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One launch-state record is sufficient for analytic sampling; it stores no redundant per-frame trajectory or integrator state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Acceleration is constant and may be arbitrary finite direction, not necessarily -Y gravity; drag, homing and collision response are outside this representation.
 * @evidence contracts/development/common.md#meaningful-documentation Members state world units, finite-vector premise and constant acceleration rather than an implicit terrestrial-gravity default.
 */
export interface IAutoMovieProjectile {
  /** Borrowed finite world launch position in metres. */
  origin: IAutoMovieVector3;

  /** Borrowed finite initial world velocity in metres/second. */
  velocity: IAutoMovieVector3;

  /** Borrowed finite constant world acceleration in metres/second squared; -Y terrestrial gravity is a caller choice. */
  gravity: IAutoMovieVector3;
}
