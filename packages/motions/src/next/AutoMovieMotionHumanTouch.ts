import { AutoMovieMotionHumanTouchDrink as AutoMovieMotionHumanTouchDrinkSource } from "../compose/AutoMovieMotionHumanTouchDrink";
import { AutoMovieMotionHumanTouchEffector as AutoMovieMotionHumanTouchEffectorSource } from "../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm as AutoMovieMotionHumanTouchFormSource } from "../compose/AutoMovieMotionHumanTouchForm";
import { AutoMovieMotionHumanTouchLaid as AutoMovieMotionHumanTouchLaidSource } from "../compose/AutoMovieMotionHumanTouchLaid";
import { AutoMovieMotionHumanTouchPath as AutoMovieMotionHumanTouchPathSource } from "../compose/AutoMovieMotionHumanTouchPath";
import { AutoMovieMotionHumanTouchStance as AutoMovieMotionHumanTouchStanceSource } from "../compose/AutoMovieMotionHumanTouchStance";
import { AutoMovieMotionHumanTouchUpright as AutoMovieMotionHumanTouchUprightSource } from "../compose/AutoMovieMotionHumanTouchUpright";
import { TOUCH_TIP } from "../compose/TOUCH_TIP";
import { touchEnvelope as touchEnvelopeLaw } from "../compose/touchEnvelope";
import { touchGoal as touchGoalLaw } from "../compose/touchGoal";
import { touchPrimitive as touchPrimitiveLaw } from "../compose/touchPrimitive";
import { touchRegionFrame as touchRegionFrameLaw } from "../compose/touchRegionFrame";
import { HumanClasp as HumanClaspSource } from "../lexicon/HumanClasp";
import { HumanDrape as HumanDrapeSource } from "../lexicon/HumanDrape";
import { HumanPartner as HumanPartnerSource } from "../lexicon/HumanPartner";
import { HumanSocial as HumanSocialSource } from "../lexicon/HumanSocial";
import { HumanTouchRows as HumanTouchRowsSource } from "../lexicon/HumanTouchRows";
import { hug as hugLaw } from "../lexicon/hug";
import { shoulderClasp as shoulderClaspLaw } from "../lexicon/shoulderClasp";
import { HumanSeatedReach as HumanSeatedReachSource } from "../touch/HumanSeatedReach";
import { backToBack as backToBackLaw } from "../touch/backToBack";
import { embraceFromBehind as embraceFromBehindLaw } from "../touch/embraceFromBehind";
import { headRest as headRestLaw } from "../touch/headRest";
import { highFive as highFiveLaw } from "../touch/highFive";
import { kiss as kissLaw } from "../touch/kiss";
import { legTouch as legTouchLaw } from "../touch/legTouch";
import { sitOnLap as sitOnLapLaw } from "../touch/sitOnLap";
import { touch as touchLaw } from "../touch/touch";
import { touchEffectors as touchEffectorsLaw } from "../touch/touchEffectors";
import { touchSite as touchSiteLaw } from "../touch/touchSite";
import { HUMAN_TOUCH_EMBLEM_BLOWN_KISS_SEND } from "./presets/HUMAN_TOUCH_EMBLEM_BLOWN_KISS_SEND";
import { HUMAN_TOUCH_EMBLEM_COVER_EARS } from "./presets/HUMAN_TOUCH_EMBLEM_COVER_EARS";
import { HUMAN_TOUCH_EMBLEM_COVER_MOUTH } from "./presets/HUMAN_TOUCH_EMBLEM_COVER_MOUTH";
import { HUMAN_TOUCH_EMBLEM_HAND_ON_HEART } from "./presets/HUMAN_TOUCH_EMBLEM_HAND_ON_HEART";
import { HUMAN_TOUCH_EMBLEM_SALUTE } from "./presets/HUMAN_TOUCH_EMBLEM_SALUTE";
import { HUMAN_TOUCH_HOLD } from "./presets/HUMAN_TOUCH_HOLD";
import { HUMAN_TOUCH_PARTNER_DANCE_HOLD } from "./presets/HUMAN_TOUCH_PARTNER_DANCE_HOLD";
import { HUMAN_TOUCH_PAT } from "./presets/HUMAN_TOUCH_PAT";
import { HUMAN_TOUCH_PRESS } from "./presets/HUMAN_TOUCH_PRESS";
import { HUMAN_TOUCH_RUB } from "./presets/HUMAN_TOUCH_RUB";
import { HUMAN_TOUCH_SCRATCH } from "./presets/HUMAN_TOUCH_SCRATCH";
import { HUMAN_TOUCH_SOCIAL_COMFORT } from "./presets/HUMAN_TOUCH_SOCIAL_COMFORT";
import { HUMAN_TOUCH_SOCIAL_FIRM_PRESS } from "./presets/HUMAN_TOUCH_SOCIAL_FIRM_PRESS";
import { HUMAN_TOUCH_SOCIAL_SHOULDER_PAT } from "./presets/HUMAN_TOUCH_SOCIAL_SHOULDER_PAT";
import { HUMAN_TOUCH_SQUEEZE } from "./presets/HUMAN_TOUCH_SQUEEZE";
import { HUMAN_TOUCH_STROKE } from "./presets/HUMAN_TOUCH_STROKE";
import { HUMAN_TOUCH_TAP } from "./presets/HUMAN_TOUCH_TAP";

