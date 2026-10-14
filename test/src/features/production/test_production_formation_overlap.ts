import { TestValidator } from "@nestia/e2e";

import { createFormationOverlapScenario } from "../internal/createFormationOverlapScenario";
import { namedFacts } from "../internal/predicates";

/**
 * Static crowd placement retains exact contact and addressed same-unit and cross-unit overlap refusals.
 *
 * Scenarios:
 * 1. Accept spacing greater than and exactly equal to the measured width.
 * 2. Refuse packed and crossed units with the original full diagnostic fields.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual overlap gate through its existing formation fixture, asserting empty findings at wide/exact authored-diameter spacing and addressed packed/cross-unit diagnostic fields. The retained 0.8-metre diagnostic expectation currently conflicts with the inscribed polygon-core calculation and remains an unresolved regression.
 * @evidence contracts/testing.md#independent-expectations Authored post radius0.4 gives outer diameter0.8, row spacing0.5 gives the first pair midpoint -0.5, and cross-unit anchors0/0.3 give midpoint0.15. These original outer-diameter expectations do not independently certify the current inscribed-core policy.
 * @evidence contracts/testing.md#distinguishing-cases Wide, authored-diameter contact and packed same-unit rows contrast with singleton cross-unit overlap; vertical intervals, tier choices, motion, unmeasurable models and sampling caps have companion entries.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_production_formation_overlap owns synchronous portable gate cases through createFormationOverlapScenario and actual product source, without a browser, native build or rendered collision claim.
 */
export function test_production_formation_overlap(): void {
  const scenario: ReturnType<typeof createFormationOverlapScenario> = createFormationOverlapScenario();
  const { post, row, judge, codes }: typeof scenario = scenario;
  const wide: ReturnType<typeof post> = post({ id: "post", radius: 0.4 });

  TestValidator.equals(
    "members standing further apart than their bodies reach are accepted",
    codes({ models: [wide], formations: [row({ spacing: 1 })] }),
    [],
  );

  const packed: ReturnType<typeof judge> = judge({
    models: [wide],
    formations: [row({ spacing: 0.5 })],
  });
  TestValidator.equals(
    "members standing inside one another are refused, and the refusal says which, where and against what",
    namedFacts([
      ["code", (): boolean => packed[0]?.code === "engine-validation-failed"],
      ["one", (): boolean => packed.length === 1],
      ["target", (): boolean => packed[0]!.target === "shot:opening"],
      ["category", (): boolean => packed[0]!.category === "error"],
      ["unit", (): boolean => packed[0]!.message.startsWith("formation:crowd ")],
      ["members", (): boolean => packed[0]!.message.includes("its slots 0 and 1")],
      // The row of four sits at -0.75, -0.25, 0.25 and 0.75, so the first two
      // stand half a metre apart with their midpoint at -0.5.
      ["apart", (): boolean => packed[0]!.message.includes("0.5m apart")],
      ["place", (): boolean => packed[0]!.message.includes("(-0.5, 0)")],
      // Two posts of 0.4 fill 0.8 m between their axes, which is the number an
      // author has to open the interval past.
      ["width", (): boolean => packed[0]!.message.includes("0.8m their bodies fill")],
    ]),
    {
      code: true,
      one: true,
      target: true,
      category: true,
      unit: true,
      members: true,
      apart: true,
      place: true,
      width: true,
    },
  );

  TestValidator.equals(
    "members exactly their own width apart are standing beside one another",
    codes({ models: [wide], formations: [row({ spacing: 0.8 })] }),
    [],
  );

  const crossed: ReturnType<typeof judge> = judge({
    models: [wide],
    formations: [
      row({ id: "left", count: 1, spacing: 1 }),
      row({
        id: "right",
        count: 1,
        spacing: 1,
        anchor: { x: 0.3, y: 0, z: 0 },
      }),
    ],
  });
  TestValidator.equals(
    "two units each standing well but standing in each other are refused",
    namedFacts([
      ["one", (): boolean => crossed.length === 1],
      ["unit", (): boolean => crossed[0]!.message.startsWith("formation:left ")],
      [
        "other",
        (): boolean => crossed[0]!.message.includes(`its slot 0 and slot 0 of "right"`),
      ],
      ["apart", (): boolean => crossed[0]!.message.includes("0.3m apart")],
      ["place", (): boolean => crossed[0]!.message.includes("(0.15, 0)")],
    ]),
    { one: true, unit: true, other: true, apart: true, place: true },
  );


}
