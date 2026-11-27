import { HumanReaction as HumanReactionSource } from "../reaction/internal/HumanReaction";
import { ReactionSource as ReactionSourceSource } from "../reaction/internal/ReactionSource";
import { flinch as flinchLaw } from "../reaction/internal/flinch";
import { give as giveLaw } from "../reaction/internal/give";

/**
 * The small involuntary reactions that share one size-and-time model: an
 * intensity share of a small displacement that peaks within a fraction of a
 * second and returns. The flinch peaks at 0.2 s and is back by 0.6 s; the give
 * peaks at 0.12 s, holds 0.15 s and is back 0.45 s later; intensity scales the
 * size and not the time.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `flinch`: A flinch: the protective startle away from a sudden threat or a
 *   blow, the head and trunk pulled away from it, the shoulders raised and the
 *   hands brought up before the face, then a return to what the body held.
 * - `give`: Giving way to a contact: the head turned aside by a slap, or the
 *   trunk carried by a hand that pushes or pulls, then a return to what the
 *   body held.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanReaction`: What a person reacts to without being touched: a gunshot's
 *   or a cannon's report reaches a listener when its sound has crossed the
 *   distance between them, so a startle synced to it begins that much after the
 *   shot.
 * - `ReactionSource`: Where the blow a reaction answers comes from: a person's
 *   region read where that person is at the second, not where the performer saw
 *   them a reaction time earlier (`HumanPerception.REACTION`).
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanReaction} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanReaction {
  /**
   * A flinch: the protective startle away from a sudden threat or a blow, the
   * head and trunk pulled away from it, the shoulders raised and the hands
   * brought up before the face, then a return to what the body held.
   *
   * The startle pattern (Landis and Hunt 1939, The Startle Pattern; Brown et
   * al. 1991, Brain 114:1891) starts with the eye blink at 30 to 50 ms, the
   * head at about 60 ms and the arms near 100 ms, peaks within about 0.2 s and
   * fades over a few tenths of a second, so the flinch reaches its peak at 0.2
   * s and returns by 0.6 s. Its size grows with `intensity`: the body above the
   * hips leans lightly away from the threat (a quarter of the reach's lean
   * limit) and the hips shift away by 1.8 % of the stature, so the head moves
   * by the trunk's height above the hips times the lean's sine plus the shift;
   * the neck ducks lightly, the hands close into fists and rise to cover the
   * face (provisional sizes, no located kinematic amplitude). The lean pivots
   * at the hips and the feet stay planted. Every part leaves what the entry
   * held and returns to it, so a flinch out of quiet standing ends in quiet
   * standing. The threat is a target (the incoming weapon's region, a prop, a
   * point), read at the start.
   *
   * The action is rows over the posture it was entered in: one phrase with no
   * preparation, whose attack is the rise and whose retraction the return, and
   * a sway of the root and the trunk, a head, two hand and two arm primitives
   * that all rise to the `stroke` instant and fall to the end on the clock's
   * envelope. A guard or a defence may cancel it from the peak on, a stagger or
   * a knockdown at any time.
   */
  export import flinch = flinchLaw;

  /**
   * Giving way to a contact: the head turned aside by a slap, or the trunk
   * carried by a hand that pushes or pulls, then a return to what the body
   * held. It is the receiver's part of a stage slap, a grab or a light push
   * that does not cost the feet their place; a push that does is `stagger`. A
   * leg giving way to a low kick is not a give: use `stagger` or a short
   * `step`.
   *
   * The contact comes from a target (the striking hand, the grabbing arm), read
   * one look before the start. The head turns about the neck to the side away
   * from it, by `TURN` at full intensity with a slight tilt the same way; the
   * trunk leans from the hips and shifts away from it, or toward it when it
   * pulls. The movement starts at the action's start, peaks after `RISE` and
   * returns over `RETURN`. Sync the action's start to the contact of the action
   * it answers.
   *
   * It rides whatever base the body is on (standing, seated) and claims the
   * head, or the root and the trunk; the feet and the arms stay as they were.
   *
   * Every size and time is provisional: the research located no study of a
   * slapped head's rotation, and the stage-combat convention (the receiver
   * turns the head with the hand's passage) gives the direction only.
   */
  export import give = giveLaw;

  /**
   * What a person reacts to without being touched: a gunshot's or a cannon's
   * report reaches a listener when its sound has crossed the distance between
   * them, so a startle synced to it begins that much after the shot.
   *
   * The delay is the distance over the speed of sound of the engine's one air
   * (`AutoMovieEngineAir.SOUND`, the ICAO Standard Atmosphere at sea level). The
   * report is a cue instant, not a hit: it delivers no impulse, and the
   * reaction's own latency is the sync's to add (`latency: "reaction"`).
   */
  export import HumanReaction = HumanReactionSource;

  /**
   * Where the blow a reaction answers comes from: a person's region read where
   * that person is at the second, not where the performer saw them a reaction
   * time earlier (`HumanPerception.REACTION`).
   *
   * A reaction is the delay itself. Its start is synced to the stimulus (the
   * contact of a slap, a shove or a grab, a blow's arrival) and its own curve
   * holds its latency (a startle's head at 60 ms), so the stimulus is read
   * where it is then. Read through the perceived aim, a shove's palm was taken
   * from where it had been 0.29 s before the contact, still on its way out from
   * the pusher's side, and the receiver of a shove on the sternum was sent 0.13
   * m sideways and 61 mm back instead of 0.20 m straight back.
   */
  export import ReactionSource = ReactionSourceSource;
}