/**
 * Touching a partner: a touch, a high five, a kiss and a leg touch.
 *
 * The family carries its fixed-parameter touches as presets, data on `AutoMovieMotionHumanTouch`: the touch kinds `TAP`, `PAT`, `STROKE`, `RUB`, `PRESS`, `SQUEEZE`, `HOLD` and `SCRATCH`, read by the rows of `HumanTouchRows`; the emblems `EMBLEM_SALUTE`, `EMBLEM_HAND_ON_HEART`, `EMBLEM_BLOWN_KISS_SEND`, `EMBLEM_COVER_MOUTH` and `EMBLEM_COVER_EARS`, read by the rows of `HumanEmblem`; the social touches `SOCIAL_SHOULDER_PAT`, `SOCIAL_COMFORT` and `SOCIAL_FIRM_PRESS`, read by the rows of `HumanSocial`; and `PARTNER_DANCE_HOLD`, read by the row of `HumanPartner`. A preset adds no method and is spread into the parameters of `touch`; each row and its preset share one value.
 *
 * Laws and helpers, each the shipped function under the family name:
 * - `touch`: One or both hands touch a partner's or the performer's own region with a tap, pat, stroke, rub, press, squeeze, hold or scratch (Jung et al.
 * - `highFive`: A high five, a low five or a fist bump between two standing partners: both bring one hand to one shared point between them and meet there at one shared instant (#3284), the mutual goal the handshake uses (`AutoMovieMotionMeeting`).
 * - `kiss`: A kiss while standing: the lips brought to a partner's region (a cheek, the forehead, the crown, the lips, the back of a hand) by leaning the body from the hips and flexing the neck, the head turned to one side for a cheek or the lips so the noses stay clear (#3284).
 * - `legTouch`: A touch with the leg while standing (#3357's effectors below the hip): the toes, the heel or the knee of one leg is brought onto a place and held there, the other leg bearing the body.
 * - `region`: A region of a target as a frame: a person's region or a prop's point through the context's aim, a trunk or head region of the performer on the posture, and a limb region of the performer on the entry pose, which a touch that does not move that limb leaves where it was.
 * - `touchPrimitive`: A touch: the arm and the fingers on one clock.
 * - `share`: How far a touch's arm is from its entry angles to its goal at a second: the clock's envelope, rising from `start` to `ready` and falling from `relax` to `end`.
 * - `goal`: The goal a touch's arm is carried toward at each second: the effector laid on the region, lifted along its normal by `lift sin^2(pi n u)` and moved along its tangent by the clock's windowed wave of `n` cycles between `strokeStart` and `strokeEnd`, and stood off along the normal by the share of the carry still to go.
 * - `headRest`: Rest the head on a partner (#4012).
 * - `backToBack`: Lean back against a seated partner's back (#4012).
 * - `sitOnLap`: Sit on a seated partner's lap (#4012).
 * - `embraceFromBehind`: Embrace a partner from behind (#4012).
 * - `hug`: A criss-cross hug between closely staged, facing partners with their heads offset.
 * - `shoulderClasp`: Two facing partners within arm's reach each rest their right palm on the other's left shoulder, then return their hands.
 * - `touchEffectors`: The parts of the hand a touch lays on its region (`touch.With`) and each one's effector (`touch.EFFECTORS`).
 * - `touchSite`: Where on a region a touch lands (#3357): a region is a patch of skin, not one point, so a touch names a place on it.
 *
 * Presets, named parameter values spread into a law's parameters beside the hold; a preset adds no method:
 * - `TIP`: The last share of a carry's progress (`touchEnvelope`) over which a vessel leaned at the face (`ITouch.lean`) tips toward it, and the first share of the way back over which it is righted, by the hand's attitude (provisional: a drinker tips the glass at the lips).
 * - `TAP`: The values the `touchTap` row of `HumanTouchRows` fixes on `touch`, spread into its parameters.
 * - `PAT`: The values the `touchPat` row of `HumanTouchRows` fixes on `touch`, spread into its parameters.
 * - `STROKE`: The values the `touchStroke` row of `HumanTouchRows` fixes on `touch`, spread into its parameters.
 * - `RUB`: The values the `touchRub` row of `HumanTouchRows` fixes on `touch`, spread into its parameters.
 * - `PRESS`: The values the `touchPress` row of `HumanTouchRows` fixes on `touch`, spread into its parameters.
 * - `SQUEEZE`: The values the `touchSqueeze` row of `HumanTouchRows` fixes on `touch`, spread into its parameters.
 * - `HOLD`: The values the `touchHold` row of `HumanTouchRows` fixes on `touch`, spread into its parameters.
 * - `SCRATCH`: The values the `touchScratch` row of `HumanTouchRows` fixes on `touch`, spread into its parameters.
 * - `EMBLEM_SALUTE`: The values the `salute` row of `HumanEmblem` fixes on `touch`, spread into its parameters.
 * - `EMBLEM_HAND_ON_HEART`: The values the `handOnHeart` row of `HumanEmblem` fixes on `touch`, spread into its parameters.
 * - `EMBLEM_BLOWN_KISS_SEND`: The values the `blownKissSend` row of `HumanEmblem` fixes on `touch`, spread into its parameters.
 * - `EMBLEM_COVER_MOUTH`: The values the `coverMouth` row of `HumanEmblem` fixes on `touch`, spread into its parameters.
 * - `EMBLEM_COVER_EARS`: The values the `coverEars` row of `HumanEmblem` fixes on `touch`, spread into its parameters.
 * - `SOCIAL_SHOULDER_PAT`: The values the `shoulderPat` row of `HumanSocial` fixes on `touch`, spread into its parameters.
 * - `SOCIAL_COMFORT`: The values the `comfort` row of `HumanSocial` fixes on `touch`, spread into its parameters.
 * - `SOCIAL_FIRM_PRESS`: The values the `firmPress` row of `HumanSocial` fixes on `touch`, spread into its parameters.
 * - `PARTNER_DANCE_HOLD`: The values the `danceHold` row of `HumanPartner` fixes on `touch`, spread into its parameters.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 * - `AutoMovieMotionHumanTouchEffector`: What touches in a touch: a hand surface, or the tip of a tool the hand holds, stated in the hand's anatomical axes (where the fingers point, where the palm faces and where the thumb points at rest) as shares of the hand's length, so a held cup's rim or a spoon's bowl is placed on the mouth without a prop.
 * - `AutoMovieMotionHumanTouchForm`: The kinds of a touch and how each moves in the region's surface frame: the social touch gestures of Jung et al.
 * - `AutoMovieMotionHumanTouchLaid`: An effector laid on a region at rest, before any stroke moves it: the arm goal that lays it, what its two directions lie on by the touch's lay, the elbow's hint for that goal, the arm solved there as the reference every second of a stroke is held to, and the elbow settled with a hand that meets its place end on.
 * - `AutoMovieMotionHumanTouchPath`: The direction a hand lies on a surface region when the arm chooses it (`lay`), and the direction a hand that continues its forearm points at a place (`reach`).
 * - `AutoMovieMotionHumanTouchStance`: What the body behind the arm does so a hand reaches a region its arm alone does not: the shoulder girdle lifted and a rise onto the toes for a region above the shoulder, then a lean from the hips for what is still beyond the arm.
 * - `AutoMovieMotionHumanTouchUpright`: How a held vessel is turned about its own upright axis at a region, so the arm that brings it there keeps it upright, and how far it is leaned.
 * - `AutoMovieMotionHumanTouchDrink`: How far a vessel is leaned toward the face at the lips, and turned there, so the arm that brings it holds it as a person drinks: the least lean, in `LEAN_STEP` degrees up to `LEAN`, whose fitted arm drinks with the vessel where it was asked (`AutoMovieMotionHumanDrinkingArm.drinks`, its reached axis within a `LEAN_STEP` of the asked one), with the facing (`AutoMovieMotionHumanTouchUpright`) whose hand meets the vessel's axis best, or for a vessel held by the grasp it was taken up by, the lean alone (`held`).
 * - `HumanSeatedReach`: A seated reach with the trunk below the arm in task priority: the hand's target first, and when the arm alone falls short, a lean of the trunk forward, which the seat bears: the hips flex the trunk over the seat and the spine's three joints flex above them, each within the flexion room its range leaves.
 * - `HumanClasp`: Hold on with the hands (`IAutoMovieMotionHumanClasp`): the entry posture carried by its own carrier's contact, or standing where it is, while each named hand reaches its hold over `REACH` and follows it: a partner's displayed bone or another prop's moving contact.
 * - `HumanDrape`: A limp body laid across a saddle (`IAutoMovieMotionHumanDrape`): in the carrier contact's frame the body lies face down across the seat, its trunk level and pointing to the head's side, the hips resting on the seat a trunk's half depth above it and folded so the legs hang down the other side, the arms and head hanging; it comes to lie so from the entry over `lay` by a minimum-jerk share and is carried by the contact.
 * - `HumanSocial`: Things two people do together or to each other in company, as rows of shipped actions and as mutual records over them (`HumanChain.mutual`).
 * - `HumanPartner`: Things two people do as partners in sport and dance, each a row of a law whose roles share a stated instant or a meeting.
 * - `HumanTouchRows`: The contact strokes as rows (#3361): each kind of `touch` under a name of its own, the site, the effector, the side and the target open, so one row serves every site (#3357).
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by `typeof` and never wrapped, so its parameters, units, frames and refusals are those its own comment states. The family's shared model and each law's parameters are declared by {@link IAutoMovieMotionHumanTouch} in `@automovie/interface`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the family covers, how its members relate and where its model is declared.
 * @evidence contracts/development/design.md#principled-representation Each member is the shipped law, preset or row itself, so the units, frames and invariants are those its owner states.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members the family groups; each stays owned by its module.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is wrapped, widened or redefined, so no behaviour is added here.
 */
