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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States immutable endpoint premises, repetition timing independence, output order and fresh per-query keys.
 * @evidence contracts/development/implementation.md#principled-implementation Exact endpoint identity groups the same immutable authored pair, then ExerciseKey.prepareBlend remains the single interpolation owner with its original missing-joint and arithmetic rules.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One nested identity map indexes prepared source/destination pairs while one ordered pass assigns the reader for every existing span.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No span, time boundary, held interval, interpolation query or key output is omitted; distinct or reversed endpoint pairs remain independent preparations.
 * @evidence contracts/development/implementation.md#efficient-algorithms For N spans, P distinct ordered pairs and J joints per pair, preparation costs expected O(N+PJ) instead of O(NJ); each actual read retains the owner's O(J) fresh interpolation work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Endpoint identity is valid because the workout holds its route and mirrored keys unchanged for the plan. Only endpoint/joint metadata is shared, with every progress independently evaluated and no current result retained.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The pair maps end with this synchronous preparation; the plan owns N reader references to P bounded endpoint preparations until release, and no time, pose history, FK workspace or handle is retained.
 */
export function prepareWorkoutBlends(
  spans: readonly IPair[],
): ReturnType<typeof ExerciseKey.prepareBlend>[] {
  const pairs: Map<
    IAutoMovieMotionHumanExerciseKey.IKey,
    Map<IAutoMovieMotionHumanExerciseKey.IKey, ReturnType<typeof ExerciseKey.prepareBlend>>
  > = new Map();
  return spans.map(
    (span: IPair): ReturnType<typeof ExerciseKey.prepareBlend> => {
      let destinations:
        | Map<IAutoMovieMotionHumanExerciseKey.IKey, ReturnType<typeof ExerciseKey.prepareBlend>>
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
