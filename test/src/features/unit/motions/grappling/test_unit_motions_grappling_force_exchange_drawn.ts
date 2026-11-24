import type { IAutoMovieMotionHumanForceExchange } from "@automovie/interface";
import { HumanForceExchange } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `HumanForceExchange.drawn` is a partner's centre under a constant pull from
 * rest: `x = a (cosh ωt - 1)`, `x' = a ω sinh ωt` and the extrapolated `x + x'
 * / ω`, with `a = F / (M ω²)`.
 *
 * A 70 kg partner at ω = 3 /s pulled by 63 N: `a = 0.1` m.
 *
 * Scenarios:
 *
 * 1. Half a second in, the closed form at `ωt = 1.5`.
 * 2. At the start nothing has moved.
 */
export function test_unit_motions_grappling_force_exchange_drawn(): void {
  const at: IAutoMovieMotionHumanForceExchange.IDrawnResult =
    HumanForceExchange.drawn({ mass: 70, frequency: 3, force: 63, seconds: 0.5 });
  const offset: number = 0.1 * (Math.cosh(1.5) - 1);
  const speed: number = 0.3 * Math.sinh(1.5);
  TestValidator.predicate(
    "the pendulum's closed form",
    nclose(at.offset, offset, 1e-12) &&
      nclose(at.speed, speed, 1e-12) &&
      nclose(at.extrapolated, offset + speed / 3, 1e-12),
  );
  TestValidator.equals(
    "at rest at the start",
    HumanForceExchange.drawn({ mass: 70, frequency: 3, force: 63, seconds: 0 }),
    { offset: 0, speed: 0, extrapolated: 0 },
  );
}
