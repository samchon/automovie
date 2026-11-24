import { AutoMovieMotionHumanAuditMotion } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * `AutoMovieMotionHumanAuditMotion.grid` samples `from`, every `1 / rate`
 * after it, and `to` itself when the ticks miss it, so neither end of a window
 * goes unread; a rate that is not positive or a reversed span is refused.
 *
 * Scenarios at 4 samples a second:
 *
 * 1. 0 to 1 s lands on its end: 0, 0.25, 0.5, 0.75, 1.
 * 2. 0 to 0.9 s ends between ticks: 0, 0.25, 0.5, 0.75 and 0.9.
 * 3. A span of no length is its one instant.
 * 4. A zero rate and a reversed span are refused.
 */
export function test_unit_motions_audit_auto_movie_motion_human_audit_motion_grid(): void {
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