export namespace AutoMovieMotionHumanTouch {
  /**
   * One or both hands touch a partner's or the performer's own region with a
   * tap, pat, stroke, rub, press, squeeze, hold or scratch (Jung et al. 2017).
   * Social touches (#3284) and self-directed touches (#3285) are rows of this
   * one law, each stating effector, region, kind and timing.
   *
   * Free-space transport brings the hand to the region; the kind's stroke
   * repeats `count` times, holds, then returns in the reach's time. Manner
   * scales tempo, lift and travel. The entry body holds except for the rise
   * and lean the arm needs. A grounded performer can take one step toward an
   * external site beyond its planted reach (`touchStance`). Seated and
   * carried touches are bounded by the reach from their existing base.
   * Self regions use the entry limb, except that the other arm is presented
   * across the waist, palm down, on the same envelope (`touchPresented`). A leg's
   * region follows the legs as a lean leaves them. Thus a touched limb stays
   * independent of the touching hand or has an explicit presentation.
   *
   * Events: the phrase instants (`ready` on the region, `strokeStart` to
   * `strokeEnd` the repetitions, `relax` leaving). A touch may be cut before
   * it arrives or from `relax` on, into standing, a walk, a gesture or another
   * touch, the declined handshake's rule.
   */
  export import touch = touchLaw;

  /**
   * A high five, a low five or a fist bump between two standing partners: both
   * bring one hand to one shared point between them and meet there at one
   * shared instant (#3284), the mutual goal the handshake uses
   * (`AutoMovieMotionMeeting`).
   *
   * The meeting point is the pair's mutual goal (`resolveAutoMovieMutualGoal`
   * on the true wrist reach of the two opposed hand frames): the action
   * prefers the mean of the two crown heights for a
   * high five, of their waist heights for a low five and of their chest
   * heights for a fist bump (provisional), and the point lies at that height
   * where both arms are the same share of their comfortable reaches, moved
   * down or up only as far as both arms' reach demands. Partners of unequal
   * stature therefore meet where the shorter one can reach. Seated partners
   * whose arms alone fall short lean their trunks forward over the seat, the
   * arm's target first, in equal shares of each hip's flexion room
   * (`HumanSeatedReach`, Chan and Dubey 1995); partners no point lies within
   * both arms of, leaned as far as they can, are refused, never stretched. Each
   * role's hand reaches it in the free-space transport time of its distance
   * (`AutoMovieMotionHumanTiming.transport`), and at least the time its arm's
   * arc takes within the audit's travel bound (`touchReach.meeting`); the pair
   * meets when the slower
   * arrives, both stay 0.1 s (provisional, the rebound) and go back in the
   * reach's time. The palms (or the fists) face each other, each surface's
   * skin on the point.
   *
   * With `prop`, each role brings the prop its hand holds instead of the hand:
   * the prop's point (a glass's `lip`) comes to the shared point with the
   * vessel upright, so two glasses meet rim to rim as in a toast, and the
   * hand keeps its prop afterwards (`HumanHeld`).
   *
   * Events: the phrase instants, with `meet` at `ready` and `rebound` at
   * `relax`; both partners share `meet`.
   */
  export import highFive = highFiveLaw;

