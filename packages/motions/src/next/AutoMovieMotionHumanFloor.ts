import { crabWalk as crabWalkLaw } from "../floor/crabWalk";
import { crawl as crawlLaw } from "../floor/crawl";
import { dive as diveLaw } from "../floor/dive";
import { getUp as getUpLaw } from "../floor/getUp";
import { lieDown as lieDownLaw } from "../floor/lieDown";
import { lieOnSurface as lieOnSurfaceLaw } from "../floor/lieOnSurface";
import { logRoll as logRollLaw } from "../floor/logRoll";
import { lyingTurn as lyingTurnLaw } from "../floor/lyingTurn";
import { roll as rollLaw } from "../floor/roll";
import { turnOver as turnOverLaw } from "../floor/turnOver";
import { HumanFloorRoll as HumanFloorRollSource } from "../lexicon/HumanFloorRoll";
import { HUMAN_FLOOR_LIE_STILL } from "./presets/HUMAN_FLOOR_LIE_STILL";
import { HUMAN_FLOOR_SIT_CROSS_LEGGED } from "./presets/HUMAN_FLOOR_SIT_CROSS_LEGGED";
import { HUMAN_FLOOR_SIT_ON_FLOOR } from "./presets/HUMAN_FLOOR_SIT_ON_FLOOR";
import { HUMAN_FLOOR_SIT_SIDEWAYS } from "./presets/HUMAN_FLOOR_SIT_SIDEWAYS";

