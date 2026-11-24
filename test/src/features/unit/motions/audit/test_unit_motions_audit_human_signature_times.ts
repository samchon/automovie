import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanSignature.times` lists `from + k / rate` from `k = 0` while it stays
 * within `to`, each from its index, so two series from one `from` whose rates
 * divide one another share their common instants bit for bit.
 *
 * Scenarios:
 *
 * 1. 0 to 0.1 s at 30 Hz: 0, 1/30, 2/30, 3/30, the last within rounding of the
 *    end.
 * 2. Every instant of that series is the 120 Hz series' instant `4k`, exactly.
 * 3. A reversed span is empty; the default rate is 60 Hz.
 */
export function test_unit_motions_audit_human_signature_times(): void {
  const coarse: number[] = HumanSignature.times(0, 0.1, 30);
  TestValidator.equals("at 30 Hz", coarse, [0, 1 / 30, 2 / 30, 3 / 30]);
  const fine: number[] = HumanSignature.times(0, 0.1, 120);
  TestValidator.predicate(
    "shared instants",
    coarse.every((t: number, k: number): boolean => fine[4 * k] === t),
  );
  TestValidator.equals(
    "reversed and default",
    [HumanSignature.times(1, 0, 30).length, HumanSignature.times(0, 1).length],
    [0, 61],
  );
}