  /**
   * A kiss while standing: the lips brought to a partner's region (a cheek, the
   * forehead, the crown, the lips, the back of a hand) by leaning the body
   * from the hips and flexing the neck, the head turned to one side for a
   * cheek or the lips so the noses stay clear (#3284).
   *
   * The lean and the neck's flexion are solved at plan time so the mouth
   * region of the leaned posture lands on the target as it stands at the
   * kiss's start: a grid of pitch and flexion at 5 degree steps, then 1 degree
   * steps about the best, then a lean to the side the target lies on, as far
   * as the hips' range lets a body on planted feet lean (`ROLL`), and, when
   * the mouth is still short, a rise onto the toes of up to 35 degrees of
   * heel (provisional). The head turns 30 degrees
   * for a cheek or the lips (provisional), to the right unless `side` says
   * otherwise; Guntürkün 2003 observed a two-to-one rightward bias, which
   * Sedgewick et al. 2019 did not find, so the side is a parameter. The
   * approach is the free-space transport
   * of the mouth's travel, the kiss holds 0.6 s (provisional) and the return
   * takes the approach's time. The feet stay planted where they stand, so no
   * balance is solved: the lean and the rise are the kiss's key poses within
   * their ranges. A difference of more than `NEAR` that the lean, the neck
   * and the toes cannot close is out of reach and refused with what they
   * reach, rather than pressed on into the partner; a step in is not drafted
   * yet.
   *
   * Events: the phrase instants, with `contact` at `ready` and `part` at
   * `relax`.
   */
  export import kiss = kissLaw;

  /**
   * A touch with the leg while standing (#3357's effectors below the hip): the
   * toes, the heel or the knee of one leg is brought onto a place and held
   * there, the other leg bearing the body.
   *
   * The body first moves over its standing foot: the root is shifted level
   * until the pelvis stands over that ankle, or, with balance asked
   * (`IAutoMovieMotionHumanBalance`), until the centre of mass does
   * (`HumanBalance.prepareCentre`), the standing leg keeping its planted goal. The moving leg is then a goal
   * of the posture resolver, as an arm is: for the toes and the heel the
   * ankle is placed so that part of the foot, read in the foot's rest frame
   * and turned as the foot stood at the entry, lies on the place; for the knee
   * the thigh's length fixes where the hip must be, so the root is shifted
   * further along the level line to the place until the knee, the leg's bend
   * hint, is exactly a thigh from the displayed hip, and the shank hangs
   * from it with the foot left free, since a foot held as it stood would
   * state another plane for the knee. A place the leg does not reach so is
   * refused.
   *
   * Events: `ready` on the place, `strokeEnd` and `relax` at the hold's end,
   * as a touch's. The leg may be cut from `relax` on.
   *
   * First pass: the foot's parts are offsets of the ankle (provisional where
   * marked), the shin is the round kick's and has no slow stroke here, the
   * contact is not declared as a window, and the standing balance is the
   * static one, not checked through the lift.
   */
  export import legTouch = legTouchLaw;

  /**
   * A region of a target as a frame: a person's region or a prop's point
   * through the context's aim, a trunk or head region of the performer on
   * the posture, and a limb region of the performer on the entry pose, which
   * a touch that does not move that limb leaves where it was.
   *
   * @param context The action's context.
   * @param target The target.
   * @param seconds Film seconds.
   * @param posture The posture so far.
   * @param entry The entry pose's resolved bones, or a supplier of the bones to read a region off the trunk on, called only for such a region.
   * @returns The point and the outward normal.
   */
  export const region: typeof touchRegionFrameLaw = touchRegionFrameLaw;

  /**
   * A touch: the arm and the fingers on one clock. The arm's whole touch is
   * planned as one trajectory (`AutoMovieMotionHumanArmPlanned`): its reach
   * from its entry angles, its hold on the goal laid on the region from
   * `ready` to `relax` and its return, clear of the body all the way; a hand
   * path solved second by second would let the elbow change sides between them.
   * Between `strokeStart` and `strokeEnd` the goal is lifted along the
   * region's normal by `lift sin^2(pi n u)`, which touches down at every
   * repetition's end, and moved along its tangent by the clock's windowed
   * wave of `n` cycles. A held vessel keeps its attitude on the way
   * (`AutoMovieMotionHumanDrinkingArm.carried`).
   *
   * @param props The touch.
   * @returns The arm's and the hand's primitives, the arm's alone when the fingers are kept; the arm carries the contact window from `ready` to `relax` when a support is given and the hand, not a held tool, is what touches it, and one `lie` window over the same span for each of its segments declared resting (`ITouch.rests`).
   * @throws {Error} When the count is not a positive whole number.
   */
  export const touchPrimitive: typeof touchPrimitiveLaw = touchPrimitiveLaw;

  /**
   * How far a touch's arm is from its entry angles to its goal at a second:
   * the clock's envelope, rising from `start` to `ready` and falling from
   * `relax` to `end`.
   *
   * @param clock The touch's clock.
   * @param seconds Seconds since the action's start.
   * @returns A share in [0, 1].
   */
  export const share: typeof touchEnvelopeLaw = touchEnvelopeLaw;

  /**
   * The last share of a carry's progress (`touchEnvelope`) over which a vessel leaned at the face (`ITouch.lean`) tips toward it, and the first share of the way back over which it is righted, by the hand's attitude (provisional: a drinker tips the glass at the lips).
   */
  export const TIP: typeof TOUCH_TIP = TOUCH_TIP;

