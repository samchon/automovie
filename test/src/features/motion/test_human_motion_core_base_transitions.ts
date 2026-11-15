import {
  HumanBase,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A base-transition law declares the base it leaves the body on (#3363), so
 * the next action is entered on that base whatever the open supports show.
 *
 * Scenarios, on the shortest and the tallest body (`f-small`, `m-large`),
 * each law performed alone from standing and its plan read:
 * 1. A crouch rises again, so it ends standing: partial with the heels flat
 *    and up, and full with the heels up. A full crouch with flat heels is
 *    refused, a `parameter` refusal on `depth`, since its thigh would need
 *    more hip flexion than the range table gives before the trunk inclines
 *    (the crouch law's own rule).
 * 2. A kneel on one knee, on both and sitting back, rising (the default),
 *    ends standing; the same kneel told not to rise ends kneeling.
 * 3. A lie-down ends lying.
 * 4. Every declared base is one of the grammar's kinds (`HumanBase.KINDS`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs each law through the public chain and reads the base its placed plan declares; a missing or wrong base fails with the law, the variant and the body.
 * @evidence contracts/development/testing.md#independent-expectations The expected bases follow from what each act does: a crouch and a rising kneel stand up again, a kneel that stays down kneels, a lie-down lies.
 * @evidence contracts/development/testing.md#distinguishing-cases Every crouch depth and heel variant with the one refused, the three kneel kinds with and without the rise, and the lie-down, on two bodies of opposite size.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and plans about twenty short actions; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios.
 */
export function test_human_motion_core_base_transitions(): void {
  const complaints: string[] = [];
  const declared = (
    body: IHumanBody,
    name: string,
    params: Record<string, unknown>,
  ): HumanBase | undefined => {
    const performance: HumanPerformance = new HumanPerformance({
      seed: "base",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").act(name as never, params as never)
        .node,
    });
    return performance.segments("a")[0]!.plan.base;
  };
  const expect = (
    body: string,
    label: string,
    got: HumanBase | undefined,
    kind: HumanBase.Kind,
  ): void => {
    if (got === undefined)
      complaints.push(`${body} ${label}: no base declared, ${kind} expected`);
    else if (got.kind !== kind)
      complaints.push(`${body} ${label}: ends ${got.kind}, not ${kind}`);
    else if (!(HumanBase.KINDS as readonly string[]).includes(got.kind))
      complaints.push(`${body} ${label}: ${got.kind} is not a base kind`);
  };
  for (const name of ["f-small", "m-large"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    for (const depth of ["partial", "full"] as const)
      for (const heels of ["flat", "up"] as const) {
        if (depth === "full" && heels === "flat") {
          try {
            declared(body, "crouch", { depth, heels, hold: 0.5 });
            complaints.push(`${name} crouch full flat: planned, a refusal expected`);
          } catch (error) {
            if (
              !(
                error instanceof HumanRefusal &&
                error.kind === "parameter" &&
                error.axis === "depth"
              )
            )
              complaints.push(
                `${name} crouch full flat: expected a parameter refusal on depth, got ${error instanceof Error ? error.message : String(error)}`,
              );
          }
          continue;
        }
        expect(
          name,
          `crouch ${depth} ${heels}`,
          declared(body, "crouch", { depth, heels, hold: 0.5 }),
          "standing",
        );
      }
    for (const kind of ["one", "both", "sitBack"] as const) {
      expect(
        name,
        `kneel ${kind}`,
        declared(body, "kneel", { kind, hold: 0.5 }),
        "standing",
      );
      expect(
        name,
        `kneel ${kind} staying down`,
        declared(body, "kneel", { kind, hold: 0.5, rise: false }),
        "kneeling",
      );
    }
    expect(name, "lieDown", declared(body, "lieDown", {}), "lying");
  }
  TestValidator.equals(
    "a base transition declares the base it ends in",
    complaints,
    [],
  );
}
