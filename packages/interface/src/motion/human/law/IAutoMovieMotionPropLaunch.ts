import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
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

  /** Use a sphere of this radius about its prop-local centre, in metres. Its rotation stays fixed in flight. */
  sphere?: {
    /** The finite positive collider radius, metres. */
    readonly radius: number;
    /** The centre relative to the displayed prop origin, local metres. */
    readonly centre: IAutoMovieVector3;
    /** Optional nonnegative Coulomb friction for this launch's contacts. Absent, use the body data. */
    readonly tangentialFriction?: number;
  };

  /** Aim from the displayed release to this world point over positive flight seconds, before any impact. A sphere aims its centre. Requires drag-free flight. */
  aim?: { readonly point: IAutoMovieVector3; readonly seconds: number };

  /** The launcher's hands that meet an incoming prop at this launch (a deliberate deflection): the incoming flight's sweep leaves them to this launch through its action, as a staged catch's hands are left to it. None when absent. */
  touching?: readonly AutoMovieHumanSide[];
}
