import {
  KickRedirect
} from "../../../../../packages/motions/src/striking/internal/KickRedirect";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the blend from prior to refreshed geometry between the cut and the shown instant with a minimum duration.
 * @evidence contracts/development/testing.md#behavioral-verification Samples direct endpoints and midpoint for a 0.3-to-0.7 s span and a cut at the shown instant.
 * @evidence contracts/development/testing.md#independent-expectations The symmetric phase gives weights 0, 0.5 and 1. A same-time cut begins at zero and is fully blended after 2 ms.
 */
export function test_motions_striking_kick_redirect(): void {
  TestValidator.predicate(
    "the blend",
    nclose(KickRedirect.weight(0.3, 0.3, 0.7), 0, 1e-12) &&
      nclose(KickRedirect.weight(0.5, 0.3, 0.7), 0.5, 1e-12) &&
      nclose(KickRedirect.weight(0.7, 0.3, 0.7), 1, 1e-12) &&
      nclose(KickRedirect.weight(0.3, 0.3, 0.3), 0, 1e-12) &&
      nclose(KickRedirect.weight(0.302, 0.3, 0.3), 1, 1e-12),
  );
}
