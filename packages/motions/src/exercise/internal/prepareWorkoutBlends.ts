import type { IAutoMovieMotionHumanExerciseKey } from "@automovie/interface";

import { ExerciseKey } from "./ExerciseKey";

/** One existing workout interval's immutable authored endpoint keys. */
interface IPair {
  /** The interval's starting key. */
  a: IAutoMovieMotionHumanExerciseKey.IKey;

  /** The interval's destination key. */
  b: IAutoMovieMotionHumanExerciseKey.IKey;
}

/**
 * Prepare one key interpolation per distinct endpoint pair in a workout.
 * Repetitions retain their own spans and clock; repeated authored key pairs
 * share only their ordered joint union and endpoint values.
 *
 * @param spans Ordered intervals whose endpoint keys stay unchanged.
 * @returns The same ordered interval readers, each yielding fresh key output.
 */
export function prepareWorkoutBlends(
  spans: readonly IPair[],
): ReturnType<typeof ExerciseKey.prepareBlend>[] {
  const pairs: Map<
    IAutoMovieMotionHumanExerciseKey.IKey,
    Map<
      IAutoMovieMotionHumanExerciseKey.IKey,
      ReturnType<typeof ExerciseKey.prepareBlend>
    >
  > = new Map();
  return spans.map(
    (span: IPair): ReturnType<typeof ExerciseKey.prepareBlend> => {
      let destinations:
        | Map<
            IAutoMovieMotionHumanExerciseKey.IKey,
            ReturnType<typeof ExerciseKey.prepareBlend>
          >
        | undefined = pairs.get(span.a);
      if (destinations === undefined) {
        destinations = new Map();
        pairs.set(span.a, destinations);
      }
      let blend: ReturnType<typeof ExerciseKey.prepareBlend> | undefined =
        destinations.get(span.b);
      if (blend === undefined) {
        blend = ExerciseKey.prepareBlend(span.a, span.b);
        destinations.set(span.b, blend);
      }
      return blend;
    },
  );
}
