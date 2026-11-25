import { AutoMovieMotionHumanWorkoutLaws } from "./AutoMovieMotionHumanWorkoutLaws";
import { AutoMovieMotionHumanWorkoutRows } from "./AutoMovieMotionHumanWorkoutRows";

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
   * A standing bodyweight exercise counted in repetitions. See
   * `AutoMovieMotionHumanWorkoutLaws.exercise`.
   */
  export import exercise = AutoMovieMotionHumanWorkoutLaws.exercise;

  /**
   * A standing static stretch or yoga pose held and released. See
   * `AutoMovieMotionHumanWorkoutLaws.stretch`.
   */
  export import stretch = AutoMovieMotionHumanWorkoutLaws.stretch;

  /**
   * An exercise, a stretch or a pose done on a support that is not only the
   * feet, or with the feet kept under a moving trunk. See
   * `AutoMovieMotionHumanWorkoutLaws.workout`.
   */
  export import workout = AutoMovieMotionHumanWorkoutLaws.workout;

  /**
   * One low two-foot hop in place, designed to accompany a single rope turn.
   * See `AutoMovieMotionHumanWorkoutLaws.ropeSkip`.
   */
  export import ropeSkip = AutoMovieMotionHumanWorkoutLaws.ropeSkip;

  /**
   * A walk along a line too narrow for a normal gait (balance beam, tightrope).
   * See `AutoMovieMotionHumanWorkoutLaws.lineWalk`.
   */
  export import lineWalk = AutoMovieMotionHumanWorkoutLaws.lineWalk;

  /** A walk on stilts. See `AutoMovieMotionHumanWorkoutLaws.stiltWalk`. */
  export import stiltWalk = AutoMovieMotionHumanWorkoutLaws.stiltWalk;

  /**
   * A keyed whole-body posture of an exercise. See
   * `AutoMovieMotionHumanWorkoutRows.ExerciseKey`.
   */
  export import ExerciseKey = AutoMovieMotionHumanWorkoutRows.ExerciseKey;

  /**
   * Drive a visible rope on the clock of a placed two-foot skip. See
   * `AutoMovieMotionHumanWorkoutLaws.prepareRopeSkip`.
   */
  export import prepareRopeSkip = AutoMovieMotionHumanWorkoutLaws.prepareRopeSkip;

  /**
   * Companion types of {@link WorkoutKind}. See
   * `AutoMovieMotionHumanWorkoutRows.WorkoutKind`.
   */
  export import WorkoutKind = AutoMovieMotionHumanWorkoutRows.WorkoutKind;

  /**
   * The exercises of the workout law done on the hands and the toes or feet .
   * See `AutoMovieMotionHumanWorkoutRows.WorkoutFloor`.
   */
  export import WorkoutFloor = AutoMovieMotionHumanWorkoutRows.WorkoutFloor;

  /**
   * The standing lifts and warm-up drills of the workout law. See
   * `AutoMovieMotionHumanWorkoutRows.WorkoutStanding`.
   */
  export import WorkoutStanding = AutoMovieMotionHumanWorkoutRows.WorkoutStanding;

  /**
   * The exercises of the workout law done hanging from a bar by both hands
   * (bars, pull-ups). See `AutoMovieMotionHumanWorkoutRows.WorkoutHanging`.
   */
  export import WorkoutHanging = AutoMovieMotionHumanWorkoutRows.WorkoutHanging;

  /**
   * Exercises, stretches, yoga poses, dance holds and turns, and a few sport
   * acts under the names a screenplay uses, each a row of the workout law with
   * its kind fixed, or of a shipped law. See
   * `AutoMovieMotionHumanWorkoutRows.HumanSportWorkout`.
   */
  export import HumanSportWorkout = AutoMovieMotionHumanWorkoutRows.HumanSportWorkout;

  /**
   * What the standing kinds of the workout law share. See
   * `AutoMovieMotionHumanWorkoutRows.WorkoutStance`.
   */
  export import WorkoutStance = AutoMovieMotionHumanWorkoutRows.WorkoutStance;

  /**
   * The exercises of the workout law done lying, sitting on the floor or on
   * furniture. See `AutoMovieMotionHumanWorkoutRows.WorkoutLying`.
   */
  export import WorkoutLying = AutoMovieMotionHumanWorkoutRows.WorkoutLying;

  /**
   * The standing poses and single acts of the workout law. See
   * `AutoMovieMotionHumanWorkoutRows.WorkoutPoses`.
   */
  export import WorkoutPoses = AutoMovieMotionHumanWorkoutRows.WorkoutPoses;

  /**
   * The gym's standing movements of the workout law. See
   * `AutoMovieMotionHumanWorkoutRows.WorkoutGym`.
   */
  export import WorkoutGym = AutoMovieMotionHumanWorkoutRows.WorkoutGym;

  /**
   * The bodyweight movements of the workout law a gym programme names beside
   * the ones the other tables hold. See
   * `AutoMovieMotionHumanWorkoutRows.WorkoutBodyweight`.
   */
  export import WorkoutBodyweight = AutoMovieMotionHumanWorkoutRows.WorkoutBodyweight;

  /**
   * The gym's remaining movements under the names a programme uses, each a row
   * of the workout law with its kind fixed (`WorkoutGym`, `WorkoutBodyweight`,
   * `WorkoutEquipment`). See `AutoMovieMotionHumanWorkoutRows.HumanSportGym`.
   */
  export import HumanSportGym = AutoMovieMotionHumanWorkoutRows.HumanSportGym;

  /**
   * The feet of a workout that stands. See
   * `AutoMovieMotionHumanWorkoutRows.WorkoutFeet`.
   */
  export import WorkoutFeet = AutoMovieMotionHumanWorkoutRows.WorkoutFeet;

  /**
   * The load a workout is done with. See
   * `AutoMovieMotionHumanWorkoutRows.WorkoutLoad`.
   */
  export import WorkoutLoad = AutoMovieMotionHumanWorkoutRows.WorkoutLoad;

  /**
   * The support a prop gives a workout. See
   * `AutoMovieMotionHumanWorkoutRows.WorkoutSupport`.
   */
  export import WorkoutSupport = AutoMovieMotionHumanWorkoutRows.WorkoutSupport;

  /**
   * The exercises of the workout law that are done on a box or a bench the
   * author names (`on`). See
   * `AutoMovieMotionHumanWorkoutRows.WorkoutEquipment`.
   */
  export import WorkoutEquipment = AutoMovieMotionHumanWorkoutRows.WorkoutEquipment;

  /**
   * Where a workout's bearing bones stay. See
   * `AutoMovieMotionHumanWorkoutRows.WorkoutPlace`.
   */
  export import WorkoutPlace = AutoMovieMotionHumanWorkoutRows.WorkoutPlace;
}
