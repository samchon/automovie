import { ExerciseKey as ExerciseKeySource } from "../exercise/ExerciseKey";
import { WorkoutBodyweight as WorkoutBodyweightSource } from "../exercise/WorkoutBodyweight";
import { WorkoutEquipment as WorkoutEquipmentSource } from "../exercise/WorkoutEquipment";
import { WorkoutFeet as WorkoutFeetSource } from "../exercise/WorkoutFeet";
import { WorkoutFloor as WorkoutFloorSource } from "../exercise/WorkoutFloor";
import { WorkoutGym as WorkoutGymSource } from "../exercise/WorkoutGym";
import { WorkoutHanging as WorkoutHangingSource } from "../exercise/WorkoutHanging";
import { WorkoutKind as WorkoutKindSource } from "../exercise/WorkoutKind";
import { WorkoutLoad as WorkoutLoadSource } from "../exercise/WorkoutLoad";
import { WorkoutLying as WorkoutLyingSource } from "../exercise/WorkoutLying";
import { WorkoutPlace as WorkoutPlaceSource } from "../exercise/WorkoutPlace";
import { WorkoutPoses as WorkoutPosesSource } from "../exercise/WorkoutPoses";
import { WorkoutStance as WorkoutStanceSource } from "../exercise/WorkoutStance";
import { WorkoutStanding as WorkoutStandingSource } from "../exercise/WorkoutStanding";
import { WorkoutSupport as WorkoutSupportSource } from "../exercise/WorkoutSupport";
import { exercise as exerciseLaw } from "../exercise/exercise";
import { lineWalk as lineWalkLaw } from "../exercise/lineWalk";
import { prepareRopeSkip as prepareRopeSkipLaw } from "../exercise/prepareRopeSkip";
import { ropeSkip as ropeSkipLaw } from "../exercise/ropeSkip";
import { stiltWalk as stiltWalkLaw } from "../exercise/stiltWalk";
import { stretch as stretchLaw } from "../exercise/stretch";
import { workout as workoutLaw } from "../exercise/workout";
import { HumanSportGym as HumanSportGymSource } from "../lexicon/HumanSportGym";
import { HumanSportWorkout as HumanSportWorkoutSource } from "../lexicon/HumanSportWorkout";

