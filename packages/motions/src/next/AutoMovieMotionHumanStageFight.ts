import { HumanStageFight as HumanStageFightSource } from "../lexicon/HumanStageFight";
import { HumanStagePiste as HumanStagePisteSource } from "../lexicon/HumanStagePiste";
import { HumanStageProp as HumanStagePropSource } from "../lexicon/HumanStageProp";
import { composeHumanBladeExchange as composeHumanBladeExchangeLaw } from "../lexicon/internal/composeHumanBladeExchange";
import { composeHumanStageProp as composeHumanStagePropLaw } from "../lexicon/internal/composeHumanStageProp";
import { readHumanBladeExchangeCues as readHumanBladeExchangeCuesLaw } from "../lexicon/internal/readHumanBladeExchangeCues";
import { stageBladeFootwork as stageBladeFootworkLaw } from "../lexicon/internal/stageBladeFootwork";
import { withHumanStagePropLink as withHumanStagePropLinkLaw } from "../lexicon/internal/withHumanStagePropLink";
import { HUMAN_STAGE_FIGHT_BACKHAND } from "./presets/HUMAN_STAGE_FIGHT_BACKHAND";
import { HUMAN_STAGE_FIGHT_CHOKE } from "./presets/HUMAN_STAGE_FIGHT_CHOKE";
import { HUMAN_STAGE_FIGHT_DIVE_FOR_COVER } from "./presets/HUMAN_STAGE_FIGHT_DIVE_FOR_COVER";
import { HUMAN_STAGE_FIGHT_DODGE } from "./presets/HUMAN_STAGE_FIGHT_DODGE";
import { HUMAN_STAGE_FIGHT_DUCK } from "./presets/HUMAN_STAGE_FIGHT_DUCK";
import { HUMAN_STAGE_FIGHT_ESQUIVA } from "./presets/HUMAN_STAGE_FIGHT_ESQUIVA";
import { HUMAN_STAGE_FIGHT_GRAB } from "./presets/HUMAN_STAGE_FIGHT_GRAB";
import { HUMAN_STAGE_FIGHT_GRABBED } from "./presets/HUMAN_STAGE_FIGHT_GRABBED";
import { HUMAN_STAGE_FIGHT_HAIR_PULL } from "./presets/HUMAN_STAGE_FIGHT_HAIR_PULL";
import { HUMAN_STAGE_FIGHT_HEADLOCK } from "./presets/HUMAN_STAGE_FIGHT_HEADLOCK";
import { HUMAN_STAGE_FIGHT_LEAN_BACK } from "./presets/HUMAN_STAGE_FIGHT_LEAN_BACK";
import { HUMAN_STAGE_FIGHT_POKE } from "./presets/HUMAN_STAGE_FIGHT_POKE";
import { HUMAN_STAGE_FIGHT_PUSHED } from "./presets/HUMAN_STAGE_FIGHT_PUSHED";
import { HUMAN_STAGE_FIGHT_RESTRAIN } from "./presets/HUMAN_STAGE_FIGHT_RESTRAIN";
import { HUMAN_STAGE_FIGHT_SHOVE } from "./presets/HUMAN_STAGE_FIGHT_SHOVE";
import { HUMAN_STAGE_FIGHT_SHOVED } from "./presets/HUMAN_STAGE_FIGHT_SHOVED";
import { HUMAN_STAGE_FIGHT_SLAP } from "./presets/HUMAN_STAGE_FIGHT_SLAP";
import { HUMAN_STAGE_FIGHT_SLAPPED } from "./presets/HUMAN_STAGE_FIGHT_SLAPPED";
import { HUMAN_STAGE_FIGHT_STAGE_HEADBUTT } from "./presets/HUMAN_STAGE_FIGHT_STAGE_HEADBUTT";
import { HUMAN_STAGE_FIGHT_STAGE_PALM_STRIKE } from "./presets/HUMAN_STAGE_FIGHT_STAGE_PALM_STRIKE";
import { HUMAN_STAGE_FIGHT_STAGE_SLAP } from "./presets/HUMAN_STAGE_FIGHT_STAGE_SLAP";
import { HUMAN_STAGE_FIGHT_STRUGGLE } from "./presets/HUMAN_STAGE_FIGHT_STRUGGLE";

