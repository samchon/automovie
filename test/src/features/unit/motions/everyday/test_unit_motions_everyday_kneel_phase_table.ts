import { kneelPhaseTable, walkRoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `kneelPhaseTable` lays a kneel's phases over its keys: down through the step
 * back (0.7 s), the lowering (1.0 s), the knee's contact (0.9 s) and the second
 * knee's (0.8 s) as far as the keys go, each scaled by the square root of the
 * hip height over the reference hip, then each mark at the bottom, the hold,
 * and, rising, back up through the same phases' seconds under the kind's rising
 * names to `stood`.
 *
 * Scenarios:
 *
 * 1. Kneeling on both knees (four keys) at the reference hip, with one mark, a 1 s
 *    hold and the rise: stepBack, lowering and kneeContact, the mark, the hold,
 *    then kneeOff, frontUp and stepForward retracing them, and stood.
 * 2. At four times the reference hip every timed phase takes twice as long.
 * 3. Without the rise the table ends with the hold.
 */
export function test_unit_motions_everyday_kneel_phase_table(): void {
  const hip: number = walkRoot.REFERENCE_HIP;
  const table: kneelPhaseTable.IPhase[] = kneelPhaseTable(
    { hipHeight: hip },
    4,
    "both",
    ["tap"],
    1,
    true,
  );
  TestValidator.equals("both knees", table, [
    { name: "stepBack", seconds: 0.7, from: 0, to: 1 },
    { name: "lowering", seconds: 1.0, from: 1, to: 2 },
    { name: "kneeContact", seconds: 0.9, from: 2, to: 3 },
    { name: "tap", seconds: 0, from: 3, to: 3 },
    { name: "settled", seconds: 1, from: 3, to: 3 },
    { name: "kneeOff", seconds: 0.9, from: 3, to: 2 },
    { name: "frontUp", seconds: 1.0, from: 2, to: 1 },
    { name: "stepForward", seconds: 0.7, from: 1, to: 0 },
    { name: "stood", seconds: 0, from: 0, to: 0 },
  ]);
  const tall: kneelPhaseTable.IPhase[] = kneelPhaseTable(
    { hipHeight: 4 * hip },
    4,
    "both",
    ["tap"],
    1,
    true,
  );
  TestValidator.predicate(
    "twice as long at four times the hip",
    tall.every(
      (phase: kneelPhaseTable.IPhase, i: number): boolean =>
        phase.name === "settled" ||
        Math.abs(phase.seconds - 2 * table[i]!.seconds) <= 1e-12,
    ),
  );
  TestValidator.equals(
    "no rise",
    kneelPhaseTable({ hipHeight: hip }, 4, "both", [], 1, false).map(
      (phase: kneelPhaseTable.IPhase): string => phase.name,
    ),
    ["stepBack", "lowering", "kneeContact", "settled"],
  );
}
