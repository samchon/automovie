import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieProjectile } from "../../../physics/IAutoMovieProjectile";

/**
 * A planned prop release at an action-local time in seconds, with world position in metres and world velocity in metres per second. Optional orientation and projectile attitude pass to performance flight evaluation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A planned prop release at an action-local time in seconds, with world position in metres and world velocity in metres per second. Optional orientation and projectile attitude pass to performance flight evaluation.
 * @evidence contracts/development/design.md#principled-representation seconds: Seconds from the action's start. point: World metres at launch: where the prop's own origin is. velocity: World metres per second at launch, any carrier's velocity included.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Throwing, releasing and carrier motion produce launches consumed by HumanPropFlight and prop sweeps; launch state is independent of the action that created it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The release clock remains action-local seconds, velocity includes carrier motion, and optional projectile attitude reuses IAutoMovieProjectile. Flight handling owns physical admission.
 */
export interface IAutoMovieMotionPropLaunch {
  /** The prop that flies: a held prop the hand lets go, or one the action sets on its way. */
  prop: string;

  /** Seconds from the action's start. */
  seconds: number;

  /** World metres at launch: where the prop's own origin is. */
  point: IAutoMovieVector3;

  /** World metres per second at launch, any carrier's velocity included. */
  velocity: IAutoMovieVector3;

  /** The prop's rotation at launch, prop to world; its displayed rotation then when absent. */
  rotation?: IAutoMovieQuaternion;

  /** How it turns in flight (`IAutoMovieProjectile.attitude`); its launch rotation kept when absent. */
  attitude?: IAutoMovieProjectile.Attitude;
}
