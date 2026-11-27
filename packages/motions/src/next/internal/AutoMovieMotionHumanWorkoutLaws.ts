import { exercise as exerciseLaw } from "../../exercise/internal/exercise";
import { lineWalk as lineWalkLaw } from "../../exercise/internal/lineWalk";
import { prepareRopeSkip as prepareRopeSkipLaw } from "../../exercise/internal/prepareRopeSkip";
import { ropeSkip as ropeSkipLaw } from "../../exercise/internal/ropeSkip";
import { stiltWalk as stiltWalkLaw } from "../../exercise/internal/stiltWalk";
import { stretch as stretchLaw } from "../../exercise/internal/stretch";
import { workout as workoutLaw } from "../../exercise/internal/workout";

/*
 * The workout family's laws, each the shipped function under its family name
 * (`AutoMovieMotionHumanWorkout`), with its own comment.
 */
export namespace AutoMovieMotionHumanWorkoutLaws {
  /*
   * A standing bodyweight exercise counted in repetitions: the squat, the
   * forward lunge, high knees and the jumping jack (ACSM's Guidelines for
   * Exercise Testing and Prescription, 11th ed.).
   *
   * Every repetition has four spans: `eccentricStart` (lowering, or opening),
   * `bottom` (the pause at the bottom), `concentricStart` (rising, or closing)
   * and `top` (the pause on top), numbered from 1, so the counts are exact and
   * the tempo is the declared eccentric, pause and concentric seconds (2, 0, 1
   * when absent, the common 2-0-1 tempo; provisional).
   *
   * - Squat: the hips sink and the trunk pitches over the planted feet
   *   (`AutoMovieMotionHumanTrunk.crouch`), the hip shift solved for balance.
   *   The depth names the thigh's angle from the horizontal at the bottom:
   *   `quarter` 60, `half` 45, `parallel` 0 degrees; the hips' drop follows
   *   from the thigh and shank lengths with the shank leaning forward up to 35
   *   degrees (provisional, the ankle's working dorsiflexion), and the trunk
   *   pitches 15, 25 or 40 degrees (provisional).
   * - Lunge: the hips come down until the lead thigh is level over an upright
   *   shank and travel forward until the trailing thigh hangs under its hip,
   *   that leg's shank level behind it on a foot stood on its toes with the
   *   ankle at its dorsiflexion range; the lead foot steps out to stand a thigh
   *   ahead of the hips there, and steps back.
   * - High knees: one knee rises per repetition, alternating, the ankle under a
   *   thigh raised to the horizontal ahead of the hip, the hips carried over
   *   the standing foot.
   * - Jumping jack: the feet jump apart to 1.5 half shoulder widths each side of
   *   the midline (provisional) with the arms raised overhead, and back; a hop
   *   of 4 cm (provisional) lifts the body in each jump, the feet free while
   *   they travel.
   *
   * Events: the numbered repetition instants. A cut at a repetition's `top`
   * into standing or another exercise is legal.
   *
   * Not drafted: floor exercises (push-up, plank, sit-up, glute bridge,
   * mountain climber, burpee), loaded lifts, machines and skipping rope; they
   * need hand and back supports on the floor.
   */
  export import exercise = exerciseLaw;

  /*
   * A standing static stretch or yoga pose held and released: the neck side
   * bend, the cross-body shoulder stretch, the overhead side bend, the standing
   * quadriceps stretch holding the ankle, and the tree pose (ACSM's Guidelines,
   * 11th ed.; the hold of 30 s, Bandy et al. 1997).
   *
   * Each pose is a phrase: `enter` to `reachEnd` over 1.5 s (provisional, a
   * stretch is entered slowly), the hold, and the release over 1.5 s. The
   * intensity names the share of the joint's own range a stretch uses (`mild`
   * half, `moderate` deep, `AutoMovieMotionHumanRange`), never more than the
   * range table allows.
   *
   * - Neck side bend: the neck and head bend to one side by the share of the
   *   neck's lateral range.
   * - Cross-body: the stretched arm crosses the chest until its wrist is beyond
   *   the other shoulder (provisional place), and the other palm presses the
   *   stretched arm near its elbow (`stretchCrossBody`).
   * - Overhead side bend: both arms overhead, palms facing, the spine and the
   *   chest bent to one side by the share of their lateral ranges, the pelvis
   *   level over the planted feet and the arms riding the chest.
   * - Quadriceps: the hips move over the standing foot, the other knee bends to
   *   at least 130 degrees (provisional) and as far as the same-side hand needs
   *   to hold the ankle (`stretchQuadriceps`).
   * - Tree: the hips over the standing foot, the other foot's sole on the inside
   *   of the standing calf, the knee turned out, the palms together before the
   *   chest.
   *
   * Events: `enter`, `reachEnd`, `release`, with the phrase instants.
   *
   * Not drafted: seated and floor stretches, PNF, dynamic stretches and the
   * flows (sun salutation); they need floor supports for the hands and seat.
   */
  export import stretch = stretchLaw;

