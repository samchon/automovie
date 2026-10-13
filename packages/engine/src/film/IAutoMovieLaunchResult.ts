import {
  IAutoMovieClip,
  IAutoMovieInteractionEvent,
  IAutoMovieReactAction,
  IAutoMovieVector3,
} from "@automovie/interface";

/** What compiling a `launch` yields: the flight, and the hit it schedules. */
export interface IAutoMovieLaunchResult {
  /** The projectile node's baked flight clip (translation + aim rotation). */
  clip: IAutoMovieClip;

  /**
   * The target's recoil, scheduled at the **computed** contact: a synthetic
   * {@link IAutoMovieReactAction} to fold into the action list, or `null` when
   * the launch carried no `onHit` (or aimed at a point/group with no single
   * actor to recoil). Its `start` is the shot-local instant the projectile
   * lands, and its `from` sits upstream along the arrow's incoming velocity, so
   * the reference synthesiser recoils the body **along the shot's travel** (an
   * arrow flying `+x` knocks the target `+x`), lobbed or flat.
   */
  react: IAutoMovieReactAction | null;

  /**
   * Seconds from the launch to impact (shot-local hit = `action.start +
   * hitTime`).
   */
  hitTime: number;

  /** World point of impact (where the solved flight lands). */
  hitPoint: IAutoMovieVector3;

  /** The solved launch velocity (magnitude = `action.speed`). */
  velocity: IAutoMovieVector3;

  /** Engine-visible contact/hit/fall events on the shot-local clock. */
  events: IAutoMovieInteractionEvent[];
}
