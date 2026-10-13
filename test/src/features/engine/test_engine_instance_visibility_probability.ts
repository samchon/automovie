import { TestValidator } from "@nestia/e2e";
import { namedFacts } from "../internal/predicates";
import { sampleInstanceVariationSlots as slots } from "../internal/sampleInstanceVariationSlots";
import { createInstanceVariationPlacement as crowd } from "../internal/createInstanceVariationPlacement";

const COUNT = 2_000;

/**
 * Visibility admission and omission retain their exact laws over the original two-thousand-member population; probability zero and one are deterministic endpoints.
 *
 * Scenarios:
 * 1. Zero hides all and one shows all; omission shows every enhanced member.
 * 2. Probability .3 stays within the original four percentage point bound.
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
