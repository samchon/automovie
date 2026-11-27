import { AutoMovieRenderFilm } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `equalOrderedScalars` compares ordered scalar lists position by position with
 * `Object.is`: same length, same order, same scalar type.
 *
 * Scenarios:
 *
 * 1. ["front-left", "front-right"] equals itself.
 * 2. Reordered labels, a shorter list, 1 against "1" and +0 against −0 differ.
 */
export function test_render_film_equal_ordered_scalars(): void {
  TestValidator.predicate(
    "equal labels",
    AutoMovieRenderFilm.equalOrderedScalars(
      ["front-left", "front-right"],
      ["front-left", "front-right"],
    ),
  );
  TestValidator.predicate(
    "reordered labels",
    !AutoMovieRenderFilm.equalOrderedScalars(["a", "b"], ["b", "a"]),
  );
  TestValidator.predicate(
    "a shorter list",
    !AutoMovieRenderFilm.equalOrderedScalars(["a", "b"], ["a"]),
  );
  TestValidator.predicate(
    "a number and its text",
    !AutoMovieRenderFilm.equalOrderedScalars([1], ["1"]),
  );
  TestValidator.predicate("signed zeros", !AutoMovieRenderFilm.equalOrderedScalars([0], [-0]));
}
