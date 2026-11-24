import { selectAutoMovieDrawSubject } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `selectAutoMovieDrawSubject` picks the named subject, or with no name the
 * only one, and refuses otherwise.
 *
 * Scenarios:
 *
 * 1. "b" of ["a", "b"] is "b"; no name of ["only"] is "only".
 * 2. No name of ["a", "b"], "c" of ["a", "b"], and anything of [] refuse.
 */
export function test_unit_render_draw_select_subject(): void {
  TestValidator.equals(
    "named",
    selectAutoMovieDrawSubject(["a", "b"], "b"),
    "b",
  );
  TestValidator.equals(
    "the only one",
    selectAutoMovieDrawSubject(["only"], null),
    "only",
  );
  TestValidator.error("several unnamed", (): string =>
    selectAutoMovieDrawSubject(["a", "b"], null),
  );
  TestValidator.error("not offered", (): string =>
    selectAutoMovieDrawSubject(["a", "b"], "c"),
  );
  TestValidator.error("none offered", (): string =>
    selectAutoMovieDrawSubject([], null),
  );
}
