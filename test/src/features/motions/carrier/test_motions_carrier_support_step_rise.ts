import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  HumanSupportStep
} from "../../../../../packages/motions/src/carrier/internal/HumanSupportStep";
import { TestValidator } from "@nestia/e2e";

/**
 * Check the signed bearing limit for a step between supports.
 *
 * Scenarios:
 *
 * 1. Admit both -0.1 and +0.1 m.
 * 2. At +0.101 m report the closed interval on `to` and recommend climbing up
 *    onto the named deck. At -0.101 m recommend climbing down.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios state the signed bearing interval and the expected climb guidance.
 * @evidence contracts/development/testing.md#behavioral-verification The fixture checks inclusive endpoints, upward and downward correction and the destination name.
 * @evidence contracts/development/testing.md#independent-expectations The sample heights straddle the specified signed tenth-metre limit by exactly 1 mm on either side.
 */
export function test_motions_carrier_support_step_rise(): void {
  HumanSupportStep.admitRise(-0.1, undefined);
  HumanSupportStep.admitRise(0.1, "deck");
  const refused = (
    height: number,
    onto: string | undefined,
  ): AutoMovieMotionHumanRefusal | undefined => {
    try {
      HumanSupportStep.admitRise(height, onto);
    } catch (error: unknown) {
      if (!(error instanceof AutoMovieMotionHumanRefusal)) throw error;
      return error;
    }
    return undefined;
  };
  const up = refused(0.101, "deck");
  const down = refused(-0.101, undefined);
  TestValidator.equals("the admitted bearing interval", up?.feasible, {
    kind: "range",
    minimum: -0.1,
    maximum: 0.1,
    unit: "m",
  });
  TestValidator.predicate(
    "keep direction and the named arrival",
    up?.axis === "to" &&
      up.fix.includes("direction up, on deck") &&
      down?.fix.endsWith("direction down") === true,
  );
}
