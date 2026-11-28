import { TestValidator } from "@nestia/e2e";

import { createInstanceVariationPlacement as crowd } from "../internal/createInstanceVariationPlacement";
import { namedFacts, nclose } from "../internal/predicates";
import { sampleInstanceVariationSlots as slots } from "../internal/sampleInstanceVariationSlots";

const COUNT: number = 2_000;

/**
 * Visibility admission and omission retain their exact laws over the original two-thousand-member population; probability zero and one are deterministic endpoints.
 *
 * Scenarios:
 * 1. Zero hides all and one shows all; omission shows every enhanced member.
 * 2. Probability .3 stays within the original four percentage point bound.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Regenerates all 2000 slots under zero/one/interior/omitted visibility declarations and observes the actual extended member visibility flag rather than a separate probability implementation.
 * @evidence contracts/development/testing.md#independent-expectations Probability endpoints independently require no/all visible members, and omission requires all visible enhanced members. The literal .3 expectation keeps the original strict .04 share bound for this fixed-seed witness without claiming exhaustive random-law or rendering proof.
 * @evidence contracts/development/common.md#meaningful-documentation Zero, one and omitted probabilities exercise exact visibility defaults. A fixed population at 0.3 checks the declared frequency tolerance.
 */
export function test_engine_instance_visibility_probability(): void {
  // 6. Visibility.
  const visibleShare: (visibleProbability?: number) => number = (
    visibleProbability?: number,
  ): number => {
    const shown: ReturnType<typeof slots> = slots(
      crowd({
        variation: {
          ...crowd().variation,
          ...(visibleProbability === undefined ? {} : { visibleProbability }),
        },
        ...(visibleProbability === undefined
          ? { prototypes: [{ id: "default", model: "body", weight: 1 }] }
          : {}),
      }),
    );
    return (
      shown.filter(
        (member: (typeof shown)[number]): boolean => member.visible === true,
      ).length / COUNT
    );
  };
  TestValidator.equals(
    "a visibility probability is the share of members shown",
    namedFacts([
      ["never", (): boolean => nclose(visibleShare(0), 0, 0)],
      ["always", (): boolean => nclose(visibleShare(1), 1, 0)],
      [
        "some",
        (): boolean => {
          const share: number = visibleShare(0.3);
          return nclose(share, 0.3, 0.04) && Math.abs(share - 0.3) < 0.04;
        },
      ],
      ["absent", (): boolean => nclose(visibleShare(), 1, 0)],
    ]),
    { never: true, always: true, some: true, absent: true },
  );
}
