import { selectAutoMovieDrawSubject } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";

/**
 * A draw page creates the subject the host names among those its module offers, and refuses a name it does not offer, or no name among several, listing every subject it offers.
 *
 * Scenarios:
 *
 * 1. A module offering `starter` and `sequel` creates `sequel` when it is named, and `starter` when it is named.
 * 2. Naming `prequel` throws listing `starter, sequel`.
 * 3. Naming nothing among the two throws listing both.
 * 4. Naming nothing in a module offering only `starter` creates `starter`.
 * 5. A module offering nothing throws, named or not.
 */
export function test_unit_render_draw_subject_selection(): void {
  const two: string[] = ["starter", "sequel"];

  // 1. A named subject.
  TestValidator.equals(
    "sequel is created",
    selectAutoMovieDrawSubject(two, "sequel"),
    "sequel",
  );
  TestValidator.equals(
    "starter is created",
    selectAutoMovieDrawSubject(two, "starter"),
    "starter",
  );

  // 2 and 3. Refusals list both.
  TestValidator.predicate(
    "an unknown name lists both",
    throwsError(
      (): string => selectAutoMovieDrawSubject(two, "prequel"),
      "starter, sequel",
    ),
  );
  TestValidator.predicate(
    "no name among several lists both",
    throwsError(
      (): string => selectAutoMovieDrawSubject(two, null),
      "starter, sequel",
    ),
  );

  // 4. The only subject.
  TestValidator.equals(
    "the only subject",
    selectAutoMovieDrawSubject(["starter"], null),
    "starter",
  );

  // 5. No subject.
  TestValidator.predicate(
    "an empty module, unnamed",
    throwsError(
      (): string => selectAutoMovieDrawSubject([], null),
      "offers no subject",
    ),
  );
  TestValidator.predicate(
    "an empty module, named",
    throwsError(
      (): string => selectAutoMovieDrawSubject([], "starter"),
      "offers no subject",
    ),
  );
}
