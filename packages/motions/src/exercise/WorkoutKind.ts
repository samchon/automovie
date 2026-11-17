import type { IAutoMovieMotionHumanExerciseKey, IAutoMovieMotionHumanWorkoutKind } from "@automovie/interface";

/** Companion types of {@link WorkoutKind}. */
export namespace WorkoutKind {

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
    key: IAutoMovieMotionHumanExerciseKey.IKey,
    seconds: number,
    leave: string,
    event: string,
    hold: number = 0,
  ): IAutoMovieMotionHumanWorkoutKind.IStep {
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
    key: IAutoMovieMotionHumanExerciseKey.IKey,
    seconds: number,
    hold: number,
  ): IAutoMovieMotionHumanWorkoutKind.IStep {
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
