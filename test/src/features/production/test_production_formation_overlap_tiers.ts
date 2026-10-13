import { TestValidator } from "@nestia/e2e";

import { createFormationOverlapScenario } from "../internal/createFormationOverlapScenario";
import { namedFacts } from "../internal/predicates";
import { createFormationFlatModel } from "../internal/createFormationFlatModel";

/**
 * The least tier bounds a refusal, while any unmeasurable tier keeps a unit unmeasured.
 *
 * Scenarios:
 * 1. Keep all three least/widest/inside-tier outcomes using original radii.
 * 2. Pair mixed measurable/unmeasurable tiers with the original measurable-only refusal.
 */
export const test_production_formation_overlap_tiers = (): void => {
  const scenario = createFormationOverlapScenario();
  const { post, row, tiered, codes } = scenario;
  const wide = post({ id: "post", radius: 0.4 });

  const flat = createFormationFlatModel(wide);
  // 12. a unit a camera may draw at more than one tier is judged by the least.
  const narrow = post({ id: "narrow", radius: 0.1 });
  const tieredPair = [
    tiered({ id: "left", models: ["post", "narrow"] }),
    tiered({
      id: "right",
      models: ["post", "narrow"],
      anchor: { x: 0.3, y: 0, z: 0 },
    }),
  ];
  TestValidator.equals(
    "a unit drawn at several tiers is judged by the least clearance of any of them",
    namedFacts([
      // Two narrow posts fill 0.2 m, which 0.3 m clears; two wide ones fill
      // 0.8 m, which it does not.
      [
        "leastIsWhatCounts",
        () =>
          codes({ models: [wide, narrow], formations: tieredPair }).length ===
          0,
      ],
      [
        "theWidestAloneWouldRefuse",
        () =>
          codes({
            models: [wide, narrow],
            formations: [
              tiered({ id: "left", models: ["post"] }),
              tiered({
                id: "right",
                models: ["post"],
                anchor: { x: 0.3, y: 0, z: 0 },
              }),
            ],
          }).length === 1,
      ],
      // And inside the least, the same pair is refused: what the tiers bought is
      // the least and not an exemption.
      [
        "insideTheLeastIsStillRefused",
        () =>
          codes({
            models: [wide, narrow],
            formations: [
              tiered({ id: "left", models: ["post", "narrow"] }),
              tiered({
                id: "right",
                models: ["post", "narrow"],
                anchor: { x: 0.15, y: 0, z: 0 },
              }),
            ],
          }).length === 1,
      ],
    ]),
    {
      leastIsWhatCounts: true,
      theWidestAloneWouldRefuse: true,
      insideTheLeastIsStillRefused: true,
    },
  );

  // 13. one tier measuring and another not is no size at all.
  TestValidator.equals(
    "a unit that measures at one tier and not at another is not measured",
    namedFacts([
      [
        "mixedIsLeftAlone",
        () =>
          codes({
            models: [wide, flat],
            formations: [
              {
                ...row({ spacing: 0.1 }),
                lod: [{ model: "post" }, { model: "flat" }],
              },
            ],
          }).length === 0,
      ],
      [
        "theMeasurableTierAloneRefuses",
        () =>
          codes({
            models: [wide, flat],
            formations: [
              { ...row({ spacing: 0.1 }), lod: [{ model: "post" }] },
            ],
          }).length === 1,
      ],
    ]),
    { mixedIsLeftAlone: true, theMeasurableTierAloneRefuses: true },
  );


};
