import { TOUCH_TIP } from "../../compose/internal/TOUCH_TIP";
import { touchEnvelope as touchEnvelopeLaw } from "../../compose/internal/touchEnvelope";
import { touchGoal as touchGoalLaw } from "../../compose/internal/touchGoal";
import { touchPrimitive as touchPrimitiveLaw } from "../../compose/internal/touchPrimitive";
import { touchRegionFrame as touchRegionFrameLaw } from "../../compose/internal/touchRegionFrame";
import { hug as hugLaw } from "../../lexicon/internal/hug";
import { shoulderClasp as shoulderClaspLaw } from "../../lexicon/internal/shoulderClasp";
import { backToBack as backToBackLaw } from "../../touch/internal/backToBack";
import { embraceFromBehind as embraceFromBehindLaw } from "../../touch/internal/embraceFromBehind";
import { headRest as headRestLaw } from "../../touch/internal/headRest";
import { highFive as highFiveLaw } from "../../touch/internal/highFive";
import { kiss as kissLaw } from "../../touch/internal/kiss";
import { legTouch as legTouchLaw } from "../../touch/internal/legTouch";
import { sitOnLap as sitOnLapLaw } from "../../touch/internal/sitOnLap";
import { touch as touchLaw } from "../../touch/internal/touch";
import { touchEffectors as touchEffectorsLaw } from "../../touch/internal/touchEffectors";
import { touchSite as touchSiteLaw } from "../../touch/internal/touchSite";

/*
 * The touch family's laws and helpers, each the shipped value under its family
 * name (`AutoMovieMotionHumanTouch`), with its own comment.
 */
export namespace AutoMovieMotionHumanTouchLaws {
  /*
   * One or both hands touch a partner's or the performer's own region with a
   * tap, pat, stroke, rub, press, squeeze, hold or scratch (Jung et al. 2017).
   * Social touches and self-directed touches are rows of this one law, each
   * stating effector, region, kind and timing.
   *
   * Free-space transport brings the hand to the region; the kind's stroke
   * repeats `count` times, holds, then returns in the reach's time. Manner
   * scales tempo, lift and travel. The entry body holds except for the rise and
   * lean the arm needs. A grounded performer can take one step toward an
   * external site beyond its planted reach (`touchStance`). Seated and carried
   * touches are bounded by the reach from their existing base. Self regions use
   * the entry limb, except that the other arm is presented across the waist,
   * palm down, on the same envelope (`touchPresented`). A leg's region follows
   * the legs as a lean leaves them. Thus a touched limb stays independent of
   * the touching hand or has an explicit presentation.
   *
   * Events: the phrase instants (`ready` on the region, `strokeStart` to
   * `strokeEnd` the repetitions, `relax` leaving). A touch may be cut before it
   * arrives or from `relax` on, into standing, a walk, a gesture or another
   * touch, the declined handshake's rule.
   */
  export import touch = touchLaw;

  /*
   * A high five, a low five or a fist bump between two standing partners: both
   * bring one hand to one shared point between them and meet there at one
   * shared instant, the mutual goal the handshake uses
   * (`AutoMovieMotionMeeting`).
   *
   * The meeting point is the pair's mutual goal (`resolveAutoMovieMutualGoal`
   * on the true wrist reach of the two opposed hand frames): the action prefers
   * the mean of the two crown heights for a high five, of their waist heights
   * for a low five and of their chest heights for a fist bump (provisional),
   * and the point lies at that height where both arms are the same share of
   * their comfortable reaches, moved down or up only as far as both arms' reach
   * demands. Partners of unequal stature therefore meet where the shorter one
   * can reach. Seated partners whose arms alone fall short lean their trunks
   * forward over the seat, the arm's target first, in equal shares of each
   * hip's flexion room (`HumanSeatedReach`, Chan and Dubey 1995); partners no
   * point lies within both arms of, leaned as far as they can, are refused,
   * never stretched. Each role's hand reaches it in the free-space transport
   * time of its distance (`AutoMovieMotionHumanTiming.transport`), and at least
   * the time its arm's arc takes within the audit's travel bound
   * (`touchReach.meeting`); the pair meets when the slower arrives, both stay
   * 0.1 s (provisional, the rebound) and go back in the reach's time. The palms
   * (or the fists) face each other, each surface's skin on the point.
   *
   * With `prop`, each role brings the prop its hand holds instead of the hand:
   * the prop's point (a glass's `lip`) comes to the shared point with the
   * vessel upright, so two glasses meet rim to rim as in a toast, and the hand
   * keeps its prop afterwards (`HumanHeld`).
   *
   * Events: the phrase instants, with `meet` at `ready` and `rebound` at
   * `relax`; both partners share `meet`.
   */
  export import highFive = highFiveLaw;

