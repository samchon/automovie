import {
  IAutoMovieClip,
  IAutoMovieInteractionEvent,
  IAutoMovieReactAction,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * What `compileLaunch` yields for one `launch` action: the projectile's baked
 * flight, the solved impact, and the reaction and events that impact
 * schedules. `compileLaunch` returns null instead when no flight reaches the
 * target at the action's speed.
 *
 * `performShot` shifts the clip onto the shot clock, refuses a launch landing
 * after the shot ends, and folds `react` into the action list so the recoil
 * passes the same synthesis and range-of-motion gate as an authored `react`.
 *
 * @evidence contracts/common.md#principled-implementation Impact time and velocity come from the closed-form ballistic solve, `solveBallisticLaunch` for a static target or `solveMovingLaunch` leading a moving one, and the hit point is `projectileAt` evaluated at that time, so the clip, the reaction and the events all share one computed contact rather than an authored guess. The moving-target lead is a fixed-point iteration capped at eight steps; for a target faster than the projectile it returns the closest lead found, so `hitPoint` is where the flight lands and can differ from where the target is at `hitTime`.
 * @evidence contracts/common.md#clear-and-simple-design Groups the flight clip, the optional reaction, the impact numbers and the events because `performShot` needs all of them from the same solve, and the numbers stay exposed so a caller can place the clip and check the landing against the shot length without re-solving.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reaction is withheld rather than invented when there is no `onHit` or no single target node, and when the incoming velocity is degenerate its direction falls back to the origin-to-impact line, a stated geometric fallback rather than a fixture value.
 * @evidence contracts/common.md#meaningful-documentation States the producer and its null case, what `performShot` does with each field, the clip's local clock, when `react` is null and where its source point sits, the units and clock of each number, and which events are emitted when.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; the solve and the flight sampling are answered on `compileLaunch` and `projectileTrajectory`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built once per launch action inside one performance; nothing caches launch results across shots.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns the clip, whose key count grows with flight time times the sample rate, plus at most three events; `performShot` keeps a time-shifted copy of the clip that still shares its value arrays, and copies of the events, then drops the result.
 * @author Samchon
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
   * {@link IAutoMovieReactAction} to fold into the action list, or null when
   * the launch carries no `onHit` or aims at a point or group with no single
   * node to recoil. Its `start` is the shot-local instant the projectile lands,
   * and its `from` point sits one metre upstream of the impact along the
   * incoming velocity, so the reference synthesizer recoils the body along the
   * projectile's travel, for a lobbed or a flat flight alike.
   */
  react: IAutoMovieReactAction | null;

  /**
   * Seconds from the launch to impact; the shot-local hit is
   * `action.start + hitTime`.
   */
  hitTime: number;

  /**
   * World point of impact in metres, where the solved flight lands. Against a
   * target faster than the projectile it is the closest lead found, not the
   * target's own position.
   */
  hitPoint: IAutoMovieVector3;

  /**
   * Solved launch velocity in metres per second, of magnitude `action.speed`.
   */
  velocity: IAutoMovieVector3;

  /**
   * Interaction events at the shot-local hit time: always a `contact`, plus a
   * `hit` when the aim names a target node, plus a `fall` when the reaction
   * declares `unbalance`.
   */
  events: IAutoMovieInteractionEvent[];
}
