import { AutoMovieRenderDraw } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

/**
 * `selectDrawSubject` picks the named subject, or with no name the
 * only one, and otherwise refuses, listing every subject the module offers.
 *
 * Scenarios:
 *
 * 1. Of ["starter", "sequel"], "sequel" is "sequel" and "starter" is "starter"; no
 *    name of ["starter"] is "starter".
 * 2. "prequel" and no name of ["starter", "sequel"] are refused listing "starter,
 *    sequel".
 * 3. A module offering nothing is refused as offering no subject, named or not.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Selects a named subject or the sole unnamed choice and explains ambiguous or absent selections.
 * @evidence contracts/development/testing.md#behavioral-verification Calls subject selection for a named, sole, ambiguous, unknown and empty fixture.
 * @evidence contracts/development/testing.md#independent-expectations The offered subject set and exact return identity distinguish sole fallback from guessing. Refusals list only the available choices.
 */
export function test_render_draw_select_subject(): void {
  const two: string[] = ["starter", "sequel"];
  TestValidator.equals(
    "named",
    [
      AutoMovieRenderDraw.selectAutoMovieDrawSubject(two, "sequel"),
      AutoMovieRenderDraw.selectAutoMovieDrawSubject(two, "starter"),
      AutoMovieRenderDraw.selectAutoMovieDrawSubject(["starter"], null),
    ],
    ["sequel", "starter", "starter"],
  );
  TestValidator.predicate(
    "refusals list the offered subjects",
    throwsError(
      (): string => AutoMovieRenderDraw.selectAutoMovieDrawSubject(two, "prequel"),
      "starter, sequel",
    ) &&
      throwsError(
        (): string => AutoMovieRenderDraw.selectAutoMovieDrawSubject(two, null),
        "starter, sequel",
      ),
  );
  TestValidator.predicate(
    "an empty module offers no subject",
    throwsError(
      (): string => AutoMovieRenderDraw.selectAutoMovieDrawSubject([], null),
      "offers no subject",
    ) &&
      throwsError(
        (): string => AutoMovieRenderDraw.selectAutoMovieDrawSubject([], "starter"),
        "offers no subject",
      ),
  );
}
