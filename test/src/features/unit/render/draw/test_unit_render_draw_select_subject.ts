import { selectAutoMovieDrawSubject } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";

/**
 * `selectAutoMovieDrawSubject` picks the named subject, or with no name the
 * only one, and otherwise refuses, listing every subject the module offers.
 *
 * Scenarios:
 *
 * 1. Of ["starter", "sequel"], "sequel" is "sequel" and "starter" is "starter"; no
 *    name of ["starter"] is "starter".
 * 2. "prequel" and no name of ["starter", "sequel"] are refused listing "starter,
 *    sequel".
 * 3. A module offering nothing is refused as offering no subject, named or not.
 */
export function test_unit_render_draw_select_subject(): void {
  const two: string[] = ["starter", "sequel"];
  TestValidator.equals(
    "named",
    [
      selectAutoMovieDrawSubject(two, "sequel"),
      selectAutoMovieDrawSubject(two, "starter"),
      selectAutoMovieDrawSubject(["starter"], null),
    ],
    ["sequel", "starter", "starter"],
  );
  TestValidator.predicate(
    "refusals list the offered subjects",
    throwsError(
      (): string => selectAutoMovieDrawSubject(two, "prequel"),
      "starter, sequel",
    ) &&
      throwsError(
        (): string => selectAutoMovieDrawSubject(two, null),
        "starter, sequel",
      ),
  );
  TestValidator.predicate(
    "an empty module offers no subject",
    throwsError(
      (): string => selectAutoMovieDrawSubject([], null),
      "offers no subject",
    ) &&
      throwsError(
        (): string => selectAutoMovieDrawSubject([], "starter"),
        "offers no subject",
      ),
  );
}
