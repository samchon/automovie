import {
  humanLassoAdmit
} from "../../../../../packages/motions/src/lexicon/internal/humanLassoAdmit";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * The `HumanLasso` law's own admission and arm (`humanLassoAdmit`): a whole
 * number of swings, a flight of some length (0.8 s by default) and a dally of
 * whole turns; the swinging wrist stands `sqrt(u² + f² + 2 u f cos 60°)` from
 * the shoulder, the elbow bent off the straight arm.
 *
 * Scenarios:
 *
 * 1. Three swings with no flight given fly 0.8 s.
 * 2. With a 0.3 m upper arm and a 0.26 m forearm the wrist stands `sqrt(0.09 +
 *    0.0676 + 0.078)` m from the shoulder.
 * 3. No swing, or a dally of half a turn, is refused.
 */
export function test_motions_lexicon_lasso(): void {
  TestValidator.predicate(
    "the flight and the reach",
    humanLassoAdmit({ swings: 3 }) === 0.8 &&
      nclose(
        humanLassoAdmit.wristReach(0.3, 0.26),
        Math.sqrt(0.09 + 0.0676 + 0.078),
        1e-12,
      ),
  );
  TestValidator.predicate(
    "no swing, half a dally",
    throwsError(() => humanLassoAdmit({ swings: 0 })) &&
      throwsError(() =>
        humanLassoAdmit({ swings: 3, dally: { horn: "horn", turns: 0.5 } }),
      ),
  );
}
