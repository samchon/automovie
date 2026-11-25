import type { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import type { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";
import type { IAutoMovieOnHitReaction } from "./IAutoMovieOnHitReaction";

/**
 * Loose a projectile at a target. The engine computes when it lands, so the
 * model never hand-times the target's reaction: it gives `onHit`, and the
 * engine schedules the struck node's recoil at the computed impact ("shoot him
 * off his horse" without knowing when the arrow arrives).
 *
 * PerformShot requires finite positive speed, a staged projectile distinct from
 * its launching actors and a resolvable aim; a node aim cannot name that
 * projectile, and onHit needs a single non-camera actor. compileLaunch uses the
 * direct ballistic arc under Earth gravity from staged projectile position,
 * optionally leading a live bone or a node with locomote actions. An
 * unreachable aim or landing more than 1e-9 seconds after shot end produces a
 * range finding at speed. Flight keys are shot-local: before start they write
 * nothing, after landing they hold. The solve emits contact, hit for a node aim
 * and fall for an unbalance reaction; these events do not establish actual
 * geometry contact or falling motion. The launcher gets no reference motion, so
 * a throw or draw needs a separate gesture.
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
   * Requires a node or bone aim identifying an actor, not a point, group or
   * camera. Omitted, the flight and its events are baked without a reaction.
   */
  onHit?: IAutoMovieOnHitReaction;
}
