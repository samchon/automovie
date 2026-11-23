import type { IAutoMovieMotionHumanRun } from "../actions/IAutoMovieMotionHumanRun";
import type { IAutoMovieMotionHumanStand } from "../actions/IAutoMovieMotionHumanStand";
import type { IAutoMovieMotionHumanExercise } from "../exercise/IAutoMovieMotionHumanExercise";
import type { IAutoMovieMotionHumanRopeSkip } from "../exercise/IAutoMovieMotionHumanRopeSkip";
import type { IAutoMovieMotionHumanWorkout } from "../next/IAutoMovieMotionHumanWorkout";

/**
 * Open parameters of the sportWorkout lexicon family, keyed by each runtime
 * export name.
 */
export interface IAutoMovieMotionHumanLexiconSportWorkoutParams {
  /** Push-ups. */
  pushUp: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Wide push-ups. */
  widePushUp: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A plank on the straight arms. */
  plank: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Mountain climbers. */
  mountainClimber: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Burpees, without the jump. */
  burpee: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** The downward dog of yoga. */
  downwardDog: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** The cobra of yoga. */
  cobra: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Sit-ups. */
  sitUp: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Crunches. */
  crunch: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Glute bridges. */
  gluteBridge: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A partner's hamstring stretch, the stretched person's part. */
  pnfHamstring: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A side plank. */
  sidePlank: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** The seated forward fold of yoga, and the seated hamstring stretch. */
  seatedFold: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** The hurdler's hamstring stretch. */
  hurdlerStretch: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A bench press, without its bar and bench. */
  benchPress: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Rowing on a machine. */
  rowing: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Pedalling a stationary bicycle. */
  cycling: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Deadlifts, without the bar. */
  deadlift: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Back squats, without the bar. */
  backSquat: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Kettlebell swings, without the bell. */
  kettlebellSwing: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Overhead presses, without the bar. */
  overheadPress: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Arm circles. */
  armCircles: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Leg swings. */
  legSwings: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Butt kicks in place. */
  buttKicks: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** The A-skip in place: the knees driven up in turn. */
  aSkip: Omit<IAutoMovieMotionHumanExercise.IParams, "kind">;

  /** The B-skip in place. */
  bSkip: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Strides: a run at an easy fast pace to the place the composition gives. */
  strides: Omit<IAutoMovieMotionHumanRun.IParams, "pace">;

  /** Skipping rope, the rope not shown. */
  jumpRope: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A standing calf stretch. */
  calfStretch: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A chest stretch. */
  chestStretch: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A triceps stretch. */
  tricepsStretch: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A lunge with a twist, in place. */
  lungeTwist: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** The mountain pose of yoga: standing still ten seconds (provisional). */
  mountainPose: Omit<IAutoMovieMotionHumanStand.IParams, "hold">;

  /** Warrior I of yoga. */
  warriorOne: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Warrior II of yoga. */
  warriorTwo: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /**
   * The standing half of a sun salutation; the plank, the cobra and the dog
   * complete the flow as their own rows.
   */
  sunSalutation: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** The triangle of yoga. */
  triangle: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Karate's front stance. */
  frontStance: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Karate's low block. */
  lowBlock: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Karate's rising block. */
  risingBlock: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A football header, the ball not moved. */
  header: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A chest trap, the ball not moved. */
  chestTrap: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A thigh trap, the ball not moved. */
  thighTrap: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A dancer's full turn. */
  spin: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** The follower's underarm turn. */
  underarmTurn: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** One turn of a hammer or discus thrower. */
  hammerTurn: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A ballroom closed hold. */
  closedHold: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A ballet arabesque on the left foot. */
  arabesque: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A breaking baby freeze on both hands. */
  babyFreeze: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A street rock with chest and head isolations. */
  streetRock: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A dead hang from a bar. */
  deadHang: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Pull-ups. */
  pullUp: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Chin-ups. */
  chinUp: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Hanging knee raises. */
  kneeRaise: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A swing on a bar. */
  barSwing: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Skip a rope for a specified cadence and count. */
  ropeSkip: IAutoMovieMotionHumanRopeSkip.IParams;
}
