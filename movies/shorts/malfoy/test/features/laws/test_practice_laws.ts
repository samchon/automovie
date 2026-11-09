import { TestValidator } from "@nestia/e2e";

import { BodyProportion } from "../../../src/laws/body/BodyProportion";
import { DuelLaw } from "../../../src/laws/duelling/DuelLaw";
import { EverydayLaw } from "../../../src/laws/everyday/EverydayLaw";
import { Gait } from "../../../src/laws/everyday/Gait";
import { BroomLaw } from "../../../src/laws/flight/BroomLaw";
import { FallLaw } from "../../../src/laws/physics/FallLaw";

/**
 * Checks the practice laws against their studies' values, computed here from
 * the studies' numbers: the duel's deflection threshold (5 m/s streak against
 * 0.23 s reaction plus 0.12 s sweep, so 1.75 m) and outcome table; the
 * level-turn bank tan φ = v² / (g r) and its 60° cap; free fall from the
 * cap's 2.7 m underside, √(2·2.7/9.80665); the handover transfer windows
 * (0.35 s for paper, 0.50 s at 90 g, 0.64 s at 1.8 kg); a straight flight
 * path's arc length; and a walk's whole-step plan, ⌈D / L⌉ + 1 steps at the
 * pace's step period.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls each law and asserts its value.
 * @evidence contracts/development/testing.md#independent-expectations Expected values are recomputed from the studies' constants with standard formulas.
 * @evidence contracts/development/testing.md#distinguishing-cases Both sides of the deflection threshold, a capped and an uncapped bank, the transfer's three regimes.
 * @evidence contracts/development/testing.md#execution-ownership Pure functions, in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States each law checked and its basis.
 */
export function test_practice_laws(): void {
  const threshold: number = 5 * (0.23 + 0.12);
  TestValidator.equals("just short of the threshold is not deflectable", DuelLaw.deflectable(threshold - 0.05), false);
  TestValidator.equals("just past the threshold is deflectable", DuelLaw.deflectable(threshold + 0.05), true);
  TestValidator.equals("a shield blocks", DuelLaw.outcome("jinx", "shield", 1), "blocked");
  TestValidator.equals("a watched jinx at 2 m is deflected", DuelLaw.outcome("jinx", "deflect", 2), "deflected");
  TestValidator.equals("a jinx at 1 m beats the sweep", DuelLaw.outcome("jinx", "deflect", 1), "hit");
  TestValidator.equals("an unanswered disarm disarms", DuelLaw.outcome("disarm", "none", 3), "disarmed");

  const g: number = 9.80665;
  TestValidator.predicate("bank at 12 m/s on 25 m", Math.abs(BroomLaw.bank(12, 25) - Math.atan((12 * 12) / (g * 25))) < 1e-12);
  TestValidator.predicate("bank is capped at 60 degrees", Math.abs(BroomLaw.bank(18, 10) - Math.PI / 3) < 1e-12);
  TestValidator.equals("straight flight has no bank", BroomLaw.bank(15, Infinity), 0);
  const line = BroomLaw.path([{ x: 0, y: 10, z: 0 }, { x: 30, y: 10, z: 40 }]);
  TestValidator.predicate("a straight path's length is its distance", Math.abs(line.length - 50) < 0.05);

  TestValidator.predicate("the cap falls 2.7 m in 0.742 s", Math.abs(FallLaw.fallTime(2.7) - Math.sqrt((2 * 2.7) / g)) < 1e-12 && Math.abs(FallLaw.fallTime(2.7) - 0.742) < 0.001);

  TestValidator.predicate("a weightless sheet transfers in 0.35 s", Math.abs(EverydayLaw.transfer(0) - 0.35) < 1e-12);
  TestValidator.predicate("90 g transfers in 0.50 s", Math.abs(EverydayLaw.transfer(0.09) - 0.5) < 1e-12);
  TestValidator.predicate("1.8 kg transfers in 0.64 s", Math.abs(EverydayLaw.transfer(1.8) - 0.64) < 1e-12);

  const carina = BodyProportion.measure(1.63);
  const step: number = (1.28 / (115.4 / 60)) * (1.63 / 1.69);
  const plan = Gait.plan(2.0, carina, "ordinary");
  TestValidator.equals("a 2 m walk takes ceil(D / L) + 1 steps", plan.steps, Math.ceil(2.0 / step) + 1);
  TestValidator.predicate("each step lasts one step period", Math.abs(plan.duration - plan.steps * (60 / 115.4)) < 1e-12);
  TestValidator.equals("no steps below a few centimetres", Gait.plan(0.01, carina, "ordinary").steps, 0);
}
