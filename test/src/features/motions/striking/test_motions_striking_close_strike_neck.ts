import { CloseStrikeNeck } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * A close strike's neck hold (`CloseStrikeNeck.weight`): the hands close on the
 * neck over the take on a minimum-jerk share, hold it to the release, and let
 * go over the rest of the strike.
 *
 * Scenario: taking in 0.2 s, releasing at 0.6 s of 1 s, the hands are half in
 * at 0.1 s, fully in from 0.2 to 0.6 s, half out at 0.8 s and off at 1 s.
 */
export function test_motions_striking_close_strike_neck(): void {
  const w = (t: number): number => CloseStrikeNeck.weight(t, 0.2, 0.6, 1);
  TestValidator.predicate(
    "the hold",
    nclose(w(0), 0, 1e-12) &&
      nclose(w(0.1), 0.5, 1e-12) &&
      nclose(w(0.2), 1, 1e-12) &&
      nclose(w(0.6), 1, 1e-12) &&
      nclose(w(0.8), 0.5, 1e-12) &&
      nclose(w(1), 0, 1e-12),
  );
}
