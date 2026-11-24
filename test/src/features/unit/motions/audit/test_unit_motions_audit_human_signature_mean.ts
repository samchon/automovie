import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanSignature.mean` averages a reading over instants: the sum of the
 * readings over their count.
 *
 * Scenarios: `2t` over 1, 2, 3 is 4; a constant 7 over one instant is 7.
 */
export function test_unit_motions_audit_human_signature_mean(): void {
  TestValidator.equals(
    "the means",
    [
      HumanSignature.mean([1, 2, 3], (t: number): number => 2 * t),
      HumanSignature.mean([5], (): number => 7),
    ],
    [4, 7],
  );
}
