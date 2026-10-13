import { TestValidator } from "@nestia/e2e";
import { namedFacts, nclose } from "../internal/predicates";
import { sampleInstanceVariationSlots as slots } from "../internal/sampleInstanceVariationSlots";
import { createInstanceVariationPlacement as crowd } from "../internal/createInstanceVariationPlacement";

const COUNT = 2_000;

/**
 * Two thousand seeded member draws preserve scale, trait and palette ranges; changing the seed changes the same slots, while zero-width ranges retain their exact authored values.
 *
 * Scenarios:
 * 1. All 2,000 draws remain in the authored ranges and use every palette entry.
 * 2. A second seed changes more than 90% of scale draws; 64 fixed draws stay exact.
 */
export const test_engine_instance_slot_range_seed = (): void => {
  // 2. Ranged values.
  const members = slots(crowd());
  const reseeded = slots(crowd({ seed: 54_321 }));
  const fixed = slots(
    crowd({
      count: 64,
      layout: { kind: "grid", rows: 8, columns: 8, spacing: { x: 1, z: 1 } },
      variation: {
        scale: { min: 1.2, max: 1.2 },
        palette: ["#111111"],
        traits: [{ name: "lean", min: 0.25, max: 0.25 }],
      },
    }),
  );
  TestValidator.equals(
    "a seeded value stays inside its authored range and follows its seed",
    namedFacts([
      [
        "scaleRange",
        () =>
          members.every((member) => member.scale >= 0.5 && member.scale <= 1.5),
      ],
      [
        "traitRange",
        () =>
          members.every(
            (member) => member.traits.lean! >= -1 && member.traits.lean! <= 1,
          ),
      ],
      [
        "everyPaletteEntry",
        () => new Set(members.map((member) => member.palette)).size === 3,
      ],
      [
        "zeroWidth",
        () =>
          fixed.every(
            (member) =>
              nclose(member.scale, 1.2, 1e-12) &&
              nclose(member.traits.lean!, 0.25, 1e-12),
          ),
      ],
      [
        "seedMatters",
        () =>
          members.filter(
            (member, slot) => member.scale !== reseeded[slot]!.scale,
          ).length >
          COUNT * 0.9,
      ],
    ]),
    {
      scaleRange: true,
      traitRange: true,
      everyPaletteEntry: true,
      zeroWidth: true,
      seedMatters: true,
    },
  );


};