  /*
   * A kiss while standing: the lips brought to a partner's region (a cheek, the
   * forehead, the crown, the lips, the back of a hand) by leaning the body from
   * the hips and flexing the neck, the head turned to one side for a cheek or
   * the lips so the noses stay clear.
   *
   * The lean and the neck's flexion are solved at plan time so the mouth region
   * of the leaned posture lands on the target as it stands at the kiss's start:
   * a grid of pitch and flexion at 5 degree steps, then 1 degree steps about
   * the best, then a lean to the side the target lies on, as far as the hips'
   * range lets a body on planted feet lean (`ROLL`), and, when the mouth is
   * still short, a rise onto the toes of up to 35 degrees of heel
   * (provisional). The head turns 30 degrees for a cheek or the lips
   * (provisional), to the right unless `side` says otherwise; Guntürkün 2003
   * observed a two-to-one rightward bias, which Sedgewick et al. 2019 did not
   * find, so the side is a parameter. The approach is the free-space transport
   * of the mouth's travel, the kiss holds 0.6 s (provisional) and the return
   * takes the approach's time. The feet stay planted where they stand, so no
   * balance is solved: the lean and the rise are the kiss's key poses within
   * their ranges. A difference of more than `NEAR` that the lean, the neck and
   * the toes cannot close is out of reach and refused with what they reach,
   * rather than pressed on into the partner; a step in is not drafted yet.
   *
   * Events: the phrase instants, with `contact` at `ready` and `part` at
   * `relax`.
   */
  export import kiss = kissLaw;

  /*
   * A touch with the leg while standing (effectors below the hip): the toes,
   * the heel or the knee of one leg is brought onto a place and held there, the
   * other leg bearing the body.
   *
   * The body first moves over its standing foot: the root is shifted level
   * until the pelvis stands over that ankle, or, with balance asked
   * (`IAutoMovieMotionHumanBalance`), until the centre of mass does
   * (`HumanBalance.prepareCentre`), the standing leg keeping its planted goal.
   * The moving leg is then a goal of the posture resolver, as an arm is: for
   * the toes and the heel the ankle is placed so that part of the foot, read in
   * the foot's rest frame and turned as the foot stood at the entry, lies on
   * the place; for the knee the thigh's length fixes where the hip must be, so
   * the root is shifted further along the level line to the place until the
   * knee, the leg's bend hint, is exactly a thigh from the displayed hip, and
   * the shank hangs from it with the foot left free, since a foot held as it
   * stood would state another plane for the knee. A place the leg does not
   * reach so is refused.
   *
   * Events: `ready` on the place, `strokeEnd` and `relax` at the hold's end, as
   * a touch's. The leg may be cut from `relax` on.
   *
   * First pass: the foot's parts are offsets of the ankle (provisional where
   * marked), the shin is the round kick's and has no slow stroke here, the
   * contact is not declared as a window, and the standing balance is the static
   * one, not checked through the lift.
   */
  export import legTouch = legTouchLaw;

  /*
   * A region of a target as a frame: a person's region or a prop's point
   * through the context's aim, a trunk or head region of the performer on the
   * posture, and a limb region of the performer on the entry pose, which a
   * touch that does not move that limb leaves where it was.
   * Parameter context: The action's context.
   * Parameter target: The target.
   * Parameter seconds: Film seconds.
   * Parameter posture: The posture so far.
   * Parameter entry: The entry pose's resolved bones, or a supplier of the bones to
   * read a region off the trunk on, called only for such a region.
   * Returns: The point and the outward normal.
   */
  export const region: typeof touchRegionFrameLaw = touchRegionFrameLaw;

