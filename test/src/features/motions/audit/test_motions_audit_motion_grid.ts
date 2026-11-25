import { AutoMovieMotionHumanAuditMotion } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `AutoMovieMotionHumanAuditMotion.grid` is the film seconds a check samples
 * between two instants: `from`, every `1 / rate` after it, and `to` itself when
 * the grid does not land on it; `lattice` indexes the same grid without
 * visiting it.
 *
 * Scenarios:
 *
 * 1. From 1 to 2 s at 4 Hz: 1, 1.25, 1.5, 1.75 and 2, the end on the grid.
 * 2. From 0 to 0.5 s at 3 Hz: 0, ⅓ and the end, 0.5, off the grid.
 * 3. An empty span reads its instant once; the lattice indexes the same points.
 * 4. A rate of zero, a negative rate and a reversed span are refused.
 */
export function test_motions_audit_motion_grid(): void {
  // 1. On the grid.
  TestValidator.equals(
    "the end on the grid",
    AutoMovieMotionHumanAuditMotion.grid(1, 2, 4),
    [1, 1.25, 1.5, 1.75, 2],
  );

  // 2. Off the grid.
  TestValidator.equals(
    "the end off the grid",
    AutoMovieMotionHumanAuditMotion.grid(0, 0.5, 3),
    [0, 1 / 3, 0.5],
  );

  // 3. An instant, and the lattice.
  const lattice: ReturnType<typeof AutoMovieMotionHumanAuditMotion.lattice> =
    AutoMovieMotionHumanAuditMotion.lattice(0, 0.5, 3);
  TestValidator.equals(
    "an instant once; the lattice the same points",
    [
      AutoMovieMotionHumanAuditMotion.grid(3, 3, 24),
      Array.from({ length: lattice.length }, (_: unknown, i: number): number =>
        lattice.at(i),
      ),
    ],
    [[3], [0, 1 / 3, 0.5]],
  );

  // 4. Refusals.
  TestValidator.predicate(
    "a rate that is not positive and a reversed span are refused",
    throwsError((): unknown => AutoMovieMotionHumanAuditMotion.grid(0, 1, 0)) &&
      throwsError((): unknown =>
        AutoMovieMotionHumanAuditMotion.grid(0, 1, -2),
      ) &&
      throwsError((): unknown =>
        AutoMovieMotionHumanAuditMotion.grid(1, 0, 24),
      ),
  );
}
