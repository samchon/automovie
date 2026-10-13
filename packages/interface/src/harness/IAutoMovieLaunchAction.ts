import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";
import { IAutoMovieOnHitReaction } from "./IAutoMovieOnHitReaction";

/**
 * Loose a projectile at a target. The engine computes when it lands, so the
 * model never hand-times the target's reaction: it gives `onHit`, and the
 * engine schedules the struck node's recoil at the computed impact ("shoot him
 * off his horse" without knowing when the arrow arrives).
 *
 * `performShot` refuses a speed that is not finite and `> 0`, a projectile that
 * is not a staged scene node or is one of the launching actors, an aim that
 * does not resolve to a point or is the projectile itself, and an `onHit` aimed
 * at a camera. `compileLaunch` then solves the flat ballistic arc under Earth
 * gravity from the projectile's staged position, leading a `bone` aim through
 * the host's live resolver and a node aim whose actions include a `locomote`.
 * A flight that cannot reach the aim at `speed`, or lands after the shot ends,
 * is a `range` violation at `speed`. The baked flight spans the whole shot,
 * holding the projectile at its origin before `start` and at the landing after
 * it. The impact emits a `contact` event, a `hit` event when the aim names a
 * node, and a `fall` event when the reaction unbalances it. The reference
 * synthesizer gives the launching actor no motion, so
 * a throw or draw is a separate gesture.
 *
 * @evidence contracts/common.md#principled-implementation `compileLaunch` solves the closed-form ballistic aim at the given speed, or its fixed-point lead against a moving target, and samples the closed-form flight, so impact time and point are computed rather than authored.
 * @evidence contracts/common.md#clear-and-simple-design The projectile, aim, speed and optional reaction are the whole launch; gravity and arc are engine defaults, and the recoil is an ordinary `react` action injected into the performance rather than a launch-specific motion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unreachable or late flight is refused rather than trimmed or sped up, and the launching actor is not given an invented throw clip.
 * @evidence contracts/common.md#meaningful-documentation States the reactive-timing purpose, every refusal, where the flight starts and how it is solved and led, how the clip covers the shot, the events, and that the shooter does not move; members give the projectile requirement, aim kinds, the speed unit and bounds, and the reaction's effect.
 * @author Samchon
 */
export interface IAutoMovieLaunchAction extends IAutoMovieActionBase {
  /** Selects a projectile launch as the action family. */
  verb: "launch";

  /**
   * Staged scene node that flies, such as an arrow prop; its staged position is
   * the launch origin, and it may not be one of the launching actors.
   */
  projectile: string;

  /**
   * What the projectile is aimed at, a target that resolves to one point: a
   * node, a bone, a literal point, or a group without formations.
   */
  at: IAutoMovieActionTarget;

  /** Launch speed in metres per second, finite and `> 0`. */
  speed: number;

  /**
   * Recoil the engine schedules on the struck node at the computed impact.
   * Omitted, the flight and its events are baked without a reaction.
   */
  onHit?: IAutoMovieOnHitReaction;
}
