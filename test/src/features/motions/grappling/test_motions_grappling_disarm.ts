import {
  disarm
} from "../../../../../packages/motions/src/grappling/internal/disarm";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * Check admission and defaulting of the disarm lever interval.
 *
 * Scenarios:
 *
 * 1. Default to 0.5 s and preserve an authored 0.8 s.
 * 2. Refuse a zero-second lever interval.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases name seconds, the default and the invalid boundary.
 * @evidence contracts/development/testing.md#behavioral-verification The lever-time helper is called with omitted, positive and zero duration.
 * @evidence contracts/development/testing.md#independent-expectations The literal default and declared input supply distinct expectations.
 */
export function test_motions_grappling_disarm(): void {
  TestValidator.equals(
    "the lever",
    [disarm.leverTime(undefined), disarm.leverTime(0.8)],
    [0.5, 0.8],
  );
  TestValidator.predicate(
    "no lever",
    throwsError(() => disarm.leverTime(0)),
  );
}
