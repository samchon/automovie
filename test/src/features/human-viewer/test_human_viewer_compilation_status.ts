import { TestValidator } from "@nestia/e2e";

import { readHumanViewerCompilationStatus } from "../../../scripts/human-viewer/readHumanViewerCompilationStatus";

/**
 * Compiler status contains only nullable failure and last-good time metadata.
 *
 * Scenarios:
 * 1. Successful and failed reports preserve both facts without private extras.
 * 2. Unreadable, unparsable and malformed reports claim no success timestamp.
 */
export const test_human_viewer_compilation_status = (): void => {
  for (const error of [null, "broken source"])
    for (const goodAt of [null, "last-good"])
      TestValidator.equals("report", readHumanViewerCompilationStatus(() => JSON.stringify({
        error, goodAt, extra: "discarded",
      })), { error, goodAt });
  for (const text of ["{", "null", "3", "[]", "{}", '{"error":3,"goodAt":null}', '{"error":null,"goodAt":3}'])
    TestValidator.equals("invalid report", readHumanViewerCompilationStatus(() => text), { error: null, goodAt: null });
  TestValidator.equals("unreadable report", readHumanViewerCompilationStatus(() => {
    throw new Error("unavailable report");
  }), { error: null, goodAt: null });
};
