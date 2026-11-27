import { AutoMovieEngineKinematicsChains } from "@automovie/engine";
import { HumanGrasp as HumanGraspSource } from "../handling/HumanGrasp";
import { HumanGraspUse as HumanGraspUseSource } from "../handling/HumanGraspUse";
import { HumanGrip as HumanGripSource } from "../handling/HumanGrip";
import { HumanHeld as HumanHeldSource } from "../handling/HumanHeld";
import { HumanHeldUse as HumanHeldUseSource } from "../handling/HumanHeldUse";
import { HumanPocket as HumanPocketSource } from "../handling/HumanPocket";
import { HumanPrehension as HumanPrehensionSource } from "../handling/HumanPrehension";
import { HumanPreshape as HumanPreshapeSource } from "../handling/HumanPreshape";
import { carryHang as carryHangLaw } from "../handling/internal/carryHang";
import { pickUp as pickUpLaw } from "../handling/internal/pickUp";
import { pickUpMoving as pickUpMovingLaw } from "../handling/internal/pickUpMoving";
import { putDown as putDownLaw } from "../handling/internal/putDown";
import { putDownAperture as putDownApertureLaw } from "../handling/internal/putDownAperture";
import { regrasp as regraspLaw } from "../handling/internal/regrasp";
import { HumanRegrasp as HumanRegraspSource } from "../lexicon/HumanRegrasp";

