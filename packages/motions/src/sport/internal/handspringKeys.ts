import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanExerciseKey,
} from "@automovie/interface";

import { ExerciseKey } from "../../exercise/internal/ExerciseKey";

/**
 * The handspring's two body-dependent key shapes, shared by its wheel and
 * flight. Their provisional joint angles are the handspring's existing lunge
 * and arched line; unspecified angles belong to the body's standing.
 */
export namespace handspringKeys {
  /**
   * The lunge with the left leg leading, its knee bent, the trailing leg
   * extended and both arms overhead (provisional angles).
   *
   * @param body The body.
   * @returns The key.
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
   * The arched line, the legs together and arms overhead, used on support and
   * in flight (provisional angles).
   *
   * @param body The body.
   * @returns The key.
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
