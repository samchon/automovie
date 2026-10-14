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
 * @evidence contracts/common.md#principled-implementation Reference synthesis converts the destination to the staged actor frame and sizes whole gait cycles from distance/speed; trips below half a nominal stride compress one cycle, then velocity times the baked duration supplies the requested travel displacement. Existing gait root bob/sway is added to that travel, and numeric action duration time-scales the result; this is neither measured foot contact nor guaranteed obstacle-free travel.
 * @evidence contracts/common.md#clear-and-simple-design A gait name, a destination and one facing switch are the whole travel; cadence, cycle count and root travel come from the actor's gait data, so no speed or path field is exposed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Full XYZ distance below 1e-6 metres steps in place; otherwise XZ distance below 1e-6 is refused as vertical-only. Unknown gaits are refused when vocabulary is supplied, relative goals are not guessed, and absent actor contexts can still yield null synthesis. Finite derived travel/cycle arithmetic is required by the baker, with no terrain or collision path solve in this verb.
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
