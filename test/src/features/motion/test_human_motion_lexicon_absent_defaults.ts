import { HumanPerformanceParams, HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The parameter gate admits an empty quiet stand and identifies a missing walking destination.
 *
 * Scenarios:
 * 1. Standing with no arguments and walking to a floor coordinate both pass admission.
 * 2. Omitting the destination from the base walk or a strolling alias reports the missing member.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which requests admit defaults and where the destination is required.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the gate used by placement and inspects its refusal.
 * @evidence contracts/development/testing.md#independent-expectations Standing needs no destination. Both walks require a floor point.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers an optional argument and a required argument on both base and registered names.
 * @evidence contracts/development/testing.md#execution-ownership Reads only the parameter schema.
 */
export function test_human_motion_lexicon_absent_defaults(): void {
  HumanPerformanceParams.check("stand", {});
  for (const row of ["walk", "stroll"]) {
    HumanPerformanceParams.check(row, { to: { x: 0, y: 0, z: 1 } });
    let refusal: unknown;
    try {
      HumanPerformanceParams.check(row, {});
    } catch (error) {
      refusal = error;
    }
    TestValidator.predicate(
      row + " requires the destination",
      refusal instanceof HumanRefusal &&
        refusal.kind === "parameter" &&
        refusal.axis === "to" &&
        refusal.value === undefined,
    );
  }
}
