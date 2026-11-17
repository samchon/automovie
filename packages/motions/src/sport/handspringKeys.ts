import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanExerciseKey,
} from "@automovie/interface";

import { ExerciseKey } from "../exercise/ExerciseKey";

/**
 * The handspring's two body-dependent key shapes, shared by its wheel and
 * flight. Their provisional joint angles are the handspring's existing
 * lunge and arched line; unspecified angles belong to the body's standing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two shapes, their provisional status and the source of unspecified angles.
 * @evidence contracts/development/design.md#principled-representation Two pure constructors of the existing exercise key.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The lunge and arch read by the handspring law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Keeps the existing provisional shapes and derives their relaxed defaults from the body.
 */
export namespace handspringKeys {
  /**
   * The lunge with the left leg leading, its knee bent, the trailing leg
   * extended and both arms overhead (provisional angles).
   *
   * @param body The body.
   * @returns The key.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the leading side and the provisional angles.
   * @evidence contracts/development/implementation.md#principled-implementation An ExerciseKey on the given body, with its existing lunge angles and the body's own relaxed defaults.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One constructor call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No angle or timing changes in this extraction.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms No algorithm is chosen.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses ExerciseKey.from.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lunged(
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanExerciseKey.IKey {
    return ExerciseKey.from(
      body,
      { neck: -15 },
      { shoulder: 175, raise: 10, elbow: 0 },
      { hip: 90, knee: 45, ankle: 15 },
      { hip: -15, knee: 0, ankle: -20 },
    );
  }

  /**
   * The arched line, the legs together and arms overhead, used on support
   * and in flight (provisional angles).
   *
   * @param body The body.
   * @returns The key.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the shape and its uses.
   * @evidence contracts/development/implementation.md#principled-implementation An ExerciseKey on the given body with the handspring's existing arch and the body's own relaxed defaults.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One constructor call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No angle or timing changes in this extraction.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms No algorithm is chosen.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses ExerciseKey.from.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function arched(
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanExerciseKey.IKey {
    return ExerciseKey.from(
      body,
      { spine: [-10, 0, 0], chest: [-10, 0, 0] },
      { hip: -10, knee: 0, ankle: 0, shoulder: 175, raise: 10, elbow: 0 },
    );
  }
}
