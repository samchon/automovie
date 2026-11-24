import { kickBall as kickBallLaw } from "../ballStrike/kickBall";
import { juggle as juggleLaw } from "../exercise/juggle";
import { HumanSportThrow as HumanSportThrowSource } from "../lexicon/HumanSportThrow";
import { HumanBallPlay as HumanBallPlaySource } from "../sport/HumanBallPlay";
import { ballSport as ballSportLaw } from "../sport/ballSport";
import { fieldThrow as fieldThrowLaw } from "../sport/fieldThrow";
import { stickBall as stickBallLaw } from "../sport/stickBall";
import { catchObject as catchObjectLaw } from "../throwing/catchObject";
import { readThrowObjectLaunch as readThrowObjectLaunchReader } from "../throwing/readThrowObjectLaunch";
import { release as releaseLaw } from "../throwing/release";
import { stageCatch as stageCatchLaw } from "../throwing/stageCatch";
import { stageDeflect as stageDeflectLaw } from "../throwing/stageDeflect";
import { throwObject as throwObjectLaw } from "../throwing/throwObject";
import { HUMAN_THROWCATCH_CRICKET_BOWL } from "./presets/HUMAN_THROWCATCH_CRICKET_BOWL";
import { HUMAN_THROWCATCH_GLOVE_CATCH } from "./presets/HUMAN_THROWCATCH_GLOVE_CATCH";
import { HUMAN_THROWCATCH_GRIDIRON_PASS } from "./presets/HUMAN_THROWCATCH_GRIDIRON_PASS";
import { HUMAN_THROWCATCH_GRIDIRON_SNAP } from "./presets/HUMAN_THROWCATCH_GRIDIRON_SNAP";
import { HUMAN_THROWCATCH_KICK_LEFT } from "./presets/HUMAN_THROWCATCH_KICK_LEFT";
import { HUMAN_THROWCATCH_KICK_RIGHT } from "./presets/HUMAN_THROWCATCH_KICK_RIGHT";
import { HUMAN_THROWCATCH_PITCH } from "./presets/HUMAN_THROWCATCH_PITCH";
import { HUMAN_THROWCATCH_PUSH_PASS } from "./presets/HUMAN_THROWCATCH_PUSH_PASS";
import { HUMAN_THROWCATCH_RUGBY_PASS } from "./presets/HUMAN_THROWCATCH_RUGBY_PASS";
import { HUMAN_THROWCATCH_SOFTBALL_WINDMILL } from "./presets/HUMAN_THROWCATCH_SOFTBALL_WINDMILL";
import { HUMAN_THROWCATCH_TWO_HAND_CATCH } from "./presets/HUMAN_THROWCATCH_TWO_HAND_CATCH";
import { HUMAN_THROWCATCH_UNDERARM_PITCH } from "./presets/HUMAN_THROWCATCH_UNDERARM_PITCH";

