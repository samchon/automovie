import { IAutoMovieShotReview, reviewShot } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite } from "../internal/filmFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * `reviewShot()` consumes script and review writes directly. A matching blank
 * beat id can satisfy the script membership and note coherence checks while
 * still returning a review keyed by an unusable beat.
 *
 * Scenarios:
 *
 * 1. Blank review beat and note beat references fail at their own fields even
 *    when the script carries a matching blank beat.
 * 2. A review write whose beat and note beat are not strings, as an untyped
 *    in-process caller can send, is refused at those fields instead of
 *    throwing a `TypeError` from the blank check.
 * 3. A revise note whose `issue` is blank and whose `suggestion` is not a
 *    string is refused at both fields, because the next round would have
 *    nothing to act on and the stored slate refuses such a note on load.
 */
export const test_film_review_shot_nonempty_refs = (): void => {
  const script = makeScriptWrite({
    beats: [
      {
        id: " ",
        name: "blank beat",
        summary: "a beat with an unusable id",
        durationHint: 1,
      },
    ],
  });

  const reviewed = reviewShot(script, {
    beat: " ",
    observations: "the pass is keyed by a blank beat.",
    verdict: "revise",
    notes: [
      {
        beat: " ",
        tier: "structural",
        issue: "the correction target cannot be addressed.",
        suggestion: "name the beat before filing review notes.",
      },
    ],
  });

  TestValidator.equals("blank review refs fail", reviewed.success, false);
  TestValidator.equals(
    "blank review beat violation",
    namedFacts([
      ["refused", () => reviewed.success === false],
      [
        "violated",
        () =>
          reviewed.success === false &&
          hasViolation(reviewed, "type", "$input.beat"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "blank note beat violation",
    namedFacts([
      ["refused", () => reviewed.success === false],
      [
        "violated",
        () =>
          reviewed.success === false &&
          hasViolation(reviewed, "type", "$input.notes[0].beat"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const untyped = reviewShot(script, {
    beat: 7 as unknown as string,
    observations: "the pass is keyed by a number.",
    verdict: "revise",
    notes: [
      {
        beat: null as unknown as string,
        tier: "structural",
        issue: "the correction target is not an id.",
        suggestion: "file the note on a named beat.",
      },
    ],
  });
  TestValidator.equals(
    "non-string review refs are refused at their fields",
    namedFacts([
      ["refused", () => untyped.success === false],
      [
        "beatViolated",
        () =>
          untyped.success === false &&
          untyped.violations.some(
            (violation) =>
              violation.path === "$input.beat" &&
              violation.expected.includes("must be a string"),
          ),
      ],
      [
        "noteBeatViolated",
        () =>
          untyped.success === false &&
          untyped.violations.some(
            (violation) =>
              violation.path === "$input.notes[0].beat" &&
              violation.expected.includes("must be a string"),
          ),
      ],
    ]),
    { refused: true, beatViolated: true, noteBeatViolated: true },
  );

  const blankProse: IAutoMovieShotReview = reviewShot(makeScriptWrite(), {
    beat: "beat-1",
    observations: "the note names nothing to fix.",
    verdict: "revise",
    notes: [
      {
        beat: "beat-1",
        tier: "physical",
        issue: " ",
        suggestion: null as unknown as string,
      },
    ],
  });
  TestValidator.equals(
    "blank or non-string note prose is refused at its fields",
    namedFacts([
      ["refused", () => blankProse.success === false],
      [
        "issueViolated",
        () => hasViolation(blankProse, "type", "$input.notes[0].issue"),
      ],
      [
        "suggestionViolated",
        () => hasViolation(blankProse, "type", "$input.notes[0].suggestion"),
      ],
    ]),
    { refused: true, issueViolated: true, suggestionViolated: true },
  );
};