/**
 * The actions on and from the floor: lying down, rolling, crawling and getting
 * up.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `lieDown`: Lying down on the floor from standing into a position: supine,
 *   prone, or on the left or right side.
 * - `getUp`: Getting up from the floor to standing: from lying on the back or the
 *   front, from the hands and knees or crouched, as a crawl ends.
 * - `roll`: A forward or backward roll on the floor: the body crouches into a
 *   tuck over its feet, rolls once round over its back as a ball rolls, without
 *   flight, and rises from the tuck on its feet where the roll has carried it.
 * - `crawl`: Crawling on hands and knees along the heading, from standing: the
 *   body gets down onto hands and knees, then crawls a number of cycles in the
 *   diagonal pattern, each hand moving with the opposite knee like a
 *   quadruped's trot (Patrick, Noah and Yang 2009, J Neurophysiol 101:603).
 * - `crabWalk`: A supine quadrupedal crawl, the crab walk
 *   (`IAutoMovieMotionHumanCrabWalk`).
 * - `dive`: A fall onto the floor on purpose from a stance: a goalkeeper's dive
 *   to the side, or a sliding tackle forward on the hip.
 * - `lieOnSurface`: Lie on a raised support.
 * - `turnOver`: Turn over while lying.
 * - `logRoll`: Log-roll across the floor.
 * - `lyingTurn`: A lying body's turn about its own long axis.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `SIT_ON_FLOOR`: The sitOnFloor preset of `lieDown`: Sitting down on the
 *   floor, the legs long, and staying three seconds (provisional).
 * - `SIT_CROSS_LEGGED`: The sitCrossLegged preset of `lieDown`: Sitting down on
 *   the floor cross-legged and staying three seconds (provisional).
 * - `SIT_SIDEWAYS`: The sitSideways preset of `lieDown`: Sitting down on the
 *   floor with both legs folded to one side and staying three seconds
 *   (provisional).
 * - `LIE_STILL`: The lieStill preset of `lieDown`: Lying down and staying three
 *   seconds (provisional), as to sleep or to play dead.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanFloorRoll`: Rolls on the floor, each a row of the roll law.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanFloor} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanFloor {
  /**
   * Lying down on the floor from standing into a position: supine, prone, or on
   * the left or right side. Entered on the knees or crouched over the hands, as
   * a crawl ends, the body goes from the posture it displays through the
   * route's postures after the kneel; any other base is refused
   * (`floorEntry`).
   *
   * The movement passes through the floor postures people use to get down
   * (VanSant 1988, Phys Ther 68:185, codes the components of the reverse rise):
   * to lie on the back the body sits down onto the floor and rolls back; to lie
   * face down it kneels, goes onto hands and knees and lowers itself forward;
   * to lie on a side it lies on its back and rolls onto that side. Each posture
   * is a set of joint angles and a whole-body tilt (`POSES`, provisional),
   * passed through in joint space on minimum-jerk progress. At every second the
   * body rests on the floor: the root's height puts the lowest point of the
   * body's collision shapes on it (`knockdown.rest`). Entered standing, the
   * feet keep their place while the body goes down to the route's first
   * posture. The mean of their bearing soles gives the root path and each foot
   * is fitted to its own stationary socket. The pelvis then stays over the
   * first landing, or its entry place when already on the floor. Rolling from
   * supine turns about the longitudinal axis with the dependent heel fixed
   * horizontally. Each phase takes `PHASE` seconds (provisional), scaled by the
   * manner's tempo; the position is then held `hold` seconds. Events: `getDown`
   * at the start, the arrival at each posture on the route (`seatContact`,
   * `kneeContact`, `handsDown`, `supine`, `prone`, `lateral`) and `settled`.
   *
   * Not yet: lying on a bed or a sofa (A2 support frames, A8 `surface`), the
   * recovery position, sleep with seeded position changes (Skarpsno et al.
   * 2017; De Koninck et al. 1992), rolling over and rising from a bed.
   */
  export import lieDown = lieDownLaw;

  /**
   * Getting up from the floor to standing: from lying on the back or the front,
   * from the hands and knees or crouched, as a crawl ends.
   *
   * Rising from the floor is described by the movement of three body regions
   * (VanSant 1988, Phys Ther 68:185, "Rising from a supine position to erect
   * stance"): the arms, the head and trunk (the axial region) and the legs. The
   * one combination VanSant found most often among adults, though in only a
   * quarter of them, is symmetrical throughout: the trunk flexes forward out of
   * supine with both hands pushing, the body comes through sitting to a squat
   * and stands. That is the `symmetric` pattern, the default from the back. The
   * other end of VanSant's axial scale is a full rotation: the body rolls over
   * to face the floor, comes up onto the hands and knees, through a half kneel
   * to standing; that is the `rotation` pattern, the only way up from the front
   * and from the hands and knees, whose first postures it has already passed.
   *
   * The rise is a support sequence (`support`): each posture of the route is a
   * stance resting on what that posture bears on (`BEARS`), its key solved by
   * the whole-body fit nearest the route's posture (`POSES`, provisional
   * angles, with `lieDown`'s own floor postures where they are the same) with
   * those parts on the floor and the centre of mass over them, a new support
   * placed before an old one lets go, the body carried between keys about a
   * support both hold and resting on the floor by its colliders at every
   * instant. The first stance leaves from the posture the entry displays, so
   * the rise continues from where the body lies.
   *
   * Young adults rise from supine to standing in 2.6 s on average at their own
   * pace (Ulbrich et al. 2000, J Am Geriatr Soc 48:1626); the route's phases
   * share that time equally (provisional split), scaled by the manner's tempo.
   * Events: one per posture reached, then `standing`.
   *
   * Not yet: a partial rotation (one hand pushing from the side) and the half
   * kneel out of the symmetric squat, VanSant's other adult variants.
   */
  export import getUp = getUpLaw;

  /**
   * A forward or backward roll on the floor: the body crouches into a tuck over
   * its feet, rolls once round over its back as a ball rolls, without flight,
   * and rises from the tuck on its feet where the roll has carried it.
   *
   * The tuck is a set of joint angles (`TUCK`, provisional: the trunk and the
   * neck flexed, the hips and the knees folded, the arms round the shins).
   * Crouching, the joints go from the entry's into the tuck while the ankles
   * stay where they stood. Rolling, the tucked body turns once about its
   * lateral axis (forward or back), its root placed each second so its lowest
   * joint centre lies on the floor at the ankles' standing height, and carried
   * along by rolling without slipping: the root advances by the turn times its
   * height above that lowest point, integrated at plan time. Rising, the crouch
   * is played back from where the roll ends.
   *
   * Contact windows: the feet plant through the crouch and the rise, the back
   * lies on the floor over the roll's middle and the seat at its end (a forward
   * roll) or start (a backward one).
   *
   * First pass: the hands do not plant on the floor at the start (the arms hold
   * the shins), the head is not kept off the floor by the hands in a backward
   * roll, and the floor's contact is read on joint centres, not the skin.
   */
  export import roll = rollLaw;

  /**
   * Crawling on hands and knees along the heading, from standing: the body gets
   * down onto hands and knees, then crawls a number of cycles in the diagonal
   * pattern, each hand moving with the opposite knee like a quadruped's trot
   * (Patrick, Noah and Yang 2009, J Neurophysiol 101:603).
   *
   * The goals are floor points. The knees rest a shank's radius over the floor
   * under the hip joints with the thighs upright, the shins lying back to feet
   * tucked on their toes (`kneelKeys.tucked`); the palms rest flat with each
   * wrist under its shoulder and the arm at `ARM` of its length, so the trunk's
   * pitch is the one that puts the posed shoulders at that height. The pelvis
   * travels at a constant speed of one stride a cycle, as high as each thigh
   * reaches its knee from it; each limb is planted on a floor point for `DUTY`
   * of the cycle, centred on its own share, and swings to the next one a stride
   * ahead on an arc, a hand `LIFT` high and a knee `KNEE_LIFT`, rising on the
   * swing's time and travelling on its minimum-jerk progress so it leaves the
   * floor before it moves, the left hand and the right knee half a cycle apart
   * from the right hand and the left knee. Each hip joint rides a thigh over
   * its own knee, so a swinging knee is lifted by the pelvis turning about the
   * spine's axis (the hip hike of a quadruped's swing), which the spine and the
   * chest turn back so the shoulders stay level over the hands. The crawl is
   * placed so each tucked foot's toes' joint is where the standing foot rolls
   * onto its toes, and the limbs land side by side, the first steps reaching
   * each limb's own footprint. Getting down from standing, the supports take
   * the body in turn (`crawlDown`): the feet roll onto their toes where they
   * stood, the body sits onto its knees in the kneel's time to lower and sit
   * back (`kneel.PHASES`), leans to its hands and comes forward over its knees.
   * Entered on the knees or crouched (a crawl ends kneeling, a bear crawl
   * crouched, and declares it), it blends from the displayed entry over `DOWN`
   * seconds instead, and any other base is refused (`floorEntry`). The cycle,
   * the stride, the duty and the lift are provisional, scaled by the square
   * root of the hip height and the manner's tempo. Events: `down` (on hands and
   * knees), and per limb and cycle `<limb>Liftoff<n>` and `<limb>Touchdown<n>`,
   * the limb one of `leftHand`, `rightHand`, `leftKnee`, `rightKnee`.
   *
   * The bear crawl is the same gait on the hands and the feet: the knees are
   * held `HOVER` off the floor, so the hips ride that much higher, and each
   * foot, on its ball behind its knee, is planted while its knee is. The
   * inchworm is its own walk (`crawlInchworm`).
   *
   * Each knee on the floor bears through a window of its lower leg at the
   * knee's region while its foot does.
   *
   * Not yet: the bear crawl's own timing (MacLellan et al. 2012 measured
   * hands-and-feet crawling; the knees' cycle is kept), the belly crawl,
   * turning and rising from the crawl.
   */
  export import crawl = crawlLaw;

  /**
   * A supine quadrupedal crawl, the crab walk
   * (`IAutoMovieMotionHumanCrabWalk`). The body settles from where it is onto
   * its hands, planted behind the shoulders, and its feet, planted ahead of the
   * hips, with the pelvis lifted to the authored height, then travels in the
   * diagonal sequence of a quadrupedal walk: the right hand and the left foot
   * swing together while the other pair bears, then the other pair. The travel
   * follows one minimum-jerk progress, so the crawl leaves and arrives at rest;
   * each swinging end lifts on a half sine over its swing. The hands and the
   * feet are the only contacts. A full backbend arches the spine and hangs the
   * head back, and is refused for a body whose spine and chest cannot extend as
   * far.
   *
   * Sources: the diagonal sequence of quadrupedal walking (Hildebrand,
   * Symmetrical gaits of horses, Science 150, 1965) carried to a supine crawl;
   * the trunk and stance values are authored.
   */
  export import crabWalk = crabWalkLaw;

  /**
   * A fall onto the floor on purpose from a stance: a goalkeeper's dive to the
   * side, or a sliding tackle forward on the hip.
   *
   * Every second the body is a set of joint angles blended from the entry's
   * toward the kind's (`SHAPES`, provisional), turned about one axis of its own
   * (the dive about its forward axis, so it lands on its side; the slide about
   * its lateral axis, leaning back), and placed with its root on a path:
   *
   * - `dive`: a crouch with the feet planted and the knees bending under the
   *   lowered root (`AutoMovieMotionHumanTrunk.preparePlanted`), then a flight
   *   whose hips move `REACH` statures to the side on a parabola `APEX`
   *   statures above the line from take-off to landing, the body turning a
   *   quarter about its forward axis on the way while its joints extend from
   *   the crouch's solved angles into the shape, then lying on its side where
   *   it landed. The flight is the one airborne part, on that one axis.
   * - `slide`: the body leans back and sinks onto its hip while its hips slide
   *   `REACH` statures forward and slowing to rest, the lead leg reaching ahead
   *   and the trailing one bent under, never off the floor.
   *
   * Landed, the root is placed so the lowest joint centre lies at the ankle's
   * standing height above the floor, as on the feet.
   *
   * Toe-off, in a dive: over the crouch's last `TOE_OFF` seconds each planted
   * foot rolls about its ball, the heel rising, by the angle (solved on the
   * planted take-off, `SECANT`) that brings the take-off's ankle to what a
   * weightless ankle reaches (`ANKLE_DORSIFLEXION.unloaded`), so the feet leave
   * the floor plantarflexed, as the push-off's plantarflexion leaves them, and
   * stay so in the air.
   *
   * Contact windows: the feet plant through the crouch; in a slide they then
   * bear on the floor, sliding with the body, to the end; landed, the seat lies
   * on the floor (the hip) and, in a dive, the lower hand plants beside it.
   *
   * First pass: the take-off is not driven by the legs' push, the landing does
   * not absorb the fall through the arm, and a slide from a run starts from the
   * run's posture at rest, not its speed.
   */
  export import dive = diveLaw;

  /**
   * Lie on a raised support. Entered seated on a bed's or a sofa's long edge,
   * the trunk lowers onto the side that turns toward the head end (the body's
   * left on the edge whose left points there) while the legs swing up onto the
   * surface, then the body rolls onto its back; `rise` reverses the route from
   * lying to sitting on the edge, feet on the floor. The keys are `lieDown`'s
   * side-lying and supine postures (VanSant 1988 components, provisional
   * angles) laid along the surface's length, the hips on its midline with the
   * head's room before them. Lying, the root rests the body's lowest collision
   * shape on the surface (`knockdown.rest` raised to it); between the edge and
   * the side the hips travel on a straight line. A surface shorter than the
   * body and `MARGIN`, or narrower than the shoulders and twice `MARGIN`, is
   * refused with the dimension, as is a lie not entered seated.
   */
  export const lieOnSurface: typeof lieOnSurfaceLaw = lieOnSurfaceLaw;

  /**
   * Turn over while lying. The body turns about its own long axis (`lyingTurn`)
   * from the position it lies in to the requested one, a quarter turn at a
   * time, through each side posture between; a turn between the back and the
   * front passes the `via` side. The limbs go from one quarter's posture to the
   * next (`lieDown`'s postures: the arms and the uppermost knee come over first
   * in the side posture, provisional angles), the pelvis keeps its place over
   * the support and the root rests the lowest collision shape on the floor or
   * the named surface at every second (`knockdown.rest`). A body not lying is
   * refused.
   */
  export const turnOver: typeof turnOverLaw = turnOverLaw;

  /**
   * Log-roll across the floor. The lying body straightens into a log, legs
   * extended and arms overhead, and rolls about its long axis (`lyingTurn`)
   * toward the named side, half a turn per `HALF` seconds. It rolls without
   * slipping: the pelvis advances along that side by the arc of the trunk's
   * cross-section rolled, half the perimeter of the chest's ellipse
   * (Ramanujan's approximation) per half turn, and the root rests the lowest
   * collision shape on the floor at every second (`knockdown.rest`). A count
   * gives the half turns; a place gives as many as bring the pelvis nearest it,
   * rounded to the `end` position's parity. Naming both or neither, or a body
   * not lying, is refused.
   */
  export const logRoll: typeof logRollLaw = logRollLaw;

  /**
   * Rolls on the floor, each a row of the roll law. Register the rows a film
   * uses.
   */
  export import HumanFloorRoll = HumanFloorRollSource;

  /**
   * A lying body's turn about its own long axis. A lying body is the supine
   * one, `Ry(yaw) Rx(-90)` (the head toward the heading's back, the chest up),
   * turned by `turn` degrees about its long axis, the root's `+Y`: `Ry(yaw)
   * Rx(-90) Ry(turn)`. At 0 it lies on its back, at 90 on its left side (the
   * chest toward where its left side faced), at 180 or -180 face down and at
   * -90 on its right side; a log roll keeps adding turns.
   */
  export import lyingTurn = lyingTurnLaw;

  /**
   * The sitOnFloor preset of `lieDown`: Sitting down on the floor, the legs
   * long, and staying three seconds (provisional). Spread into `lieDown`'s
   * parameters; the `sitOnFloor` row reads it.
   */
  export const SIT_ON_FLOOR: typeof HUMAN_FLOOR_SIT_ON_FLOOR =
    HUMAN_FLOOR_SIT_ON_FLOOR;

  /**
   * The sitCrossLegged preset of `lieDown`: Sitting down on the floor
   * cross-legged and staying three seconds (provisional). Spread into
   * `lieDown`'s parameters; the `sitCrossLegged` row reads it.
   */
  export const SIT_CROSS_LEGGED: typeof HUMAN_FLOOR_SIT_CROSS_LEGGED =
    HUMAN_FLOOR_SIT_CROSS_LEGGED;

  /**
   * The sitSideways preset of `lieDown`: Sitting down on the floor with both
   * legs folded to one side and staying three seconds (provisional). Spread
   * into `lieDown`'s parameters; the `sitSideways` row reads it.
   */
  export const SIT_SIDEWAYS: typeof HUMAN_FLOOR_SIT_SIDEWAYS =
    HUMAN_FLOOR_SIT_SIDEWAYS;

  /**
   * The lieStill preset of `lieDown`: Lying down and staying three seconds
   * (provisional), as to sleep or to play dead. Spread into `lieDown`'s
   * parameters; the `lieStill` row reads it.
   */
  export const LIE_STILL: typeof HUMAN_FLOOR_LIE_STILL = HUMAN_FLOOR_LIE_STILL;
}
