import { KickRedirect } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * A redirected kick's blend (`KickRedirect.weight`): from the old geometry to
 * the fresh one on a minimum-jerk share between the cut and the impact, over at
 * least a millisecond.
 *
 * Scenarios:
 *
 * 1. Cut at 0.3 s with the impact at 0.7 s, it is none at the cut, half at 0.5 s
 *    and whole at the impact.
 * 2. Cut at the impact itself, it turns over a millisecond: none at the cut and
 *    whole 2 ms on.
 */
export function test_unit_motions_striking_kick_redirect(): void {
  TestValidator.predicate(
    "the blend",
    nclose(KickRedirect.weight(0.3, 0.3, 0.7), 0, 1e-12) &&
      nclose(KickRedirect.weight(0.5, 0.3, 0.7), 0.5, 1e-12) &&
      nclose(KickRedirect.weight(0.7, 0.3, 0.7), 1, 1e-12) &&
      nclose(KickRedirect.weight(0.3, 0.3, 0.3), 0, 1e-12) &&
      nclose(KickRedirect.weight(0.302, 0.3, 0.3), 1, 1e-12),
  );
}