  /**
   * The goal a touch's arm is carried toward at each second: the effector
   * laid on the region, lifted along its normal by `lift sin^2(pi n u)` and
   * moved along its tangent by the clock's windowed wave of `n` cycles
   * between `strokeStart` and `strokeEnd`, and stood off along the normal
   * by the share of the carry still to go. Another arm that works with the
   * same hand (a second hand on a held tool) reads the same goal.
   *
   * @param props The touch.
   * @returns The goal at a posture and a second since the action's start.
   * @throws {Error} When the count is not a positive whole number.
   */
  export const goal: typeof touchGoalLaw = touchGoalLaw;

  /**
   * Rest the head on a partner (#4012). The resting head's own region, the
   * temple on the side the partner's region lies unless named, is brought to
   * the partner's region. The body leans from the hips as a kiss does
   * (`kissBody`, seated or on planted feet), the neck flexes and the head
   * bends to the side (`headRestAim`): solved once against the region where
   * the performer sees it at the start, then corrected at every second
   * against the region where it is felt, a held limb's feedback delay before
   * (`HumanPerception.HELD`, as `touchHold.felt` reads a partner under the
   * hand), so the head follows the partner's shoulder as the partner
   * breathes or turns. The head goes down in the free transport time of its
   * travel, rests the authored span on a `head` window on the partner's
   * region loaded with half the weight of the head and neck segments in the
   * body's own mass model, and comes up in the same time. A region the lean, the
   * neck and the side bend cannot bring the head to within `NEAR` is refused
   * with the miss and the angles, so a much shorter partner's shoulder is out
   * of reach standing.
   */
  export const headRest: typeof headRestLaw = headRestLaw;

  /**
   * Lean back against a seated partner's back (#4012). Each of the two reads
   * its own and the other's upper back on the displayed bodies at the start
   * and leans its trunk back
   * from the hips over the seat (the kiss's lean, `kissBody`, seated) by the
   * least pitch that moves its own upper back (by the lean model's change from
   * upright) to half a skin contact short of the upright plane halfway between
   * the two across the floor, each back at its own height, so the two backs
   * rest a skin contact apart and neither presses into the other; the neck
   * flexes by the lean so the head stays upright and does not pass that plane
   * first.
   * The trunk's weight leans onto the partner: the window's load is the
   * trunk's share of the body's mass times the tangent of the lean
   * (moments about the hips with the contact taken at the trunk's mass
   * centre, provisional). A standing performer, or a meeting point beyond
   * `BACK`, is refused. Given the partner's own lean (`with`), the two must
   * lean and sit up together within a frame: one that sits up or leaves
   * while the other still leans is refused, naming who would be left
   * leaning on nothing.
   */
  export const backToBack: typeof backToBackLaw = backToBackLaw;

  /**
   * Sit on a seated partner's lap (#4012). The lap is the seated partner's
   * thighs where they are at the start: its height is the top of the two
   * thighs' middles (`thighFrontLeft` and `thighFrontRight`), its heading
   * the partner's hips to knees. The sit law (`sit`) sits the body onto it
   * as onto a seat facing that heading, the seat's front edge set so the
   * sitter's seat socket comes to rest over the thighs' middles; a lap above
   * the sitter's band is got onto as a high seat, the feet hanging. The
   * sit's seat window bears instead on the partner: half on each thigh. A
   * partner whose thighs are not near level is refused as not seated.
   */
  export const sitOnLap: typeof sitOnLapLaw = sitOnLapLaw;

  /**
   * Embrace a partner from behind (#4012). The lean from the hips is solved
   * first, the least forward pitch that lays the chest's sternum region on
   * the partner's upper back (the kiss's lean model, `kissBody`, on planted
   * feet); then the knees' sink (up to `SINK`), the side lean (within the
   * kiss's `ROLL`), the head's turn
   * (`TWIST`), the neck's flexion and side bend and its protraction (`PROTRACT`) that bring the chin nearest
   * the top of the partner's shoulder (the shoulder's region), by turns on
   * coarse grids refined by
   * degrees; a chin still behind and below the shoulder then reaches forward in
   * closed form, the neck flexing about its base by the angle that carries the
   * chin forward to it and the heels rising (within the kiss's `RAISE`) by the
   * height that flexion costs plus what was missing. A
   * chest already in the partner's back, a back the lean cannot reach, or a
   * chin left farther than `NEAR` from the shoulder is refused with the gap or
   * the miss. The hands meet on the partner's abdomen, one placement for
   * both: each palm on the partner's own surface on its side of the midline
   * (a ray onto the colliders), the fingers toward the midline, the palm's
   * middle as far from it as the fingertips reach and a skin contact more, so
   * the fingertips meet there without crossing. Both arms are laid as one
   * course (`courseArmGoal`) around the partner's trunk, thighs and arms, the
   * palms lying on the abdomen's. Everything is read where the partner stands
   * at the start. Loaded windows: the chest on the upper back (`LEAN`), the
   * chin on the shoulder, the palms on the abdomen.
   */
  export const embraceFromBehind: typeof embraceFromBehindLaw =
    embraceFromBehindLaw;

  /**
   * A criss-cross hug between closely staged, facing partners with their heads
   * offset. Each right arm reaches around the partner's shoulder to the upper
   * back and each left arm around the waist to the lower back. Each performer's
   * hands share a hold and return to their entry poses. Use with
   * `HumanChain.mutual` and the `one` and `other` chains. The touch law fits the
   * arms to the staged bodies and may refuse an unreachable or obstructed reach.
   *
   * Dueren et al. (2021, Fig. 2) studied the criss-cross arm placement and used
   * 1, 5 and 10 second holds measured from hand contact. The `hold` parameter
   * sets the nominal touch dwell in seconds and defaults to one for a brief greeting.
   * https://doi.org/10.1016/j.actpsy.2021.103441
   */
  export const hug: typeof hugLaw = hugLaw;

