import { AutoMovieGravity } from "@automovie/engine";
import type { IAutoMovieMotionHumanForceExchange } from "@automovie/interface";
import { HumanForceExchange } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `HumanForceExchange.resisted` is the static moment balance of a resisting
 * partner: a pull `F` at grip height `h` against the weight `M g` moves the
 * centre of pressure `F h / (M g)` toward the pull, resisted while that stays
 * within the base.
 *
 * A 70 kg partner pulled by 100 N at 1 m.
 *
 * Scenarios:
 *
 * 1. At g = 10 the shift is 1/7 m, inside a 0.2 m base.
 * 2. A 0.1 m base cannot hold it: none.
 * 3. Without a gravity the standard one is used.
 */
export function test_unit_motions_grappling_force_exchange_resisted(): void {
  const props = (
    edge: number,
  ): IAutoMovieMotionHumanForceExchange.IResistedProps => ({
    mass: 70,
    force: 100,
    height: 1,
    edge,
  });
  TestValidator.predicate(
    "the moment balance's shift",
    nclose(HumanForceExchange.resisted(props(0.2), 10)!, 1 / 7, 1e-12) &&
      HumanForceExchange.resisted(props(0.1), 10) === null &&
      nclose(
        HumanForceExchange.resisted(props(0.2))!,
        100 / (70 * AutoMovieGravity.STANDARD),
        1e-12,
      ),
  );
}
