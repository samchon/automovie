import { TestValidator } from "@nestia/e2e";

import { reviewFileName } from "../../../scripts/review/reviewFileName";

/**
 * A review frame's file name is a pure function of its state, view and pass,
 * safe on any file system.
 *
 * Scenarios:
 * 1. A plain request gives `<state>__<view>__<pass>.png` in lower case.
 * 2. Separators, colons, spaces and dots in a name reduce to single hyphens,
 *    and leading and trailing separators are dropped, so no name can climb
 *    out of the output directory or end in a dot.
 * 3. The same request gives the same file, and requests that differ give
 *    different files (state, view and pass each matter).
 * 4. Negative twin: a part with no letter or digit is refused with the part
 *    named, instead of colliding with another empty part.
 */
export const test_body_review_file_name = (): void => {
  TestValidator.equals(
    "plain",
    reviewFileName({ state: "Hips-90", view: "left-three-quarter", pass: "beauty" }),
    "hips-90__left-three-quarter__beauty.png",
  );
  TestValidator.equals(
    "separators reduce",
    reviewFileName({ state: "../a\\b: c.", view: "front", pass: "clay" }),
    "a-b-c__front__clay.png",
  );
  const names = new Set([
    reviewFileName({ state: "a", view: "front", pass: "beauty" }),
    reviewFileName({ state: "b", view: "front", pass: "beauty" }),
    reviewFileName({ state: "a", view: "back", pass: "beauty" }),
    reviewFileName({ state: "a", view: "front", pass: "clay" }),
  ]);
  TestValidator.equals("four requests, four files", names.size, 4);
  TestValidator.equals(
    "same request, same file",
    reviewFileName({ state: "a", view: "front", pass: "beauty" }),
    reviewFileName({ state: "a", view: "front", pass: "beauty" }),
  );
  for (const [part, frame] of [
    ["state", { state: "..", view: "front", pass: "clay" }],
    ["view", { state: "a", view: "", pass: "clay" }],
    ["pass", { state: "a", view: "front", pass: "--" }],
  ] as const) {
    let message = "";
    try {
      reviewFileName(frame);
    } catch (error) {
      message = (error as Error).message;
    }
    TestValidator.predicate(`empty ${part} is refused`, message.includes(part));
  }
};
