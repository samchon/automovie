import { AutoMovieRenderFilm } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `equalOrderedScalarRows` compares lists of scalar rows: as many rows, each
 * pair equal position by position.
 *
 * Scenarios:
 *
 * 1. The stereo downmix [[0.5, 0.5]] equals itself.
 * 2. [[0.5, 0.5]] against [[0.5]], [[1]] against [[1], [1]] and [[1, 0]] against
 *    [[0, 1]] differ.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Compares scalar rows by row count, width and ordered contents.
 * @evidence contracts/development/testing.md#behavioral-verification Calls ordered row comparison on equal rows, a narrower row, another row count and reordered values.
 * @evidence contracts/development/testing.md#independent-expectations The explicit arrays isolate each dimension or ordering difference and hold the other dimensions constant.
 */
export function test_render_film_equal_ordered_scalar_rows(): void {
  TestValidator.predicate(
    "equal rows",
    AutoMovieRenderFilm.equalOrderedScalarRows([[0.5, 0.5]], [[0.5, 0.5]]),
  );
  TestValidator.predicate(
    "a shorter row",
    !AutoMovieRenderFilm.equalOrderedScalarRows([[0.5, 0.5]], [[0.5]]),
  );
  TestValidator.predicate(
    "another row count",
    !AutoMovieRenderFilm.equalOrderedScalarRows([[1]], [[1], [1]]),
  );
  TestValidator.predicate(
    "reordered entries",
    !AutoMovieRenderFilm.equalOrderedScalarRows([[1, 0]], [[0, 1]]),
  );
}