  /**
   * Two facing partners within arm's reach each rest their right palm on the
   * other's left shoulder, then return their hands. Pass to `HumanChain.mutual`
   * with the `one` and `other` chains. The reaches start together and each palm
   * stays through the touch law's contact phase and the nominal `hold` dwell
   * in seconds. The touch law can stretch the dwell with the rest of the action.
   * The touch law fits the arms and refuses targets out of reach.
   *
   * Yahiro et al. (2026) studied face-to-face palm contact on the shoulder in
   * greetings and comforting gestures. Reciprocity and the default one-second
   * hold are staging choices. https://doi.org/10.5100/jje.62.75
   */
  export const shoulderClasp: typeof shoulderClaspLaw = shoulderClaspLaw;

  /**
   * What touches in a touch: a hand surface, or the tip of a tool the hand
   * holds, stated in the hand's anatomical axes (where the fingers point, where
   * the palm faces and where the thumb points at rest) as shares of the hand's
   * length, so a held cup's rim or a spoon's bowl is placed on the mouth
   * without a prop. Also the effector's displayed point the verdicts read, the
   * skin's stand-off from the hand's own colliders and the arm goal that lays
   * the effector on a contact point.
   */
  export import AutoMovieMotionHumanTouchEffector = AutoMovieMotionHumanTouchEffectorSource;

  /**
   * The kinds of a touch and how each moves in the region's surface frame: the
   * social touch gestures of Jung et al. 2017 (the corpus of social touch)
   * reduced to a lift off the surface along its normal (a tap, a pat), a
   * travel along it (a stroke, a rub, a scratch) or neither (a press, a
   * squeeze, a hold), with the repetition's length and the fingers' curl.
   *
   * A stroke moves at the pleasant-touch speed of Loken et al. 2009 (1 to 10
   * cm/s; the peak is set to 5 cm/s). The other periods and every amplitude
   * are provisional shares of the hand's length.
   */
  export import AutoMovieMotionHumanTouchForm = AutoMovieMotionHumanTouchFormSource;

  /**
   * An effector laid on a region at rest, before any stroke moves it: the arm
   * goal that lays it, what its two directions lie on by the touch's lay, the
   * elbow's hint for that goal, the arm solved there as the reference every
   * second of a stroke is held to, and the elbow settled with a hand that
   * meets its place end on. The touch stroke (`AutoMovieMotionHumanTouch`) and
   * every law that plans one read these once, on the entry posture.
   */
  export import AutoMovieMotionHumanTouchLaid = AutoMovieMotionHumanTouchLaidSource;

  /**
   * The direction a hand lies on a surface region when the arm chooses it
   * (`lay`), and the direction a hand that continues its forearm points at a
   * place (`reach`). Read by the touch stroke
   * (`AutoMovieMotionHumanTouch`), whose transport is a joint-space carry and
   * so needs no path of its own.
   */
  export import AutoMovieMotionHumanTouchPath = AutoMovieMotionHumanTouchPathSource;

  /**
   * What the body behind the arm does so a hand reaches a region its arm
   * alone does not: the shoulder girdle lifted and a rise onto the toes for a
   * region above the shoulder, then a lean from the hips for what is still
   * beyond the arm.
   *
   * A person reaching up to a taller person's face, or to a shelf, lifts the
   * shoulder with the arm (the scapula turns up as the arm is raised, Inman,
   * Saunders and Abbott 1944) and then raises the heels, because leaning
   * forward lowers the shoulder and takes it away from a place above it. Each
   * moves by the least angle that brings the wrist within the kept share of
   * the arm, and no further than the shoulder needs to come level with the
   * wrist or than its limit (`GIRDLE`, `RAISE`). What remains is leaned into
   * (`AutoMovieMotionHumanLeanInto`). A region off to the side that the forward
   * lean leaves out of reach is turned toward first: the trunk twists about
   * its long axis by the heading's angle to the line from the shoulder to the
   * wrist, shared by the lumbar and thoracic spine within their twist ranges,
   * as a person turns the chest toward a hand reaching across the body. The
   * lean, solved again on the turned trunk, refuses a region still out of
   * reach at its limit. Two hands' regions off to one side (`faces`) are
   * turned toward from the start, the leaned trunk facing their middle from
   * the shoulders, the turn and the lean solved together to their fixed
   * point, so both arms reach from that side and neither crosses the body.
   */
  export import AutoMovieMotionHumanTouchStance = AutoMovieMotionHumanTouchStanceSource;

  /**
   * How a held vessel is turned about its own upright axis at a region, so
   * the arm that brings it there keeps it upright, and how far it is leaned.
   *
   * Standing a vessel upright fixes one axis of the hand; its turn about that
   * axis is free, and most of those turns ask the forearm and the wrist for
   * more than their range, so the resolver gives way on the rotation and the
   * vessel tilts. Each candidate turns the region's level normal by a multiple
   * of `STEP` degrees within `SPAN` either way (`facings`); each is solved on
   * the posture, and the facing whose reached hand keeps the vessel's axis
   * nearest the asked one is taken, the nearest to head on on a tie, so the
   * first that keeps it exactly ends the search. The turn
   * about that axis is not counted, since it is free. A lean toward the face
   * is a turn of the axis about the level line across the region (`tip`);
   * the least lean that lets the arm drink is `AutoMovieMotionHumanTouchDrink`'s.
   */
  export import AutoMovieMotionHumanTouchUpright = AutoMovieMotionHumanTouchUprightSource;