  /*
   * An exercise, a stretch or a pose done on a support that is not only the
   * feet, or with the feet kept under a moving trunk: the body gets from
   * standing into the exercise's first posture, passes through the postures of
   * each repetition, and gets up again.
   *
   * The physics is kinematic and stated: every posture is a set of joint angles
   * and a whole-body tilt (`WorkoutKind`, `ExerciseKey`), passed through in
   * joint space on minimum-jerk progress, and the body is placed by what bears
   * it. The bones that bear (the toes of a push-up, the hands on a bar, the
   * pelvis on a bench, the feet of a squat) keep their mean place, so the body
   * pivots about its support and rises by what its limbs shorten. Hands that
   * bear on the floor are laid there by the arm's solve and stay. Nothing is
   * integrated: no force, no load and no balance check decides a posture.
   *
   * Events: `enter`; for each repetition `r` the kind's own pairs (such as
   * `lower1`, `bottom1`, `press1`, `top1`; `reach1`, `reachEnd1` for a held
   * pose); `release` and `relax`. With `stay`, the body is left on its support
   * and the plan declares that base. A succeeding exercise with the same floor
   * stance uses the incoming palms and bearing pins. An already lowered entry
   * approaches the first key from its displayed posture.
   *
   * First pass limits: the way down from standing and back is a blend of the
   * two postures with the root carried between them and kept above the floor,
   * so the feet slide while it lasts and no hand helps; equipment (bars,
   * benches, machines, ropes) is not shown and nothing is held; a kind's own
   * table states which of its supports are kept by angles alone.
   */
  export import workout = workoutLaw;

  /*
   * One low two-foot hop in place, designed to accompany a single rope turn.
   * Register with `AutoMovieMotionHumanChain.extend({ ropeSkip })` and the performance's
   * laws.
   *
   * The default cadence is 1.7 Hz, a frequency tested by Silva and Pellegrini
   * (2009). They measured 0.13 s from takeoff to the simultaneous-foot rope
   * crossing. The model places that crossing at the apex, giving 0.26 s flight.
   * The flight band and the flat-foot compression and handle pose are authored
   * choices for a low hop. The arm and fist angles stage the grip, and the
   * action's named instants let a prop producer author its own rope turn.
   * https://periodicos.ufsc.br/index.php/rbcdh/article/download/1980-0037.2009v11n4p379/10901
   */
  export const ropeSkip: typeof ropeSkipLaw = ropeSkipLaw;

  /*
   * A walk along a line too narrow for a normal gait (balance beam, tightrope).
   * Each step puts a foot one foot's length ahead of the other on the line,
   * heel to toe, turned out `TURN` degrees from it; a stepping foot swings over
   * `SWING` of a `PERIOD`-second step while the other bears, passing the
   * bearing shank on its own side by the two shanks' radii at the crossing; a
   * foot holds the line under its ball and its heel rises about that ball. The
   * hips travel along the line between the feet on minimum-jerk progress and
   * sway across it, `SWAY` of the stature at the stride's period, corrected
   * back over the line at each footfall; the arms are held out to the sides for
   * balance.
   *
   * The line is the prop's: a beam's `surface` along its depth, a rope's or a
   * bar's `bar` along its length, at its top. Refused: an entry whose feet are
   * not on the line's top, and a stopping point beyond either end of the line.
   *
   * A rope or wire may sag (`sag`): the footprints follow the parabola of that
   * sag, and a sag too shallow for the span is refused because the tension it
   * needs, `W L / (4 sag)`, exceeds the line's working load `LOAD`. A balancing
   * pole (`pole`, `lineWalkPole`) is held in both hands at its grips, carried
   * with the hips.
   *
   * First pass: the sway is kinematic, not a balance controller; the line's sag
   * is static, not deflected under each step.
   *
   * Events: `step1` to `stepN` at each footfall, `relax`.
   */
  export import lineWalk = lineWalkLaw;

  /*
   * A walk on stilts. Each foot stands strapped on its stilt's platform and
   * carries the stilt with it, so the stilts' tips are the only floor contacts;
   * the feet bear on the platforms' height as on a raised floor. The steps are
   * short, `STEP` hip heights, on the stance's own wide base, one every
   * `PERIOD` seconds with the foot in the air over `SWING` of it, lifted `LIFT`
   * metres so the tip clears the floor; the hips ride over the feet and the
   * arms are held a little out for balance. Standing still is stepping in
   * place: a stop at the start steps each foot where it stands.
   *
   * Refused: a stilt with no `foot` or `tip`, and an entry foot not standing on
   * its stilt's platform.
   */
  export import stiltWalk = stiltWalkLaw;

  /*
   * Drive a visible rope on the clock of a placed two-foot skip.
   *
   * The central cable runs transversely and revolves over the neutral body
   * height and below the foot station. The two side legs complete a four-point
   * cable of the specified length. Its orbit starts overhead and reaches the
   * bottom at the action's airborne underpass. If needed, the rope waits at the
   * overhead position so its entire passage fits within the flight. Each handle
   * follows the displayed grasp's wrapped axis, with its local +Z end on the
   * thumb side. The cable can flex where it joins that end. A film host poses
   * its two barrels and supplies the unindexed cord to the existing soft-prop
   * draw binding. This is a derived staging curve.
   * Returns: A seekable film-time sampler, undefined outside the surviving
   * action.
   * For invalid dimensions, an incompatible action, or a
   * rope that cannot span the sampled pose above the floor.
   */
  export const prepareRopeSkip: typeof prepareRopeSkipLaw = prepareRopeSkipLaw;
}
