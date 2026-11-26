import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanExercise } from "../exercise/IAutoMovieMotionHumanExercise";
import type { IAutoMovieMotionHumanLineWalk } from "../exercise/IAutoMovieMotionHumanLineWalk";
import type { IAutoMovieMotionHumanRopeSkip } from "../exercise/IAutoMovieMotionHumanRopeSkip";
import type { IAutoMovieMotionHumanStiltWalk } from "../exercise/IAutoMovieMotionHumanStiltWalk";
import type { IAutoMovieMotionHumanStretch } from "../exercise/IAutoMovieMotionHumanStretch";
import type { IAutoMovieMotionHumanWorkoutBodyweight } from "../exercise/IAutoMovieMotionHumanWorkoutBodyweight";
import type { IAutoMovieMotionHumanWorkoutDance } from "../exercise/IAutoMovieMotionHumanWorkoutDance";
import type { IAutoMovieMotionHumanWorkoutEquipment } from "../exercise/IAutoMovieMotionHumanWorkoutEquipment";
import type { IAutoMovieMotionHumanWorkoutFloor } from "../exercise/IAutoMovieMotionHumanWorkoutFloor";
import type { IAutoMovieMotionHumanWorkoutGym } from "../exercise/IAutoMovieMotionHumanWorkoutGym";
import type { IAutoMovieMotionHumanWorkoutHanging } from "../exercise/IAutoMovieMotionHumanWorkoutHanging";
import type { IAutoMovieMotionHumanWorkoutLoad } from "../exercise/IAutoMovieMotionHumanWorkoutLoad";
import type { IAutoMovieMotionHumanWorkoutLying } from "../exercise/IAutoMovieMotionHumanWorkoutLying";
import type { IAutoMovieMotionHumanWorkoutPoses } from "../exercise/IAutoMovieMotionHumanWorkoutPoses";
import type { IAutoMovieMotionHumanWorkoutStanding } from "../exercise/IAutoMovieMotionHumanWorkoutStanding";

/**
 * Repeated exercises and stretches: a repetition clock built from `tempo` (3.3
 * s a repetition by default) and the kind tables.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanWorkout` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanWorkout<Chain> {
  /**
   * A standing bodyweight exercise counted in repetitions: the squat, the
   * forward lunge, high knees and the jumping jack (ACSM's Guidelines for
   * Exercise Testing and Prescription, 11th ed.).
   *
   * @param params The `balance`, `kind`, `count`, `depth`, `tempo`, `side` and
   *   `manner` of `IAutoMovieMotionHumanExercise.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  exercise(
    params: IAutoMovieMotionHumanExercise.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A standing static stretch or yoga pose held and released: the neck side
   * bend, the cross-body shoulder stretch, the overhead side bend, the standing
   * quadriceps stretch and the tree pose, held 30 s by default (`stretch.HOLD`,
   * Bandy et al. 1997).
   *
   * @param params The `kind`, `side`, `hold`, `depth` and `manner` of
   *   `IAutoMovieMotionHumanStretch.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  stretch(params: IAutoMovieMotionHumanStretch.IParams, anchor?: string): Chain;

  /**
   * An exercise, a stretch or a pose done on a support that is not only the
   * feet, or with the feet kept under a moving trunk: the body gets from
   * standing into the exercise's first posture, passes through the postures of
   * each repetition, and gets up again.
   *
   * Registered law: `registered("workout", params)`; not a chain method.
   *
   * @param params The `kind`, `count`, `hold`, `on`, `stay`, `load` and
   *   `manner` of `IAutoMovieMotionHumanWorkout.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  workout(params: IAutoMovieMotionHumanWorkout.IParams, anchor?: string): Chain;

  /**
   * Skip a rope in place: one two-foot jump over the rope at each of its turns.
   *
   * Registered law: `registered("ropeSkip", params)`; not a chain method.
   *
   * @param params The `periodSeconds` and `flightSeconds` of
   *   `IAutoMovieMotionHumanRopeSkip.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  ropeSkip(
    params: IAutoMovieMotionHumanRopeSkip.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A walk along a line too narrow for a normal gait (balance beam, tightrope):
   * the feet step heel to toe on the line, each turned out from it, the arms
   * held out to the sides, and the body sways over the line and corrects
   * (`lineWalk`).
   *
   * Registered law: `registered("lineWalk", params)`; not a chain method.
   *
   * @param params The `on`, `to`, `steps`, `pole` and `sag` of
   *   `IAutoMovieMotionHumanLineWalk.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  lineWalk(
    params: IAutoMovieMotionHumanLineWalk.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A walk on stilts: each foot strapped on a stilt's platform, the stilts'
   * tips the only floor contacts, short steps on a wide base.
   *
   * Registered law: `registered("stiltWalk", params)`; not a chain method.
   *
   * @param params The `stilts`, `to` and `steps` of
   *   `IAutoMovieMotionHumanStiltWalk.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  stiltWalk(
    params: IAutoMovieMotionHumanStiltWalk.IParams,
    anchor?: string,
  ): Chain;
}

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
    on?: {
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
}