  /*
   * A touch: the arm and the fingers on one clock. The arm's whole touch is
   * planned as one trajectory (`AutoMovieMotionHumanArmPlanned`): its reach
   * from its entry angles, its hold on the goal laid on the region from `ready`
   * to `relax` and its return, clear of the body all the way; a hand path
   * solved second by second would let the elbow change sides between them.
   * Between `strokeStart` and `strokeEnd` the goal is lifted along the region's
   * normal by `lift sin^2(pi n u)`, which touches down at every repetition's
   * end, and moved along its tangent by the clock's windowed wave of `n`
   * cycles. A held vessel keeps its attitude on the way
   * (`AutoMovieMotionHumanDrinkingArm.carried`).
   * Parameter props: The touch.
   * Returns: The arm's and the hand's primitives, the arm's alone when the
   * fingers are kept; the arm carries the contact window from `ready` to
   * `relax` when a support is given and the hand, not a held tool, is what
   * touches it, and one `lie` window over the same span for each of its
   * segments declared resting (`ITouch.rests`).
   * When the count is not a positive whole number.
   */
  export const touchPrimitive: typeof touchPrimitiveLaw = touchPrimitiveLaw;

  /*
   * How far a touch's arm is from its entry angles to its goal at a second: the
   * clock's envelope, rising from `start` to `ready` and falling from `relax`
   * to `end`.
   * Parameter clock: The touch's clock.
   * Parameter seconds: Seconds since the action's start.
   * Returns: A share in [0, 1].
   */
  export const share: typeof touchEnvelopeLaw = touchEnvelopeLaw;

  /*
   * The last share of a carry's progress (`touchEnvelope`) over which a vessel
   * leaned at the face (`ITouch.lean`) tips toward it, and the first share of
   * the way back over which it is righted, by the hand's attitude (provisional:
   * a drinker tips the glass at the lips).
   */
  export const TIP: typeof TOUCH_TIP = TOUCH_TIP;

  /*
   * The goal a touch's arm is carried toward at each second: the effector laid
   * on the region, lifted along its normal by `lift sin^2(pi n u)` and moved
   * along its tangent by the clock's windowed wave of `n` cycles between
   * `strokeStart` and `strokeEnd`, and stood off along the normal by the share
   * of the carry still to go. Another arm that works with the same hand (a
   * second hand on a held tool) reads the same goal.
   * Parameter props: The touch.
   * Returns: The goal at a posture and a second since the action's start.
   * When the count is not a positive whole number.
   */
  export const goal: typeof touchGoalLaw = touchGoalLaw;

  /*
   * Rest the head on a partner. The resting head's own region, the temple on
   * the side the partner's region lies unless named, is brought to the
   * partner's region. The body leans from the hips as a kiss does (`kissBody`,
   * seated or on planted feet), the neck flexes and the head bends to the side
   * (`headRestAim`): solved once against the region where the performer sees it
   * at the start, then corrected at every second against the region where it is
   * felt, a held limb's feedback delay before (`HumanPerception.HELD`, as
   * `touchHold.felt` reads a partner under the hand), so the head follows the
   * partner's shoulder as the partner breathes or turns. The head goes down in
   * the free transport time of its travel, rests the authored span on a `head`
   * window on the partner's region loaded with half the weight of the head and
   * neck segments in the body's own mass model, and comes up in the same time.
   * A region the lean, the neck and the side bend cannot bring the head to
   * within `NEAR` is refused with the miss and the angles, so a much shorter
   * partner's shoulder is out of reach standing.
   */
  export const headRest: typeof headRestLaw = headRestLaw;

  /*
   * Lean back against a seated partner's back. Each of the two reads its own
   * and the other's upper back on the displayed bodies at the start and leans
   * its trunk back from the hips over the seat (the kiss's lean, `kissBody`,
   * seated) by the least pitch that moves its own upper back (by the lean
   * model's change from upright) to half a skin contact short of the upright
   * plane halfway between the two across the floor, each back at its own
   * height, so the two backs rest a skin contact apart and neither presses into
   * the other; the neck flexes by the lean so the head stays upright and does
   * not pass that plane first. The trunk's weight leans onto the partner: the
   * window's load is the trunk's share of the body's mass times the tangent of
   * the lean (moments about the hips with the contact taken at the trunk's mass
   * centre, provisional). A standing performer, or a meeting point beyond
   * `BACK`, is refused. Given the partner's own lean (`with`), the two must
   * lean and sit up together within a frame: one that sits up or leaves while
   * the other still leans is refused, naming who would be left leaning on
   * nothing.
   */
  export const backToBack: typeof backToBackLaw = backToBackLaw;

