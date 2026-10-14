import { unionSubjectBoxes } from "@automovie/engine";
import { IAutoMovieSubjectBox } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../internal/predicates";

/**
 * The union of subject boxes is the per-axis extreme of their corners, for a
 * list of any length.
 *
 * Scenarios:
 *
 * 1. An empty list answers null rather than an inverted or zero box.
 * 2. A single box answers its own corners, as a new object.
 * 3. Boxes extending the union on different axes each contribute only the axis
 *    they extend.
 * 4. Three hundred thousand boxes, past the argument-count limit of a spread
 *    `Math.min` call, still answer the union instead of throwing.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `unionSubjectBoxes` and asserts the returned corners, catching a fold that drops an axis, keeps the first box, mutates its input, or throws a `RangeError` on a long list; any exact per-axis extreme passes.
 * @evidence contracts/testing.md#independent-expectations Expected corners are the hand-computed per-axis minima and maxima of boxes chosen so each axis is extended by a different box, and the long list is built with its extremes at known indices, so the oracle is the definition of an axis-aligned union and not the implementation's output.
 * @evidence contracts/testing.md#distinguishing-cases Covers the empty, singleton and multi-box cases plus the long-list limit that the spread implementation failed; framing a union inside a shot is owned by `test_film_camera_formation_subject_extent`.
 * @evidence contracts/testing.md#execution-ownership A unit test of a pure engine function, discovered by its `test_` export under `test/src/features/film`, with no host, consumer or native artifact involved.
 */
export function test_film_union_subject_boxes(): void {
  TestValidator.equals(
    "an empty list has no union",
    unionSubjectBoxes([]),
    null,
  );

  const only: IAutoMovieSubjectBox = {
    min: { x: -1, y: 0, z: 2 },
    max: { x: 1, y: 3, z: 4 },
  };
  const single: IAutoMovieSubjectBox | null = unionSubjectBoxes([only]);
  TestValidator.predicate(
    "a single box answers its own corners as a new box",
    single !== null &&
      single !== only &&
      vclose(single.min, only.min) &&
      vclose(single.max, only.max),
  );

  const mixed: IAutoMovieSubjectBox | null = unionSubjectBoxes([
    only,
    { min: { x: -5, y: 1, z: 3 }, max: { x: 0, y: 2, z: 3 } },
    { min: { x: 0, y: -2, z: 2 }, max: { x: 0, y: 9, z: 7 } },
  ]);
  TestValidator.predicate(
    "each box extends only the axes it reaches past",
    mixed !== null &&
      vclose(mixed.min, { x: -5, y: -2, z: 2 }) &&
      vclose(mixed.max, { x: 1, y: 9, z: 7 }) &&
      vclose(only.min, { x: -1, y: 0, z: 2 }),
  );

  const many: IAutoMovieSubjectBox[] = Array.from(
    { length: 300_000 },
    (_: unknown, index: number): IAutoMovieSubjectBox => ({
      min: { x: index, y: 0, z: 0 },
      max: { x: index + 1, y: 1, z: 1 },
    }),
  );
  const long: IAutoMovieSubjectBox | null = unionSubjectBoxes(many);
  TestValidator.predicate(
    "a list past the spread argument limit still unions",
    long !== null &&
      vclose(long.min, { x: 0, y: 0, z: 0 }) &&
      vclose(long.max, { x: 300_000, y: 1, z: 1 }),
  );
}