/**
 * Taking, holding and releasing an object by hand: the grasp, the carry pose
 * and the regrasp. pickUp and putDown share one reach model
 * (`HumanPrehension`).
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `pickUp`: Reaching for a prop's grip, grasping it and lifting it clear.
 * - `putDown`: Setting a held prop down at a place and letting go.
 * - `regrasp`: A held object moved within or with the hand that holds it, without
 *   being put down: turned about one of its own axes (a key in a lock, a cap),
 *   shifted to another of its grips (a pen turned into a writing grip, a phone
 *   from a carry grip to a texting grip), or rolled across the fingers (a
 *   coin).
 * - `carryHang`: Loads carried at the sides with the arms hanging, performed over
 *   a walk (`HumanChain.over`): a farmer's walk.
 * - `pickUpMoving`: Intercept a mounted prop on a translating support at an
 *   authored time.
 * - `putDownAperture`: Register and stage an aligned solid-object insertion and
 *   seated handoff.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanGrasp`: A prop's grip affordance as a grasp target, and the hand that
 *   grasps it: where the grip socket goes, how the hand turns, how wide it
 *   opens on the way and how its digits close.
 * - `HumanGraspUse`: A grasp chosen for what the tool is taken up for, and not
 *   only for the reach: the use names the tool's working point and how the
 *   tool's line, from its handle to that point, lies to the forearm when it is
 *   presented.
 * - `HumanGrip`: A hand closing on an object: which digits close for a grip kind,
 *   each digit's phalanges as the body's own colliders, and the finger angles
 *   at contact, solved, never authored.
 * - `HumanPreshape`: The open hand a reach carries toward a grasp: the pre-shape
 *   whose thumb-index aperture is the peak aperture for the grasped width
 *   (`HumanPrehension.aperture`).
 * - `HumanPrehension`: Reach to grasp as two coupled components, the model of
 *   prehension since Jeannerod (1981, 1984): the transport carries the hand to
 *   the object and the grasp shapes the hand, opening it to a peak aperture
 *   during the transport and closing it on the object as the transport ends.
 * - `HumanHeld`: An act performed with the prop the hand already holds: the
 *   prop's own point (a glass's lip, a phone's screen, a cigarette's mouth end)
 *   as the effector, in place of a bare hand surface or an implied tool, and
 *   the hold kept through the act.
 * - `HumanHeldUse`: A held tool used as the grasp it was taken up by presents it:
 *   the act that works with it keeps the hand's rotation the grasp was chosen
 *   to hold at the place of use (`HumanGraspUse.presented`), so it asks the
 *   wrist only what the grip was taken for, and a second hand that steadies the
 *   tool (a camera's other end) is laid on the tool's other handle where the
 *   first hand carries it.
 * - `HumanPocket`: Small props stowed in the body's pockets.
 * - `HumanRegrasp`: A held object moved within or with the hand, without being
 *   put down: each a row of `regrasp`.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanPrehension} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanPrehension {
  /**
   * Reaching for a prop's grip, grasping it and lifting it clear.
   *
   * The goal is the grip, not the arm: the hand's grip socket is brought onto
   * the prop's grip affordance along its approach axis (`HumanGrasp`), taken as
   * the archetype declares it: untilted, and from the side about the grip's
   * axis the arm reaches with the least wrist error among the sides its
   * declared symmetry allows (any side of a round grip, either of a
   * half-symmetric one, the declared one otherwise; `pickUpSearch.TURNS`); a
   * use's grasp is searched over its own turns and tilts. Then the fingers open
   * to the peak aperture on the way and close on the prop's colliders until
   * contact (`HumanGrip`), and inverse kinematics solves the arm. Where the arm
   * reaches the grip from the posture the action is entered in, the rest of the
   * body holds that posture, so a pick up continues a stand or the deepest
   * point of a bend with its feet planted, and only the reaching arm and its
   * fingers move. Where it does not, a standing body is lowered toward the grip
   * over the reach, as the bend law lowers it (`pickUpPosture`): a slight lean
   * at a counter, a stoop or a squat for a low one, the feet planted; a seated
   * one leans from its seat; and where the arm still misses, the trunk turns
   * toward the grip first and a standing body then takes one adjustment step
   * (`pickUpAdjust`). The lift is the whole body's: the trunk or the stance
   * carries what the arm cannot, and where neither does, the step is taken for
   * the grip and the lifted place together (`pickUpStance`). A body that moved
   * for the grip or the lift straightens after it over as long as the reach,
   * the hand riding with the shoulder, and the event `upright` closes the
   * action.
   *
   * Phases:
   *
   * 1. Reach: the reach-to-grasp transport (`HumanPrehension`): the two-factor
   *    movement time of McIntosh et al. (2018) for the wrist's travel and the
   *    grasped width, with the performer's timing variability; the hand comes
   *    in the last stretch along the approach axis from a setback equal to the
   *    peak aperture, so the open hand clears the object, and the aperture
   *    peaks inside Jeannerod's 60 to 70 % band.
   * 2. Load: the hand holds for 0.15 s with the fingers closed, the preload and
   *    load phases that precede lift-off in a precision lift (Johansson and
   *    Westling 1984, Exp. Brain Res. 56:550); the duration is provisional, as
   *    the phase durations themselves were not reached.
   * 3. Lift: the wrist rises `lift` metres (0.1 m when absent, provisional: about
   *    a hand's breadth clear of the support, or 0 when the other hand already
   *    holds it) on a minimum-jerk profile timed by the same movement-time law.
   *    Where the arm alone cannot bring the wrist to its lifted place, the
   *    trunk inclines toward it, or a lowered body straightens part of the way,
   *    over the lift (`pickUpLift.raise`); a lift the planned hand still falls
   *    short of by more than the arm solver's place tolerance is refused on
   *    `lift` (`pickUpLift.judged`).
   *
   * The hand grips the prop from `gripClosed` to the end, which attaches the
   * prop to the hand (`HumanPerformance.prop`), so the prop rides the lift, and
   * the plan declares a hold from `gripClosed`, so the hand keeps the prop with
   * its closed fingers through later actions (carried with the trunk while a
   * walk or a turn drives the body) until a put down or a hand over takes it. A
   * second hand steadies a prop the other already carries; it takes the grip
   * without a lift, and an independently requested lift is refused on `lift`.
   *
   * Events: `gripClosed`, `liftOff`, `lifted`, and `upright` after a body
   * lowered for the grip or inclined for the lift straightens. A pick up cut
   * into a stand before `gripClosed` abandons the reach; after `lifted` it
   * continues into a stand, a walk, a put down or a hand over. A grip no
   * lowering brings within the arm, or one beyond the arm of a body that is not
   * standing, is refused with the step named.
   */
  export import pickUp = pickUpLaw;

  /**
   * Setting a held prop down at a place and letting go.
   *
   * The goal is the prop's resting frame, not the hand: the author names where
   * the prop's origin goes (and optionally its heading), and the hand is placed
   * wherever holds the prop there, by the rigid hand-to-prop offset the grip
   * has kept since it closed (the prop's displayed frame and the hand's at the
   * start, so whatever the grasp was, the same grasp lays the prop down). With
   * `on`, the prop is put on a bone of the performer's own body instead, at its
   * frame on that bone as the body stands at the start, and is worn there from
   * `placed` (`IHumanActionPlan.wears`). With `onto`, it is set on another
   * prop's socket, its own socket laid on it, and rides that socket from
   * `placed` as the other prop's articulations pose it
   * (`IHumanActionPlan.mounts`): an arrow nocked on a bow's string, drawn back
   * with it. A free placement uses the prop's declared rest rotation turned to
   * the requested heading, or the whole `rotation` the author declares, such as
   * a card laid face up. The arm keeps its entry configuration as its reference
   * while the rest of the body keeps its entry posture.
   *
   * Phases: a transport of the hand to the placing frame, timed by the
   * reach-to-grasp movement time over the travel (`HumanPrehension`), its last
   * 0.05 m straight down so the prop lands rather than slides (provisional
   * setback); the release, the fingers opening flat over 0.2 s (provisional) as
   * the grip ends, which leaves the prop where it was placed; and the hand's
   * return to where the arm hangs, rising the same 0.05 m first, over another
   * movement time.
   *
   * Events: `placed` transfers the prop from the grip to its resting frame.
   * `release` marks the end of finger opening. A placing frame beyond the arm's
   * reach is refused, as is a placement without a destination. A rigid receiver
   * with an authored motion track may translate horizontally at constant speed
   * during a direct placement. The hand arrives with the receiver's velocity,
   * opens while tracking it, and eases away afterward.
   */
  export import putDown = putDownLaw;

  /**
   * A held object moved within or with the hand that holds it, without being
   * put down: turned about one of its own axes (a key in a lock, a cap),
   * shifted to another of its grips (a pen turned into a writing grip, a phone
   * from a carry grip to a texting grip), or rolled across the fingers (a
   * coin). Rows name each kind (`HumanRegrasp`).
   *
   * `twist`: the wrist does the turn and the grip holds. The hand, and the
   * object riding it with the offset stored at closure, rotate together about
   * the object's axis line, an affordance whose translation lies on the axis
   * and whose `+X` is its direction, so the object turns about its own axis
   * only; the angle is counter-clockwise looking down the axis.
   *
   * `regrip`: the object moves in the still hand from the grip it is held by to
   * the grip a named affordance takes (`HumanGrasp.hand`, the grip a pick-up of
   * that affordance would close), as the grip window's in-hand motion
   * (`HumanContactWindow.inHand`): its origin on a straight line in the hand
   * and its rotation along the shortest arc, both on one minimum-jerk profile.
   *
   * `roll`: the object rolls without slipping from the forefinger's pad to the
   * little finger's across the relaxed hand, turning about the palm's normal by
   * the distance over its radius (the affordance `axis`'s `radius`).
   *
   * This is the first pass the in-hand manipulation issue states for when the
   * literature gives no deterministic finger-gaiting rule that fits: the digits
   * keep the hand's shape while the object moves, so no digit lifts and
   * replaces; a schedule of digit contacts waits on that rule. A turn beyond
   * the forearm's range would need such regrips between turns.
   *
   * Every kind follows a minimum-jerk profile (Flash and Hogan 1985). Its
   * duration is 0.6 s for a quarter turn, a grip change or a roll across the
   * hand (provisional: a search for measured key-turning and in-hand
   * manipulation times found none), a twist's in proportion to its angle. The
   * hand must hold the object at entry, or the act is refused. Event `done` at
   * the end; the hand keeps the object after.
   */
  export import regrasp = regraspLaw;

  /**
   * Loads carried at the sides with the arms hanging, performed over a walk
   * (`HumanChain.over`): a farmer's walk. Each hand that holds a prop is let
   * down until its arm hangs nearly straight from the shoulder, a little out
   * from the thigh, the hand turned as it held the prop (carried round with the
   * body when the walk turns), and holds it there.
   *
   * Each wrist goes `HANG` of the arm (upper arm and forearm) below its
   * shoulder, read on the walk's posture each second, and `OUT` of the half
   * shoulder width out to the side; the arms leave their carrying pose over
   * `SETTLE` seconds and keep the walk's posture otherwise. The props stay in
   * the hands: the law grips them through its whole length and leaves them held
   * after.
   */
  export import carryHang = carryHangLaw;

  /**
   * Intercept a mounted prop on a translating support at an authored time. The
   * hand matches incoming velocity at closure, brakes over the load phase, and
   * lifts with the ordinary pickup's stance, grip and cancellation rules.
   * Register this law in the performance's `laws` and the typed authoring
   * chain.
   */
  export const pickUpMoving: typeof pickUpMovingLaw = pickUpMovingLaw;

  /**
   * Register and stage an aligned solid-object insertion and seated handoff.
   *
   * Use with HumanChain.extend({ putDownAperture }) and supply the law to
   * HumanPerformance. The receptacle must hold its opening and seat fixed until
   * the empty hand has withdrawn through the opening. The authored corridor
   * must clear the prop and hand.
   *
   * Adult shape-sorter trials distinguish transport to the opening from
   * insertion, with orientation primarily adjusted during transport (Ossmy et
   * al. 2020, Figures 1 and 3,
   * https://pmc.ncbi.nlm.nih.gov/articles/PMC6851484/).
   *
   * A receptacle with a guide (`onto.guide`) carries the object itself from the
   * opening to the seat: the object rides the guide's socket while the
   * placement drives the guide's slider back to the seat, as a scabbard guides
   * its blade home, and the hand follows on its grip.
   */
  export const putDownAperture: typeof putDownApertureLaw = putDownApertureLaw;

  /**
   * A prop's grip affordance as a grasp target, and the hand that grasps it:
   * where the grip socket goes, how the hand turns, how wide it opens on the
   * way and how its digits close.
   *
   * The affordance frame follows the one convention of
   * `AutoMovieAffordanceKind`: `+Y` points out of the contact, so the hand
   * arrives along `-Y` with its palm facing into the object, and the wrapped
   * axis runs along `+X`, the thumb side toward `+X`. The grasp lays the hand's
   * grip socket (the centre of a power grip, 25 mm out from the palm) on the
   * affordance point with the socket's palm normal along `-Y` and its
   * thumb-side forward along `+X` (`HumanHand.reach`), which fixes the hand's
   * rotation, and then sets the palm on the grasped part's near surface, half
   * the grasped width back from the affordance point on the part's axis, so a
   * thick part is not entered by a palm placed for the socket's nominal 50 mm
   * handle; the arm is then solved by inverse kinematics, an effector frame
   * laid on the object's authored grip marker.
   *
   * The grasped width is the affordance's `aperture`, or else the extent along
   * the approach axis of the prop's collider nearest the grip point (the span
   * the closing hand must clear), read from the engine's `physicalShapeSpan`.
   * `HumanPreshape` opens the hand for it on the way.
   */
  export import HumanGrasp = HumanGraspSource;

  /**
   * A grasp chosen for what the tool is taken up for, and not only for the
   * reach: the use names the tool's working point and how the tool's line, from
   * its handle to that point, lies to the forearm when it is presented.
   *
   * A handle can be wrapped from any side, and the side a hanging arm reaches
   * most easily leaves a blade or a barrel where the wrist cannot later aim it.
   * So a grasp taken for a use must also hold in one more key pose of the
   * grasp's choice (`HumanGrasp.reachable`): the tool presented ahead of the
   * shoulder on the line of its use.
   */
  export import HumanGraspUse = HumanGraspUseSource;

  /**
   * A hand closing on an object: which digits close for a grip kind, each
   * digit's phalanges as the body's own colliders, and the finger angles at
   * contact, solved, never authored.
   *
   * Closure is the engine's `AutoMovieEngineKinematicsChains.curlChainUntilContact` (the auto-grasp stopping
   * rule of Miller and Allen 2004, IEEE Robot. Autom. Mag. 11(4):110): the
   * digits named by the grip kind close proximal to distal until each phalanx
   * first touches the object, the four fingers before the thumb so the thumb
   * closes over them as in a power grip (Napier 1956; the Cutkosky and Feix
   * oppositions the grip kinds name):
   *
   * - `power`, `lateral` and `two-hand`: the four fingers, then the thumb;
   * - `hook`: the four fingers, the thumb left relaxed;
   * - `precision`: the thumb, the index and the middle finger, the ring and
   *   little fingers left relaxed.
   *
   * The curl runs on the hand alone, from its rest or from the open shape a law
   * passes (an offered hand opens its thumb before it closes), with the object
   * carried into the rest hand's frame by the planned grasp (the hand's world
   * wrist and rotation), so the angles depend only on where the object sits in
   * the hand, which a grip keeps fixed, and are computed once per grasp. Each
   * chain reads the profile's phalanx capsules and distal core tip. Its uniform
   * radius is the minimum of those three capsule radii, so wider phalanges
   * remain an approximation to their drawn surface. Missing digit capsules are
   * refused rather than replaced with guessed thickness.
   */
  export import HumanGrip = HumanGripSource;

  /**
   * The open hand a reach carries toward a grasp: the pre-shape whose
   * thumb-index aperture is the peak aperture for the grasped width
   * (`HumanPrehension.aperture`).
   *
   * The open hand is found on the thumb-index aperture of the body's own digit
   * colliders (`HumanGrip.aperture`): a blend from the closed grasp toward the
   * flat hand when the flat hand is wide enough, else the flat hand with the
   * thumb's carpometacarpal joint abducted until it is, the joint that opens
   * the human grip span; a span the hand cannot reach within the joint's range
   * of abduction stops at the range's end and reports the aperture it reached.
   */
  export import HumanPreshape = HumanPreshapeSource;

  /**
   * Reach to grasp as two coupled components, the model of prehension since
   * Jeannerod (1981, 1984): the transport carries the hand to the object and
   * the grasp shapes the hand, opening it to a peak aperture during the
   * transport and closing it on the object as the transport ends. Every number
   * here belongs to the reaching and grasping family; none is borrowed from
   * striking or locomotion.
   *
   * - Movement time. McIntosh, Mon-Williams and Tresilian (2018, J. Exp. Psychol.
   *   Hum. Percept. Perform. 44:1022, table 1) found reach-to-grasp time poorly
   *   fitted by Fitts' law and well fitted by a two-factor model, `MT = a + b
   *   lg A + c W` for the grasped width, with the group fit a = -306.07 ms, b =
   *   297.27 ms per decade of amplitude A in millimetres and c = 0.65 ms per
   *   millimetre of width W (r^2 = 0.97). Amplitudes below the study's shortest
   *   (170 mm) take its value, since the fit is not valid there; skill varies
   *   the duration through the cross-task timing variability
   *   (`HumanSkill.jitter`), no study of reaching speed by proficiency having
   *   been located.
   * - Peak aperture. It scales with the object's width with a slope of about 0.8
   *   (Smeets and Brenner 1999, Motor Control 3:237, as cited by Utz et al.
   *   2015); the intercept, 25 mm, is provisional (the full regression was not
   *   reachable): it keeps the peak 5 mm above the widest graspable object,
   *   about 100 mm (McIntosh et al. 2018's hypothetical maximum grip).
   * - Peak timing. Aperture peaks at 60 to 70 % of the transport (Jeannerod 1984,
   *   J. Mot. Behav. 16:235); a seeded draw places it inside that band.
   *
   * The transport path superposes two minimum-jerk units (Flash and Hogan 1985;
   * Flash and Henis 1991): the first carries the wrist from where it is to an
   * approach point set back from the grasp along the object's approach axis,
   * the second, overlapping its end, carries it the last stretch along that
   * axis onto the grasp, so the hand arrives moving along the approach and
   * never through the object, as the deceleration phase of a reach to grasp is
   * the longer one (McIntosh 2018, time after peak speed). Both units end at
   * rest, so the wrist stops exactly on the grasp with zero velocity and
   * acceleration. The hand turns to its grasp rotation on a minimum-jerk slerp
   * finished by the second unit's start, so it is oriented before the final
   * approach.
   */
  export import HumanPrehension = HumanPrehensionSource;

  /**
   * An act performed with the prop the hand already holds: the prop's own point
   * (a glass's lip, a phone's screen, a cigarette's mouth end) as the effector,
   * in place of a bare hand surface or an implied tool, and the hold kept
   * through the act. A drink from a held glass and two glasses clinked in a
   * toast read it.
   *
   * A held prop rides the hand rigidly, so its point and its axes are fixed in
   * the hand's frame from the instant the act starts. The effector is that
   * point, stated as the tool offset the touch generator already takes, with
   * the two directions the act lays against its region read off the prop:
   *
   * - A vessel (an act that stands it `upright`) lays its own axis, the point's
   *   normal, on the world's up. Its rim is a ring about that axis, so the
   *   region meets the rim on the side the act's facing direction points to
   *   (the palm's side of a drinking hand), and the effector faces outward
   *   there: the vessel then stands before a face, never in it. The prop's
   *   origin is read as a point of the vessel's axis, as a vessel that stands
   *   on its base at its origin has it.
   * - Any other prop turns its point's normal into the region (a screen faces the
   *   ear, a filter end enters the lips) and keeps the act's along direction as
   *   nearly as that normal allows.
   */
  export import HumanHeld = HumanHeldSource;

  /**
   * A held tool used as the grasp it was taken up by presents it: the act that
   * works with it keeps the hand's rotation the grasp was chosen to hold at the
   * place of use (`HumanGraspUse.presented`), so it asks the wrist only what
   * the grip was taken for, and a second hand that steadies the tool (a
   * camera's other end) is laid on the tool's other handle where the first hand
   * carries it.
   */
  export import HumanHeldUse = HumanHeldUseSource;

  /**
   * Small props stowed in the body's pockets. A pocket is a named site on the
   * body, not a cloth: the region of the body surface its opening lies on, so a
   * stowed prop is worn on that region's bone at the region's point and follows
   * the bone through walking and sitting. Taking it out is the ordinary pickup
   * of a worn prop, which a grip takes off its bone; putting it back is the
   * put-down onto the same site, which wears it there again.
   *
   * - Trouser front pockets on the front of the hips (`pocketFrontLeft`,
   *   `pocketFrontRight`).
   * - The trouser back pocket on the seat (`seat`).
   * - Jacket side pockets at the hips (`hipLeft`, `hipRight`).
   * - Inner breast pockets on the chest (`chestLeft`, `chestRight`).
   */
  export import HumanPocket = HumanPocketSource;

  /**
   * A held object moved within or with the hand, without being put down: each a
   * row of `regrasp`. Register the ones a film uses
   * (`HumanPerformance.IInput.laws`, `HumanChain.extend`).
   */
  export import HumanRegrasp = HumanRegraspSource;
}
