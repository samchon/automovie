import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanWorkoutBodyweight } from "./IAutoMovieMotionHumanWorkoutBodyweight";
import type { IAutoMovieMotionHumanWorkoutEquipment } from "./IAutoMovieMotionHumanWorkoutEquipment";
import type { IAutoMovieMotionHumanWorkoutFloor } from "./IAutoMovieMotionHumanWorkoutFloor";
import type { IAutoMovieMotionHumanWorkoutGym } from "./IAutoMovieMotionHumanWorkoutGym";
import type { IAutoMovieMotionHumanWorkoutHanging } from "./IAutoMovieMotionHumanWorkoutHanging";
import type { IAutoMovieMotionHumanWorkoutLoad } from "./IAutoMovieMotionHumanWorkoutLoad";
import type { IAutoMovieMotionHumanWorkoutLying } from "./IAutoMovieMotionHumanWorkoutLying";
import type { IAutoMovieMotionHumanWorkoutPoses } from "./IAutoMovieMotionHumanWorkoutPoses";
import type { IAutoMovieMotionHumanWorkoutStanding } from "./IAutoMovieMotionHumanWorkoutStanding";

/**
 * An exercise, a stretch or a pose done on a support that is not only the
 * feet, or with the feet kept under a moving trunk: the body gets from
 * standing into the exercise's first posture, passes through the postures
 * of each repetition, and gets up again (#3377, #3378).
 *
 * The physics is kinematic and stated: every posture is a set of joint
 * angles and a whole-body tilt (`WorkoutKind`, `ExerciseKey`), passed
 * through in joint space on minimum-jerk progress, and the body is placed
 * by what bears it. The bones that bear (the toes of a push-up, the hands
 * on a bar, the pelvis on a bench, the feet of a squat) keep their mean
 * place, so the body pivots about its support and rises by what its limbs
 * shorten. Hands that bear on the floor are laid there by the arm's solve
 * and stay. Nothing is integrated: no force, no load and no balance check
 * decides a posture.
 *
 * Events: `enter`; for each repetition `r` the kind's own pairs (such as
 * `lower1`, `bottom1`, `press1`, `top1`; `reach1`, `reachEnd1` for a held
 * pose); `release` and `relax`. With `stay`, the body is left on its
 * support and the plan declares that base.
 *
 * First pass limits: the way down from standing and back is a blend of the
 * two postures with the root carried between them and kept above the floor,
 * so the feet slide while it lasts and no hand helps; equipment (bars,
 * benches, machines, ropes) is not shown and nothing is held; a kind's own
 * table states which of its supports are kept by angles alone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation reps: Repetitions; the kind's own count when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. hold: Seconds a held pose is stayed in; the kind's own when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. on: The prop the body bears on, by one of its affordances: a bench's `surface` under a kind that lies or sits raised, a bar's `bar` between the hands of a hanging kind, which hangs from nothing else. Its place when the action starts replaces the height the kind computes from the body, and the body goes to it. None when absent.
 * @evidence contracts/development/design.md#principled-representation reps: Repetitions; the kind's own count when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. hold: Seconds a held pose is stayed in; the kind's own when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. on: The prop the body bears on, by one of its affordances: a bench's `surface` under a kind that lies or sits raised, a bar's `bar` between the hands of a hanging kind, which hangs from nothing else. Its place when the action starts replaces the height the kind computes from the body, and the body goes to it. None when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/workout.ts (workout.plan, context); exercise/workout.ts (workout.KINDS); exercise/workout.ts (workout.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanWorkoutFloor.Name, IAutoMovieMotionHumanWorkoutEquipment.Name, IAutoMovieMotionHumanWorkoutGym.Name, IAutoMovieMotionHumanWorkoutBodyweight.Name, IAutoMovieMotionHumanWorkoutLying.Name, IAutoMovieMotionHumanWorkoutStanding.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanWorkout {
  /**
   * An exercise's name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation An exercise's name.
   * @evidence contracts/development/design.md#principled-representation Workout names are the union of the floor, equipment, gym, bodyweight, lying and standing vocabularies; those owners define the routines rather than a second copied string list.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/workout.ts (workout.KINDS).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanWorkoutFloor.Name, IAutoMovieMotionHumanWorkoutEquipment.Name, IAutoMovieMotionHumanWorkoutGym.Name, IAutoMovieMotionHumanWorkoutBodyweight.Name, IAutoMovieMotionHumanWorkoutLying.Name, IAutoMovieMotionHumanWorkoutStanding.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type Kind =
    | IAutoMovieMotionHumanWorkoutFloor.Name
    | IAutoMovieMotionHumanWorkoutEquipment.Name
    | IAutoMovieMotionHumanWorkoutGym.Name
    | IAutoMovieMotionHumanWorkoutBodyweight.Name
    | IAutoMovieMotionHumanWorkoutLying.Name
    | IAutoMovieMotionHumanWorkoutStanding.Name
    | IAutoMovieMotionHumanWorkoutPoses.Name
    | IAutoMovieMotionHumanWorkoutHanging.Name;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The exercise, the count, the hold, the prop borne and whether the body stays down.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The kind is a closed union; no angle is typed by the author.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The exercise. */
    kind: IAutoMovieMotionHumanWorkout.Kind;

    /** Repetitions; the kind's own count when absent.
     * Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    reps?: number;

    /** Seconds a held pose is stayed in; the kind's own when absent.
     * Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    hold?: number;

    /** The prop the body bears on, by one of its affordances: a bench's `surface` under a kind that lies or sits raised, a bar's `bar` between the hands of a hanging kind, which hangs from nothing else. Its place when the action starts replaces the height the kind computes from the body, and the body goes to it. None when absent. */
    on?: {
      /** Scene subject id of the exercise support prop. */
      prop: string;
      /** Affordance id on that prop used for the first contact. */
      affordance: string;
      /** Optional second support affordance id on the same prop; omitted uses the single-contact case. */
      other?: string;
    };

    /** Whether the body stays on its support at the end instead of standing up; `false` when absent. */
    stay?: boolean;

    /** The prop the exercise is done with, already held (`WorkoutLoad`); none when absent. */
    load?: IAutoMovieMotionHumanWorkoutLoad.IParams;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }
}
