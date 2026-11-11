import {
  type IAutoMovieCapturePlanRequest,
  parseAutoMovieCapturePlanRequest,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";

/**
 * A value the grammar cannot read stops the request naming the key, the text and what is accepted, and two keys that ask for the same thing twice stop it naming both.
 *
 * Scenarios:
 *
 * 1. Each capture key with an unreadable value (a word for a number, a negative or fractional count, a zero rate, a cut threshold above 100, `to` before `from`, `smallest` above `longest`, an unknown reduction, a round name with a slash, an empty view list, a malformed view, an unknown pass, a repeated view or pass, a tolerance above 255) is refused with the key and the text in the message.
 * 2. `at` beside `from`, `passes` beside `shade`, `margin` without `sweep`, `tolerance` without `compare` and a round compared with itself are refused.
 * 3. An inspection key with an unreadable value is refused by the inspection reader the grammar composes.
 * 4. The boundary values `from=0`, `window=0`, `tolerance=255`, `smallest` equal to `longest` and `margin=0` are read.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Parses each malformed text through the public reader and checks the refusal names the key and the text; a reader that fell back to a default or a refusal that named neither fails.
 * @evidence contracts/development/testing.md#independent-expectations Each malformed value breaks a range the reader's documented table states; the boundary values are the table's own limits and must be accepted.
 * @evidence contracts/development/testing.md#distinguishing-cases Every capture key with a value just outside its range against the limit itself, exclusive key pairs, and one inspection key. Unknown keys are owned by `test_capture_request_unknown_key`; whether a view exists for a subject is owned by the plan's tests.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_request_malformed_value`; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_capture_request_malformed_value(): void {
  const refuses: (text: string, fragments: string[]) => boolean = (
    text: string,
    fragments: string[],
  ): boolean =>
    throwsError(
      (): unknown => parseAutoMovieCapturePlanRequest(new URLSearchParams(text)),
      fragments,
    );

  // 1. Unreadable values name the key and the text.
  for (const [key, value] of [
    ["from", "soon"],
    ["from", "-1"],
    ["to", "x"],
    ["rate", "0"],
    ["at", "1,later"],
    ["at", ""],
    ["events", "-2"],
    ["window", "1.5"],
    ["window", "-1"],
    ["threshold", "101"],
    ["longest", "0"],
    ["smallest", "12.5"],
    ["reduction", "bicubic"],
    ["round", "a/b"],
    ["compare", ".hidden"],
    ["views", ";"],
    ["passes", "sepia"],
    ["passes", "clay,clay"],
    ["views", "front;front"],
    ["sweep", " "],
    ["subject", " "],
  ] as const)
    TestValidator.predicate(
      `${key}=${value} is refused`,
      refuses(`${key}=${encodeURIComponent(value)}`, [key, `"${value}"`]),
    );
  TestValidator.predicate(
    "to before from is refused",
    refuses("from=3&to=2", ["to", '"2"', "after from"]),
  );
  TestValidator.predicate(
    "smallest above longest is refused",
    refuses("longest=300&smallest=400", ["smallest", "at most longest"]),
  );
  TestValidator.predicate(
    "a malformed view is refused",
    refuses("views=1,2:3,4,5", ["views", "1,2:3,4,5"]),
  );
  TestValidator.predicate(
    "a tolerance above 255 is refused",
    refuses("compare=before&tolerance=256", ["tolerance", '"256"']),
  );

  // 2. Keys that exclude or need each other.
  for (const [text, fragments] of [
    ["at=1&rate=5", ["at", "rate"]],
    ["passes=clay&shade=depth", ["passes", "shade"]],
    ["margin=0.1", ["margin", "sweep"]],
    ["tolerance=1", ["tolerance", "compare"]],
    ["round=r1&compare=r1", ["r1", "itself"]],
  ] as const)
    TestValidator.predicate(`${text} is refused`, refuses(text, [...fragments]));

  // 3. Inspection values go through the inspection reader.
  TestValidator.predicate(
    "an unknown shade is refused",
    refuses("shade=sepia", ["shade", "sepia"]),
  );

  // 4. The limits themselves are read.
  const limits: IAutoMovieCapturePlanRequest = parseAutoMovieCapturePlanRequest(
    new URLSearchParams(
      "from=0&window=0&compare=b&tolerance=255&longest=300&smallest=300&sweep=a&margin=0",
    ),
  );
  TestValidator.equals(
    "boundary values are accepted",
    [
      limits.sampling,
      limits.window,
      limits.tolerance,
      limits.budget,
      limits.margin,
    ],
    [
      { kind: "even", from: 0, to: null, rate: 5 },
      0,
      255,
      { longest: 300, smallest: 300, reduction: "area" },
      0,
    ],
  );
}
