import { HumanDefence as HumanDefenceSource } from "../lexicon/HumanDefence";
import { DefenceOutcome as DefenceOutcomeSource } from "../striking/DefenceOutcome";
import { defend as defendLaw } from "../striking/internal/defend";
import { guard as guardLaw } from "../striking/internal/guard";
import { HUMAN_DEFENCE_CHECK_KICK } from "./presets/HUMAN_DEFENCE_CHECK_KICK";
import { HUMAN_DEFENCE_COVER } from "./presets/HUMAN_DEFENCE_COVER";
import { HUMAN_DEFENCE_ELBOW_BLOCK } from "./presets/HUMAN_DEFENCE_ELBOW_BLOCK";
import { HUMAN_DEFENCE_HAND_PARRY } from "./presets/HUMAN_DEFENCE_HAND_PARRY";
import { HUMAN_DEFENCE_HIGH_BLOCK } from "./presets/HUMAN_DEFENCE_HIGH_BLOCK";
import { HUMAN_DEFENCE_ROLL_UNDER } from "./presets/HUMAN_DEFENCE_ROLL_UNDER";
import { HUMAN_DEFENCE_SLIP } from "./presets/HUMAN_DEFENCE_SLIP";
import { HUMAN_DEFENCE_SWAY_BACK } from "./presets/HUMAN_DEFENCE_SWAY_BACK";

