import { subtractHumanAuditInterval } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `subtractHumanAuditInterval` removes one film interval from a list: each
 * piece keeps its part before the removed interval and its part after it, where
 * of positive length.
 *
 * Scenarios:
 *
 * 1. 0 to 10 s less 2 to 5 s leaves 0 to 2 and 5 to 10.
 * 2. Pieces 0 to 3 and 6 to 9 less 2 to 7 leave 0 to 2 and 7 to 9.
 * 3. A removal covering a piece leaves nothing of it; one beside it leaves it
 *    whole; one sharing only an end leaves it whole too.
 */
export function test_motions_audit_subtract_human_audit_interval(): void {
  TestValidator.equals(
    "the remainders",
    [
      subtractHumanAuditInterval([[0, 10]], 2, 5),
      subtractHumanAuditInterval(
        [
          [0, 3],
          [6, 9],
        ],
        2,
        7,
      ),
      subtractHumanAuditInterval([[1, 2]], 0, 3),
      subtractHumanAuditInterval([[1, 2]], 4, 5),
      subtractHumanAuditInterval([[1, 2]], 2, 3),
    ],
    [
      [
        [0, 2],
        [5, 10],
      ],
      [
        [0, 2],
        [7, 9],
      ],
      [],
      [[1, 2]],
      [[1, 2]],
    ],
  );
}
