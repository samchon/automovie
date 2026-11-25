import type { IAutoMovieInteractionEvent } from "../cinematics/IAutoMovieInteractionEvent";
import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieReactAction } from "../harness/IAutoMovieReactAction";

/**
 * What `compileLaunch` yields for one `launch` action: the projectile's baked
 * flight, the solved impact, and the reaction and events that impact schedules.
 * `compileLaunch` returns null instead when no flight reaches the target at the
 * action's speed.
 *
 * `performShot` shifts the clip onto the shot clock, refuses a launch landing
 * after the shot ends, and folds `react` into the action list so the recoil
 * passes the same synthesis and range-of-motion gate as an authored `react`.
 */
export interface IAutoMovieLaunchResult {
  /**
   * The projectile node's baked flight clip, id `trajectory:<projectile>`, with
   * translation and aim rotation keys on a launch-local clock from 0 to
   * {@link hitTime}; `performShot` shifts it by the action's `start` and
   * suffixes the id of a second or later flight of the same projectile.
   */
  clip: IAutoMovieClip;

  /**
   * The target's recoil, scheduled at the computed contact: a synthetic
   * {@link IAutoMovieReactAction} to fold into the action list, or null when the
   * launch carries no `onHit` or aims at a point or group with no single node
   * to recoil. Its `start` is the shot-local instant the projectile lands, and
   * its `from` point sits one metre upstream of the impact along the incoming
   * velocity, so the reference synthesizer recoils the body along the
   * projectile's travel, for a lobbed or a flat flight alike.
   */
  react: IAutoMovieReactAction | null;

  /**
   * Seconds from the launch to impact; the shot-local hit is `action.start +
   * hitTime`.
   */
  hitTime: number;

  /**
   * World point of impact in metres, where the solved flight lands. Against a
   * target faster than the projectile it is the closest lead found, not the
   * target's own position.
   */
  hitPoint: IAutoMovieVector3;

  /** Solved launch velocity in metres per second, of magnitude `action.speed`. */
  velocity: IAutoMovieVector3;

  /**
   * Interaction events at the shot-local hit time: always a `contact`, plus a
   * `hit` when the aim names a target node, plus a `fall` when the reaction
   * declares `unbalance`.
   */
  events: IAutoMovieInteractionEvent[];
}