  /**
   * How far a vessel is leaned toward the face at the lips, and turned there,
   * so the arm that brings it holds it as a person drinks: the least lean, in
   * `LEAN_STEP` degrees up to `LEAN`, whose fitted arm drinks with the
   * vessel where it was asked (`AutoMovieMotionHumanDrinkingArm.drinks`, its
   * reached axis within a `LEAN_STEP` of the asked one), with the facing
   * (`AutoMovieMotionHumanTouchUpright`) whose hand meets the vessel's axis
   * best, or for a vessel held by the grasp it was taken up by, the lean
   * alone (`held`). Held exactly upright at the lips the vessel asks the elbow
   * up to the shoulder's height; a drinker tips the glass at the lips with the
   * elbow low (Murphy, Willén and Sunnerhagen 2011).
   */
  export import AutoMovieMotionHumanTouchDrink = AutoMovieMotionHumanTouchDrinkSource;

  /**
   * The parts of the hand a touch lays on its region (`touch.With`) and each
   * one's effector (`touch.EFFECTORS`).
   */
  export import touchEffectors = touchEffectorsLaw;

  /**
   * Where on a region a touch lands (#3357): a region is a patch of skin, not
   * one point, so a touch names a place on it. The place is stated by the
   * author, drawn by the seed, or chosen by a rule; on a prop's contact that
   * has a length, it is a share along that length (`along`, `span`).
   *
   * A place is an offset in the region's own surface: `up` along the surface
   * toward the head (the world's up laid into the surface) and `out` to the
   * right of someone facing the surface. On a level surface, where the world's
   * up has no direction in it, `up` is the world's forward.
   */
  export import touchSite = touchSiteLaw;

  /**
   * A seated reach with the trunk below the arm in task priority: the hand's
   * target first, and when the arm alone falls short, a lean of the trunk
   * forward, which the seat bears: the hips flex the trunk over the seat and
   * the spine's three joints flex above them, each within the flexion room
   * its range leaves. The joints share the lean in one share of each one's
   * room, and two seated partners in one share of each one's chain, the
   * joint-limit-weighted least-norm resolution of the redundancy (Chan and
   * Dubey 1995, "A weighted least-norm solution based scheme for avoiding
   * joint limits for redundant joint manipulators", IEEE Trans. Robot. Autom.
   * 11(2)): each joint's motion weighted by its range, so none reaches its
   * limit before another.
   *
   * A standing body leans none here: its reach stays its arm's, as the
   * standing laws already plan it.
   */
  export import HumanSeatedReach = HumanSeatedReachSource;

  /**
   * Hold on with the hands (`IAutoMovieMotionHumanClasp`): the entry posture carried by its own carrier's contact, or standing where it is, while each named hand reaches its hold over `REACH` and follows it: a partner's displayed bone or another prop's moving contact. Register `HumanClasp` to use it.
   *
   * The author gives `seconds`; the hand's reach to its hold is provisional (`HumanClasp`); a handshake, a held hand.
   */
  export const HumanClasp: typeof HumanClaspSource = HumanClaspSource;

  /**
   * A limp body laid across a saddle (`IAutoMovieMotionHumanDrape`): in the carrier contact's frame the body lies face down across the seat, its trunk level and pointing to the head's side, the hips resting on the seat a trunk's half depth above it and folded so the legs hang down the other side, the arms and head hanging; it comes to lie so from the entry over `lay` by a minimum-jerk share and is carried by the contact. Register `HumanDrape` to use it.
   *
   * The author gives `seconds` of the drape after the laying movement; no natural value is defined (provisional).
   */
  export const HumanDrape: typeof HumanDrapeSource = HumanDrapeSource;

  /**
   * Things two people do together or to each other in company, as rows of
   * shipped actions and as mutual records over them (`HumanChain.mutual`).
   * Register the rows a film uses.
   */
  export import HumanSocial = HumanSocialSource;

  /**
   * Things two people do as partners in sport and dance, each a row of a law
   * whose roles share a stated instant or a meeting. Register the rows a film
   * uses.
   */
  export import HumanPartner = HumanPartnerSource;

  /**
   * The contact strokes as rows (#3361): each kind of `touch` under a name of its own, the site, the effector, the side and the target open, so one row serves every site (#3357).
   *
   * Each row writes no motion: its law plans it, so it fits any body, refuses and is checked as the law is, and its draws are keyed by its own name. The rows over the arm's phrases themselves are `HumanUpperRows`.
   */
  export import HumanTouchRows = HumanTouchRowsSource;

  /**
   * The values the `touchTap` row of `HumanTouchRows` fixes on `touch`, spread into its parameters. `touch` of kind `tap`: 3 taps of 0.3 s, then 0.4 s on the place, in all 1.3 s after the reach; a light attention-getting touch on a shoulder or an arm ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override; provisional except the stroke).
   */
  export const TAP: typeof HUMAN_TOUCH_TAP = HUMAN_TOUCH_TAP;

  /**
   * The values the `touchPat` row of `HumanTouchRows` fixes on `touch`, spread into its parameters. `touch` of kind `pat`: 3 pats of 0.4 s, then 0.4 s, 1.6 s after the reach; comfort, praise, a friendly pat ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override; provisional except the stroke).
   */
  export const PAT: typeof HUMAN_TOUCH_PAT = HUMAN_TOUCH_PAT;

  /**
   * The values the `touchStroke` row of `HumanTouchRows` fixes on `touch`, spread into its parameters. `touch` of kind `stroke`: one stroke at a 5 cm/s peak (the pleasant-touch rate, Loken et al. 2009), about 5 s for a 0.2 m hand, then 0.4 s; a caress, soothing ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override; provisional except the stroke).
   */
  export const STROKE: typeof HUMAN_TOUCH_STROKE = HUMAN_TOUCH_STROKE;

  /**
   * The values the `touchRub` row of `HumanTouchRows` fixes on `touch`, spread into its parameters. `touch` of kind `rub`: 3 rubs of 0.5 s, then 0.4 s, 1.9 s after the reach; warming, soothing, rubbing a shoulder or a back ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override; provisional except the stroke).
   */
  export const RUB: typeof HUMAN_TOUCH_RUB = HUMAN_TOUCH_RUB;

