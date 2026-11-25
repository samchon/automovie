import { AutoMovieMotionHumanTouchLaws } from "./AutoMovieMotionHumanTouchLaws";
import { AutoMovieMotionHumanTouchRows } from "./AutoMovieMotionHumanTouchRows";

/**
 * Touching a partner: a touch, a high five, a kiss and a leg touch.
 *
 * The family carries its fixed-parameter touches as presets, data on
 * `AutoMovieMotionHumanTouch`: the touch kinds `TAP`, `PAT`, `STROKE`, `RUB`,
 * `PRESS`, `SQUEEZE`, `HOLD` and `SCRATCH`, read by the rows of
 * `HumanTouchRows`; the emblems `EMBLEM_SALUTE`, `EMBLEM_HAND_ON_HEART`,
 * `EMBLEM_BLOWN_KISS_SEND`, `EMBLEM_COVER_MOUTH` and `EMBLEM_COVER_EARS`, read
 * by the rows of `HumanEmblem`; the social touches `SOCIAL_SHOULDER_PAT`,
 * `SOCIAL_COMFORT` and `SOCIAL_FIRM_PRESS`, read by the rows of `HumanSocial`;
 * and `PARTNER_DANCE_HOLD`, read by the row of `HumanPartner`. A preset adds no
 * method and is spread into the parameters of `touch`; each row and its preset
 * share one value.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `touch`: One or both hands touch a partner's or the performer's own region
 *   with a tap, pat, stroke, rub, press, squeeze, hold or scratch (Jung et al.
 * - `highFive`: A high five, a low five or a fist bump between two standing
 *   partners: both bring one hand to one shared point between them and meet
 *   there at one shared instant, the mutual goal the handshake uses
 *   (`AutoMovieMotionMeeting`).
 * - `kiss`: A kiss while standing: the lips brought to a partner's region (a
 *   cheek, the forehead, the crown, the lips, the back of a hand) by leaning
 *   the body from the hips and flexing the neck, the head turned to one side
 *   for a cheek or the lips so the noses stay clear.
 * - `legTouch`: A touch with the leg while standing (effectors below the hip):
 *   the toes, the heel or the knee of one leg is brought onto a place and held
 *   there, the other leg bearing the body.
 * - `region`: A region of a target as a frame: a person's region or a prop's
 *   point through the context's aim, a trunk or head region of the performer on
 *   the posture, and a limb region of the performer on the entry pose, which a
 *   touch that does not move that limb leaves where it was.
 * - `touchPrimitive`: A touch: the arm and the fingers on one clock.
 * - `share`: How far a touch's arm is from its entry angles to its goal at a
 *   second: the clock's envelope, rising from `start` to `ready` and falling
 *   from `relax` to `end`.
 * - `goal`: The goal a touch's arm is carried toward at each second: the effector
 *   laid on the region, lifted along its normal by `lift sin^2(pi n u)` and
 *   moved along its tangent by the clock's windowed wave of `n` cycles between
 *   `strokeStart` and `strokeEnd`, and stood off along the normal by the share
 *   of the carry still to go.
 * - `headRest`: Rest the head on a partner.
 * - `backToBack`: Lean back against a seated partner's back.
 * - `sitOnLap`: Sit on a seated partner's lap.
 * - `embraceFromBehind`: Embrace a partner from behind.
 * - `hug`: A criss-cross hug between closely staged, facing partners with their
 *   heads offset.
 * - `shoulderClasp`: Two facing partners within arm's reach each rest their right
 *   palm on the other's left shoulder, then return their hands.
 * - `touchEffectors`: The parts of the hand a touch lays on its region
 *   (`touch.With`) and each one's effector (`touch.EFFECTORS`).
 * - `touchSite`: Where on a region a touch lands: a region is a patch of skin,
 *   not one point, so a touch names a place on it.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `TIP`: The last share of a carry's progress (`touchEnvelope`) over which a
 *   vessel leaned at the face (`ITouch.lean`) tips toward it, and the first
 *   share of the way back over which it is righted, by the hand's attitude
 *   (provisional: a drinker tips the glass at the lips).
 * - `TAP`: The values the `touchTap` row of `HumanTouchRows` fixes on `touch`,
 *   spread into its parameters.
 * - `PAT`: The values the `touchPat` row of `HumanTouchRows` fixes on `touch`,
 *   spread into its parameters.
 * - `STROKE`: The values the `touchStroke` row of `HumanTouchRows` fixes on
 *   `touch`, spread into its parameters.
 * - `RUB`: The values the `touchRub` row of `HumanTouchRows` fixes on `touch`,
 *   spread into its parameters.
 * - `PRESS`: The values the `touchPress` row of `HumanTouchRows` fixes on
 *   `touch`, spread into its parameters.
 * - `SQUEEZE`: The values the `touchSqueeze` row of `HumanTouchRows` fixes on
 *   `touch`, spread into its parameters.
 * - `HOLD`: The values the `touchHold` row of `HumanTouchRows` fixes on `touch`,
 *   spread into its parameters.
 * - `SCRATCH`: The values the `touchScratch` row of `HumanTouchRows` fixes on
 *   `touch`, spread into its parameters.
 * - `EMBLEM_SALUTE`: The values the `salute` row of `HumanEmblem` fixes on
 *   `touch`, spread into its parameters.
 * - `EMBLEM_HAND_ON_HEART`: The values the `handOnHeart` row of `HumanEmblem`
 *   fixes on `touch`, spread into its parameters.
 * - `EMBLEM_BLOWN_KISS_SEND`: The values the `blownKissSend` row of `HumanEmblem`
 *   fixes on `touch`, spread into its parameters.
 * - `EMBLEM_COVER_MOUTH`: The values the `coverMouth` row of `HumanEmblem` fixes
 *   on `touch`, spread into its parameters.
 * - `EMBLEM_COVER_EARS`: The values the `coverEars` row of `HumanEmblem` fixes on
 *   `touch`, spread into its parameters.
 * - `SOCIAL_SHOULDER_PAT`: The values the `shoulderPat` row of `HumanSocial`
 *   fixes on `touch`, spread into its parameters.
 * - `SOCIAL_COMFORT`: The values the `comfort` row of `HumanSocial` fixes on
 *   `touch`, spread into its parameters.
 * - `SOCIAL_FIRM_PRESS`: The values the `firmPress` row of `HumanSocial` fixes on
 *   `touch`, spread into its parameters.
 * - `PARTNER_DANCE_HOLD`: The values the `danceHold` row of `HumanPartner` fixes
 *   on `touch`, spread into its parameters.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `AutoMovieMotionHumanTouchEffector`: What touches in a touch: a hand surface,
 *   or the tip of a tool the hand holds, stated in the hand's anatomical axes
 *   (where the fingers point, where the palm faces and where the thumb points
 *   at rest) as shares of the hand's length, so a held cup's rim or a spoon's
 *   bowl is placed on the mouth without a prop.
 * - `AutoMovieMotionHumanTouchForm`: The kinds of a touch and how each moves in
 *   the region's surface frame: the social touch gestures of Jung et al.
 * - `AutoMovieMotionHumanTouchLaid`: An effector laid on a region at rest, before
 *   any stroke moves it: the arm goal that lays it, what its two directions lie
 *   on by the touch's lay, the elbow's hint for that goal, the arm solved there
 *   as the reference every second of a stroke is held to, and the elbow settled
 *   with a hand that meets its place end on.
 * - `AutoMovieMotionHumanTouchPath`: The direction a hand lies on a surface
 *   region when the arm chooses it (`lay`), and the direction a hand that
 *   continues its forearm points at a place (`reach`).
 * - `AutoMovieMotionHumanTouchStance`: What the body behind the arm does so a
 *   hand reaches a region its arm alone does not: the shoulder girdle lifted
 *   and a rise onto the toes for a region above the shoulder, then a lean from
 *   the hips for what is still beyond the arm.
 * - `AutoMovieMotionHumanTouchUpright`: How a held vessel is turned about its own
 *   upright axis at a region, so the arm that brings it there keeps it upright,
 *   and how far it is leaned.
 * - `AutoMovieMotionHumanTouchDrink`: How far a vessel is leaned toward the face
 *   at the lips, and turned there, so the arm that brings it holds it as a
 *   person drinks: the least lean, in `LEAN_STEP` degrees up to `LEAN`, whose
 *   fitted arm drinks with the vessel where it was asked
 *   (`AutoMovieMotionHumanDrinkingArm.drinks`, its reached axis within a
 *   `LEAN_STEP` of the asked one), with the facing
 *   (`AutoMovieMotionHumanTouchUpright`) whose hand meets the vessel's axis
 *   best, or for a vessel held by the grasp it was taken up by, the lean alone
 *   (`held`).
 * - `HumanSeatedReach`: A seated reach with the trunk below the arm in task
 *   priority: the hand's target first, and when the arm alone falls short, a
 *   lean of the trunk forward, which the seat bears: the hips flex the trunk
 *   over the seat and the spine's three joints flex above them, each within the
 *   flexion room its range leaves.
 * - `HumanClasp`: Hold on with the hands (`IAutoMovieMotionHumanClasp`): the
 *   entry posture carried by its own carrier's contact, or standing where it
 *   is, while each named hand reaches its hold over `REACH` and follows it: a
 *   partner's displayed bone or another prop's moving contact.
 * - `HumanDrape`: A limp body laid across a saddle
 *   (`IAutoMovieMotionHumanDrape`): in the carrier contact's frame the body
 *   lies face down across the seat, its trunk level and pointing to the head's
 *   side, the hips resting on the seat a trunk's half depth above it and folded
 *   so the legs hang down the other side, the arms and head hanging; it comes
 *   to lie so from the entry over `lay` by a minimum-jerk share and is carried
 *   by the contact.
 * - `HumanSocial`: Things two people do together or to each other in company, as
 *   rows of shipped actions and as mutual records over them
 *   (`HumanChain.mutual`).
 * - `HumanPartner`: Things two people do as partners in sport and dance, each a
 *   row of a law whose roles share a stated instant or a meeting.
 * - `HumanTouchRows`: The contact strokes as rows: each kind of `touch` under a
 *   name of its own, the site, the effector, the side and the target open, so
 *   one row serves every site.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanTouch} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanTouch {
  /**
   * One or both hands touch a partner's or the performer's own region with a
   * tap, pat, stroke, rub, press, squeeze, hold or scratch (Jung et al. See
   * `AutoMovieMotionHumanTouchLaws.touch`.
   */
  export import touch = AutoMovieMotionHumanTouchLaws.touch;

  /**
   * A high five, a low five or a fist bump between two standing partners. See
   * `AutoMovieMotionHumanTouchLaws.highFive`.
   */
  export import highFive = AutoMovieMotionHumanTouchLaws.highFive;

  /** A kiss while standing. See `AutoMovieMotionHumanTouchLaws.kiss`. */
  export import kiss = AutoMovieMotionHumanTouchLaws.kiss;

  /**
   * A touch with the leg while standing (effectors below the hip). See
   * `AutoMovieMotionHumanTouchLaws.legTouch`.
   */
  export import legTouch = AutoMovieMotionHumanTouchLaws.legTouch;

  /**
   * A region of a target as a frame. See
   * `AutoMovieMotionHumanTouchLaws.region`.
   */
  export import region = AutoMovieMotionHumanTouchLaws.region;

  /** A touch. See `AutoMovieMotionHumanTouchLaws.touchPrimitive`. */
  export import touchPrimitive = AutoMovieMotionHumanTouchLaws.touchPrimitive;

  /**
   * How far a touch's arm is from its entry angles to its goal at a second. See
   * `AutoMovieMotionHumanTouchLaws.share`.
   */
  export import share = AutoMovieMotionHumanTouchLaws.share;

  /**
   * The last share of a carry's progress (`touchEnvelope`) over which a vessel
   * leaned at the face (`ITouch.lean`) tips toward it, and the first share of
   * the way back over which it is righted, by the hand's attitude (provisional.
   * See `AutoMovieMotionHumanTouchLaws.TIP`.
   */
  export import TIP = AutoMovieMotionHumanTouchLaws.TIP;

  /**
   * The goal a touch's arm is carried toward at each second. See
   * `AutoMovieMotionHumanTouchLaws.goal`.
   */
  export import goal = AutoMovieMotionHumanTouchLaws.goal;

  /** Rest the head on a partner. See `AutoMovieMotionHumanTouchLaws.headRest`. */
  export import headRest = AutoMovieMotionHumanTouchLaws.headRest;

  /**
   * Lean back against a seated partner's back. See
   * `AutoMovieMotionHumanTouchLaws.backToBack`.
   */
  export import backToBack = AutoMovieMotionHumanTouchLaws.backToBack;

  /**
   * Sit on a seated partner's lap. See
   * `AutoMovieMotionHumanTouchLaws.sitOnLap`.
   */
  export import sitOnLap = AutoMovieMotionHumanTouchLaws.sitOnLap;

  /**
   * Embrace a partner from behind. See
   * `AutoMovieMotionHumanTouchLaws.embraceFromBehind`.
   */
  export import embraceFromBehind = AutoMovieMotionHumanTouchLaws.embraceFromBehind;

  /**
   * A criss-cross hug between closely staged, facing partners with their heads
   * offset. See `AutoMovieMotionHumanTouchLaws.hug`.
   */
  export import hug = AutoMovieMotionHumanTouchLaws.hug;

  /**
   * Two facing partners within arm's reach each rest their right palm on the
   * other's left shoulder, then return their hands. See
   * `AutoMovieMotionHumanTouchLaws.shoulderClasp`.
   */
  export import shoulderClasp = AutoMovieMotionHumanTouchLaws.shoulderClasp;

  /**
   * What touches in a touch. See
   * `AutoMovieMotionHumanTouchRows.AutoMovieMotionHumanTouchEffector`.
   */
  export import AutoMovieMotionHumanTouchEffector = AutoMovieMotionHumanTouchRows.AutoMovieMotionHumanTouchEffector;

  /**
   * The kinds of a touch and how each moves in the region's surface frame. See
   * `AutoMovieMotionHumanTouchRows.AutoMovieMotionHumanTouchForm`.
   */
  export import AutoMovieMotionHumanTouchForm = AutoMovieMotionHumanTouchRows.AutoMovieMotionHumanTouchForm;

  /**
   * An effector laid on a region at rest, before any stroke moves it. See
   * `AutoMovieMotionHumanTouchRows.AutoMovieMotionHumanTouchLaid`.
   */
  export import AutoMovieMotionHumanTouchLaid = AutoMovieMotionHumanTouchRows.AutoMovieMotionHumanTouchLaid;

  /**
   * The direction a hand lies on a surface region when the arm chooses it
   * (`lay`), and the direction a hand that continues its forearm points at a
   * place (`reach`). See
   * `AutoMovieMotionHumanTouchRows.AutoMovieMotionHumanTouchPath`.
   */
  export import AutoMovieMotionHumanTouchPath = AutoMovieMotionHumanTouchRows.AutoMovieMotionHumanTouchPath;

  /**
   * What the body behind the arm does so a hand reaches a region its arm alone
   * does not. See
   * `AutoMovieMotionHumanTouchRows.AutoMovieMotionHumanTouchStance`.
   */
  export import AutoMovieMotionHumanTouchStance = AutoMovieMotionHumanTouchRows.AutoMovieMotionHumanTouchStance;

  /**
   * How a held vessel is turned about its own upright axis at a region, so the
   * arm that brings it there keeps it upright, and how far it is leaned. See
   * `AutoMovieMotionHumanTouchRows.AutoMovieMotionHumanTouchUpright`.
   */
  export import AutoMovieMotionHumanTouchUpright = AutoMovieMotionHumanTouchRows.AutoMovieMotionHumanTouchUpright;

  /**
   * How far a vessel is leaned toward the face at the lips, and turned there,
   * so the arm that brings it holds it as a person drinks. See
   * `AutoMovieMotionHumanTouchRows.AutoMovieMotionHumanTouchDrink`.
   */
  export import AutoMovieMotionHumanTouchDrink = AutoMovieMotionHumanTouchRows.AutoMovieMotionHumanTouchDrink;

  /**
   * The parts of the hand a touch lays on its region (`touch.With`) and each
   * one's effector (`touch.EFFECTORS`). See
   * `AutoMovieMotionHumanTouchLaws.touchEffectors`.
   */
  export import touchEffectors = AutoMovieMotionHumanTouchLaws.touchEffectors;

  /**
   * Where on a region a touch lands. See
   * `AutoMovieMotionHumanTouchLaws.touchSite`.
   */
  export import touchSite = AutoMovieMotionHumanTouchLaws.touchSite;

  /**
   * A seated reach with the trunk below the arm in task priority. See
   * `AutoMovieMotionHumanTouchRows.HumanSeatedReach`.
   */
  export import HumanSeatedReach = AutoMovieMotionHumanTouchRows.HumanSeatedReach;

  /**
   * Hold on with the hands (`IAutoMovieMotionHumanClasp`). See
   * `AutoMovieMotionHumanTouchRows.HumanClasp`.
   */
  export import HumanClasp = AutoMovieMotionHumanTouchRows.HumanClasp;

  /**
   * A limp body laid across a saddle (`IAutoMovieMotionHumanDrape`). See
   * `AutoMovieMotionHumanTouchRows.HumanDrape`.
   */
  export import HumanDrape = AutoMovieMotionHumanTouchRows.HumanDrape;

  /**
   * Things two people do together or to each other in company, as rows of
   * shipped actions and as mutual records over them (`HumanChain.mutual`). See
   * `AutoMovieMotionHumanTouchRows.HumanSocial`.
   */
  export import HumanSocial = AutoMovieMotionHumanTouchRows.HumanSocial;

  /**
   * Things two people do as partners in sport and dance, each a row of a law
   * whose roles share a stated instant or a meeting. See
   * `AutoMovieMotionHumanTouchRows.HumanPartner`.
   */
  export import HumanPartner = AutoMovieMotionHumanTouchRows.HumanPartner;

  /**
   * The contact strokes as rows. See
   * `AutoMovieMotionHumanTouchRows.HumanTouchRows`.
   */
  export import HumanTouchRows = AutoMovieMotionHumanTouchRows.HumanTouchRows;

  /**
   * The values the `touchTap` row of `HumanTouchRows` fixes on `touch`, spread
   * into its parameters. See `AutoMovieMotionHumanTouchRows.TAP`.
   */
  export import TAP = AutoMovieMotionHumanTouchRows.TAP;

  /**
   * The values the `touchPat` row of `HumanTouchRows` fixes on `touch`, spread
   * into its parameters. See `AutoMovieMotionHumanTouchRows.PAT`.
   */
  export import PAT = AutoMovieMotionHumanTouchRows.PAT;

  /**
   * The values the `touchStroke` row of `HumanTouchRows` fixes on `touch`,
   * spread into its parameters. See `AutoMovieMotionHumanTouchRows.STROKE`.
   */
  export import STROKE = AutoMovieMotionHumanTouchRows.STROKE;

  /**
   * The values the `touchRub` row of `HumanTouchRows` fixes on `touch`, spread
   * into its parameters. See `AutoMovieMotionHumanTouchRows.RUB`.
   */
  export import RUB = AutoMovieMotionHumanTouchRows.RUB;

  /**
   * The values the `touchPress` row of `HumanTouchRows` fixes on `touch`,
   * spread into its parameters. See `AutoMovieMotionHumanTouchRows.PRESS`.
   */
  export import PRESS = AutoMovieMotionHumanTouchRows.PRESS;

  /**
   * The values the `touchSqueeze` row of `HumanTouchRows` fixes on `touch`,
   * spread into its parameters. See `AutoMovieMotionHumanTouchRows.SQUEEZE`.
   */
  export import SQUEEZE = AutoMovieMotionHumanTouchRows.SQUEEZE;

  /**
   * The values the `touchHold` row of `HumanTouchRows` fixes on `touch`, spread
   * into its parameters. See `AutoMovieMotionHumanTouchRows.HOLD`.
   */
  export import HOLD = AutoMovieMotionHumanTouchRows.HOLD;

  /**
   * The values the `touchScratch` row of `HumanTouchRows` fixes on `touch`,
   * spread into its parameters. See `AutoMovieMotionHumanTouchRows.SCRATCH`.
   */
  export import SCRATCH = AutoMovieMotionHumanTouchRows.SCRATCH;

  /**
   * The values the `salute` row of `HumanEmblem` fixes on `touch`, spread into
   * its parameters. See `AutoMovieMotionHumanTouchRows.EMBLEM_SALUTE`.
   */
  export import EMBLEM_SALUTE = AutoMovieMotionHumanTouchRows.EMBLEM_SALUTE;

  /**
   * The values the `handOnHeart` row of `HumanEmblem` fixes on `touch`, spread
   * into its parameters. See
   * `AutoMovieMotionHumanTouchRows.EMBLEM_HAND_ON_HEART`.
   */
  export import EMBLEM_HAND_ON_HEART = AutoMovieMotionHumanTouchRows.EMBLEM_HAND_ON_HEART;

  /**
   * The values the `blownKissSend` row of `HumanEmblem` fixes on `touch`,
   * spread into its parameters. See
   * `AutoMovieMotionHumanTouchRows.EMBLEM_BLOWN_KISS_SEND`.
   */
  export import EMBLEM_BLOWN_KISS_SEND = AutoMovieMotionHumanTouchRows.EMBLEM_BLOWN_KISS_SEND;

  /**
   * The values the `coverMouth` row of `HumanEmblem` fixes on `touch`, spread
   * into its parameters. See
   * `AutoMovieMotionHumanTouchRows.EMBLEM_COVER_MOUTH`.
   */
  export import EMBLEM_COVER_MOUTH = AutoMovieMotionHumanTouchRows.EMBLEM_COVER_MOUTH;

  /**
   * The values the `coverEars` row of `HumanEmblem` fixes on `touch`, spread
   * into its parameters. See
   * `AutoMovieMotionHumanTouchRows.EMBLEM_COVER_EARS`.
   */
  export import EMBLEM_COVER_EARS = AutoMovieMotionHumanTouchRows.EMBLEM_COVER_EARS;

  /**
   * The values the `shoulderPat` row of `HumanSocial` fixes on `touch`, spread
   * into its parameters. See
   * `AutoMovieMotionHumanTouchRows.SOCIAL_SHOULDER_PAT`.
   */
  export import SOCIAL_SHOULDER_PAT = AutoMovieMotionHumanTouchRows.SOCIAL_SHOULDER_PAT;

  /**
   * The values the `comfort` row of `HumanSocial` fixes on `touch`, spread into
   * its parameters. See `AutoMovieMotionHumanTouchRows.SOCIAL_COMFORT`.
   */
  export import SOCIAL_COMFORT = AutoMovieMotionHumanTouchRows.SOCIAL_COMFORT;

  /**
   * The values the `firmPress` row of `HumanSocial` fixes on `touch`, spread
   * into its parameters. See
   * `AutoMovieMotionHumanTouchRows.SOCIAL_FIRM_PRESS`.
   */
  export import SOCIAL_FIRM_PRESS = AutoMovieMotionHumanTouchRows.SOCIAL_FIRM_PRESS;

  /**
   * The values the `danceHold` row of `HumanPartner` fixes on `touch`, spread
   * into its parameters. See
   * `AutoMovieMotionHumanTouchRows.PARTNER_DANCE_HOLD`.
   */
  export import PARTNER_DANCE_HOLD = AutoMovieMotionHumanTouchRows.PARTNER_DANCE_HOLD;
}
