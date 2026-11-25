import { operateDrive as operateDriveLaw } from "../affordance/operateDrive";
import { operateInsert as operateInsertLaw } from "../affordance/operateInsert";
import { swipeTouchscreen as swipeTouchscreenLaw } from "../everyday/swipeTouchscreen";
import { button as buttonLaw } from "../handling/button";
import { manipulateFacing as manipulateFacingLaw } from "../handling/manipulateFacing";
import { manipulateFingering as manipulateFingeringLaw } from "../handling/manipulateFingering";
import { manipulateReach as manipulateReachLaw } from "../handling/manipulateReach";
import { manipulateShape as manipulateShapeLaw } from "../handling/manipulateShape";
import { pushPullLean as pushPullLeanLaw } from "../handling/pushPullLean";
import { throwPottery as throwPotteryLaw } from "../handling/throwPottery";
import { write as writeLaw } from "../handling/write";
import { zip as zipLaw } from "../handling/zip";
import { HumanHoldHandles as HumanHoldHandlesLaw } from "../lexicon/HumanHoldHandles";
import { HumanManipulate as HumanManipulateSource } from "../lexicon/HumanManipulate";
import { HumanToolRows as HumanToolRowsSource } from "../lexicon/HumanToolRows";
import { LongToolStroke as LongToolStrokeSource } from "../tasks/LongToolStroke";
import { composeHumanToolWork as composeHumanToolWorkLaw } from "../tasks/composeHumanToolWork";
import { hookSet as hookSetLaw } from "../tasks/hookSet";

/**
 * The operate family's further laws, helpers and rows, each the shipped value
 * under its family name (`AutoMovieMotionHumanOperate`), with its own comment.
 */
export namespace AutoMovieMotionHumanOperateHelpers {
  /**
   * Draw up a clay wall on a turning wheel with both hands. Register as
   * `throwPottery`.
   *
   * The right palm lies on the wall's `outside` face and the left on its
   * `inside` face, each placed by the wrist that puts the palm's surface on the
   * face (`placeHumanHandSurface`'s rule) with the hand's entry attitude. The
   * faces ride the wheel's `raise` slider, which the pull drives from its
   * travel at the start up by `rise` over `seconds`, so both palms rise with
   * the wall and its height grows monotonically; the trunk leans forward over
   * the wheel, by the least hip hinge (`HumanTrunkLean`) that brings every palm
   * place within the arms, coming in and going out with the hands; the head's
   * crank turns at `rpm` throughout. The clay is round about the head's axis,
   * so each palm stays on the same surface in the turning head's frame. The
   * hands reach the wall over the transport movement time and leave over
   * another. Events: `strokeStart` and `strokeEnd` bound the pull.
   *
   * Refusals: a wheel without its head, rise or wall faces; a rise outside the
   * wheel's; a non-positive duration; a face beyond either arm.
   */
  export const throwPottery: typeof throwPotteryLaw = throwPotteryLaw;

  /**
   * One fingertip reaches a named touchscreen, swipes in its local X direction
   * and withdraws. `strokeStart` is touch-in, `strokeEnd` (also `relax`) is
   * touch-out. The hand returns to its entry pose at full duration. The stroke
   * takes 285.1 ms by default, the mean touch-in to touch-out duration from
   * Jeong and Liu (2017, doi:10.1080/00140139.2017.1313457). Jeong reports the
   * measured mean in Table 2.6 of his dissertation. The shared transport rule
   * times the reach and withdrawal. The contact carries no weight. The screen
   * belongs to a stationary fixture and the body keeps its entry stance. Stage
   * a free hand in front of the glass and within reach of the entire stroke.
   * The next action can cut in once the hand has withdrawn.
   */
  export const swipeTouchscreen: typeof swipeTouchscreenLaw =
    swipeTouchscreenLaw;

