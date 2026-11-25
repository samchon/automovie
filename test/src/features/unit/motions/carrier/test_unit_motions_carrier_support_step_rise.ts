import { HumanRefusal, HumanSupportStep } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * The nominally level step admits its signed bearing interval.
 *
 * Scenarios:
 *
 * 1. Both 0.1 m limits bear. Just beyond either one gives the intended climb
 *    direction and the same closed bearing interval.
 */
export function test_unit_motions_carrier_support_step_rise(): void {
  HumanSupportStep.admitRise(-0.1, undefined);
  HumanSupportStep.admitRise(0.1, "deck");
  const refused = (
    height: number,
    onto: string | undefined,
  ): HumanRefusal | undefined => {
    try {
      HumanSupportStep.admitRise(height, onto);
    } catch (error: unknown) {
      if (!(error instanceof HumanRefusal)) throw error;
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
