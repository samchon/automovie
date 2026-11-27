import { HumanEnvironmentRecovery as HumanEnvironmentRecoverySource } from "../lexicon/internal/HumanEnvironmentRecovery";
import { HumanFloorFall as HumanFloorFallSource } from "../lexicon/internal/HumanFloorFall";
import { HumanStuntFall as HumanStuntFallSource } from "../lexicon/internal/HumanStuntFall";
import { HumanVehicleHit as HumanVehicleHitLaw } from "../lexicon/internal/HumanVehicleHit";
import { CollapseFold as CollapseFoldSource } from "../reaction/internal/CollapseFold";
import { collapse as collapseLaw } from "../reaction/internal/collapse";
import { knockdown as knockdownLaw } from "../reaction/internal/knockdown";
import { perturb as perturbLaw } from "../reaction/internal/perturb";
import { stagger as staggerLaw } from "../reaction/internal/stagger";
import { thrown as thrownLaw } from "../reaction/internal/thrown";
import { wireArrest as wireArrestLaw } from "../reaction/internal/wireArrest";
import { wireFlight as wireFlightLaw } from "../reaction/internal/wireFlight";
import { HUMAN_FALL_GOALKEEPER_DIVE_LEFT } from "./presets/HUMAN_FALL_GOALKEEPER_DIVE_LEFT";
import { HUMAN_FALL_GOALKEEPER_DIVE_RIGHT } from "./presets/HUMAN_FALL_GOALKEEPER_DIVE_RIGHT";