  /**
   * Move the working point of a held tool along an authored planar stroke.
   *
   * Register the law and perform `registered("write", params)` after taking the
   * tool in the orientation used to write. The surface belongs to a fixed rigid
   * prop. A prop that supplies a frame reader declares its rigidity with
   * `hasArticulations: false`. The arm approaches and leaves the stroke with
   * the entry wrist attitude as its goal. The target gives each edge time
   * proportional to its length and zero speed at each vertex, using Flash and
   * Hogan's planar minimum-jerk law (1985,
   * doi:10.1523/JNEUROSCI.05-07-01688.1985). The arm plans against that target.
   * This stages the motion of the working point. Mark making and pressure
   * depend on the scene's medium.
   */
  export const write: typeof writeLaw = writeLaw;

  /**
   * Brace a fixed garment's rim with the index finger while the opposite thumb
   * pushes its button through the opening. Register as `button`. The same
   * stroke clock moves the button mesh and places the thumb; the drive leaves
   * the button through the panel when the hands leave. A rigid straight slider
   * and authored bounding sphere approximate the closure without cloth
   * dynamics.
   */
  export const button: typeof buttonLaw = buttonLaw;

  /**
   * Brace a supported pouch and pinch its slider tab through a straight stroke.
   *
   * YKK's usage guidance calls for a straight pull along the zipper chain and
   * bringing opposing elements together for a bag closure
   * (https://lyncs.ykkfastening.com/shop/pages/about_products_09.aspx). The
   * flat modeled brace anchors the casing. The model's coupled lips, the
   * working fingertips and the retained travel follow one authored stroke.
   */
  export const zip: typeof zipLaw = zipLaw;

  /**
   * Set the hook. The hand holding the rod turns it about the grip, the tip
   * rising by the authored angle on a minimum-jerk course in the authored time
   * (a sharp lift), about the horizontal axis square to the rod; the grip stays
   * where it is, so the rod turns in the hand's own rotation and the arm
   * follows the hand's goal. The set is held a beat. A rod not held, a lift
   * outside 0 to `LIFT` or a time of no length is refused; a grip the arm
   * cannot keep is refused by the reach check.
   */
  export const hookSet: typeof hookSetLaw = hookSetLaw;

  /**
   * Keep both of a walker's hands on a moving implement's two handles, as a
   * ploughman holds a walking plough.
   *
   * The base walk owns the steps and the handles stay on the posed implement.
   * The overlay acquires both handles and releases them over equal authored
   * intervals, each hand's goal on its handle's actual moving frame by the
   * shared rider hold (`HumanMountRider.hold`, `HumanRideHands`), the same fit
   * the lead and the driving lines use, and both arms laid on one planned
   * course (`courseArmGoal`) so neither changes branch as the handles move.
   *
   * The author gives the total `seconds`; the hands take the handles and let go
   * in `transition` seconds each, together less than `seconds`; no natural
   * value is defined (provisional).
   */
  export const holdHandles: typeof HumanHoldHandlesLaw = HumanHoldHandlesLaw;

  /**
   * How far the trunk leans when a load is pushed, pulled or dragged by its
   * handles, by the load's declared level and the handles' height.
   *
   * The angles are Lett and McGill's (2006, Ergonomics 49:895, figure 9): the
   * peak torso angle, the trunk's lean relative to the hips, of nine men
   * pushing walking forward and pulling walking backward against a cable weight
   * stack, the handle at each one's waist and at each one's shoulder, at three
   * loads. The load levels are theirs: 45.5 N (`light`), 222.5 N (`moderate`,
   * Snook and Ciriello's 1991 acceptable push and pull, which they chose to
   * test) and 400.5 N (`heavy`). Each angle is the mean of the four
   * firefighters' and the five students' bars weighted by the groups' sizes,
   * the bars read off the figure to about half a degree.
   *
   * A push leans forward into the load and a pull leans back away from it, the
   * upper body's centre of mass ahead of the feet for a push and behind them
   * for a pull (the paper's hinge torque). A drag behind the body while walking
   * forward leans forward as a push does, the hands' force on the load pointing
   * the way the body walks, and takes the push's angles. A handle between the
   * waist and the shoulder takes the angle between theirs in proportion; below
   * the waist or above the shoulder keeps the nearer one's, as the study
   * measured no other height.
   */
  export import pushPullLean = pushPullLeanLaw;