/**
 * Repeated exercises and stretches: a repetition clock built from `tempo` (3.3
 * s a repetition by default) and the kind tables.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `exercise`: A standing bodyweight exercise counted in repetitions: the squat,
 *   the forward lunge, high knees and the jumping jack (ACSM's Guidelines for
 *   Exercise Testing and Prescription, 11th ed.).
 * - `stretch`: A standing static stretch or yoga pose held and released: the neck
 *   side bend, the cross-body shoulder stretch, the overhead side bend, the
 *   standing quadriceps stretch holding the ankle, and the tree pose (ACSM's
 *   Guidelines, 11th ed.; the hold of 30 s, Bandy et al.
 * - `workout`: An exercise, a stretch or a pose done on a support that is not
 *   only the feet, or with the feet kept under a moving trunk: the body gets
 *   from standing into the exercise's first posture, passes through the
 *   postures of each repetition, and gets up again.
 * - `ropeSkip`: One low two-foot hop in place, designed to accompany a single
 *   rope turn.
 * - `lineWalk`: A walk along a line too narrow for a normal gait (balance beam,
 *   tightrope).
 * - `stiltWalk`: A walk on stilts.
 * - `prepareRopeSkip`: Drive a visible rope on the clock of a placed two-foot
 *   skip.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `ExerciseKey`: A keyed whole-body posture of an exercise: the body's tilt,
 *   its turn and its joints, with no place of its own.
 * - `WorkoutKind`: Companion types of {@link WorkoutKind}.
 * - `WorkoutFloor`: The exercises of the workout law done on the hands and the
 *   toes or feet: the push-up, the plank, the mountain climber, the burpee, the
 *   downward dog and the cobra.
 * - `WorkoutStanding`: The standing lifts and warm-up drills of the workout law:
 *   lifts shown without their load (deadlift, back squat, kettlebell swing,
 *   overhead press) and drills (arm circles, leg swings, butt kicks, the
 *   B-skip, the skipping rope's hops).
 * - `WorkoutHanging`: The exercises of the workout law done hanging from a bar by
 *   both hands (bars, pull-ups): the dead hang, the pull-up, the chin-up, the
 *   hanging knee raise and the swing.
 * - `HumanSportWorkout`: Exercises, stretches, yoga poses, dance holds and turns,
 *   and a few sport acts under the names a screenplay uses, each a row of the
 *   workout law with its kind fixed, or of a shipped law.
 * - `WorkoutStance`: What the standing kinds of the workout law share: the
 *   supports of a standing body, the record of a kind whose pinned bones stay
 *   where they stand, and the stances whose angles are solved on the body so
 *   both feet reach the floor.
 * - `WorkoutLying`: The exercises of the workout law done lying, sitting on the
 *   floor or on furniture: on the back (sit-up, crunch, glute bridge, a
 *   partner's hamstring stretch), on a side (side plank), sitting on the floor
 *   (the forward fold and the hurdler's stretch) and on furniture as high as
 *   the body needs (the bench press, the rowing machine, the stationary
 *   bicycle).
 * - `WorkoutPoses`: The standing poses and single acts of the workout law:
 *   stretches and yoga poses (calf, chest, triceps, the lunge with a twist,
 *   warrior I and II, the triangle, the standing half of a sun salutation),
 *   karate's front stance and blocks, a footballer's header and traps, a
 *   dancer's turn and closed hold and a thrower's turn.
 * - `WorkoutGym`: The gym's standing movements of the workout law: free-weight
 *   exercises a programme names beside the ones the other tables hold, shown
 *   here without their load unless the author names one (`load`): the bent-over
 *   row, the curl, the overhead triceps extension, the lateral and the front
 *   raise, the shrug, the calf raise, the front and the goblet squat, the split
 *   squat, the wall sit, the Romanian deadlift, the good morning, and the power
 *   clean and the snatch as their phases.
 * - `WorkoutBodyweight`: The bodyweight movements of the workout law a gym
 *   programme names beside the ones the other tables hold.
 * - `HumanSportGym`: The gym's remaining movements under the names a programme
 *   uses, each a row of the workout law with its kind fixed (`WorkoutGym`,
 *   `WorkoutBodyweight`, `WorkoutEquipment`).
 * - `WorkoutFeet`: The feet of a workout that stands: a foot the kind never moves
 *   is held by the leg's solve on the place it stands on at the entry, and a
 *   foot the body turns on stays on its ball, turned by the key's own turn.
 * - `WorkoutLoad`: The load a workout is done with: a prop the performer already
 *   holds (a barbell, a dumbbell, a kettlebell taken by `pickUp`), carried
 *   through the exercise's keys instead of being refused.
 * - `WorkoutSupport`: The support a prop gives a workout: a bench's top under a
 *   body that lies or sits raised, a bar between the hands of a body that
 *   hangs, a box's top under a foot.
 * - `WorkoutEquipment`: The exercises of the workout law that are done on a box
 *   or a bench the author names (`on`): the step-up, the incline push-up (the
 *   hands on the bench), the decline push-up (the feet on it) and the hip
 *   thrust (the upper back on its edge).
 * - `WorkoutPlace`: Where a workout's bearing bones stay: the one place the
 *   kind's pin keeps while the body works, decided once per plan from how the
 *   kind is anchored.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanWorkout} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanWorkout {
  /**
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

  /**
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

  /**
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

  /**
   * One low two-foot hop in place, designed to accompany a single rope turn.
   * Register with `HumanChain.extend({ ropeSkip })` and the performance's
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

  /**
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

  /**
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

  /**
   * A keyed whole-body posture of an exercise: the body's tilt, its turn and
   * its joints, with no place of its own. Where the body is follows from what
   * bears it: the key is pinned by naming bones whose mean stays at a point
   * (`pinned`), so the support neither slides nor sinks while the joints move.
   *
   * Angles are clinical degrees. A leg stood on a flat foot under a pitched
   * trunk is written by `stood`, which gives the hip and the ankle the angles
   * that keep the foot level.
   */
  export import ExerciseKey = ExerciseKeySource;

  /**
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
   *
   * @returns A seekable film-time sampler, undefined outside the surviving
   *   action.
   * @throws {HumanRefusal} For invalid dimensions, an incompatible action, or a
   *   rope that cannot span the sampled pose above the floor.
   */
  export const prepareRopeSkip: typeof prepareRopeSkipLaw = prepareRopeSkipLaw;

  /** Companion types of {@link WorkoutKind}. */
  export import WorkoutKind = WorkoutKindSource;

  /**
   * The exercises of the workout law done on the hands and the toes or feet :
   * the push-up, the plank, the mountain climber, the burpee, the downward dog
   * and the cobra.
   *
   * A prone support's pitch is solved on the body: the shoulders stand a share
   * of the arm's length above the floor over the toes (`plank`). Every other
   * angle is provisional, read off the exercise's usual description (ACSM's
   * Guidelines, 11th ed.; NSCA's Essentials of Strength Training, 4th ed.).
   *
   * First pass: the palms are laid where the first posture's angles put the
   * hands, so a body whose proportions differ from the keys' shows it in the
   * elbows; a burpee has no jump.
   */
  export import WorkoutFloor = WorkoutFloorSource;

  /**
   * The standing lifts and warm-up drills of the workout law: lifts shown
   * without their load (deadlift, back squat, kettlebell swing, overhead press)
   * and drills (arm circles, leg swings, butt kicks, the B-skip, the skipping
   * rope's hops).
   *
   * The feet stay where they stand: a key's legs are written by
   * `ExerciseKey.stood`, which keeps a foot level under a pitched trunk. A
   * drill that lifts a foot pins the pelvis or the standing foot instead. Every
   * stated angle is provisional, read off the exercise's usual description
   * (ACSM's Guidelines, 11th ed.; NSCA's Essentials of Strength Training, 4th
   * ed.).
   *
   * First pass: no bar, bell or rope is held or moved unless the author names a
   * load; a deadlift's and an overhead press's bar then travels over the middle
   * of the feet (`WorkoutLoad`).
   */
  export import WorkoutStanding = WorkoutStandingSource;

  /**
   * The exercises of the workout law done hanging from a bar by both hands
   * (bars, pull-ups): the dead hang, the pull-up, the chin-up, the hanging knee
   * raise and the swing.
   *
   * The fists' mean (the hands' grip sockets) stays on the bar and everything
   * else follows from the joints: a pull-up is the elbows' and the shoulders'
   * flexion with the hands fixed, so the body rises by what the arms shorten; a
   * swing is the whole body's pitch about the hands. Angles are provisional
   * (NSCA's Essentials of Strength Training, 4th ed., for the pull-up's top:
   * the chin over the bar, the elbows beside the ribs).
   *
   * First pass: the body is lifted to the bar from standing without a jump
   * being planned; a swing's rate is keyed, not a pendulum's; a chin-up differs
   * from a pull-up by the elbows kept ahead, the forearm's turn not written.
   */
  export import WorkoutHanging = WorkoutHangingSource;

  /**
   * Exercises, stretches, yoga poses, dance holds and turns, and a few sport
   * acts under the names a screenplay uses, each a row of the workout law with
   * its kind fixed, or of a shipped law. A row leaves open the count (`reps`),
   * a held pose's `hold`, whether the body stays on its support (`stay`), a
   * bar's place and the manner.
   *
   * What a row shows and what its first pass leaves out is stated on its kind
   * (`WorkoutFloor`, `WorkoutStanding`, `WorkoutHanging`): equipment is not
   * shown and nothing is held. A flow (a sun salutation, a kata) is these rows
   * in sequence in the composition.
   *
   * A row's time is its kind's: an entry of 0.8 to 2.4 s, then the default
   * count of repetitions, each a few seconds of its steps, or one pose held for
   * the stated seconds. Each row states its own, all provisional. `reps` and
   * `hold` replace them.
   */
  export import HumanSportWorkout = HumanSportWorkoutSource;

  /**
   * What the standing kinds of the workout law share: the supports of a
   * standing body, the record of a kind whose pinned bones stay where they
   * stand, and the stances whose angles are solved on the body so both feet
   * reach the floor.
   */
  export import WorkoutStance = WorkoutStanceSource;

  /**
   * The exercises of the workout law done lying, sitting on the floor or on
   * furniture: on the back (sit-up, crunch, glute bridge, a partner's hamstring
   * stretch), on a side (side plank), sitting on the floor (the forward fold
   * and the hurdler's stretch) and on furniture as high as the body needs (the
   * bench press, the rowing machine, the stationary bicycle).
   *
   * Every angle is provisional, read off the exercise's usual description
   * (ACSM's Guidelines, 11th ed.; NSCA's Essentials of Strength Training, 4th
   * ed.).
   *
   * First pass: the bench, the rower's seat and rail and the bicycle are not
   * props, so nothing is shown under the body; a barbell is not held; a
   * bridge's shoulders and a side plank's forearm are kept by the angles alone
   * and may slide by the difference between the keys. The side plank's roll is
   * solved on the body so its forearm rests on the floor level with its feet.
   */
  export import WorkoutLying = WorkoutLyingSource;

  /**
   * The standing poses and single acts of the workout law: stretches and yoga
   * poses (calf, chest, triceps, the lunge with a twist, warrior I and II, the
   * triangle, the standing half of a sun salutation), karate's front stance and
   * blocks, a footballer's header and traps, a dancer's turn and closed hold
   * and a thrower's turn.
   *
   * A split stance's front knee and a straddle's straight leg are solved on the
   * body so both feet reach the floor (`WorkoutStance`). Every stated angle is
   * provisional, read off the pose's usual description (ACSM's Guidelines, 11th
   * ed., for the stretches; Iyengar, Light on Yoga, for the poses; Nakayama,
   * Dynamic Karate, for the stance and the blocks).
   *
   * First pass: no ball is moved; a straddled foot's sideways tilt is not
   * flattened; a turn is one full turn on the left foot's ball without a rise
   * onto it; the partner of a closed hold or an underarm turn is not met.
   */
  export import WorkoutPoses = WorkoutPosesSource;

  /**
   * The gym's standing movements of the workout law: free-weight exercises a
   * programme names beside the ones the other tables hold, shown here without
   * their load unless the author names one (`load`): the bent-over row, the
   * curl, the overhead triceps extension, the lateral and the front raise, the
   * shrug, the calf raise, the front and the goblet squat, the split squat, the
   * wall sit, the Romanian deadlift, the good morning, and the power clean and
   * the snatch as their phases. The floor exercises and the dip are
   * `WorkoutBodyweight`'s.
   *
   * Every angle is provisional, read off the exercise's usual description
   * (NSCA's Essentials of Strength Training and Conditioning, 4th ed., exercise
   * technique chapters); none is a measured value.
   *
   * A loaded take fits its hands to the authored prop through `WorkoutLoad`.
   * The snatch and clean-and-jerk use separate catches and recoveries from the
   * IWF's definitions (https://iwf.sport/weightlifting_/rules/). The
   * trajectories are keyed kinematic staging. Nagao and Yamashita's example
   * snatch bar path (https://doi.org/10.1371/journal.pone.0263224, Fig. 3)
   * motivates preserving the continuous fore-aft path through turnover. The
   * wall sit uses a place. `WorkoutEquipment` owns bench and box support.
   */
  export import WorkoutGym = WorkoutGymSource;

  /**
   * The bodyweight movements of the workout law a gym programme names beside
   * the ones the other tables hold. On the floor: the pike push-up, the
   * superman, the bird dog, the lying leg raise, the bicycle crunch, the
   * Russian twist and the dead bug. On two bars at the hips' height: the dip.
   *
   * Every angle is provisional, read off the exercise's usual description
   * (ACSM's Guidelines, 11th ed.; NSCA's Essentials of Strength Training and
   * Conditioning, 4th ed., for the dip); none is a measured value.
   *
   * The bars of a dip are places at the standing hips' height beside the body
   * unless the author names a prop (`on`): a support exercise's bars stand
   * within the standing body's reach. First pass: the dip's base is the
   * grammar's `hanging`, the body borne by its hands with its feet off the
   * floor, there being no base of a body supported above its hands; a bird
   * dog's hands are kept by the angles alone.
   */
  export import WorkoutBodyweight = WorkoutBodyweightSource;

  /**
   * The gym's remaining movements under the names a programme uses, each a row
   * of the workout law with its kind fixed (`WorkoutGym`, `WorkoutBodyweight`,
   * `WorkoutEquipment`). A row leaves open the count (`reps`), a held pose's
   * `hold`, whether the body stays on its support (`stay`), the support (`on`),
   * the load (`load`), a bar's place and the manner. The bear crawl and the
   * inchworm are rows of the crawl law, which leaves open the count of cycles.
   *
   * What a row shows and what its first pass leaves out is stated on its kind
   * or its law: without `load` nothing is held, and without `on` no equipment
   * bears.
   */
  export import HumanSportGym = HumanSportGymSource;

  /**
   * The feet of a workout that stands: a foot the kind never moves is held by
   * the leg's solve on the place it stands on at the entry, and a foot the body
   * turns on stays on its ball, turned by the key's own turn.
   *
   * A key's legs are joint angles, and the stance a body is entered in has its
   * own width and toe-out, so the keyed feet stand a few centimetres from the
   * real ones; the solve puts each bearing foot back on its own place, which is
   * what the first run of the workout signature test measured as 42 mm of slip
   * without it.
   */
  export import WorkoutFeet = WorkoutFeetSource;

  /**
   * The load a workout is done with: a prop the performer already holds (a
   * barbell, a dumbbell, a kettlebell taken by `pickUp`), carried through the
   * exercise's keys instead of being refused.
   *
   * The hand that holds keeps its grip: the plan declares the grip and leaves
   * the hold as it found it, so the prop rides that hand. A prop held in one
   * hand asks no more. A prop with a second handle (a bar) is laid level: the
   * holding hand swings about its shoulder to centre the bar and turns so the
   * line to the other handle runs to the performer's other side with the
   * knuckles continuing the forearm, and the other hand is laid on that handle
   * by the arm's solve, as a long gun's support hand is.
   *
   * A lift whose kind says so (`WorkoutKind.midfoot`) carries the bar's middle
   * over the middle of the feet, so the bar of a deadlift or a press travels in
   * a vertical line over it. The rule is provisional: it is the coaching rule
   * of the Starting Strength method, whose own pages refused this session's
   * reading, and the one measurement read is narrower. Hancock, Wyatt and
   * Kilgore, "Variation in Barbell Position Relative to Shoulder and Foot
   * Anatomical Landmarks Alters Movement Efficiency", International Journal of
   * Exercise Science 5(3):183-195, 2012
   * (https://digitalcommons.wku.edu/ijes/vol5/iss3/1), abstract: six
   * weightlifters' deadlifts started with the bar over the navicular (the
   * mid-foot) moved it 37.5 +/- 13.7 mm horizontally backward, against 66.7 +/-
   * 12.9 mm when started over the metatarsophalangeal joint; a vertical path is
   * the limit that start approaches, and no source was read for the press. The
   * holding hand is swung about its shoulder at the arm's own reach, forward or
   * back and to either side, by what the key's arms leave the bar's middle off
   * that line, so the bar hangs centred between the hands and each handle is as
   * far out of its own shoulder; the mid-foot is the middle between the heel
   * and the toe of each foot the entry stands on.
   *
   * First pass: the load weighs nothing in the motion (no lean, no slower
   * tempo, no bar path round the knees); a bar is kept level across the body
   * whatever the key, so a one-sided or turned carry is not written; the
   * holding hand's turn about the bar is the straight wrist's, whatever the
   * lift (no hook or mixed grip).
   */
  export const WorkoutLoad: typeof WorkoutLoadSource = WorkoutLoadSource;

  /**
   * The support a prop gives a workout: a bench's top under a body that lies or
   * sits raised, a bar between the hands of a body that hangs, a box's top
   * under a foot. The prop names the place by one of its affordances, so the
   * exercise is done on the furniture the scene has, at its own height, instead
   * of on a height computed from the body.
   *
   * First pass: the place is read once, as the action starts, so a support that
   * moves during the exercise is not followed; the affordance's point is used
   * and its extent is not (a body may lie past a bench's end); the body goes to
   * the support by the workout's own entry blend, not by walking to it.
   */
  export import WorkoutSupport = WorkoutSupportSource;

  /**
   * The exercises of the workout law that are done on a box or a bench the
   * author names (`on`): the step-up, the incline push-up (the hands on the
   * bench), the decline push-up (the feet on it) and the hip thrust (the upper
   * back on its edge).
   *
   * Each solves its angles from the support's own height: a step-up's knee
   * bends as far as lifts the foot onto the box with the other leg straight,
   * and a push-up's pitch puts the shoulders the arm's reach above the hands
   * with the toes where they bear. A hip thrust's back turns about the chest's
   * joint over the bench's edge: at the lockout the trunk and the thighs are
   * one line over upright shanks, pitched as the edge's height asks, and at the
   * bottom the legs are solved in the sagittal plane onto the same place of the
   * feet. The hip thrust is the one Contreras et al. describe (Journal of
   * Applied Biomechanics 32:254-260, 2016, Methods and Figure 1): the back on a
   * bench about 16 inches high, the feet flat, full hip extension at the top;
   * `RISEN`, `SUNK` and `DROP` are not from it. The part that bears on the prop
   * is pinned on the prop's place; the other is kept by the angles.
   *
   * With no support named, the kind is done on an imagined one a quarter of the
   * stature high, so the row still plans alone.
   *
   * First pass: a step-up stays on the box's edge, the trailing foot hanging
   * beside it, and does not step down the far side; the feet of an incline
   * push-up and the palms' turn of a decline one are the keys', not solved onto
   * the floor; a hip thrust's feet are on their place at the bottom and at the
   * lockout and follow the blend of the angles between, the back does not roll
   * on the edge, and nothing lies across the hips; every angle not solved is
   * provisional (NSCA's Essentials of Strength Training and Conditioning, 4th
   * ed., for the exercises' positions).
   */
  export import WorkoutEquipment = WorkoutEquipmentSource;

  /**
   * Where a workout's bearing bones stay: the one place the kind's pin keeps
   * while the body works, decided once per plan from how the kind is anchored.
   *
   * - `stance`: where the entry shows those bones, so a foot stays where it
   *   stands and not where the keys' own joints would stand it.
   * - `hips`: where they are when the first posture rests with the pelvis over
   *   its place. Feet or toes that bear on the floor are as high above it as
   *   when the body stands on them, and hands as high as a laid palm's wrist; a
   *   body that bears on its trunk is rested by its shapes; a body on a raised
   *   support has its hip joints as high above it as above the floor when it
   *   lies flat.
   * - `bar`: the prop's with the joints' own height above it, or, with none, the
   *   places a support exercise's bars stand at (`WorkoutKind.bars`) beside the
   *   place stood on, or the floor rule for a kind done on equipment (an
   *   imagined support). A hanging kind hangs from the bar it names and is
   *   refused without one; hands that grip a bar are pinned by their grip
   *   sockets, so the bar lies in the fists.
   */
  export const WorkoutPlace: typeof WorkoutPlaceSource = WorkoutPlaceSource;
}
