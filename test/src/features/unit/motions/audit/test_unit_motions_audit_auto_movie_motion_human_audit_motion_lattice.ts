import { AutoMovieMotionHumanAuditMotion } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * `AutoMovieMotionHumanAuditMotion.lattice` indexes the audit grid without
 * listing it: `count = floor((to - from) * rate)` ticks after `from`, plus `to`
 * when the ticks miss it; index `k` up to the count is `from + k / rate`, past
 * it `to`.
 *
 * Scenarios at 4 samples a second:
 *
 * 1. 1 to 1.9 s: 5 instants, index 2 at 1.5 s, index 4 at 1.9 s.
 * 2. 0 to 1 s: 5 instants, the last at 1 s.
 * 3. A negative rate is refused.
 */
export function test_unit_motions_audit_auto_movie_motion_human_audit_motion_lattice(): void {
  const between: AutoMovieMotionHumanAuditMotion.IGrid =
    AutoMovieMotionHumanAuditMotion.lattice(1, 1.9, 4);
  TestValidator.equals(
    "between ticks",
    [between.length, between.at(2), between.at(4)],
    [5, 1.5, 1.9],
  );
  const on: AutoMovieMotionHumanAuditMotion.IGrid =
    AutoMovieMotionHumanAuditMotion.lattice(0, 1, 4);
  TestValidator.equals("on the end", [on.length, on.at(4)], [5, 1]);
  TestValidator.predicate(
    "a negative rate",
    throwsError(() => AutoMovieMotionHumanAuditMotion.lattice(0, 1, -1)),
  );
}