  /**
   * The part an operation moves on a prop that articulates, and the drive the
   * operation publishes for it: the hand and the part follow one function of
   * the stroke's progress, the prop posed at the articulation's travel there.
   *
   * The operated contact is the prop's articulation itself (a trigger, a
   * button, a knob) or a contact that rides one of the mechanism's kinds,
   * however far up its chain (a door's lever on its latch on its hinge, a
   * drawer's pull on its slider, `IAutoMovieAffordance.rides`). The stroke
   * moves that articulation from where the performance has it at the
   * operation's start by the mechanism's amount, converting a prior writer's
   * coordinate of that degree through the engine's articulation map, in the
   * articulation's own unit and sign: degrees for a hinge's swing or a knob's
   * turn, metres for a slider's or a button's travel. The hand's goal at a
   * progress is the contact of the prop posed at that travel, so the hand
   * cannot drift from the part; the drive writes the same travel at the same
   * progress.
   */
  export import operateDrive = operateDriveLaw;

  /**
   * Inserting a held prop along a socket's axis: a rammer down a bore, a sword
   * into its scabbard, a magazine into its well, an arrow back into a quiver, a
   * key into a lock.
   *
   * The hand holds the prop as it entered the operation (`StrikingHeld`) and
   * the goal is the prop's working point (`tip`) on the socket's axis: at the
   * socket's mouth when the stroke begins, then pushed in along the axis, the
   * inverse of the socket's outward normal, by `depth`. The prop's line is kept
   * on the axis, so the hand's place and turn follow from the prop's own line
   * as the hand holds it (`StrikingRoll.hand`), and the elbow is placed by the
   * bend search. With `withdraw` the prop is drawn back out over the second
   * half of the stroke along the same axis: the depth at a progress `p` of the
   * stroke is `depth (1 - cos 2 pi p) / 2`, at rest at the mouth, at the bottom
   * and at the mouth again, so the reversal at the bottom has no jump in speed.
   * Without it the depth is `depth p`, and the prop is left home.
   */
  export import operateInsert = operateInsertLaw;

  /**
   * The path of a long tool through one stroke, as a function of the stroke's
   * share: the trailing grip, the tool's line from that grip toward its face,
   * the face's facing, the lead hand's slide along the line from the trailing
   * grip, and how far the stroke reaches toward the work (for the trunk's bow).
   * A swung stroke (`chop`, `side`, `swing`) turns the line in the one plane
   * holding its top and its contact, about that plane's normal, the face facing
   * the way the head travels, so it arrives at the work from the stroke's
   * direction; the lead hand slides down to the trailing hand on the downswing
   * (Freivalds 1986 for a shovel's and an axe's two-hand holds). A dig drives
   * the blade below the ground, levers it, lifts it and swings it toward where
   * the load goes; a rake pulls the tines along the ground toward the performer
   * and lifts them back. Keys between are eased with minimum jerk.
   */
  export import LongToolStroke = LongToolStrokeSource;

  /**
   * The rotation one hand keeps through a keyed contact sequence
   * (`manipulate`): the fingers toward the hand's first site from the body's
   * root, laid across the site's normal, and the palm against the normal. The
   * plan places the hand with it and the fingering reads every digit's tip
   * where it puts it, so both see one hand.
   *
   * @param hold The posture the act is entered with.
   * @param presses The sequence's sites with their hands, in order.
   * @param side The hand.
   * @returns The hand's world rotation from its rest.
   */
  export const manipulateFacing: typeof manipulateFacingLaw =
    manipulateFacingLaw;

