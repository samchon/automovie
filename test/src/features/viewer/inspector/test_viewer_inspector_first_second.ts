import {
  firstInspectorSecond
} from "../../../../../packages/viewer/src/inspector/internal/firstInspectorSecond";
import { TestValidator } from "@nestia/e2e";

/**
 * `firstInspectorSecond` names the first second a request samples.
 *
 * Scenarios:
 *
 * 1. Sampling `at` seconds 4 and 9 starts at 4.
 * 2. Sampling evenly from 2.5 starts at 2.5.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the first sample on the explicit and even clocks.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the inspector's opening-second operation on two typed sampling requests.
 * @evidence contracts/development/testing.md#independent-expectations The declared order puts four before nine in the explicit sample list. The even request declares its own start at 2.5.
 */
export function test_viewer_inspector_first_second(): void {
  TestValidator.equals(
    "at",
    firstInspectorSecond({ sampling: { kind: "at", seconds: [4, 9] } }),
    4,
  );
  TestValidator.equals(
    "even",
    firstInspectorSecond({
      sampling: { kind: "even", from: 2.5, to: null, rate: 1 },
    }),
    2.5,
  );
}