/**
 * Defending against a strike: blocking, parrying and the guard.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `defend`: A defence against one placed strike: a glove, forearm or shin
 *   brought to where the incoming weapon will be, or the head moved off its
 *   line.
 * - `guard`: The fighting stance taken and held: from whatever the performer
 *   stands in, each foot steps to its stance place in turn, cleared from the
 *   floor before it travels and pointed in the air (the rear foot first, so the
 *   lead foot stays a support), the root sinks until both knees soften and
 *   turns to the stance heading, and the gloves come up to the guard, then the
 *   stance holds with a light bounce through the knees.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `CHECK_KICK`: The checkKick preset: a kick checked with the raised shin.
 * - `COVER`: The cover preset: both forearms brought up to cover the head.
 * - `ELBOW_BLOCK`: The elbowBlock preset: a body strike taken on the elbow.
 * - `HAND_PARRY`: The handParry preset: the incoming fist deflected by the hand.
 * - `HIGH_BLOCK`: The highBlock preset: a high strike taken on the raised
 *   forearm.
 * - `ROLL_UNDER`: The rollUnder preset: the body rolled under a hook.
 * - `SLIP`: The slip preset: the head moved off the line of a straight punch.
 * - `SWAY_BACK`: The swayBack preset: the trunk swayed back from a strike.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `DefenceOutcome`: Whether a defence is in time, late or fails against one
 *   strike, decided from the two performers' timing before any geometry, and
 *   how a forced outcome is realised with plausible human timing.
 * - `HumanDefence`: The defences as rows on the grammar: each named defence is a
 *   row of `defend`, the law that owns the defender's role and the outcome
 *   shared with the strike it answers, and the brace a row of `brace`, a base
 *   adaptation.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanDefence} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanDefence {
  /**
   * A defence against one placed strike: a glove, forearm or shin brought to
   * where the incoming weapon will be, or the head moved off its line.
   *
   * When the defence starts comes from the defence outcome law
   * ({@link DefenceOutcome}): the defender reacts to the strike's launch after a
   * seeded reaction time, earlier by the anticipation lead the strike's
   * preparation allows (its telegraph), and the author may force the outcome
   * (in time, late or fail), which the law realises with plausible timing.
   * Where it goes comes from what the defender sees at that start: the
   * attacker's moving limb (the hand or foot whose velocity points most toward
   * the struck region) and the line from it to the region on the defender's own
   * body. Nothing about contact is decided here: the strike stops on the first
   * surface it meets, so an in-time cover is struck on the glove, a late one is
   * struck through, and a slip that moved the head off the line in time is
   * missed (the strike's tracking cannot follow a move that starts within one
   * correction latency of its contact).
   *
   * Kinds (IBA coaching manual pp. 57 to 67; kickboxing research, defence
   * table):
   *
   * - `cover`: the glove on the attacked side over the attacked head region, palm
   *   toward the incoming line, elbow down (both gloves for a central region).
   * - `parry`: the glove opposite the punching hand meets the fist on the line a
   *   forearm's length ahead of the region and turns it aside.
   * - `elbowBlock`: the elbow on the attacked side dropped over the attacked body
   *   region, the glove kept at the jaw.
   * - `highBlock`: the forearm on the attacked side braced beside the head, the
   *   glove above the temple.
   * - `slip`: the head moved off the line by its own radius, the fist's and a
   *   margin, through the knees and a trunk lean, outside the punching arm.
   * - `roll`: the head dropped under the line by two head radii through bent
   *   knees and a forward lean, then up.
   * - `sway`: the upper body leaned back over the rear foot until the head clears
   *   the line.
   * - `check`: the leg on the attacked side lifted, knee up and out, shin turned
   *   into the kick, the foot dorsiflexed (the toes-up variant).
   *
   * The defence holds until just after the strike's contact and returns to the
   * guard over one hand recovery. The geometry itself is built by
   * {@link defendGeometry} on the first posture after the read.
   */
  export import defend = defendLaw;

  /**
   * The fighting stance taken and held: from whatever the performer stands in,
   * each foot steps to its stance place in turn, cleared from the floor before
   * it travels and pointed in the air (the rear foot first, so the lead foot
   * stays a support), the root sinks until both knees soften and turns to the
   * stance heading, and the gloves come up to the guard, then the stance holds
   * with a light bounce through the knees. If a step is interrupted, its
   * airborne foot takes the first swing and the existing bearing foot holds
   * through that landing.
   *
   * The stance itself is {@link StrikingStance}: measured on the body, so any
   * stature takes its own. A foot already within 1 cm of its place stays
   * planted. The line faces the `facing` target when one is given (read at the
   * start), otherwise it keeps the entry's line: a performer already in a
   * stance keeps its line, and one standing square faces straight ahead.
   *
   * A guard facing a person steps back from them by its half of the least step
   * along the line between them that keeps its guard and theirs, both held,
   * clear of each other (`StrikingGuardYield`), so two fighters in guard never
   * stand inside each other, whatever their sizes.
   *
   * The bounce: kickboxers keep a rhythmic bounce between exchanges; its height
   * is a third of the stance's sink and its rate two bounces a second,
   * provisional readings of coaching footage (the kickboxing research's rhythm
   * share) with no located measurement.
   */
  export import guard = guardLaw;

  /**
   * Whether a defence is in time, late or fails against one strike, decided
   * from the two performers' timing before any geometry, and how a forced
   * outcome is realised with plausible human timing.
   *
   * The law (the campaign): the defender starts at `t_start = launch + RT -
   * lead x telegraph`, where `RT` is a simple reaction time from the defender's
   * ex-Gaussian, `lead` the anticipation the defender's skill buys and
   * `telegraph` in [0, 1] how much of the attack its preparation shows. With
   * the defence's own movement time `T_def` and the attacker's contact second
   * `t_hit`, the margin is `m = t_hit - (t_start + T_def)`:
   *
   * - `m >= 0`: in time; the defending limb or head is in place at contact.
   * - `-T_def / 2 < m < 0`: late; the strike lands through the half-made guard.
   * - Otherwise: fail; the strike lands as if undefended.
   *
   * A roundhouse reaches its target in about one simple reaction time (280 to
   * 300 ms against a 290 ms elite mean), so a purely reactive defence cannot be
   * in time against a fast kick; anticipation is what makes it possible, which
   * is the evidence this law encodes.
   *
   * Forcing an outcome draws `m` from the forced band intersected with the
   * plausible band (every reaction time and lead inside its 1 to 99 % range),
   * solves `t_start`, and splits it into a reaction time and a lead, each in
   * its range. When the bands do not meet, the attacker's strike duration is
   * stretched or shortened within its own allowed factor first; if no factor
   * suffices, the forced outcome is refused with the outcomes plausible timing
   * does reach, since the outcome is the author's input and must not change
   * silently. An implausible reaction time is never used.
   */
  export import DefenceOutcome = DefenceOutcomeSource;

  /**
   * The defences as rows on the grammar: each named defence is a row of
   * `defend`, the law that owns the defender's role and the outcome shared with
   * the strike it answers, and the brace a row of `brace`, a base adaptation.
   * The composition gives the strike answered (`against`) and, where the scene
   * decides it, the outcome.
   *
   * | Row                                                          | Law      | Fixed              |
   * | ------------------------------------------------------------ | -------- | ------------------ |
   * | `cover`, `handParry`, `elbowBlock`, `highBlock`, `checkKick` | `defend` | the block          |
   * | `slip`, `rollUnder`, `swayBack`                              | `defend` | the evasion        |
   * | `braceImpact`, `bracePush`                                   | `brace`  | what is braced for |
   *
   * Every `defend` row shares one timing ({@link IAutoMovieMotionHumanDefend}):
   * the defender starts after a reaction time of about 0.3 s less the
   * anticipation the strike's preparation shows, and its limb or head takes
   * 0.30 s at novice to 0.20 s at elite to move, so against a rear straight of
   * 0.310 s a defence is in time only when it anticipates, and a kick or a fast
   * strike is met late by a novice. `slip`, `rollUnder` and `swayBack` fit a
   * punch; `cover`, `elbowBlock` and `highBlock` fit a punch or a kick to the
   * guarded region; `checkKick` fits a kick to the leg. The `brace` rows set
   * the stance for an impact or a push and state no time.
   *
   * `handParry`, `rollUnder` and `swayBack` are named apart from the blade's
   * `parry`, the regrasp's `roll` and the drill's `sway`, so a name a
   * performance registers is one row.
   *
   * Each `defend` row fixes the kind of the preset of the same name in
   * `AutoMovieMotionHumanDefence` (`COVER`, `SLIP` and the rest), so the values
   * are written once.
   */
  export import HumanDefence = HumanDefenceSource;

  /**
   * The checkKick preset: a kick checked with the raised shin. Spread into
   * `defend`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `checkKick`
   * row of `HumanDefence` fixes these values.
   */
  export const CHECK_KICK: typeof HUMAN_DEFENCE_CHECK_KICK =
    HUMAN_DEFENCE_CHECK_KICK;

  /**
   * The cover preset: both forearms brought up to cover the head. Spread into
   * `defend`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `cover` row of
   * `HumanDefence` fixes these values.
   */
  export const COVER: typeof HUMAN_DEFENCE_COVER = HUMAN_DEFENCE_COVER;

  /**
   * The elbowBlock preset: a body strike taken on the elbow. Spread into
   * `defend`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `elbowBlock`
   * row of `HumanDefence` fixes these values.
   */
  export const ELBOW_BLOCK: typeof HUMAN_DEFENCE_ELBOW_BLOCK =
    HUMAN_DEFENCE_ELBOW_BLOCK;

  /**
   * The handParry preset: the incoming fist deflected by the hand. Spread into
   * `defend`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `handParry`
   * row of `HumanDefence` fixes these values.
   */
  export const HAND_PARRY: typeof HUMAN_DEFENCE_HAND_PARRY =
    HUMAN_DEFENCE_HAND_PARRY;

  /**
   * The highBlock preset: a high strike taken on the raised forearm. Spread
   * into `defend`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `highBlock`
   * row of `HumanDefence` fixes these values.
   */
  export const HIGH_BLOCK: typeof HUMAN_DEFENCE_HIGH_BLOCK =
    HUMAN_DEFENCE_HIGH_BLOCK;

  /**
   * The rollUnder preset: the body rolled under a hook. Spread into `defend`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `rollUnder` row of
   * `HumanDefence` fixes these values.
   */
  export const ROLL_UNDER: typeof HUMAN_DEFENCE_ROLL_UNDER =
    HUMAN_DEFENCE_ROLL_UNDER;

  /**
   * The slip preset: the head moved off the line of a straight punch. Spread
   * into `defend`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `slip` row of
   * `HumanDefence` fixes these values.
   */
  export const SLIP: typeof HUMAN_DEFENCE_SLIP = HUMAN_DEFENCE_SLIP;

  /**
   * The swayBack preset: the trunk swayed back from a strike. Spread into
   * `defend`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `swayBack` row
   * of `HumanDefence` fixes these values.
   */
  export const SWAY_BACK: typeof HUMAN_DEFENCE_SWAY_BACK =
    HUMAN_DEFENCE_SWAY_BACK;
}