/**
 * Stage fighting: a staged blade exchange between two performers, a visual prop
 * beat with an optional partner response, the padded blade footwork, and the
 * non-contact slaps, grabs, holds and the receiver's responses short of a
 * strike.
 *
 * Each blow is a row of a shipped action on a partner the composition names;
 * the row leaves the target or the partner open. The receiver's response is its
 * own row (`slapped`, `shoved`, `grabbed`, `pushed`), whose start the
 * composition syncs to the attacker's contact. A stage palm strike and a stage
 * headbutt are driven at the target and stopped short at 0.85 of their delivery
 * (provisional) with no contact declared, and a stage slap passes half a hand's
 * length clear of the cheek (provisional). The partner's flinch in `stageProp`
 * starts at the prop beat's named `stroke` event plus any authored delay, and
 * the timing adds no contact between performers.
 *
 * The presets are the constants of `AutoMovieMotionHumanStageFight` that the
 * rows of `HumanStageFight` read; each names the members of its law that the
 * row fixes.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `stageBladeFootwork`: Shift a performer's stance between two floor marks on a
 *   blade set.
 * - `withHumanStagePropLink`: Attach an authored swing and settle to a digital
 *   stage prop's link hinge.
 * - `readHumanBladeExchangeCues`: Read a staged blade exchange's editing cues
 *   from a resolved film schedule.
 * - `bladeExchange`: Compose a blocked opening and an optional reply for a staged
 *   blade exchange.
 * - `stageProp`: Append a visual prop beat and, when authored, a second
 *   performer's response.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `STAGE_PALM_STRIKE`: The stage palm strike preset: the rear palm heel driven
 *   at the target and stopped short at 0.85 of its delivery (provisional), with
 *   no contact declared.
 * - `STAGE_HEADBUTT`: The stage headbutt preset: the forehead driven at the
 *   target and stopped short at 0.85 of its delivery (provisional), with no
 *   contact declared.
 * - `SLAP`: The slap preset: one tap of the open palm swept across the target.
 * - `STAGE_SLAP`: The stage slap preset: one tap of the open palm swept across
 *   the target, half a hand's length clear of it (provisional), with no contact
 *   declared.
 * - `BACKHAND`: The backhand preset: one tap of the hand's back swept across the
 *   target.
 * - `SHOVE`: The shove preset: one press of the palm.
 * - `GRAB`: The grab preset: one squeeze of the palm.
 * - `POKE`: The poke preset: a tap of the fingertips.
 * - `RESTRAIN`: The restrain preset: a clinch held for 3 s.
 * - `HEADLOCK`: The headlock preset: a clinch held for 2 s.
 * - `SLAPPED`: The slapped preset: the head giving way from the blow.
 * - `GRABBED`: The grabbed preset: the trunk giving way toward the grip.
 * - `LEAN_BACK`: The lean back preset: the trunk giving way away from the threat.
 * - `PUSHED`: The pushed preset: the trunk giving way from a push at half
 *   intensity.
 * - `SHOVED`: The shoved preset: a stagger at a speed of 0.8.
 * - `CHOKE`: The choke preset: one squeeze of the palm held for 2 s.
 * - `HAIR_PULL`: The hair pull preset: one squeeze of the palm held for 1.5 s.
 * - `STRUGGLE`: The struggle preset: one squeeze of the palm held for 1.5 s.
 * - `DIVE_FOR_COVER`: The dive for cover preset: a prone lie down held for 3 s.
 * - `DUCK`: The duck preset: a partial crouch held for 0.3 s.
 * - `ESQUIVA`: The esquiva preset: a full crouch held for 0.6 s.
 * - `DODGE`: The dodge preset: one step to the right.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanStageFight`: Stage fighting short of a strike: slaps, grabs and holds,
 *   each a row of a shipped action on a partner the composition names (the row
 *   leaves the target or the partner open).
 * - `HumanStageProp`: A held digital prop display law.
 * - `HumanStagePiste`: A two-performer bout on a piste or a kendo court.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanStageFight} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanStageFight {
  /**
   * Stage fighting short of a strike: slaps, grabs and holds, each a row of a
   * shipped action on a partner the composition names (the row leaves the
   * target or the partner open). The receiver's response is its own row
   * (`slapped`, `shoved`, `grabbed`, `pushed`), whose start the composition
   * syncs to the attacker's contact: `b.registered("slapped", { from }).sync({
   * of: "slap" })`. Register the ones a film uses.
   */
  export import HumanStageFight = HumanStageFightSource;

  /**
   * A held digital prop display law. `stroke` is the authored screen beat,
   * available to another performance chain as a synchronization anchor. The
   * existing body and arm planners own support and grip fitting.
   */
  export const HumanStageProp: typeof HumanStagePropSource =
    HumanStagePropSource;

  /**
   * A two-performer bout on a piste or a kendo court. The opening distance is
   * authored by the marks; each advance of the approach covers at most 0.3 m
   * (`HumanStagePiste.ADVANCE`, about a foot, provisional) in the `duration`
   * the take gives it, so the approach lasts the advances' count times that.
   * The epee scores a double touch when the two touches fall within 0.04 s
   * (`HumanStagePiste.DOUBLE`, FIE). The attack is the weapon's own blade
   * timing (`IAutoMovieMotionHumanSword`): a lunge's point at 2.6 to 3.2 m/s
   * for foil and epee, a cut at 6 to 10 m/s for sabre and kendo. From their
   * opening marks both close the distance in advances of the weapon's own
   * footwork, then the first attacks and the screenplay's result decides the
   * exchange. A touch for the first lands its attack; one for the second has
   * the attack parried and the second riposte; the epee's double touch lands
   * both attacks at one instant, each blade following the other performer as it
   * lunges; no touch has the attack parried and left there. The result is
   * announced at the decisive instant of the touch that scores, or of the parry
   * that closes the attack.
   *
   * The rules are checked before anything is placed. A touch must aim at the
   * weapon's valid target (FIE Technical Rules): the foil's trunk, every region
   * for the epee, and for the sabre every region above the waist. A kendo
   * strike must aim at a struck region of the opponent's armour (FIK, The
   * Regulations of Kendo Shiai and Shinpan, Articles 12 and 14): the men, the
   * kote, either side of the do or the tsuki. Only the epee scores a double
   * touch. Register stageBladeFootwork and the HumanBlade rows when playing the
   * take; the blade actions refuse a target out of reach.
   */
  export import HumanStagePiste = HumanStagePisteSource;

  /**
   * Shift a performer's stance between two floor marks on a blade set. A fenced
   * stage uses lifted steps, the kendo profile moves the travelling foot along
   * the floor, and an armoured cast can use a deliberate cadence. These are
   * screen-blocking profiles. A prop cue belongs to the editor's clock
   * independently of footholds. Props remain attached by the normal grip
   * owner.
   */
  export const stageBladeFootwork: typeof stageBladeFootworkLaw =
    stageBladeFootworkLaw;

  /**
   * Attach an authored swing and settle to a digital stage prop's link hinge.
   *
   * Keyframes give hinge travel in degrees at seconds relative to a film
   * instant. The connecting curve stays between neighbouring travels and
   * settles at each key. The performance places and retains the final state.
   * This track gives the connector and its terminal part the same
   * articulation.
   *
   * @param prop A digital prop with a poseable `link` hinge.
   * @param start The film second or schedule cue the track starts at.
   * @param keys At least two ordered keys, starting at zero seconds.
   * @returns The prop with the new track appended.
   * @throws {Error} For a missing hinge or inadmissible time or hinge travel.
   */
  export const withHumanStagePropLink: typeof withHumanStagePropLinkLaw =
    withHumanStagePropLinkLaw;

  /**
   * Read a staged blade exchange's editing cues from a resolved film schedule.
   * The `opening` cue is the opening's decisive instant, `block` is the
   * responder's stroke event and `reply` is the optional follow-through's
   * start. Cues are in film seconds. A cut that removes an instant also removes
   * its cue. An instant at the cut remains.
   *
   * @param schedule Placed schedule containing the exchange.
   * @param cue Cue id passed to composeHumanBladeExchange, without a phase
   *   suffix.
   * @returns A cue track in time order, with the opening before the block on a
   *   tie.
   * @throws {Error} When either of the exchange's required phases is absent.
   */
  export const readHumanBladeExchangeCues: typeof readHumanBladeExchangeCuesLaw =
    readHumanBladeExchangeCuesLaw;

  /**
   * Compose a blocked opening and an optional reply for a staged blade
   * exchange. Register the cut and parry rows of HumanBlade with
   * HumanPerformance, and bind, riposte, taken and enGarde when the exchange
   * has a reply. Each chain prepares its performer and prop. The block starts
   * at the authored lead before the opening's decisive cue, and a reply starts
   * when the block ends. The block's stroke cue comes from the resolved action
   * timing. Answered, the opening is `taken`: the block is a bind that carries
   * its blade aside, the opener keeps the blade there until the reply ends and
   * then returns to guard.
   *
   * @param opening Entry chain of the opening performer.
   * @param responding Entry chain of the responding performer.
   * @param exchange Stable cue id, held-prop subjects, stage marks and block
   *   lead in film seconds.
   * @returns Parallel composition of the two performers, with unchanged entry
   *   chains.
   * @throws {Error} When cast or props coincide, an id is blank, or the lead is
   *   invalid.
   */
  export const bladeExchange: typeof composeHumanBladeExchangeLaw =
    composeHumanBladeExchangeLaw;

  /**
   * Append a visual prop beat and, when authored, a second performer's
   * response.
   *
   * The partner's flinch starts at the prop beat's named `stroke` event, plus
   * any authored delay. Omit the response for a solo display or a passing beat
   * without a reaction. The timing adds no contact between performers.
   *
   * @param performer The performer carrying the digital prop.
   * @param beat The visual pose and prop mark.
   * @param cue An anchor unique within the scene.
   * @param response The optional responding performer and reaction timing.
   * @returns The composed performance chains.
   * @throws {Error} For a blank cue, a self-response or an invalid delay.
   */
  export const stageProp: typeof composeHumanStagePropLaw =
    composeHumanStagePropLaw;

  /**
   * The stage palm strike preset: the rear palm heel driven at the target and
   * stopped short at 0.85 of its delivery (provisional), with no contact
   * declared. The `stagePalmStrike` row of `HumanStageFight` reads it, so the
   * row and the preset share one value.
   */
  export const STAGE_PALM_STRIKE: typeof HUMAN_STAGE_FIGHT_STAGE_PALM_STRIKE =
    HUMAN_STAGE_FIGHT_STAGE_PALM_STRIKE;

  /**
   * The stage headbutt preset: the forehead driven at the target and stopped
   * short at 0.85 of its delivery (provisional), with no contact declared. The
   * `stageHeadbutt` row of `HumanStageFight` reads it, so the row and the
   * preset share one value.
   */
  export const STAGE_HEADBUTT: typeof HUMAN_STAGE_FIGHT_STAGE_HEADBUTT =
    HUMAN_STAGE_FIGHT_STAGE_HEADBUTT;

  /**
   * The slap preset: one tap of the open palm swept across the target. The
   * `slap` row of `HumanStageFight` reads it, so the row and the preset share
   * one value.
   */
  export const SLAP: typeof HUMAN_STAGE_FIGHT_SLAP = HUMAN_STAGE_FIGHT_SLAP;

  /**
   * The stage slap preset: one tap of the open palm swept across the target,
   * half a hand's length clear of it (provisional), with no contact declared.
   * The `stageSlap` row of `HumanStageFight` reads it, so the row and the
   * preset share one value.
   */
  export const STAGE_SLAP: typeof HUMAN_STAGE_FIGHT_STAGE_SLAP =
    HUMAN_STAGE_FIGHT_STAGE_SLAP;

  /**
   * The backhand preset: one tap of the hand's back swept across the target.
   * The `backhand` row of `HumanStageFight` reads it, so the row and the preset
   * share one value.
   */
  export const BACKHAND: typeof HUMAN_STAGE_FIGHT_BACKHAND =
    HUMAN_STAGE_FIGHT_BACKHAND;

  /**
   * The shove preset: one press of the palm. The `shove` row of
   * `HumanStageFight` reads it, so the row and the preset share one value.
   */
  export const SHOVE: typeof HUMAN_STAGE_FIGHT_SHOVE = HUMAN_STAGE_FIGHT_SHOVE;

  /**
   * The grab preset: one squeeze of the palm. The `grab` row of
   * `HumanStageFight` reads it, so the row and the preset share one value.
   */
  export const GRAB: typeof HUMAN_STAGE_FIGHT_GRAB = HUMAN_STAGE_FIGHT_GRAB;

  /**
   * The poke preset: a tap of the fingertips. The `poke` row of
   * `HumanStageFight` reads it, so the row and the preset share one value.
   */
  export const POKE: typeof HUMAN_STAGE_FIGHT_POKE = HUMAN_STAGE_FIGHT_POKE;

  /**
   * The restrain preset: a clinch held for 3 s. The `restrain` row of
   * `HumanStageFight` reads it, so the row and the preset share one value.
   */
  export const RESTRAIN: typeof HUMAN_STAGE_FIGHT_RESTRAIN =
    HUMAN_STAGE_FIGHT_RESTRAIN;

  /**
   * The headlock preset: a clinch held for 2 s. The `headlock` row of
   * `HumanStageFight` reads it, so the row and the preset share one value.
   */
  export const HEADLOCK: typeof HUMAN_STAGE_FIGHT_HEADLOCK =
    HUMAN_STAGE_FIGHT_HEADLOCK;

  /**
   * The slapped preset: the head giving way from the blow. The `slapped` row of
   * `HumanStageFight` reads it, so the row and the preset share one value.
   */
  export const SLAPPED: typeof HUMAN_STAGE_FIGHT_SLAPPED =
    HUMAN_STAGE_FIGHT_SLAPPED;

  /**
   * The grabbed preset: the trunk giving way toward the grip. The `grabbed` row
   * of `HumanStageFight` reads it, so the row and the preset share one value.
   */
  export const GRABBED: typeof HUMAN_STAGE_FIGHT_GRABBED =
    HUMAN_STAGE_FIGHT_GRABBED;

  /**
   * The lean back preset: the trunk giving way away from the threat. The
   * `leanBack` row of `HumanStageFight` reads it, so the row and the preset
   * share one value.
   */
  export const LEAN_BACK: typeof HUMAN_STAGE_FIGHT_LEAN_BACK =
    HUMAN_STAGE_FIGHT_LEAN_BACK;

  /**
   * The pushed preset: the trunk giving way from a push at half intensity. The
   * `pushed` row of `HumanStageFight` reads it, so the row and the preset share
   * one value.
   */
  export const PUSHED: typeof HUMAN_STAGE_FIGHT_PUSHED =
    HUMAN_STAGE_FIGHT_PUSHED;

  /**
   * The shoved preset: a stagger at a speed of 0.8. The `shoved` row of
   * `HumanStageFight` reads it, so the row and the preset share one value.
   */
  export const SHOVED: typeof HUMAN_STAGE_FIGHT_SHOVED =
    HUMAN_STAGE_FIGHT_SHOVED;

  /**
   * The choke preset: one squeeze of the palm held for 2 s. The `choke` row of
   * `HumanStageFight` reads it, so the row and the preset share one value.
   */
  export const CHOKE: typeof HUMAN_STAGE_FIGHT_CHOKE = HUMAN_STAGE_FIGHT_CHOKE;

  /**
   * The hair pull preset: one squeeze of the palm held for 1.5 s. The
   * `hairPull` row of `HumanStageFight` reads it, so the row and the preset
   * share one value.
   */
  export const HAIR_PULL: typeof HUMAN_STAGE_FIGHT_HAIR_PULL =
    HUMAN_STAGE_FIGHT_HAIR_PULL;

  /**
   * The struggle preset: one squeeze of the palm held for 1.5 s. The `struggle`
   * row of `HumanStageFight` reads it, so the row and the preset share one
   * value.
   */
  export const STRUGGLE: typeof HUMAN_STAGE_FIGHT_STRUGGLE =
    HUMAN_STAGE_FIGHT_STRUGGLE;

  /**
   * The dive for cover preset: a prone lie down held for 3 s. The
   * `diveForCover` row of `HumanStageFight` reads it, so the row and the preset
   * share one value.
   */
  export const DIVE_FOR_COVER: typeof HUMAN_STAGE_FIGHT_DIVE_FOR_COVER =
    HUMAN_STAGE_FIGHT_DIVE_FOR_COVER;

  /**
   * The duck preset: a partial crouch held for 0.3 s. The `duck` row of
   * `HumanStageFight` reads it, so the row and the preset share one value.
   */
  export const DUCK: typeof HUMAN_STAGE_FIGHT_DUCK = HUMAN_STAGE_FIGHT_DUCK;

  /**
   * The esquiva preset: a full crouch held for 0.6 s. The `esquiva` row of
   * `HumanStageFight` reads it, so the row and the preset share one value.
   */
  export const ESQUIVA: typeof HUMAN_STAGE_FIGHT_ESQUIVA =
    HUMAN_STAGE_FIGHT_ESQUIVA;

  /**
   * The dodge preset: one step to the right. The `dodge` row of
   * `HumanStageFight` reads it, so the row and the preset share one value.
   */
  export const DODGE: typeof HUMAN_STAGE_FIGHT_DODGE = HUMAN_STAGE_FIGHT_DODGE;
}
