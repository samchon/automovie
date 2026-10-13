import { TestValidator } from "@nestia/e2e";

import { createFormationOverlapScenario } from "../internal/createFormationOverlapScenario";
import { namedFacts } from "../internal/predicates";

/**
 * Column clearance observes unchanged lift and depth-cell neighbour laws.
 *
 * Scenarios:
 * 1. Pair overlapping, exactly touching, clear-above and level columns at the same plan distance.
 * 2. Find the original depth-boundary pair with its original member and midpoint diagnostic.
 */
export const test_production_formation_overlap_height_depth = (): void => {
  const scenario = createFormationOverlapScenario();
  const { post, row, file, judge, codes } = scenario;
  const wide = post({ id: "post", radius: 0.4 });

  // 14. a lift between two units narrows the clearance between them.
  const lifted = (height: number) => [
    row({ id: "lower", count: 1, spacing: 1 }),
    row({
      id: "upper",
      count: 1,
      spacing: 1,
      anchor: { x: 0.3, y: height, z: 0 },
    }),
  ];
  TestValidator.equals(
    "two units are judged by the height between them, not only by the plan",
    namedFacts([
      // A post two metres tall stands from -1 to 1 about its own origin, so a
      // metre and a half of lift still leaves half a metre of shared height.
      [
        "overlappingHeightsRefused",
        () => codes({ models: [wide], formations: lifted(1.5) }).length === 1,
      ],
      // Two metres of lift stands the upper column's floor exactly on the
      // lower's ceiling, which is passing above rather than standing inside.
      [
        "touchingHeightsAccepted",
        () => codes({ models: [wide], formations: lifted(2) }).length === 0,
      ],
      [
        "clearAbove",
        () => codes({ models: [wide], formations: lifted(3) }).length === 0,
      ],
      // And the plan distance is the same in all three, so what separated them
      // is the lift and nothing else.
      [
        "levelIsRefused",
        () => codes({ models: [wide], formations: lifted(0) }).length === 1,
      ],
    ]),
    {
      overlappingHeightsRefused: true,
      touchingHeightsAccepted: true,
      clearAbove: true,
      levelIsRefused: true,
    },
  );

  // 15. a pair one behind the other, across a cell boundary in depth.
  const ranked = judge({
    models: [wide],
    formations: [
      file({ count: 2, spacing: 0.3, anchor: { x: 0, y: 0, z: 0.7 } }),
    ],
  });
  TestValidator.equals(
    "two members one behind the other are found across a boundary in depth",
    namedFacts([
      ["one", () => ranked.length === 1],
      ["members", () => ranked[0]!.message.includes("its slots 0 and 1")],
      ["apart", () => ranked[0]!.message.includes("0.3m apart")],
      // The two stand at z = 0.7 and z = 1.0, which the gate's own cell width of
      // twice the widest column puts on either side of a boundary.
      ["place", () => ranked[0]!.message.includes("(0, 0.85)")],
    ]),
    { one: true, members: true, apart: true, place: true },
  );


};
