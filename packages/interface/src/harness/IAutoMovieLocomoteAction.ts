import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * Travel across the ground on one of the actor's own gaits.
 *
 * `gait` is matched by name against the gaits the actor's context supplies
 * ({@link IAutoMovieGait.name}), so the vocabulary is the actor's: the shipped
 * humanoid gaits are `walk`, `run`, `sprint`, `sneak` and `march`, the horse's
 * `walk`, `trot`, `gallop` and `rear`, the cat's `walk`, `leap` and `stalk`.
 * `performShot` refuses a gait the actor does not list when the host supplies
 * gait lists, and a destination that resolves but leaves an actor no
 * horizontal travel, since a gait cannot climb straight up.
 *
 * The reference synthesizer (`makeActorSynthesizer`) carries whole gait cycles
 * to the destination, including its height change, at the actor's ground
 * speed. A numeric `duration` time-scales that walk to the stated span, and
 * `"auto"` keeps the engine's sizing. A relative target, `direction` or
 * `offscreen`, has no point yet, so the actor steps in place; so does an actor
 * already at the destination. A node destination is read from the staged
 * placement, or where a previous beat left that node, not from its motion in
 * this shot.
 *
 * @evidence contracts/common.md#principled-implementation `locomoteMotion` rounds the distance to whole gait cycles at the requested speed and bakes the velocity that arrives exactly, with the destination dropped into the actor's model frame so a turned actor walks to the world point.
 * @evidence contracts/common.md#clear-and-simple-design A gait name, a destination and one facing switch are the whole travel; cadence, cycle count and root travel come from the actor's gait data, so no speed or path field is exposed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A vertical-only destination is refused instead of being treated as already reached, an unknown gait is refused when the vocabulary is known, and a relative target is not turned into a guessed point.
 * @evidence contracts/common.md#meaningful-documentation States the gait vocabulary with the shipped names, both refusals, how travel and duration are realized, the step-in-place cases, and where a node destination is read; members give the gait match, destination kinds and the facing default.
 * @author Samchon
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