/**
 * Throwing, catching and kicking an object or a ball, and juggling.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `throwObject`: Throwing a held object to a target: overarm, underarm, or a
 *   gentle toss.
 * - `catchObject`: Catching an object thrown by another action: the hands meet it
 *   where its path enters the reach, give with it, and bring it to the chest.
 * - `release`: Letting go: a hand opens on what it holds, and the held prop
 *   leaves it.
 * - `kickBall`: Kicking the ball prop lying beside the support foot with the
 *   instep, from standing: the kicking leg swings back, then through the ball
 *   and on.
 * - `juggle`: Toss juggling standing still: the cascade of an odd number of balls
 *   and the shower.
 * - `fieldThrow`: A field event's throw: the shot, the discus or the hammer from
 *   a circle, or the javelin from a runway.
 * - `stickBall`: A hockey blade push or a lacrosse pocket exchange.
 * - `ballSport`: Team ball skills.
 * - `stageCatch`: The physical-prop variant of the catch law, a chain method.
 * - `stageDeflect`: A deliberate deflection of an incoming ball: the staged
 *   interception of `stageCatch`, whose hand meets the ball on its actual
 *   flight at the authored instant, hands the same ball straight back instead
 *   of closing on it.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `PITCH`: A baseball pitch, a crow-hop throw or a javelin throw: the overarm
 *   style, release 20 degrees above the horizontal after a 0.5 s windup.
 * - `UNDERARM_PITCH`: A softball pitch or a bowling-style lob: the underarm
 *   style, release 40 degrees after a 0.45 s windup.
 * - `SOFTBALL_WINDMILL`: A fastpitch softball delivery: the windmill style,
 *   release 2 degrees after a 0.64 s windup.
 * - `CRICKET_BOWL`: A high cricket release toward the authored pitch bounce: the
 *   cricket style, release 4 degrees below the horizontal after a 0.42 s
 *   windup.
 * - `PUSH_PASS`: A one-hand push pass, a free throw or a shot put (the two-hand
 *   chest and bounce passes are `ballSport` kinds `chestPass` and
 *   `bouncePass`): the toss style, release 50 degrees after a 0.35 s windup.
 * - `RUGBY_PASS`: A rugby pass with a two-hand release: the rugby style, release
 *   18 degrees after a 0.3 s windup.
 * - `GRIDIRON_PASS`: An overarm gridiron pass: the gridironPass style, release 17
 *   degrees after a 0.45 s windup.
 * - `GRIDIRON_SNAP`: A gridiron snap from a folded stance: the gridironSnap
 *   style, release 22 degrees after a 0.24 s windup.
 * - `GLOVE_CATCH`: A catch of a fly ball or a thrown ball in one hand.
 * - `TWO_HAND_CATCH`: A goalkeeper's or a receiver's catch in both hands.
 * - `KICK_RIGHT`: A football pass, shot, cross or punt with the right foot.
 * - `KICK_LEFT`: The same kick with the left foot.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanBallPlay`: Read one ball's play from a placed performance and test it
 *   against the gates a sport credits (a hoop, a goal mouth, a cup).
 * - `HumanSportThrow`: Throws, catches, kicks, jumps and runs of sport under
 *   their names, each a row of the shipped law that plans it.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanThrowCatch} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanThrowCatch {
  /**
   * Throwing a held object to a target: overarm, underarm, or a gentle toss.
   *
   * The goal is a launch: the object, held at the hand's grip, leaves the hand
   * at the release with the velocity whose drag-free ballistic path takes the
   * point that flies, the held prop's own origin (or the grip of an empty hand,
   * `throwObjectLever`), through the target. The release angle is the style's
   * (`throwObjectForm.ANGLE`, provisional; underarm precision throws regulate
   * speed and angle by distance, Dupuy, Mottet and Ripoll 2000, J Sports Sci
   * 18:375), and the speed follows from the range equation `v^2 = g d^2 / (2
   * cos^2 a (d tan a - h))` for the horizontal distance `d` and the rise `h` to
   * the target; a target the angle cannot reach is refused. The chamber and the
   * finish are places around the standing shoulder in arm lengths
   * (`throwObjectForm.PLACES`, provisional); the release is read from the
   * shoulder of the trunk's release pose, at the arm's reach for the elbow's
   * flexion where a study gives it ({@link throwObjectRelease}). The hand is
   * drawn back to the chamber on minimum-jerk progress (the windup), then
   * driven on a cubic Hermite curve from rest at the chamber to the launch
   * velocity, taking twice the path's length over the launch speed (the time of
   * constant acceleration from rest), carries that velocity unchanged for
   * `throwObjectForm.CARRY` seconds on each side of the release point, so the
   * launch does not depend on the instant the hand opens within it, and goes on
   * to rest at the finish over the same time; it holds, then returns to where
   * it hung. The trunk turns toward the throwing side in the windup, back
   * square to the line by the release and through to the other side by the
   * finish, so the trunk leads the arm (the proximal-to-distal sequence, Putnam
   * 1993, J Biomech 26 Suppl 1:125), and inclines forward from the cocking to
   * the style's `throwObjectForm.TILT` at release (Fleisig et al. 1999), rising
   * again in the recovery. Events: `windup` at the start, `cocked` (the end of
   * cocking, Fleisig et al. 1995's maximum external rotation for an overarm
   * throw), `release`, `followThrough`, `recover`.
   *
   * The plan carries its launch (`of`), so a catcher can intercept the path. A
   * thrown `prop` rides the hand by a grip window to the release and is
   * launched there (`IHumanActionPlan.launches`), so it flies the same path;
   * `angle` replaces the style's release angle for a row with its own. An
   * `implement` held in the hand lengthens the lever the launch leaves from and
   * stays held after it (`holds`), only the prop flying; a `turns` attitude
   * spins the prop at the lever's rate rounded to whole half turns to the
   * target (`throwObjectLever`). Not yet: the stride, the two-hand chest pass
   * and overhead throws, the thrown prop riding the implement before the
   * release (it leaves from the implement's point, set on its way, until a prop
   * can hold a prop), the release-timing scatter of the endpoint-error model
   * (Hore et al. 1995), and feints.
   */
  export import throwObject = throwObjectLaw;

  /** The launch a throw's plan carries, undefined for any other plan. */
  export const readThrowObjectLaunch: typeof readThrowObjectLaunchReader =
    readThrowObjectLaunchReader;

  /**
   * Catching an object thrown by another action: the hands meet it where its
   * path enters the reach, give with it, and bring it to the chest.
   *
   * The goal is an interception. The throw's plan carries its launch
   * (`readThrowObjectLaunch`), so the path is known in closed form, drag-free.
   * The catch point is where the path first comes within `REACH` arm lengths
   * ahead of the catcher's root along its heading (provisional), and the
   * contact instant the path's time there; a path that never comes so near, or
   * a point the arms cannot reach from the shoulders, is refused. With two
   * hands the palms take the object from both sides, each palm on its surface
   * across the catcher's left-right axis; with one the palm takes it from
   * behind, facing the way it comes, or with a worn glove (`glove`) the hand
   * turned as that palm would be and moved so the glove's pocket meets it. The
   * fingers take the turn about the palm's normal (`ROLLS`, upward first) the
   * arm holds at the contact with the least strain
   * (`AutoMovieMotionHumanBend.strain`), so the wrist's range decides it. The
   * ball's size is the ball's own (`ball`, `HumanBall`). The hands travel there
   * on minimum-jerk progress over the aimed movement time to an object of its
   * size (McIntosh et al. 2018, `AutoMovieMotionHumanTiming.aimed`), arriving
   * at contact; the anticipatory `prepare` instant is 100 ms before impact
   * (Lacquaniti and Maioli 1989, J Neurosci 9:134). After contact the hands
   * give `GIVE` along the object's velocity over `GIVE_TIME` (the issue's 0.05
   * to 0.15 m, provisional), which is `secured`, then carry it to before the
   * sternum and hold it. Events: `reach`, `prepare`, `contact`, `secured`,
   * `held`.
   *
   * The catch may start any time up to that `prepare` instant: with the throw,
   * or later, as when the thrower cuts its own throw at the release to catch
   * what it tossed (a juggle, a rhythmic toss).
   *
   * Not yet: hand closure timed by optical expansion (Savelsbergh et al. 1991),
   * a running catch (McLeod and Dienes 1996), a fumble, the catch against the
   * chest, and a held prop handed from the throw.
   */
  export import catchObject = catchObjectLaw;

  /**
   * Letting go: a hand opens on what it holds, and the held prop leaves it.
   *
   * The hand stays where the hold kept it on the trunk (its grip frame at the
   * entry, read in the chest's frame and carried with the chest the carrier
   * shows), and opens at `open`, the decisive instant, a brief pause
   * (`AutoMovieMotionHumanTiming.PAUSES.brief`, provisional) after the entry.
   * Until then its grip window on the prop takes the hand over from the hold;
   * at `open` the prop is launched (`IHumanActionPlan.launches`) with the
   * hand's velocity there, the central difference of the carried grip point at
   * the engine's plan-time step (`integrateMotionTrajectory.STEP`), so a drop
   * from a still hand falls and one from a moving carrier carries its speed.
   *
   * A prop that rests on something the hand held back (an arrow on a drawn
   * string) is launched by `launch` instead: along its line from one of its
   * points to another, at the speed the launcher gives (a bow's `launchSpeed`
   * at the string's travel), plus the hand's velocity.
   *
   * It is performed over a carrier and claims only that hand's arm. A hand that
   * holds nothing is refused.
   */
  export import release = releaseLaw;

  /**
   * Kicking the ball prop lying beside the support foot with the instep, from
   * standing: the kicking leg swings back, then through the ball and on.
   *
   * The goal is the foot on the ball: at `stroke` (contact) the kicking foot's
   * toes' joint, the middle of the instep, meets the back of the ball at its
   * centre's height along the kick's direction, the centre and the radius the
   * ball's own (`HumanBall`), the foot plantarflexed `POINT` degrees so the
   * instep faces the ball (Lees and Nolan 1998, J Sports Sci 16:211; Nunome et
   * al. 2002, Med Sci Sports Exerc 34:2028, compare the instep and side-foot
   * kicks). The backswing draws the foot back and up behind the ball
   * (`CHAMBER`, in shank lengths, provisional), the swing
   * (`AutoMovieMotionHumanLegPhrase.swing`) passes the contact at speed and
   * runs on through the follow-through along the leg's arc about the hip, at
   * the swing's own angular rate, so the leg keeps its length and the knee its
   * bend instead of locking straight on a placement past reach; with no hold,
   * the knee flexes as the foot returns to its stance. The opposite arm swings
   * out for balance. The support foot stays planted where it stood, so the ball
   * must lie within the kicking leg's reach of its hip; a farther ball is
   * refused with the reach. Phase lengths are provisional, scaled by the
   * manner's tempo. Events: the phrase's `ready` (`backswing`), `strokeStart`,
   * `stroke` (`contact`), `strokeEnd` (`followThrough`), `relax`.
   *
   * With `speed`, the foot meets the prop at the stroke's film instant and
   * publishes the authored outgoing velocity for that same prop. Both uses
   * retain the planted support foot.
   */
  export import kickBall = kickBallLaw;

  /**
   * Toss juggling standing still.
   *
   * The pattern's times follow Shannon's theorem `(F + D) H = (V + D) N` for
   * two hands with the dwell ratio `D / (D + V)` held at `DWELL` (Beek and
   * Lewbel, The Science of Juggling, 1995, report about three quarters in the
   * cascade): the flight `F` is the throw's to its height `h`, `sqrt(8 h / g)`
   * between hands level with each other, so the dwell is `2 k F / (N - 2 k)`
   * and the vacancy `(1 - k) / k` of it.
   *
   * - Cascade (odd `N`): the hands throw in turn, each from inside (`INSIDE` of
   *   the hands' spacing toward the middle) to the other hand's outside catch
   *   point; a caught ball is carried in a scoop, down `SCOOP` metres and in,
   *   to its throw.
   * - Shower (two balls): the right hand throws high to the left, the left passes
   *   low back to the right in a third of the high flight.
   *
   * Every throw is a launch aimed at the catching hand's point at the catch,
   * and every hold a grip on the ball from its catch to its throw; a dropped
   * throw (`drops`) has no catch and falls to the floor, and its ball is not
   * thrown again. A vacancy shorter than `VACANCY` leaves the hand no time to
   * get to its catch and is refused with the height that gives it.
   *
   * Events: `throw{n}`, `catch{n}` for each throw's catch, `relax`.
   */
  export import juggle = juggleLaw;

  /**
   * A field event's throw. In a circle the feet stand in the power position
   * across it, their balls pivoting while the body turns over them by the
   * event's turn; the javelin is cut from a run at the block foot's footfall
   * (`AthleticsRunUp`) and turns no further. The body's joints go from the
   * event's wind key to its release key and back to standing
   * (`fieldThrowKeys`). The implement rides the throwing hand to the release
   * and is launched there (`launches`) from its held frame at the release angle
   * `EVENTS[event].angle`, with the drag-free speed `v^2 = g d^2 / (2 cos^2 a
   * (h + d tan a))` that lands it at the authored distance, measured from the
   * circle's inside edge or the arc (World Athletics TR 33.12, 34.5).
   *
   * Refused: an implement the hands do not hold, a foot touching outside the
   * circle or past the arc (a foul, TR 33.2 and TR 32.16), and a distance
   * needing more speed than `EVENTS[event].speed`.
   *
   * First pass: the turns pivot on both balls in the power position rather than
   * the single-support steps of the elite technique; the hand's own motion is
   * keyed, so its speed at the release is not the launch's.
   *
   * Events: `windup`, `release`, `recover`.
   */
  export import fieldThrow = fieldThrowLaw;

  /**
   * A hockey blade push or a lacrosse pocket exchange. The carrier owns the
   * foot plants or skating path. The two arm goals follow one rigid stick
   * frame, from its displayed starting pose through the working cue to a
   * follow-through. A hand that does not already hold the stick first reaches
   * its grip from the entry arm, timed as a reach-to-grasp, while the stick
   * waits; its grip opens there. The follow-through turns the stick about the
   * top hand's grip. Both hands leave the stick held, so the actions that
   * follow carry it. The ball remains the same named prop.
   *
   * The field push uses the FIH playing face and the ice push reads the puck's
   * radial dimension as well as the blade. The lacrosse scoop seats the ball in
   * the crosse, and the pass declares release on the same clock. The teaching
   * sources are FIH 2026 §2, IIHF 2026–27 §§10 and 13, and USA Lacrosse's Learn
   * the Basics. Phase shares, shaft inclination and default speed are
   * provisional film-staging values.
   */
  export import stickBall = stickBallLaw;

  /**
   * Team ball skills. The original stationary dribble, volleyball dig and set,
   * and football throw-in retain their implied-ball poses. With a held prop the
   * throw-in releases it through `at` at the specified elevation. Performance
   * reads the actual held frame at release. Basketball dribble release, chest
   * pass, bounce pass and set shot, and the grounded handball throw use
   * `ballCourt`. It publishes the spherical collision shape and keeps one prop
   * through release and flight. A planted basketball contest raises and waves
   * both hands and plants the body: it cannot ride a walk or run, so it follows
   * a run cut by `until` or a stand. The volleyball serve, spike, block,
   * receive and set use `courtStroke`.
   *
   * - Dribble: the knees give a twentieth of the stature (provisional), the palm
   *   faces down at the hand's side ahead of the hip, pushes down a quarter of
   *   the arm and rises again `count` times at 2 bounces a second
   *   (provisional).
   * - Dig: in a crouch, both arms reach from the displayed shoulders, nearly
   *   straight, to a platform pointing 40 degrees below the horizontal, the
   *   palms together; the platform lifts 10 degrees at the contact.
   * - Set: in a crouch, both hands stand above the forehead, palms up and
   *   forward; at the contact the legs extend and the hands rise overhead.
   * - Throw-in: both feet stay on the ground (the Laws of the Game), both hands
   *   are drawn behind the head while the trunk arches back about the hips, and
   *   they come over the head and forward as the trunk flexes, along a line
   *   rising at 30 degrees, the distance-best release angle (Linthorne and
   *   Everett 2006), to where it meets the arms' reach about the flexed
   *   shoulders.
   *
   * The original implied skills share a ready position, stroke and return. The
   * court and volleyball families define their own phase durations and use the
   * same action clock and composing primitives.
   */
  export import ballSport = ballSportLaw;

  /**
   * A baseball pitch, a crow-hop throw or a javelin throw: the overarm style,
   * release 20 degrees above the horizontal after a 0.5 s windup. Spread into
   * `throwObject`'s parameters with the target.
   */
  export const PITCH: typeof HUMAN_THROWCATCH_PITCH = HUMAN_THROWCATCH_PITCH;

  /**
   * A softball pitch or a bowling-style lob: the underarm style, release 40
   * degrees after a 0.45 s windup. Spread into `throwObject`'s parameters with
   * the target.
   */
  export const UNDERARM_PITCH: typeof HUMAN_THROWCATCH_UNDERARM_PITCH =
    HUMAN_THROWCATCH_UNDERARM_PITCH;

  /**
   * A fastpitch softball delivery: the windmill style, release 2 degrees after
   * a 0.64 s windup. Spread into `throwObject`'s parameters with the target.
   */
  export const SOFTBALL_WINDMILL: typeof HUMAN_THROWCATCH_SOFTBALL_WINDMILL =
    HUMAN_THROWCATCH_SOFTBALL_WINDMILL;

  /**
   * A high cricket release toward the authored pitch bounce: the cricket style,
   * release 4 degrees below the horizontal after a 0.42 s windup. Spread into
   * `throwObject`'s parameters with the target.
   */
  export const CRICKET_BOWL: typeof HUMAN_THROWCATCH_CRICKET_BOWL =
    HUMAN_THROWCATCH_CRICKET_BOWL;

  /**
   * A one-hand push pass, a free throw or a shot put (the two-hand chest and
   * bounce passes are `ballSport` kinds `chestPass` and `bouncePass`): the toss
   * style, release 50 degrees after a 0.35 s windup. Spread into
   * `throwObject`'s parameters with the target.
   */
  export const PUSH_PASS: typeof HUMAN_THROWCATCH_PUSH_PASS =
    HUMAN_THROWCATCH_PUSH_PASS;

  /**
   * A rugby pass with a two-hand release: the rugby style, release 18 degrees
   * after a 0.3 s windup. Spread into `throwObject`'s parameters with the
   * target.
   */
  export const RUGBY_PASS: typeof HUMAN_THROWCATCH_RUGBY_PASS =
    HUMAN_THROWCATCH_RUGBY_PASS;

  /**
   * An overarm gridiron pass: the gridironPass style, release 17 degrees after
   * a 0.45 s windup. Spread into `throwObject`'s parameters with the target.
   */
  export const GRIDIRON_PASS: typeof HUMAN_THROWCATCH_GRIDIRON_PASS =
    HUMAN_THROWCATCH_GRIDIRON_PASS;

  /**
   * A gridiron snap from a folded stance: the gridironSnap style, release 22
   * degrees after a 0.24 s windup. Spread into `throwObject`'s parameters with
   * the target.
   */
  export const GRIDIRON_SNAP: typeof HUMAN_THROWCATCH_GRIDIRON_SNAP =
    HUMAN_THROWCATCH_GRIDIRON_SNAP;

  /**
   * A catch of a fly ball or a thrown ball in one hand. Spread into
   * `catchObject`'s parameters with the anchor of the throw caught.
   */
  export const GLOVE_CATCH: typeof HUMAN_THROWCATCH_GLOVE_CATCH =
    HUMAN_THROWCATCH_GLOVE_CATCH;

  /**
   * A goalkeeper's or a receiver's catch in both hands. Spread into
   * `catchObject`'s parameters with the anchor of the throw caught.
   */
  export const TWO_HAND_CATCH: typeof HUMAN_THROWCATCH_TWO_HAND_CATCH =
    HUMAN_THROWCATCH_TWO_HAND_CATCH;

  /**
   * A football pass, shot, cross or punt with the right foot. Spread into
   * `kickBall`'s parameters with the ball.
   */
  export const KICK_RIGHT: typeof HUMAN_THROWCATCH_KICK_RIGHT =
    HUMAN_THROWCATCH_KICK_RIGHT;

  /**
   * The same kick with the left foot. Spread into `kickBall`'s parameters with
   * the ball.
   */
  export const KICK_LEFT: typeof HUMAN_THROWCATCH_KICK_LEFT =
    HUMAN_THROWCATCH_KICK_LEFT;

  /**
   * The physical-prop variant of the catch law, an action of the vocabulary:
   * compose the anchored launch first through the proposed catch time, then
   * `stageCatch({ partner, ball })` on the catcher's chain. A portable
   * drag-free prop must reach the base law's interception point on its actual
   * flight before this law gives its grip custody of the prop. An authored
   * `intercept` reads that flight at release plus its seconds, including any
   * intervening rebound, and uses the same arm planner. The interception second
   * is the flight's provisional planning horizon, so a long pass is caught
   * after the thrower's action has ended. Final flight admission checks that
   * the launch survives and its frame matches the grip.
   */
  export const stageCatch: typeof stageCatchLaw = stageCatchLaw;

  /**
   * A deliberate deflection of an incoming ball: the staged interception of
   * `stageCatch`, whose hand meets the ball on its actual flight at the
   * authored instant, hands the same ball straight back instead of closing on
   * it. The deflection is the outcome the caller decides, so it is published as
   * a launch at the touch, and the incoming flight's sweep leaves the touching
   * hands to that launch as a staged catch's hands are left to it.
   *
   * The rebound is the ball's own restitution off a palm facing the incoming
   * ball: with the palm's normal `n` against the incoming velocity `v`, the
   * outgoing velocity is `v - (1 + e)(v . n) n = -e v`, the normal impact of a
   * sphere on a surface held still through the touch (no tangential friction
   * along a head-on normal).
   */
  export const stageDeflect: typeof stageDeflectLaw = stageDeflectLaw;

  /**
   * Read one ball's play from a placed performance and test it against the
   * gates a sport credits (a hoop, a goal mouth, a cup).
   *
   * `read` joins the ball's hand grips into possessions and merges them with
   * its engine flights, so the same prop's custody and travel are one
   * film-ordered log. `crossing` scans the displayed ball, the frame every
   * consumer renders, for the first passage through a gate toward its credited
   * side.
   */
  export import HumanBallPlay = HumanBallPlaySource;

  /**
   * Throws, catches, kicks, jumps and runs of sport under their names, each a
   * row of the shipped law that plans it. The composition gives what the law
   * leaves open: the ball the hand holds and what it is thrown at, the ball
   * kicked and where, the thrower caught from, the place jumped or run to.
   *
   * The laws own the physics a row inherits: a throw's kinetic chain and the
   * ball's ballistic flight from its release, a catch's interception, a kick's
   * ball flight, a jump's flight from its take-off speed. First pass: a row
   * fixes only the style its name means; an event's own technique (a pitcher's
   * windup, a jump shot's leap before the release, a hurdle's trail leg) is not
   * planned, and the row says so; a high jump's arch over the bar is
   * `HumanGymnastics.fosburyFlop`.
   */
  export import HumanSportThrow = HumanSportThrowSource;
}
