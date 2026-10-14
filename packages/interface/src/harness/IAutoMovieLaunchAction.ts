import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";
import { IAutoMovieOnHitReaction } from "./IAutoMovieOnHitReaction";

/**
 * Loose a projectile at a target. The engine computes when it lands, so the model never hand-times the target's reaction: it gives `onHit`, and the engine schedules the struck node's recoil at the computed impact ("shoot him off his horse" without knowing when the arrow arrives).
 *
 * performShot requires finite positive speed, a staged projectile distinct from its launching actors and a resolvable aim; a node aim cannot name that projectile, and onHit needs a single non-camera actor. compileLaunch uses the direct ballistic arc under Earth gravity from staged projectile position, optionally leading a live bone or a node with locomote actions. An unreachable aim or landing more than 1e-9 seconds after shot end produces a range finding at speed. Flight keys are shot-local: before start they write nothing, after landing they hold. The solve emits contact, hit for a node aim and fall for an unbalance reaction; these events do not establish actual geometry contact or falling motion. The launcher gets no reference motion, so a throw or draw needs a separate gesture.
 *
 * @evidence contracts/common.md#principled-implementation compileLaunch uses analytic constant-gravity aim and 30 Hz default trajectory sampling. Moving aim uses at most eight fixed-point iterations, accepting the best visited time residual or early convergence below 1e-6 seconds, so an emitted contact is a computed aim event rather than independent collision detection. Linear playback approximates the parabola between keys; extreme binary64 solve arithmetic and feasible trajectory counts remain limitations.
 * @evidence contracts/common.md#clear-and-simple-design The projectile, aim, speed and optional reaction are the whole launch; gravity and arc are engine defaults, and the recoil is an ordinary `react` action injected into the performance rather than a launch-specific motion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unreachable or more-than-1e-9-seconds-late flight is refused rather than trimmed; point/group onHit cannot be silently discarded and the launcher receives no invented throw. Sequence playback gives flight tracks no authority before start and holds their landing afterward; injected recoil is exempt from ordinary region-overlap refusal, and fall events do not prove falling motion.
 * @evidence contracts/common.md#meaningful-documentation States the reactive-timing purpose, every refusal, where the flight starts and how it is solved and led, how the clip covers the shot, the events, and that the shooter does not move; members give the projectile requirement, aim kinds, the speed unit and bounds, and the reaction's effect.
 * @author Samchon
 */
export interface IAutoMovieLaunchAction extends IAutoMovieActionBase {
  /** Selects a projectile launch as the action family. */
  verb: "launch";

  /**
   * Staged scene node that flies, such as an arrow prop; its staged position is the launch origin, and it may not be one of the launching actors.
   */
  projectile: string;

  /**
   * What the projectile is aimed at, a target that resolves to one point: a node, a bone, a literal point, or a group without formations.
   */
  at: IAutoMovieActionTarget;

  /** Launch speed in metres per second, finite and `> 0`. */
  speed: number;

  /**
   * Recoil the engine schedules on the struck node at the computed impact. Requires a node or bone aim identifying an actor, not a point, group or camera. Omitted, the flight and its events are baked without a reaction.
   */
  onHit?: IAutoMovieOnHitReaction;
}
