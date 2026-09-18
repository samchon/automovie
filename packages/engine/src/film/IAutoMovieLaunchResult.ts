import { IAutoMovieClip, IAutoMovieInteractionEvent, IAutoMovieReactAction, IAutoMovieVector3 } from "@automovie/interface";

/**
 * What compiling a `launch` yields: the flight, and the hit it schedules.
 *
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-authored-simulated-trajectory Returns the analytically solved velocity and baked projectile clip beside the computed hit outputs while leaving the authored launch action unchanged.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#rigid-trajectory-tier-contract Exposes one realized analytic-trajectory result whose sampled flight and impact facts share the same solver output.
 */
export interface IAutoMovieLaunchResult {
  /**
   * The projectile node's baked flight clip (translation + aim rotation).
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-authored-simulated-trajectory Carries the deterministic translation and aim-rotation samples baked from the engine's analytic launch solution.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#rigid-trajectory-tier-contract Materializes the realized analytic trajectory as the projectile node's builder-ready motion clip.
   */
  clip: IAutoMovieClip;

  /**
   * The target's recoil, scheduled at the **computed** contact: a synthetic
   * {@link IAutoMovieReactAction} to fold into the action list, or `null` when
   * the launch carried no `onHit` (or aimed at a point/group with no single
   * actor to recoil). Its `start` is the shot-local instant the projectile
   * lands, and its `from` sits upstream along the arrow's incoming velocity, so
   * the reference synthesiser recoils the body **along the shot's travel** (an
   * arrow flying `+x` knocks the target `+x`), lobbed or flat.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Carries the optional target recoil scheduled at the computed impact time and incoming direction.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output IAutoMovieLaunchResult.react realizes observable world-contact output: The target's recoil, scheduled at the **computed** contact: a synthetic {@link IAutoMovieReactAction} to fold into the action list, or `null` when the launch carried no `onHit` (or aimed at a point/group with no single actor to recoil). Its `start` is the shot-local instant the projectile lands, and its `from` sits upstream along the arrow's incoming velocity, so the reference synthesiser recoils the body **along the shot's travel** (an arrow flying `+x` knocks the target `+x`), lobbed or flat.
   */
  react: IAutoMovieReactAction | null;

  /**
   * Seconds from the launch to impact (shot-local hit = `action.start +
   * hitTime`).
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence IAutoMovieLaunchResult.hitTime makes impact consequences observable: Seconds from the launch to impact (shot-local hit = `action.start + hitTime`).
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output IAutoMovieLaunchResult.hitTime realizes observable world-contact output: Seconds from the launch to impact (shot-local hit = `action.start + hitTime`).
   */
  hitTime: number;

  /**
   * World point of impact (where the solved flight lands).
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence IAutoMovieLaunchResult.hitPoint makes impact consequences observable: World point of impact (where the solved flight lands).
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output IAutoMovieLaunchResult.hitPoint realizes observable world-contact output: World point of impact (where the solved flight lands).
   */
  hitPoint: IAutoMovieVector3;

  /**
   * The solved launch velocity (magnitude = `action.speed`).
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-authored-simulated-trajectory Exposes the engine-solved initial velocity, with magnitude fixed by the authored `action.speed`, that generated the returned flight.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#rigid-trajectory-tier-contract Identifies the analytic-tier velocity shared by trajectory sampling and impact computation.
   */
  velocity: IAutoMovieVector3;

  /**
   * Engine-visible contact/hit/fall events on the shot-local clock.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence IAutoMovieLaunchResult.events makes impact consequences observable: Engine-visible contact/hit/fall events on the shot-local clock.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output IAutoMovieLaunchResult.events realizes observable world-contact output: Engine-visible contact/hit/fall events on the shot-local clock.
   */
  events: IAutoMovieInteractionEvent[];
}
