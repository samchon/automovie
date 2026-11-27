import type { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import type { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * Travel across the ground on one of the actor's own gaits.
 *
 * `gait` is matched by name against the gaits the actor's context supplies
 * ({@link IAutoMovieGait.name}), so the vocabulary is the actor's: the shipped
 * humanoid gaits are `walk`, `run`, `sprint`, `sneak` and `march`, the horse's
 * `walk`, `trot`, `gallop` and `rear`, the cat's `walk`, `leap` and `stalk`.
 * `performShot` refuses a gait the actor does not list when the host supplies
 * gait lists, and a destination that resolves but leaves an actor no horizontal
 * travel, since a gait cannot climb straight up.
 *
 * The reference synthesizer (AutoMovieEngineFilm.makeActorSynthesizer) carries
 * whole gait cycles
 * to the destination, including its height change, at the actor's ground speed.
 * A numeric `duration` time-scales that walk to the stated span, and `"auto"`
 * keeps the engine's sizing. A relative target, `direction` or `offscreen`, has
 * no point yet, so the actor steps in place; so does an actor already at the
 * destination. A node destination is read from the staged placement, or where a
 * previous beat left that node, not from its motion in this shot.
 */
export interface IAutoMovieLocomoteAction extends IAutoMovieActionBase {
  /** Selects locomotion as the action family. */
  verb: "locomote";

  /** Name of a gait the actor's context supplies, matched exactly. */
  gait: string;

  /**
   * Where to go. A formation-free node, bone, point or group destination is
   * walked to; a relative target steps in place.
   */
  to: IAutoMovieActionTarget;

  /**
   * Turn the body to face the travel direction. Omitted or `false`, the actor
   * keeps its facing and strafes or backpedals.
   */
  faceTravel?: boolean;
}
