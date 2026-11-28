import {
  StrikingContact
} from "../../../../../packages/motions/src/striking/internal/StrikingContact";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/**
 * Striking contact (`StrikingContact.closest`, `first`): the closest point of a
 * segment to a point, clamped to its ends; and the first instant a gap closes,
 * scanned in steps and bisected inside the step that closes it.
 *
 * Scenarios:
 *
 * 1. Over the segment (0, 0, 0)-(2, 0, 0), (1, 1, 0) is closest to (1, 0, 0) and
 *    (3, 1, 0) to (2, 0, 0); a segment of no length is its start.
 * 2. A gap `1 - t` scanned over [0, 3] in 0.25 s steps first closes at 1 s; one
 *    closed at the start closes there; one never closing has none; a scan step
 *    of none is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines clamped segment projection, the first gap crossing, and refusal for an invalid scan step.
 * @evidence contracts/development/testing.md#behavioral-verification Calls both geometry operations on a centered segment, endpoint and zero-length segment, then scans crossing, initial-overlap and miss functions.
 * @evidence contracts/development/testing.md#independent-expectations A segment from x = 0 to 2 clamps an external point to x = 2. The gap 1 − t first closes at 1 s and an already closed gap reports the start.
 */
export function test_motions_striking_contact(): void {
  const a = { x: 0, y: 0, z: 0 };
  const b = { x: 2, y: 0, z: 0 };
  TestValidator.predicate(
    "the closest point",
    vclose(
      StrikingContact.closest({ x: 1, y: 1, z: 0 }, a, b),
      { x: 1, y: 0, z: 0 },
      1e-12,
    ) &&
      vclose(StrikingContact.closest({ x: 3, y: 1, z: 0 }, a, b), b, 1e-12) &&
      vclose(StrikingContact.closest({ x: 3, y: 1, z: 0 }, a, a), a, 1e-12),
  );
  TestValidator.predicate(
    "the first closing",
    nclose(
      StrikingContact.first((t: number): number => 1 - t, 0, 3, 0.25)!,
      1,
      1e-6,
    ) &&
      StrikingContact.first((): number => -1, 0.5, 3, 0.25) === 0.5 &&
      StrikingContact.first((): number => 1, 0, 3, 0.25) === undefined &&
      throwsError(() => StrikingContact.first((): number => 1, 0, 3, 0)),
  );
}