  /*
   * Sit on a seated partner's lap. The lap is the seated partner's thighs where
   * they are at the start: its height is the top of the two thighs' middles
   * (`thighFrontLeft` and `thighFrontRight`), its heading the partner's hips to
   * knees. The sit law (`sit`) sits the body onto it as onto a seat facing that
   * heading, the seat's front edge set so the sitter's seat socket comes to
   * rest over the thighs' middles; a lap above the sitter's band is got onto as
   * a high seat, the feet hanging. The sit's seat window bears instead on the
   * partner: half on each thigh. A partner whose thighs are not near level is
   * refused as not seated.
   */
  export const sitOnLap: typeof sitOnLapLaw = sitOnLapLaw;

  /*
   * Embrace a partner from behind. The lean from the hips is solved first, the
   * least forward pitch that lays the chest's sternum region on the partner's
   * upper back (the kiss's lean model, `kissBody`, on planted feet); then the
   * knees' sink (up to `SINK`), the side lean (within the kiss's `ROLL`), the
   * head's turn (`TWIST`), the neck's flexion and side bend and its protraction
   * (`PROTRACT`) that bring the chin nearest the top of the partner's shoulder
   * (the shoulder's region), by turns on coarse grids refined by degrees; a
   * chin still behind and below the shoulder then reaches forward in closed
   * form, the neck flexing about its base by the angle that carries the chin
   * forward to it and the heels rising (within the kiss's `RAISE`) by the
   * height that flexion costs plus what was missing. A chest already in the
   * partner's back, a back the lean cannot reach, or a chin left farther than
   * `NEAR` from the shoulder is refused with the gap or the miss. The hands
   * meet on the partner's abdomen, one placement for both: each palm on the
   * partner's own surface on its side of the midline (a ray onto the
   * colliders), the fingers toward the midline, the palm's middle as far from
   * it as the fingertips reach and a skin contact more, so the fingertips meet
   * there without crossing. Both arms are laid as one course (`courseArmGoal`)
   * around the partner's trunk, thighs and arms, the palms lying on the
   * abdomen's. Everything is read where the partner stands at the start. Loaded
   * windows: the chest on the upper back (`LEAN`), the chin on the shoulder,
   * the palms on the abdomen.
   */
  export const embraceFromBehind: typeof embraceFromBehindLaw =
    embraceFromBehindLaw;

  /*
   * A criss-cross hug between closely staged, facing partners with their heads
   * offset. Each right arm reaches around the partner's shoulder to the upper
   * back and each left arm around the waist to the lower back. Each performer's
   * hands share a hold and return to their entry poses. Use with
   * `HumanChain.mutual` and the `one` and `other` chains. The touch law fits
   * the arms to the staged bodies and may refuse an unreachable or obstructed
   * reach.
   *
   * Dueren et al. (2021, Fig. 2) studied the criss-cross arm placement and used
   * 1, 5 and 10 second holds measured from hand contact. The `hold` parameter
   * sets the nominal touch dwell in seconds and defaults to one for a brief
   * greeting. https://doi.org/10.1016/j.actpsy.2021.103441
   */
  export const hug: typeof hugLaw = hugLaw;

  /*
   * Two facing partners within arm's reach each rest their right palm on the
   * other's left shoulder, then return their hands. Pass to `HumanChain.mutual`
   * with the `one` and `other` chains. The reaches start together and each palm
   * stays through the touch law's contact phase and the nominal `hold` dwell in
   * seconds. The touch law can stretch the dwell with the rest of the action.
   * The touch law fits the arms and refuses targets out of reach.
   *
   * Yahiro et al. (2026) studied face-to-face palm contact on the shoulder in
   * greetings and comforting gestures. Reciprocity and the default one-second
   * hold are staging choices. https://doi.org/10.5100/jje.62.75
   */
  export const shoulderClasp: typeof shoulderClaspLaw = shoulderClaspLaw;

  /*
   * The parts of the hand a touch lays on its region (`touch.With`) and each
   * one's effector (`touch.EFFECTORS`).
   */
  export import touchEffectors = touchEffectorsLaw;

  /*
   * Where on a region a touch lands: a region is a patch of skin, not one
   * point, so a touch names a place on it. The place is stated by the author,
   * drawn by the seed, or chosen by a rule; on a prop's contact that has a
   * length, it is a share along that length (`along`, `span`).
   *
   * A place is an offset in the region's own surface: `up` along the surface
   * toward the head (the world's up laid into the surface) and `out` to the
   * right of someone facing the surface. On a level surface, where the world's
   * up has no direction in it, `up` is the world's forward.
   */
  export import touchSite = touchSiteLaw;
}
