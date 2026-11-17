import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanBase } from "../law/IAutoMovieMotionHumanBase";
import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieMotionHumanExerciseKey } from "./IAutoMovieMotionHumanExerciseKey";

/**
 * One exercise of the workout law, as data: the postures a repetition
 * passes through, what bears the body while it works, and how the body gets
 * there from standing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the record is and its three parts.
 * @evidence contracts/development/design.md#principled-representation A route of keyed postures and a pin, so a push-up, a pull-up and a deadlift differ in data and share one planner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members the workout law reads; the kind tables fill them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The route is a function of the body, so an angle that must fit a body's lengths is solved from them.
 */
export interface IAutoMovieMotionHumanWorkoutKind {
  /** What bears the body while it works. */
  base: IAutoMovieMotionHumanBase.Kind;

  /**
   * Where the bearing bones are put: `stance` where they are in standing
   * (feet that never leave the floor), `hips` where the first posture rests
   * on the floor with the pelvis over the place stood on, `bar` on a bar
   * above the place stood on.
   */
  anchor: "stance" | "hips" | "bar";

  /** The bones whose mean place is kept while the body works, or the grip sockets of hands closed on a bar, the bar in the fists. */
  pin: readonly IAutoMovieMotionHumanExerciseKey.Pin[];

  /**
   * The height of what the first posture rests on (a bench, a seat, a
   * saddle), for the `hips` anchor; the floor when absent.
   *
   * @param body The body.
   * @returns Metres above the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the unit and the default.
   * @evidence contracts/development/implementation.md#principled-implementation A function of the body, so a bench is as high as the body's own knee and no furniture size is fixed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One number.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The furniture is not a prop in this pass; the kind's doc says so.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state.
   */
  raise?(body: IAutoMovieMotionHumanBody): number;

  /** Whether the palms are laid on the floor under where the first posture has the hands, and kept there while the body works. */
  hands?: boolean;

  /** The parts that bear while the body works, with how each bears. */
  supports: readonly IAutoMovieMotionHumanWorkoutKind.ISupport[];

  /** Whether a `stance` kind moves its bearing feet into a stance of its own (a split, a straddle); otherwise the feet that bear are held on the places they stand on at the entry. */
  strides?: boolean;

  /** Whether a bar held in both hands (`load` with `other`) travels over the middle of the feet, as a deadlift's and a press's does; where the key's arms put it when absent. */
  midfoot?: boolean;

  /** Whether every other repetition is done on the other side. */
  alternate?: boolean;

  /** Seconds from standing to the first posture and back; 0 when the first posture is standing. */
  enter: number;

  /** Repetitions when the author names none. */
  reps: number;

  /**
   * The postures of one repetition on a body: the first is where the
   * exercise starts and each repetition ends.
   *
   * @param body The body.
   * @param support The height above the floor of the prop's place the body bears on, metres, when the author names one (`on`); a kind done on equipment solves its angles from it, and others ignore it.
   * @returns The steps, at least one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and what the first step is.
   * @evidence contracts/development/implementation.md#principled-implementation A function of the body, so an angle two supports share (a split stance's two legs, a plank's pitch over its arms) is solved from the body's lengths.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One list.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Stated angles are provisional and named so in each table.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state.
   */
  route(
    body: IAutoMovieMotionHumanBody,
    support?: number,
  ): readonly IAutoMovieMotionHumanWorkoutKind.IStep[];

  /**
   * How high the pinned joints stand above the place a `bar` anchor gives
   * them, when they do not lie on it: an ankle above a box's top, a wrist
   * above a bench's. On the place itself when absent.
   *
   * @param body The body.
   * @returns Metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the unit and the default.
   * @evidence contracts/development/implementation.md#principled-implementation A function of the body, since the height is a joint's own above what its part bears on.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One number.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state.
   */
  rise?(body: IAutoMovieMotionHumanBody): number;

  /**
   * The height of the bars a `bar` kind is supported on when the author
   * names none: the places a support exercise's bars stand at, beside the
   * place stood on, as the dip's law defines its parallel bars "on two bars
   * at the hips' height", places unless the author names a prop
   * (`WorkoutBodyweight`). A `bar` kind with neither these nor a support of
   * its own (`rise`) hangs from a bar it must name.
   *
   * @param body The body.
   * @returns Metres above the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the unit, where the bars stand and what a kind without it does.
   * @evidence contracts/development/implementation.md#principled-implementation A function of the body, so the bars stand at the body's own height and no equipment size is fixed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One number.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only a support exercise, whose bars stand within the standing body's reach, places them; a hanging kind still names its bar.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state.
   */
  bars?(body: IAutoMovieMotionHumanBody): number;
}

/**
 * Companion types of {@link WorkoutKind}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation seconds: Seconds taken to reach it from the step before. hold: Seconds stayed in it.
 * @evidence contracts/development/design.md#principled-representation seconds: Seconds taken to reach it from the step before. hold: Seconds stayed in it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/WorkoutBodyweight.ts (WorkoutBodyweight.floor, base); exercise/WorkoutBodyweight.ts (WorkoutBodyweight.floor, route); exercise/WorkoutBodyweight.ts (WorkoutBodyweight.floor, return); exercise/WorkoutFeet.ts (WorkoutFeet.keep, kind); exercise/WorkoutGym.ts (WorkoutGym.pair, return); exercise/WorkoutHanging.ts (WorkoutHanging.kind, route).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanExerciseKey.IKey identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanWorkoutKind {
  /**
   * A part that bears and how.
   *
   * @evidence contracts/development/common.md#meaningful-documentation part: The part. kind: How it bears.
   * @evidence contracts/development/design.md#principled-representation part: The part. kind: How it bears.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/workout.ts (workout.plan.contacts, support); exercise/WorkoutBodyweight.ts (WorkoutBodyweight.floor, supports); exercise/WorkoutFeet.ts (WorkoutFeet.keep.bearing, how); exercise/WorkoutFeet.ts (WorkoutFeet.keep.bearing, support); exercise/WorkoutStance.ts (WorkoutStance.of, supports); exercise/WorkoutBodyweight.ts (WorkoutBodyweight.BACK).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanContactWindow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ISupport {
    /** The part. */
    part: IAutoMovieMotionHumanContactWindow["part"];

    /** How it bears. */
    kind: IAutoMovieMotionHumanContactWindow["kind"];
  }

  /**
   * One posture of a repetition.
   *
   * @evidence contracts/development/common.md#meaningful-documentation seconds: Seconds taken to reach it from the step before. hold: Seconds stayed in it.
   * @evidence contracts/development/design.md#principled-representation seconds: Seconds taken to reach it from the step before. hold: Seconds stayed in it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/workout.ts (workout.plan.stayed, step); exercise/WorkoutBodyweight.ts (WorkoutBodyweight.KINDS, return); exercise/WorkoutEquipment.ts (WorkoutEquipment.KINDS, return); exercise/WorkoutFloor.ts (WorkoutFloor.KINDS, return); exercise/WorkoutGym.ts (WorkoutGym.pair, return); exercise/WorkoutGym.ts (WorkoutGym.KINDS, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanExerciseKey.IKey identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IStep {
    /** The posture. */
    key: IAutoMovieMotionHumanExerciseKey.IKey;

    /** Seconds taken to reach it from the step before. */
    seconds: number;

    /** Seconds stayed in it. */
    hold: number;

    /** Whether the author's `hold` replaces this step's. */
    held?: boolean;

    /** The event at which the body leaves for this posture, numbered by repetition. */
    leave: string;

    /** The event at which the body arrives in it, numbered by repetition. */
    event: string;
  }
}
