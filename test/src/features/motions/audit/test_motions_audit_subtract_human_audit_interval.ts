import {
  subtractHumanAuditInterval
} from "../../../../../packages/motions/src/audit/internal/subtractHumanAuditInterval";
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names an interior removal, two overlapping pieces, complete coverage, disjoint removal and touching at a shared endpoint.
 * @evidence contracts/development/testing.md#behavioral-verification Calls subtractHumanAuditInterval on five literal interval lists and compares every resulting positive-length piece.
 * @evidence contracts/development/testing.md#independent-expectations An interior cut from 2 to 5 leaves [0, 2] and [5, 10]. A cut across the gap leaves [0, 2] and [7, 9]. A fully surrounded piece disappears, while disjoint and endpoint-touching pieces stay whole.
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
