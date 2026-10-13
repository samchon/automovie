import { TestValidator } from "@nestia/e2e";
import { namedFacts } from "../internal/predicates";
import { sampleInstanceVariationSlots as slots } from "../internal/sampleInstanceVariationSlots";
import { createInstanceVariationPlacement as crowd } from "../internal/createInstanceVariationPlacement";

const COUNT = 2_000;

/**
 *
 * Visibility admission and omission retain their exact laws over the original two-thousand-member population; probability zero and one are deterministic endpoints.
 *
 * Scenarios:
 * 1. Zero hides all and one shows all; omission shows every enhanced member.
 * 2. Probability .3 stays within the original four percentage point bound.
 *
 * @evidence contracts/testing.md#behavioral-verification Regenerates 2,000 slots with `instanceSlot` for visibility probabilities 0, 1, 0.3 and none, and asserts the share whose `visible` is true; it catches an inverted comparison that shows members at probability zero, an off-by-one that hides some at probability one, a probability applied as its complement, and an omitted probability that hides members instead of showing all.
 * @evidence contracts/testing.md#independent-expectations Shares 0 and 1 follow exactly from the authored endpoints; 0.3 is the authored probability itself, and the four-point tolerance is about 3.9 binomial standard deviations for p = 0.3 over 2,000 draws, so the oracle bounds the law statistically without reproducing which slots the seeded hash hides.
 * @evidence contracts/testing.md#distinguishing-cases Boundaries at probability zero and one, an interior probability, and the absent field; explicit per-slot visibility overrides belong to `test_engine_instance_slot_variation`, and ranged draws and seed sensitivity to `test_engine_instance_slot_range_seed`.
 */
export const test_engine_instance_visibility_probability = (): void => {
  // 6. Visibility.
  const visibleShare = (visibleProbability?: number) => {
    const shown = slots(
      crowd({
        variation: {
          ...crowd().variation,
          ...(visibleProbability === undefined ? {} : { visibleProbability }),
        },
        ...(visibleProbability === undefined
          ? { prototypes: [{ id: "default", modelRecipe: "body", weight: 1 }] }
          : {}),
      }),
    );
    return shown.filter((member) => member.visible === true).length / COUNT;
  };
  TestValidator.equals(
    "a visibility probability is the share of members shown",
    namedFacts([
      ["never", () => visibleShare(0) === 0],
      ["always", () => visibleShare(1) === 1],
      ["some", () => Math.abs(visibleShare(0.3) - 0.3) < 0.04],
      ["absent", () => visibleShare() === 1],
    ]),
    { never: true, always: true, some: true, absent: true },
  );


};
