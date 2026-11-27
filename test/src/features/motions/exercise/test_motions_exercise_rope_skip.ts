import { AutoMovieEngineGravity } from "@automovie/engine";
import {
  ropeSkipHop
} from "../../../../../packages/motions/src/exercise/internal/ropeSkipHop";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * The `ropeSkip` law's own logic (`ropeSkipHop`): a 0.26 s flight centred in a
 * 1.7 Hz period (Silva and Pellegrini 2009's 0.13 s to the rope's crossing,
 * placed at the apex), the root rising on `g t (flight - t) / 2` in the air.
 *
 * Scenarios:
 *
 * 1. By default the hop takes off at `(1 / 1.7 - 0.26) / 2` s, passes the rope
 *    under the feet 0.13 s later at the apex `g 0.13² / 2` m up, and lands 0.26
 *    s after takeoff.
 * 2. At the period's start and end the root stands at the stance.
 * 3. A 0.4 s flight, past the 0.36 s band, or a period no longer than the flight,
 *    is refused.
 */
export function test_motions_exercise_rope_skip(): void {
  const hop: ropeSkipHop.IHop = ropeSkipHop({}, 0);
  const takeoff: number = (1 / 1.7 - 0.26) / 2;
  TestValidator.predicate(
    "the default hop",
    nclose(hop.takeoff, takeoff, 1e-12) &&
      nclose(hop.under, takeoff + 0.13, 1e-12) &&
      nclose(hop.landed, takeoff + 0.26, 1e-12) &&
      nclose(
        hop.lift(hop.under),
        (AutoMovieEngineGravity.STANDARD * 0.13 ** 2) / 2,
        1e-12,
      ) &&
      nclose(hop.lift(0), 0, 1e-12) &&
      nclose(hop.lift(hop.duration), 0, 1e-12) &&
      nclose(hop.events[2]!.share, hop.under / hop.duration, 1e-12),
  );
  TestValidator.predicate(
    "outside the band",
    throwsError(() => ropeSkipHop({ flightSeconds: 0.4 }, 0)) &&
      throwsError(() =>
        ropeSkipHop({ flightSeconds: 0.3, periodSeconds: 0.3 }, 0),
      ),
  );
}
