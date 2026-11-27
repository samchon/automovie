import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanWorkoutBodyweight } from "./IAutoMovieMotionHumanWorkoutBodyweight";
import type { IAutoMovieMotionHumanWorkoutDance } from "./IAutoMovieMotionHumanWorkoutDance";
import type { IAutoMovieMotionHumanWorkoutEquipment } from "./IAutoMovieMotionHumanWorkoutEquipment";
import type { IAutoMovieMotionHumanWorkoutFloor } from "./IAutoMovieMotionHumanWorkoutFloor";
import type { IAutoMovieMotionHumanWorkoutGym } from "./IAutoMovieMotionHumanWorkoutGym";
import type { IAutoMovieMotionHumanWorkoutHanging } from "./IAutoMovieMotionHumanWorkoutHanging";
import type { IAutoMovieMotionHumanWorkoutLoad } from "./IAutoMovieMotionHumanWorkoutLoad";
import type { IAutoMovieMotionHumanWorkoutLying } from "./IAutoMovieMotionHumanWorkoutLying";
import type { IAutoMovieMotionHumanWorkoutPoses } from "./IAutoMovieMotionHumanWorkoutPoses";
import type { IAutoMovieMotionHumanWorkoutStanding } from "./IAutoMovieMotionHumanWorkoutStanding";

/**
 * An exercise, a stretch or a pose done on a support that is not only the feet,
 * or with the feet kept under a moving trunk: the body gets from standing into
 * the exercise's first posture, passes through the postures of each repetition,
 * and gets up again.
 *
 * The physics is kinematic and stated: every posture is a set of joint angles
 * and a whole-body tilt (`WorkoutKind`, `ExerciseKey`), passed through in joint
 * space on minimum-jerk progress, and the body is placed by what bears it. The
 * bones that bear (the toes of a push-up, the hands on a bar, the pelvis on a
 * bench, the feet of a squat) keep their mean place, so the body pivots about
 * its support and rises by what its limbs shorten. Hands that bear on the floor
 * are laid there by the arm's solve and stay. Nothing is integrated: no force,
 * no load and no balance check decides a posture.
 *
 * Events: `enter`; for each repetition `r` the kind's own pairs (such as
 * `lower1`, `bottom1`, `press1`, `top1`; `reach1`, `reachEnd1` for a held
 * pose); `release` and `relax`. With `stay`, the body is left on its support
 * and the plan declares that base.
 *
 * First pass limits: the way down from standing and back is a blend of the two
 * postures with the root carried between them and kept above the floor, so the
 * feet slide while it lasts and no hand helps; equipment (bars, benches,
 * machines, ropes) is not shown and nothing is held; a kind's own table states
 * which of its supports are kept by angles alone.
 */
export namespace IAutoMovieMotionHumanWorkout {
  /** An exercise's name. */
  export type Kind =
    | IAutoMovieMotionHumanWorkoutFloor.Name
    | IAutoMovieMotionHumanWorkoutEquipment.Name
    | IAutoMovieMotionHumanWorkoutGym.Name
    | IAutoMovieMotionHumanWorkoutBodyweight.Name
    | IAutoMovieMotionHumanWorkoutLying.Name
    | IAutoMovieMotionHumanWorkoutStanding.Name
    | IAutoMovieMotionHumanWorkoutPoses.Name
    | IAutoMovieMotionHumanWorkoutHanging.Name
    | IAutoMovieMotionHumanWorkoutDance.Name;

  /** Parameters. */
  export interface IParams {
    /** The exercise. */
    kind: IAutoMovieMotionHumanWorkout.Kind;

    /**
     * Repetitions, a whole number of at least 1; the kind's own count when
     * absent.
     */
    count?: number;

    /** Seconds a held pose is stayed in, at least 0; the kind's own when absent. */
    hold?: number;

    /**
     * The prop the body bears on, by one of its affordances: a bench's
     * `surface` under a kind that lies or sits raised, a bar's `bar` between
     * the hands of a hanging kind, which hangs from nothing else. Its place
     * when the action starts replaces the height the kind computes from the
     * body, and the body goes to it. None when absent.
     */
    on?: IParamsOn;

    /**
     * Static friction coefficient of the planted floor for a named wall sit,
     * nonnegative. When absent the law uses 0.6 for a dry shoe-floor pair.
     */
    floorFriction?: number;

    /**
     * Whether the body stays on its support at the end instead of standing up;
     * `false` when absent.
     */
    stay?: boolean;

    /**
     * The prop the exercise is done with, already held (`WorkoutLoad`); none
     * when absent.
     */
    load?: IAutoMovieMotionHumanWorkoutLoad.IParams;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /** The on object of {@link IParams}. */
  export type IParamsOn = {
    /** Scene subject id of the exercise support prop. */
    prop: string;
    /** Affordance id on that prop used for the first contact. */
    affordance: string;
    /**
     * Optional second support affordance id on the same prop; omitted uses
     * the single-contact case.
     */
    other?: string;
  };
}
