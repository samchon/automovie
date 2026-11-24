import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanExerciseKey,
} from "@automovie/interface";

import { ExerciseKey } from "./ExerciseKey";

/**
 * A karate block's chamber: the fists at the hips, the blocking arm folded
 * across.
 *
 * @param body The body.
 * @returns The chamber's exercise key.
 */
export function karateBlockChamber(
  body: IAutoMovieMotionHumanBody,
): IAutoMovieMotionHumanExerciseKey.IKey {
  return ExerciseKey.from(
    body,
    {},
    { shoulder: -10, elbow: 90 },
    {},
    { shoulder: 60, raise: 0, elbow: 140 },
  );
}
