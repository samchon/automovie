import { HumanCoupled } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A supported walk assigns each helper to the opposite side of the same person.
 *
 * Scenarios:
 * 1. Each helper bears the helped person and names the other helper as its neighbour.
 * 2. The helped role follows both people. All three receive the authored duration.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the three role bindings and shared duration.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the mutual record with three distinct subject names.
 * @evidence contracts/development/testing.md#independent-expectations The cast determines the subject references. Exchanging helpers must exchange sides.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks each helper and the person they support.
 * @evidence contracts/development/testing.md#execution-ownership Resolves the cast in memory without a rig.
 */
export function test_human_motion_catalogue_contract_support_walk(): void {
  const cast: Parameters<typeof HumanCoupled.supportWalk.act>[2] = {
    helper: "first",
    second: "other",
    helped: "walker",
  };
  const duration: number = 3;
  for (const role of ["helper", "second"] as const)
    TestValidator.equals(
      role + " supports the walker",
      HumanCoupled.supportWalk.act(role, { seconds: duration }, cast),
      {
        name: "bearing",
        params: {
          seconds: duration,
          carry: role === "helper" ? "supported" : "supportedLeft",
          of: "walker",
          beside: role === "helper" ? "other" : "first",
        },
      },
    );
  TestValidator.equals(
    "walker follows both helpers",
    HumanCoupled.supportWalk.act("helped", { seconds: duration }, cast),
    {
      name: "borne",
      params: {
        seconds: duration,
        carry: "supported",
        by: "first",
        with: "other",
      },
    },
  );
}