  /**
   * The values the `touchPress` row of `HumanTouchRows` fixes on `touch`, spread into its parameters. `touch` of kind `press`: one press of 0.4 s, then held 1.2 s, 1.6 s after the reach; a firm touch, pushing a button on a person, steadying ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override; provisional except the stroke).
   */
  export const PRESS: typeof HUMAN_TOUCH_PRESS = HUMAN_TOUCH_PRESS;

  /**
   * The values the `touchSqueeze` row of `HumanTouchRows` fixes on `touch`, spread into its parameters. `touch` of kind `squeeze`: one squeeze of 0.4 s with the fingers curled 20 degrees, held 1.2 s, 1.6 s after the reach; reassurance, a grip on an arm or a hand ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override; provisional except the stroke).
   */
  export const SQUEEZE: typeof HUMAN_TOUCH_SQUEEZE = HUMAN_TOUCH_SQUEEZE;

  /**
   * The values the `touchHold` row of `HumanTouchRows` fixes on `touch`, spread into its parameters. `touch` of kind `hold`: one placement of 0.4 s, then held 1.2 s, 1.6 s after the reach; a hand laid on a shoulder or an arm ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override; provisional except the stroke).
   */
  export const HOLD: typeof HUMAN_TOUCH_HOLD = HUMAN_TOUCH_HOLD;

  /**
   * The values the `touchScratch` row of `HumanTouchRows` fixes on `touch`, spread into its parameters. `touch` of kind `scratch`: 3 scratches of 0.2 s with curled fingers, then 0.4 s, 1.0 s after the reach; an itch, scratching the head or an arm ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override; provisional except the stroke).
   */
  export const SCRATCH: typeof HUMAN_TOUCH_SCRATCH = HUMAN_TOUCH_SCRATCH;

  /**
   * The values the `salute` row of `HumanEmblem` fixes on `touch`, spread into its parameters. The military hand salute (US Army TC 3-21.5): the forefinger's end at the right brow, the hand in line with the forearm, the upper arm level.
   */
  export const EMBLEM_SALUTE: typeof HUMAN_TOUCH_EMBLEM_SALUTE =
    HUMAN_TOUCH_EMBLEM_SALUTE;

  /**
   * The values the `handOnHeart` row of `HumanEmblem` fixes on `touch`, spread into its parameters. A hand on the heart: the right palm on the left chest.
   */
  export const EMBLEM_HAND_ON_HEART: typeof HUMAN_TOUCH_EMBLEM_HAND_ON_HEART =
    HUMAN_TOUCH_EMBLEM_HAND_ON_HEART;

  /**
   * The values the `blownKissSend` row of `HumanEmblem` fixes on `touch`, spread into its parameters. The blown kiss's send, performed after `blownKiss`: the open hand, palm up, swept forward from the lips and held a moment at the shoulder's height, 0.818 of the stature, the forearm and the hand's length, 0.146 and 0.108 of it, ahead of the performer (Drillis and Contini's segment proportions, as Winter's Biomechanics and Motor Control of Human Movement tabulates them), in the performer's own statures so it fits every body.
   */
  export const EMBLEM_BLOWN_KISS_SEND: typeof HUMAN_TOUCH_EMBLEM_BLOWN_KISS_SEND =
    HUMAN_TOUCH_EMBLEM_BLOWN_KISS_SEND;

  /**
   * The values the `coverMouth` row of `HumanEmblem` fixes on `touch`, spread into its parameters. A hand over the mouth, as at a gasp or a yawn.
   */
  export const EMBLEM_COVER_MOUTH: typeof HUMAN_TOUCH_EMBLEM_COVER_MOUTH =
    HUMAN_TOUCH_EMBLEM_COVER_MOUTH;

  /**
   * The values the `coverEars` row of `HumanEmblem` fixes on `touch`, spread into its parameters. Both hands over the ears.
   */
  export const EMBLEM_COVER_EARS: typeof HUMAN_TOUCH_EMBLEM_COVER_EARS =
    HUMAN_TOUCH_EMBLEM_COVER_EARS;

  /**
   * The values the `shoulderPat` row of `HumanSocial` fixes on `touch`, spread into its parameters. A pat on the partner's shoulder; the composition gives the shoulder as the target. Two pats of 0.4 s, then 0.4 s, 1.2 s after the reach (`AutoMovieMotionHumanTouchForm.FORMS`, provisional); encouragement, praise.
   */
  export const SOCIAL_SHOULDER_PAT: typeof HUMAN_TOUCH_SOCIAL_SHOULDER_PAT =
    HUMAN_TOUCH_SOCIAL_SHOULDER_PAT;

  /**
   * The values the `comfort` row of `HumanSocial` fixes on `touch`, spread into its parameters. A comforting hand held on the partner. Held 2 s after the reach (provisional); condolence, reassurance.
   */
  export const SOCIAL_COMFORT: typeof HUMAN_TOUCH_SOCIAL_COMFORT =
    HUMAN_TOUCH_SOCIAL_COMFORT;

  /**
   * The values the `firmPress` row of `HumanSocial` fixes on `touch`, spread into its parameters. A firm, slow pat or press of the palm on the partner (Laban's press: strong, sustained, direct); the composition gives the region. The press takes 0.4 s and holds 1.2 s (`touch`'s defaults, provisional); steadying, emphasis.
   */
  export const SOCIAL_FIRM_PRESS: typeof HUMAN_TOUCH_SOCIAL_FIRM_PRESS =
    HUMAN_TOUCH_SOCIAL_FIRM_PRESS;

  /**
   * The values the `danceHold` row of `HumanPartner` fixes on `touch`, spread into its parameters. The follower's hold of a walking partner dance once both stand: her left palm laid on the leader and held 1.5 s. The composition gives the leader's region (his near shoulder at her left in a promenade). A hold kept while walking is coupled travel (#3341), not staged here: a speed-matching follower lags while the leader walks.
   */
  export const PARTNER_DANCE_HOLD: typeof HUMAN_TOUCH_PARTNER_DANCE_HOLD =
    HUMAN_TOUCH_PARTNER_DANCE_HOLD;
}