  /**
   * The digits of a keyed contact sequence (`manipulate`): each contact's own
   * digit, or the Viterbi path over the five digits of its hand that minimizes
   * the travel of the limiting part over each stroke, accounting for the lift
   * and descent of a reused digit. The wrist stands where the plan places it
   * for that digit's press (`manipulateReach`, in the rotation the hand keeps
   * for the act), so a difference of two such places is the wrist's travel.
   *
   * @param body The body.
   * @param contacts The contacts with their sites.
   * @param sides Each contact's hand.
   * @param rotation Each hand's rotation for the act, from its rest.
   * @returns Each contact's digit.
   */
  export const manipulateFingering: typeof manipulateFingeringLaw =
    manipulateFingeringLaw;

  /**
   * Where the wrist stands for one press of a keyed contact sequence
   * (`manipulate`): the hand turned as the act keeps it, the pressing digit
   * straight, its tip over the site at typing's hover height (`typeText.HOVER`)
   * and advanced along the digit by as much as its swing down to the key's
   * bottom shortens its reach.
   *
   * A straight digit of length r from its first joint, swung down by the hover
   * height and the key's travel d, reaches sqrt(r^2 - d^2) ahead of that joint,
   * not r: a tip placed straight over the key would stop short of it by the
   * difference. The knuckle advances along the digit by r - sqrt(r^2 - d^2),
   * and the press is a swing about the first joint that ends on the key, which
   * the digit's own inverse kinematics then fits.
   *
   * @param body The body.
   * @param side The hand.
   * @param digit The pressing digit, as `manipulate.Finger` names it.
   * @param site The site, world metres.
   * @param normal The site's outward unit normal, world.
   * @param depth The key's travel, metres.
   * @param rotation The hand's world rotation from its rest for the act.
   * @returns The wrist's world point.
   */
  export const manipulateReach: typeof manipulateReachLaw = manipulateReachLaw;

  /**
   * The hand's shape while one digit presses in a keyed contact sequence
   * (`manipulate`): that digit straight, as the flat hand holds it, for its
   * inverse kinematics to take down to its key. Other digits retain their
   * relaxed shape when it clears the key plane by the hover height. Each
   * remaining digit takes a clearing shape or lifts its own tip from the
   * achieved wrist frame.
   *
   * @param body The rig supplying each shaped tip.
   * @param wrist The achieved wrist point, in world metres.
   * @param rotation The achieved wrist rotation.
   * @param site The key top in world metres.
   * @param normal The surface's unit outward normal.
   * @param side The hand.
   * @param digit The pressing digit, as `manipulate.Finger` names it.
   * @returns The digit angles and only the additional goals required for
   *   clearance.
   */
  export const manipulateShape: typeof manipulateShapeLaw = manipulateShapeLaw;

  /**
   * Keyed contact sequences: the digits pressing the sites of a prop one after
   * another, each a row of `manipulate`. Register the ones a film uses
   * (`HumanPerformance.IInput.laws`, `HumanChain.extend`); `manipulate` itself
   * is registered with them.
   *
   * Register the separate write law to trace an authored planar stroke with a
   * held tool.
   */
  export import HumanManipulate = HumanManipulateSource;

  /**
   * The tool strokes as rows: each tool of `useTool` under a name of its own,
   * the held prop, the work site, the hand, the cycles and the manner open.
   *
   * Each row writes no motion: its law plans it, so it fits any body, refuses
   * and is checked as the law is, and its draws are keyed by its own name. The
   * rows over the arm's phrases themselves are `HumanUpperRows`.
   */
  export import HumanToolRows = HumanToolRowsSource;

  /**
   * One-handed tool work from a working base composed from shipped actions :
   * kneeling or crouching at floor level, seated at a bench, or standing. The
   * base is taken first, then `useTool` cycles from it, so the base, the pickup
   * and the tool are fitted, refused and checked as those actions are. The tool
   * is taken up once the base has settled, since a kneeling or seated body
   * rests its free hands as it goes down.
   *
   * The work point's height chooses the base when the author names none: below
   * `FLOOR_REACH` of the stature the performer kneels on one knee, up to
   * `CROUCH_REACH` it crouches, and above it stands (provisional bands between
   * the standing work heights `useTool` already reaches and the floor).
   */
  export import composeHumanToolWork = composeHumanToolWorkLaw;
}
