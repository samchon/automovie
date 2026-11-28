import {
  AutoMovieMotionHumanAuditMotion
} from "../../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditMotion";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `AutoMovieMotionHumanAuditMotion.grid` samples `from`, every `1 / rate` after
 * it, and `to` itself when the ticks miss it, so neither end of a window goes
 * unread; a rate that is not positive or a reversed span is refused.
 *
 * Scenarios at 4 samples a second:
 *
 * 1. 0 to 1 s lands on its end: 0, 0.25, 0.5, 0.75, 1.
 * 2. 0 to 0.9 s ends between ticks: 0, 0.25, 0.5, 0.75 and 0.9.
 * 3. A span of no length is its one instant.
 * 4. A zero rate and a reversed span are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names exact and off-tick endpoints, a single-instant span and malformed rates and spans.
 * @evidence contracts/development/testing.md#behavioral-verification Calls AuditMotion.grid with small finite spans at 4 Hz and exercises zero-rate and reversed-span refusals.
 * @evidence contracts/development/testing.md#independent-expectations Quarter-second ticks fix all interior samples. The end at 0.9 is appended once instead of a later tick, and a span from 2 to 2 produces exactly [2].
 */
export function test_motions_audit_auto_movie_motion_human_audit_motion_grid(): void {
  TestValidator.equals(
    "on the end",
    AutoMovieMotionHumanAuditMotion.grid(0, 1, 4),
    [0, 0.25, 0.5, 0.75, 1],
  );
  TestValidator.equals(
    "between ticks",
    AutoMovieMotionHumanAuditMotion.grid(0, 0.9, 4),
    [0, 0.25, 0.5, 0.75, 0.9],
  );
  TestValidator.equals(
    "no length",
    AutoMovieMotionHumanAuditMotion.grid(2, 2, 4),
    [2],
  );
  TestValidator.predicate(
    "refusals",
    throwsError(() => AutoMovieMotionHumanAuditMotion.grid(0, 1, 0)) &&
      throwsError(() => AutoMovieMotionHumanAuditMotion.grid(1, 0, 4)),
  );
}