/**
 * The falls and the balance reactions: a collapse, a stagger, a knockdown, a
 * body thrown or hit by a car, a perturbation, a wire flight or arrest, a
 * staged stunt fall and the recovery from a trip or a slip. Each is planned by
 * physics of the body and its support, not by a fixed pose. A reaction that
 * leaves the feet where they are is a `IAutoMovieMotionHumanReaction`, not a
 * fall.
 *
 * `AutoMovieMotionHumanFall.GOALKEEPER_DIVE_LEFT` and `GOALKEEPER_DIVE_RIGHT`
 * (`IDivePreset`) are the one-side dives of a goalkeeper, data spread into the
 * dive law's parameters; a preset adds no method.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `collapse`: A staged collapse in a chosen direction and tone, for a faint or
 *   a fatal hit (`IAutoMovieMotionHumanCollapse`).
 * - `stagger`: A stagger: a blow pushes the centre of mass past the base of
 *   support and recovery steps catch it.
 * - `knockdown`: A knockdown: the legs give way and the body goes down away from
 *   the blow, sitting onto the floor and falling back to lie supine.
 * - `thrown`: A struck body thrown clear of the floor by a blast or a jerk-back
 *   (`IAutoMovieMotionHumanThrown`).
 * - `perturb`: One perturbation law whose response follows from the forces on its
 *   performer: the body absorbs an impulse within its base, catches it with
 *   capture steps, or falls, as the engine's balance outcome decides from the
 *   impulse, the body's mass and its support
 *   (`resolveAutoMovieBalanceOutcome`), or as the author fixes the outcome.
 * - `wireFlight`: A wire flight along an authored path
 *   (`IAutoMovieMotionHumanWireFlight`).
 * - `vehicleHit`: A pedestrian and a moving car: struck and thrown along one of
 *   the frontal impact trajectories (`planVehicleHit`), or diving clear of it
 *   at the last moment (`planVehicleDive`).
 * - `wireArrest`: An arrested fall on a wire
 *   (`IAutoMovieMotionHumanWireFlight.IArrest`).
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `GOALKEEPER_DIVE_LEFT`: The goalkeeper's dive to the left: the body dives to
 *   its own left side.
 * - `GOALKEEPER_DIVE_RIGHT`: The goalkeeper's dive to the right: the body dives
 *   to its own right side.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanStuntFall`: Staged stunt falls: a tumble or seat slide down a staircase
 *   and a high fall onto a pad or the ground (`planStuntFall`).
 * - `HumanEnvironmentRecovery`: Resolving a walk's staged trip or slip: the walk
 *   is cut at the measured cue and continues into a capture step, a fall or a
 *   braced rail catch (`planEnvironmentRecovery`).
 * - `HumanFloorFall`: Falls onto the floor on purpose, each a row of the dive
 *   law.
 * - `CollapseFold`: The trunk lean and clinical joint angles of a collapse at its
 *   sag, drop and lay shares, degrees.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanFall} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanFall {
  /**
   * A staged collapse in a chosen direction and tone, for a faint or a fatal
   * hit (`IAutoMovieMotionHumanCollapse`). `backward` is the knockdown itself;
   * the other directions drop onto the knees by `knockdown.SEATED`, about the
   * free-fall time of the pelvis slowed by the buckling legs, and lay the trunk
   * on the floor by `knockdown.DOWN`, while an optional sag softens the knees
   * first. The pelvis drops where it stood, the heading turns so the body falls
   * away from the blow, and the root height rests each pose's lowest collider
   * on the floor (`knockdown.rest`), so no pose penetrates it. The fold's
   * angles are `CollapseFold`'s.
   */
  export import collapse = collapseLaw;

  /**
   * A stagger: a blow pushes the centre of mass past the base of support and
   * recovery steps catch it.
   *
   * The centre of mass moves over the floor as an inverted pendulum of Hof's
   * leg length, 1.34 hip heights (Hof, Gazendam and Sinke 2005, J Biomech
   * 38:1), from the blow's speed along the push, its centre of pressure always
   * as near the extrapolated centre of mass `x + v / omega0`, `omega0 = sqrt(g
   * / l)`, as the bearing feet reach: on it, which holds it, or at the nearest
   * point of their outline, from which it runs on (Hof 2008, Hum Mov Sci
   * 27:112). After the push it moves without a jump: a weight shift carries it
   * onto the stance foot before each step, ending where the swing holds it, and
   * onto a landed foot only by the next shift, never at a touch-down. Each
   * recovery step chooses its time and its place within measured bounds, as
   * capture-point stepping does (Koolen et al. 2012, Int J Robot Res 31:1094;
   * Griffin et al. 2017): the weight shifts onto the stance foot over both
   * feet, the foot swings in its direction's step time and lands the sole point
   * it lands on as near the extrapolated centre of mass as its reachable
   * footstep region allows, and the body is caught once the extrapolated centre
   * of mass lies inside the base the two feet make. The region is the stance
   * foot's: within its direction's longest recovery step of where the foot
   * stood beside the stance foot; a step past it shortens toward the stance
   * foot. The legs then admit each step at its mid-swing and its landing, under
   * the pelvis the centre of mass carries there: each planted leg's reach, knee
   * flexion and thigh extension as a two-bone chain, and crossed legs clear of
   * each other as the tangle audit reads them (`staggerAdmission`,
   * `walkLegClearance`); a step they do not hold refuses its order of the feet.
   * The legs may cross, a sole's length in front of or behind the stance foot:
   * a footstep planner's region on the stepping foot's own side of the stance
   * foot (Deits and Tedrake 2014) keeps a walking robot's legs apart, but it
   * forbids the crossover step people take in most lateral recoveries, so it is
   * not this region. Every order of the feet over up to four steps is tried,
   * the fewest steps first, so capture is monotone in the push's speed; the
   * order preferred alternates its feet forward and backward (Maki and McIlroy
   * 1997), beginning with the foot further along the push, the rear foot for a
   * push backward, and pushed sideways begins with the leg the push unloads,
   * which crosses in front of or behind the loaded one (Maki, McIlroy and Perry
   * 1996: 96% of lateral stepping responses), the loaded leg's side-step being
   * the other order. The bounds are those of younger adults at the threshold of
   * balance recovery: an 82 ms reaction and a 138 ms weight shift before the
   * first step (Cyr, Moglo and Smeesters 2005), steps of 238, 176 and 193 ms
   * and up to 0.59, 0.38 and 0.42 statures forward, sideways and backward
   * (Telonio, Cyr, Moglo and Smeesters 2005), read between those directions on
   * an ellipse; the leg a sideways push unloads leaves the floor 20% sooner and
   * swings 70% longer than a forward or backward step (Maki, McIlroy and Perry
   * 1996, `LATERAL`). A foot stepping forward strikes with its heel and one
   * stepping backward lands on its forefoot (Grasso, Bianchi and Lacquaniti
   * 1998). A push four steps do not catch is a fall, as people take up to four
   * recovery steps (Debelle, Maganaris and O'Brien 2021): it is refused, naming
   * the fastest push the body catches that way.
   *
   * Once caught, the other foot closes at least at the entry's stance width, as
   * far ahead or behind as stands the middle of the two ankles, as the entry
   * stood over its own, under where the extrapolated centre of mass will be
   * when it lands, and the close holds only with the extrapolated centre of
   * mass then inside the two feet's base (Hof 2008). The extrapolated centre of
   * mass then tracks a minimum-jerk course to where the body stood over its
   * feet, its centre of pressure placed by the divergent component's tracking
   * law inside the base (Englsberger, Ott and Albu-Schaffer 2015), and the
   * centre of mass follows it, `x' = omega0 (xi - x)`, until both rest within a
   * millimetre.
   *
   * The body over its feet is read at each second from prepared courses
   * (`StaggerFeet`): the trunk bends about the hips against the fall, the hip
   * strategy (Horak and Nashner 1986, J Neurophysiol 55:1369), by the
   * inclination of the extrapolated centre of mass's lead over the pendulum's
   * length, bounded by the hip's extension and eased in from the measured
   * reaction (`staggerLean`, the relation provisional); the pelvis carries the
   * centre of mass's course less the shift that tilt makes of it, and is
   * lowered to the height its planted legs allow, as the walk settles its
   * pelvis (`walkReach.ground`), each heel rising about its ball where the
   * ankle runs out of room. A stepping foot first rises clear of the floor by
   * the minimum toe clearance of walking (`walkFoot.CLEARANCE`, Killeen et al.
   * 2017), over the share of its swing a walking foot takes to set down from
   * that height, then swings as a walking foot swings (`walkFoot.prepareSwing`)
   * to the stance it lands in, bowed clear of the standing foot by the soles'
   * own clearance in closed form (`staggerSwingBow`) and held inside its leg's
   * ranges and as high over the floor as its swing carries it
   * (`walkReach.swing`), so it leaves and joins its stances where they stand.
   *
   * Both arms abduct as balance reactions, 9.4 degrees from 154 ms after the
   * push (the mean of the two arms' abduction within 200 ms of a backward
   * release, 10.7 and 8.0 degrees, at its measured onset; Weerdesteyn, Laing
   * and Robinovitch 2008, Exp Brain Res 186:571), held through the steps and
   * let down as the body settles, each let out further where it would pass into
   * the body, read once for the plan at `KNOTS` a second as a gait reads its
   * carriage (`HumanArmSwing.carriage`) and interpolated between. The steps,
   * the catch and the settling are the body's dynamics, which no manner
   * changes; the manner's tempo scales the righting.
   *
   * The push is read where its source is as the plan begins, the causal read a
   * reaction makes (`ReactionSource`).
   *
   * A performer standing on one foot, a kicker mid-kick, catches no push: the
   * stagger is refused, naming the speed it can catch.
   */
  export import stagger = staggerLaw;

  /**
   * A knockdown: the legs give way and the body goes down away from the blow,
   * sitting onto the floor and falling back to lie supine.
   *
   * The collapse is a buckle, not a dive: the knees and hips fold while the
   * pelvis goes back and down behind the feet (as in the stepping-response
   * failures of Maki and McIlroy 1997, where a push too large for one step ends
   * in a fall), the seat meets the floor at 0.45 s, about the free-fall time of
   * the pelvis from its height slowed by the buckling legs, and the trunk rolls
   * back until the back rests on the floor by 1.1 s, the arms trailing. The
   * feet stay where they stood until the seat lands; then the seat stays where
   * it landed and the heels slide out as the legs straighten.
   *
   * Each pose rests on the floor without penetrating it: the root's height is
   * solved so the lowest point of the body's own collision shapes touches the
   * floor. The seat and the lie are fitted to the body the same way: the knee
   * at the seat is the one that puts the feet on the floor the seat sits on,
   * and the lying arm's extension and elbow are the ones that lay the arm on
   * the floor beside the body, so any stature sits and lies on the floor
   * exactly. The body goes down away from the blow (the `from` target), turned
   * so its back falls toward that direction.
   *
   * The trunk's recline and the hip's fold at the seat are provisional
   * readings; detailed falls belong to tier 2 of the kickboxing research.
   */
  export import knockdown = knockdownLaw;

  /**
   * A struck body thrown clear of the floor by a blast or a jerk-back
   * (`IAutoMovieMotionHumanThrown`). The body takes its rig's shape over
   * `WINDUP` with the feet held flat where they stood, the feet leave the floor
   * at `takeoff`, and the root flies the ballistic path of the authored
   * distance and height under standard gravity until it reaches the height it
   * lies at, `land`, turning over onto its back meanwhile into the knockdown's
   * supine lie (`KnockdownFloor`). The body faces against its travel, so it
   * lands on its back.
   */
  export import thrown = thrownLaw;

  /**
   * One perturbation law whose response follows from the forces on its
   * performer: the body absorbs an impulse within its base, catches it with
   * capture steps, or falls, as the engine's balance outcome decides from the
   * impulse, the body's mass and its support
   * (`resolveAutoMovieBalanceOutcome`), or as the author fixes the outcome.
   *
   * The impulse is the sum of the impulses on the performer
   * (`IHumanActionContext.forces`) from one pendulum time constant `1 / ω0`
   * before the action's start, the span within which the body has not yet moved
   * by more than its own response, to the start. Its outcome:
   *
   * - **absorb**: the hips travel along the push and come back over the feet as a
   *   critically damped pendulum at the body's own frequency, `x(t) = v t
   *   exp(-ω0 t)` with `v` the centre's speed after the impulse, its peak `v /
   *   (e ω0)` at `t = 1 / ω0`; the feet stay planted.
   * - **step**: `stagger`'s capture step at the centre's speed after the impulse,
   *   from the side the impulse comes from (Hof, Gazendam and Sinke 2005; the
   *   step's landing from Maki and McIlroy 1997, as `stagger` cites).
   * - **fall**: the way the impulse pushes in the body's frame: a push from
   *   behind a forward `collapse`, one from a side a sideways `collapse` away
   *   from it, and one from ahead the `knockdown`, from the side it comes
   *   from.
   *
   * An author's outcome the impulse cannot produce is refused with the impulse
   * range that would produce it, never clamped; with no impulse on the
   * performer the outcome is an absorb of nothing, a still stance.
   *
   * First pass: the step outcome lays one capture step, `stagger`'s; the
   * engine's outcome may ask for more, which this law refuses naming the fall
   * instead until the multi-step plan lands (A folds `stagger` into this law's
   * step). The absorb shows no trunk motion beyond the hips' travel; the ankle
   * and hip strategies (Horak and Nashner 1986) are not yet split.
   */
  export import perturb = perturbLaw;

  /**
   * A wire flight along an authored path (`IAutoMovieMotionHumanWireFlight`).
   * The root moves along the polyline from the entry root through the waypoints
   * to the end by arc length on one minimum-jerk profile (Flash and Hogan
   * 1985), so it starts and ends at rest; the feet stay planted over `LIFT`, a
   * heel rising about its ball once its leg has straightened under the rising
   * body, and the shape blends in over the first quarter of the flight and out
   * over the last, from and back to the quiet stance's joints: the column
   * upright and the arms hanging relaxed with their digits clear of the thighs
   * (`stand.relaxed`), so a flight lands in the stance the stand law holds. The
   * heading turns the body's front-back line onto the horizontal travel of the
   * whole path by the shorter turn (a travel behind is flown backward), once
   * the wire has taken the weight and the feet have left the floor, by the end
   * of the first quarter: planted feet hold the heading, which the hips cannot
   * turn far. No gravity is checked: the flight is staged on wires.
   */
  export import wireFlight = wireFlightLaw;

  /**
   * A pedestrian and a moving car: struck and thrown along one of the frontal
   * impact trajectories (`planVehicleHit`), or diving clear of it at the last
   * moment (`planVehicleDive`). Register `HumanVehicleHit.vehicleHit` and
   * `HumanVehicleHit.vehicleDive` to use them.
   */
  export import vehicleHit = HumanVehicleHitLaw;

  /**
   * An arrested fall on a wire (`IAutoMovieMotionHumanWireFlight.IArrest`).
   * From where it hangs raised, the body falls free for `drop` under standard
   * gravity, so it reaches `v = sqrt(2 g drop)`; the wire then takes it and
   * decelerates it uniformly to rest at the authored height, needing `a = v² /
   * (2 d)` over the remaining distance `d`; it hangs there for `HOLD`, then the
   * wire lowers it to the floor on a minimum-jerk profile, landing at rest. The
   * body keeps the posture it entered with. A fall whose deceleration would
   * exceed the authored bound, or which has no room left above the stop, is
   * refused.
   */
  export import wireArrest = wireArrestLaw;

  /**
   * Staged stunt falls: a tumble or seat slide down a staircase and a high fall
   * onto a pad or the ground (`planStuntFall`). Register
   * `HumanStuntFall.stuntFall` to use it.
   */
  export import HumanStuntFall = HumanStuntFallSource;

  /**
   * Resolving a walk's staged trip or slip: the walk is cut at the measured cue
   * and continues into a capture step, a fall or a braced rail catch
   * (`planEnvironmentRecovery`). Register
   * `HumanEnvironmentRecovery.environmentalRecovery` to use it.
   *
   * Timing: the walk keeps its own speed
   * (`IAutoMovieMotionHumanWalkParams.pace`) up to the cue; the lost foot is
   * released over at most 0.14 s (provisional) and the capture step, rail catch
   * or fall take the perturbation law's own times, on the same clock. A trip or
   * a slip on an ordinary walk; a stumble over a kerb, a slip on a wet floor.
   */
  export import HumanEnvironmentRecovery = HumanEnvironmentRecoverySource;

  /**
   * Falls onto the floor on purpose, each a row of the dive law. Register the
   * rows a film uses.
   */
  export import HumanFloorFall = HumanFloorFallSource;

  /**
   * The trunk lean and clinical joint angles of a collapse at its sag, drop and
   * lay shares, degrees. The angles are provisional stage readings in the
   * knockdown's convention (`KnockdownFloor`): a positive pitch leans the trunk
   * forward, a positive roll toward the body's right, flexion raises a limb
   * forward. A forward fall kneels, then pitches nearly prone with the hips and
   * knees opening; a sideways fall kneels, then rolls onto one hip and
   * shoulder; an in-place collapse folds the knees and hips fully with the
   * trunk over them. A protective body raises its arms toward the floor ahead
   * of its trunk, a limp one keeps them at its sides with the head following
   * the trunk.
   */
  export import CollapseFold = CollapseFoldSource;

  /**
   * The goalkeeper's dive to the left: the body dives to its own left side.
   * Spread into the dive law's parameters with the kind of fall; the
   * `goalkeeperDiveLeft` row of `HumanFloorFall` fixes this value.
   */
  export const GOALKEEPER_DIVE_LEFT: typeof HUMAN_FALL_GOALKEEPER_DIVE_LEFT =
    HUMAN_FALL_GOALKEEPER_DIVE_LEFT;

  /**
   * The goalkeeper's dive to the right: the body dives to its own right side.
   * Spread into the dive law's parameters with the kind of fall; the
   * `goalkeeperDiveRight` row of `HumanFloorFall` fixes this value.
   */
  export const GOALKEEPER_DIVE_RIGHT: typeof HUMAN_FALL_GOALKEEPER_DIVE_RIGHT =
    HUMAN_FALL_GOALKEEPER_DIVE_RIGHT;
}
