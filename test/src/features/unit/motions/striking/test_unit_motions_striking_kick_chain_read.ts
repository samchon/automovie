import { ROM_TOLERANCE } from "@automovie/engine";
import { KickForm, kickChainRead } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * A solved kick chain's status (`kickChainRead.status`): short when the weapon
 * misses by more than `KickForm.RESIDUAL`, jammed when the knee folds past the
 * technique's greatest flexion beyond the joint tolerance, reached otherwise; a
 * miss outranks a jam.
 *
 * Scenario: a round kick missing twice the residual is short, even jammed; one
 * on target folded a degree past its bound and tolerance is jammed; one at its
 * bound has reached.
 */
export function test_unit_motions_striking_kick_chain_read(): void {
  const most: number = KickForm.FLEXION.round[1];
  TestValidator.equals(
    "the status",
    [
      kickChainRead.status(2 * KickForm.RESIDUAL, 0, "round"),
      kickChainRead.status(2 * KickForm.RESIDUAL, most + 90, "round"),
      kickChainRead.status(0, most + ROM_TOLERANCE + 1, "round"),
      kickChainRead.status(0, most, "round"),
    ],
    ["short", "short", "jammed", "reached"],
  );
}
