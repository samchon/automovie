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
 *
 * @evidence contracts/testing.md#behavioral-verification Validates multi-tier pairs at two separations and a mixed flat/solid tier population, checking the least supported clearance and omission of a unit with an unmeasurable tier.
 * @evidence contracts/testing.md#independent-expectations Narrow post radius0.1 has an inscribed-core diameter below0.2, so separation0.3 clears it while0.15 overlaps it; wide radius0.4 cores overlap at0.3. A flat tier has no occupied column to certify.
 * @evidence contracts/testing.md#distinguishing-cases Least-tier clearance contrasts with wide-only refusal and inside-least refusal; mixed flat/solid tiers contrast with solid-only packed refusal. A skipped mixed unit is unmeasured, not proven safe in every tier.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_production_formation_overlap_tiers synchronously executes the actual portable gate through existing model/formation fixture providers, without selecting a live camera tier or rendering members.
 */
export function test_production_formation_overlap_tiers(): void {
  const scenario: ReturnType<typeof createFormationOverlapScenario> = createFormationOverlapScenario();
  const { post, row, tiered, codes }: typeof scenario = scenario;
  const wide: ReturnType<typeof post> = post({ id: "post", radius: 0.4 });

  const flat: ReturnType<typeof createFormationFlatModel> = createFormationFlatModel(wide);
  // 12. a unit a camera may draw at more than one tier is judged by the least.
  const narrow: ReturnType<typeof post> = post({ id: "narrow", radius: 0.1 });
  const tieredPair: ReturnType<typeof tiered>[] = [
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
      // Narrow posts have outer diameter 0.2 m and a smaller filled polygon
      // core, which 0.3 m clears; the wide posts' cores still overlap at 0.3 m.
      [
        "leastIsWhatCounts",
        (): boolean =>
          codes({ models: [wide, narrow], formations: tieredPair }).length ===
          0,
      ],
      [
        "theWidestAloneWouldRefuse",
        (): boolean =>
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
        (): boolean =>
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
        (): boolean =>
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
        (): boolean =>
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


}
