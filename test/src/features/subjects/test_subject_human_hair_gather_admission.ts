import { assertHumanFaceHair } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { throwsError } from "../internal/predicates";

/**
 * A gathered layer admits one numerical scalp tie and an integrated tail.
 * Scenarios:
 * 1. Inclusive angular bounds, positive radius, full steering and all-guide
 *    integration pass without changing the caller's document.
 * 2. A missing gather keeps ordinary hair valid; each invalid angle, radius,
 *    strength, tail vector or fractional guide population refuses before build.
 */
export const test_subject_human_hair_gather_admission = (): void => {
  const input = createNumericalHairFixture();
  const layer = input.layers[0];
  assertHumanFaceHair(input);
  layer.gather = {
    anchor: { polar: 0, azimuth: -Math.PI },
    radius: 0.01,
    strength: 1,
    tail: { direction: [0, -1, 0] },
  };
  layer.guides = { fraction: 1, neighbours: 1 };
  const original = JSON.stringify(input);
  assertHumanFaceHair(input);
  TestValidator.equals(
    "gather input remains owned",
    JSON.stringify(input),
    original,
  );
  layer.gather.anchor = { polar: Math.PI, azimuth: Math.PI };
  layer.gather.tail.spread = { radius: 0, reach: 0.01 };
  assertHumanFaceHair(input);
  const invalids: Partial<NonNullable<typeof layer.gather>>[] = [
    { anchor: { polar: -0.001, azimuth: 0 } },
    { anchor: { polar: Math.PI + 0.001, azimuth: 0 } },
    { anchor: { polar: 1, azimuth: -Math.PI - 0.001 } },
    { anchor: { polar: 1, azimuth: Math.PI + 0.001 } },
    { radius: 0 },
    { radius: -0.001 },
    { strength: 0 },
    { strength: 1.001 },
    { tail: { direction: [0, 0, 0] } },
    {
      tail: { direction: [0, -1, 0], spread: { radius: -0.001, reach: 0.01 } },
    },
    { tail: { direction: [0, -1, 0], spread: { radius: 0.01, reach: 0 } } },
  ];
  for (const invalid of invalids)
    TestValidator.predicate(
      "invalid gathering field refuses",
      throwsError(() =>
        assertHumanFaceHair({
          layers: [
            {
              ...layer,
              gather: { ...layer.gather!, ...invalid },
            },
          ],
        }),
      ),
    );
  TestValidator.predicate(
    "whole-curve interpolation cannot cross a tie event",
    throwsError(() =>
      assertHumanFaceHair({
        layers: [{ ...layer, guides: { fraction: 0.5, neighbours: 2 } }],
      }),
    ),
  );
};
