import { TestValidator } from "@nestia/e2e";

import { createFormationOverlapScenario } from "../internal/createFormationOverlapScenario";
import { namedFacts } from "../internal/predicates";

/**
 * Static crowd placement retains exact contact and addressed same-unit and cross-unit overlap refusals.
 *
 * Scenarios:
 * 1. Accept spacing greater than and exactly equal to the measured width.
 * 2. Refuse packed and crossed units with the original full diagnostic fields.
 */
export const test_production_formation_overlap = (): void => {
  const scenario = createFormationOverlapScenario();
  const { post, row, judge, codes } = scenario;
  const wide = post({ id: "post", radius: 0.4 });

  TestValidator.equals(
    "members standing further apart than their bodies reach are accepted",
    codes({ models: [wide], formations: [row({ spacing: 1 })] }),
    [],
  );

  const packed = judge({
    models: [wide],
    formations: [row({ spacing: 0.5 })],
  });
  TestValidator.equals(
    "members standing inside one another are refused, and the refusal says which, where and against what",
    namedFacts([
      ["code", () => packed[0]?.code === "engine-validation-failed"],
      ["one", () => packed.length === 1],
      ["target", () => packed[0]!.target === "shot:opening"],
      ["category", () => packed[0]!.category === "error"],
      ["unit", () => packed[0]!.message.startsWith("formation:crowd ")],
      ["members", () => packed[0]!.message.includes("its slots 0 and 1")],
      // The row of four sits at -0.75, -0.25, 0.25 and 0.75, so the first two
      // stand half a metre apart with their midpoint at -0.5.
      ["apart", () => packed[0]!.message.includes("0.5m apart")],
      ["place", () => packed[0]!.message.includes("(-0.5, 0)")],
      // Two posts of 0.4 fill 0.8 m between their axes, which is the number an
      // author has to open the interval past.
      ["width", () => packed[0]!.message.includes("0.8m their bodies fill")],
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

  const crossed = judge({
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
      ["one", () => crossed.length === 1],
      ["unit", () => crossed[0]!.message.startsWith("formation:left ")],
      [
        "other",
        () => crossed[0]!.message.includes(`its slot 0 and slot 0 of "right"`),
      ],
      ["apart", () => crossed[0]!.message.includes("0.3m apart")],
      ["place", () => crossed[0]!.message.includes("(0.15, 0)")],
    ]),
    { one: true, unit: true, other: true, apart: true, place: true },
  );


};
