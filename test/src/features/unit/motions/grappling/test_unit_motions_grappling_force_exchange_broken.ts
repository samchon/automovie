import { HumanForceExchange } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `HumanForceExchange.broken` is when a constant pull breaks a base, `T = ln(1 +
 * e M ω² / F) / ω`, the inverse of `breaking`.
 *
 * A 70 kg partner at ω = 3 /s on a base 0.1 m deep; `e M ω²` is 63 N.
 *
 * Scenarios:
 *
 * 1. A pull of `63 / (e³ - 1)` N breaks the base in 1 s.
 * 2. A pull of 63 N breaks it in `ln 2 / 3` s.
 * 3. No pull never breaks it.
 */
export function test_unit_motions_grappling_force_exchange_broken(): void {
  const at = (force: number): number =>
    HumanForceExchange.broken({ mass: 70, frequency: 3, edge: 0.1, force });
  TestValidator.predicate(
    "the breaking instant",
    nclose(at(63 / (Math.exp(3) - 1)), 1, 1e-12) &&
      nclose(at(63), Math.LN2 / 3, 1e-12) &&
      at(0) === Infinity,
  );
}
