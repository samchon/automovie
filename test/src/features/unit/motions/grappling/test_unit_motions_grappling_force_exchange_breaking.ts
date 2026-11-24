import { HumanForceExchange } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * `HumanForceExchange.breaking` is the constant pull that breaks a base at a
 * declared instant: a linear inverted pendulum's extrapolated centre `(F / M
 * ω²)(e^{ωT} - 1)` reaches the base's edge `e`, so `F = e M ω² / (e^{ωT} - 1)`
 * (Hof, Gazendam and Sinke 2005).
 *
 * A 70 kg partner at ω = 3 /s on a base 0.1 m deep.
 *
 * Scenarios:
 *
 * 1. Broken in 1 s, the pull is `63 / (e³ - 1)` N.
 * 2. Broken in half the time, the pull is larger.
 * 3. A non-positive instant is a caller's defect and throws.
 */
export function test_unit_motions_grappling_force_exchange_breaking(): void {
  const at = (seconds: number): number =>
    HumanForceExchange.breaking({ mass: 70, frequency: 3, edge: 0.1, seconds });
  TestValidator.predicate(
    "the breaking pull",
    nclose(at(1), 63 / (Math.exp(3) - 1), 1e-9) &&
      at(0.5) > at(1) &&
      throwsError((): number => at(0)),
  );
}
