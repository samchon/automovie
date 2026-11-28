import { AutoMovieEngineGravity } from "@automovie/engine";
import {
  trampolineBounce
} from "../../../../../packages/motions/src/exercise/internal/trampolineBounce";
import { TestValidator } from "@nestia/e2e";

/**
 * The `trampolineBounce` law's bed (`trampolineBounce.deflection`): the
 * deflection that takes a fall is the root of the energy balance `K1 x² / 2 +
 * K3 x⁴ / 4 = m g (fall + x)`.
 *
 * Scenario: a 70 kg jumper falling 1 m and 2 m deflects the bed to a positive
 * depth balancing that energy, the longer fall deeper.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Trampoline deflection balances the incoming fall energy and grows with a longer fall.
 * @evidence contracts/development/testing.md#behavioral-verification Calls bed deflection for the same 70 kg jumper falling one and two metres.
 * @evidence contracts/development/testing.md#independent-expectations Substitutes each returned positive depth back into spring energy and gravitational work, and checks that the higher fall deflects further.
 */
export function test_motions_exercise_trampoline_bounce(): void {
  const g: number = AutoMovieEngineGravity.STANDARD;
  const balance = (fall: number, x: number): number =>
    (trampolineBounce.K1 * x * x) / 2 +
    (trampolineBounce.K3 * x ** 4) / 4 -
    70 * g * (fall + x);
  const one: number = trampolineBounce.deflection(70, 1);
  const two: number = trampolineBounce.deflection(70, 2);
  TestValidator.predicate(
    "the energy balance",
    one > 0 &&
      two > one &&
      Math.abs(balance(1, one)) < 1e-6 * 70 * g &&
      Math.abs(balance(2, two)) < 1e-6 * 70 * g,
  );
}
