import { TestValidator } from "@nestia/e2e";

import { createInstanceVariationPlacement as crowd } from "../internal/createInstanceVariationPlacement";
import { namedFacts, nclose } from "../internal/predicates";
import { sampleInstanceVariationSlots as slots } from "../internal/sampleInstanceVariationSlots";

const COUNT: number = 2_000;

/**
 * Two thousand seeded member draws preserve scale, trait and palette ranges; changing the seed changes the same slots, while zero-width ranges retain their exact authored values.
 *
 * Scenarios:
 * 1. All 2,000 draws remain in the authored ranges and use every palette entry.
 * 2. A second seed changes more than 90% of scale draws; 64 fixed draws stay exact.
 *
 * @evidence contracts/testing.md#behavioral-verification Regenerates each addressed member through the actual instance-slot owner, observing scale/trait range bounds, palette coverage, unchanged zero-width ranges and changed scale draws after a seed edit.
 * @evidence contracts/testing.md#independent-expectations Authored .5..1.5 and -1..1 intervals, three palette entries, 1.2/.25 fixed values and the original greater-than-90-percent threshold define the oracle independently. Two selected seeds witness sensitivity without proving all seeds or statistical independence.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the full 2000-member varying population, its same-slot reseeded twin and 64 fixed-range draws; prototype, transform and visibility laws have separate units. Original inclusive ranges, strict change-count bound and 1e-12 fixed tolerances remain unchanged.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns placements/member arrays through the existing canonical fixtures, starts no filesystem/renderer/browser/GPU work and mutates no production consumer or foreign method.
 */
export function test_engine_instance_slot_range_seed(): void {
  // 2. Ranged values.
  const members: ReturnType<typeof slots> = slots(crowd());
  const reseeded: ReturnType<typeof slots> = slots(crowd({ seed: 54_321 }));
  const fixed: ReturnType<typeof slots> = slots(
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
        (): boolean =>
          members.every(
            (member: (typeof members)[number]): boolean =>
              member.scale >= 0.5 && member.scale <= 1.5,
          ),
      ],
      [
        "traitRange",
        (): boolean =>
          members.every(
            (member: (typeof members)[number]): boolean =>
              member.traits.lean! >= -1 && member.traits.lean! <= 1,
          ),
      ],
      [
        "everyPaletteEntry",
        (): boolean =>
          new Set(
            members.map(
              (member: (typeof members)[number]): string => member.palette,
            ),
          ).size === 3,
      ],
      [
        "zeroWidth",
        (): boolean =>
          fixed.every(
            (member: (typeof fixed)[number]): boolean =>
              nclose(member.scale, 1.2, 1e-12) &&
              nclose(member.traits.lean!, 0.25, 1e-12),
          ),
      ],
      [
        "seedMatters",
        (): boolean =>
          members.filter(
            (member: (typeof members)[number], slot: number): boolean =>
              member.scale !== reseeded[slot]!.scale,
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
}
