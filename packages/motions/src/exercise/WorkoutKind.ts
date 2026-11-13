import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanBase } from "../law/HumanBase";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { ExerciseKey } from "./ExerciseKey";

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
export interface WorkoutKind {
  /** What bears the body while it works. */
  base: HumanBase.Kind;

  /**
   * Where the bearing bones are put: `stance` where they are in standing
   * (feet that never leave the floor), `hips` where the first posture rests
   * on the floor with the pelvis over the place stood on, `bar` on a bar
   * above the place stood on.
   */
  anchor: "stance" | "hips" | "bar";

  /** The bones whose mean place is kept while the body works. */
  pin: readonly AutoMovieHumanoidBone[];

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
  raise?(body: IHumanBody): number;

  /** Whether the palms are laid on the floor under where the first posture has the hands, and kept there while the body works. */
  hands?: boolean;

  /** The parts that bear while the body works, with how each bears. */
  supports: readonly WorkoutKind.ISupport[];

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
   * @returns The steps, at least one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and what the first step is.
   * @evidence contracts/development/implementation.md#principled-implementation A function of the body, so an angle two supports share (a split stance's two legs, a plank's pitch over its arms) is solved from the body's lengths.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One list.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Stated angles are provisional and named so in each table.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state.
   */
  route(body: IHumanBody): readonly WorkoutKind.IStep[];
}
/** Companion types of {@link WorkoutKind}. */
export namespace WorkoutKind {
  /** A part that bears and how. */
  export interface ISupport {
    /** The part. */
    part: IHumanContactWindow["part"];

    /** How it bears. */
    kind: IHumanContactWindow["kind"];
  }

  /** One posture of a repetition. */
  export interface IStep {
    /** The posture. */
    key: ExerciseKey.IKey;

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

  /**
   * A step of a counted repetition.
   *
   * @param key The posture.
   * @param seconds Seconds taken to reach it.
   * @param leave The event at which the body leaves for it.
   * @param event The event at which it arrives.
   * @param hold Seconds stayed in it; 0 when absent.
   * @returns The step.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the default.
   * @evidence contracts/development/implementation.md#principled-implementation One record, so a table row reads as posture, time and the two event names.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function step(
    key: ExerciseKey.IKey,
    seconds: number,
    leave: string,
    event: string,
    hold: number = 0,
  ): IStep {
    return { key, seconds, hold, leave, event };
  }

  /**
   * A step that is held: a stretch's or a pose's end, entered over `seconds`
   * (`reach` to `reachEnd`) and stayed in for `hold` seconds unless the
   * author names a hold.
   *
   * @param key The posture.
   * @param seconds Seconds taken to reach it.
   * @param hold Seconds stayed in it when the author names none.
   * @returns The step.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, the event names and whose hold wins.
   * @evidence contracts/development/implementation.md#principled-implementation The same record as a counted step with the author's hold admitted.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function pose(
    key: ExerciseKey.IKey,
    seconds: number,
    hold: number,
  ): IStep {
    return {
      key,
      seconds,
      hold,
      held: true,
      leave: "reach",
      event: "reachEnd",
    };
  }
}
