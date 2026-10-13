import { TestValidator } from "@nestia/e2e";
import { namedFacts, qclose } from "../internal/predicates";
import { sampleInstanceVariationSlots as slots } from "../internal/sampleInstanceVariationSlots";
import { createInstanceVariationPlacement as crowd } from "../internal/createInstanceVariationPlacement";

const COUNT = 2_000;

/**
 *
 * Instance rotations compose the authored heading before fixed offsets, while per-axis scales are independent draws and uniform scale remains the same value on all axes.
 *
 * Scenarios:
 * 1. Sixteen fixed quaternion twins follow the hand-derived quarter-turn and 30-degree offset.
 * 2. All 2,000 axis draws stay in range, are independent, and the uniform twin repeats exactly.
 *
 * @evidence contracts/testing.md#behavioral-verification Regenerates slots with `instanceSlot` and asserts each member's rotation quaternion under a 90-degree heading with and without a fixed 30-degree x offset, then each `scale3` axis under per-axis ranges and under uniform scale; it catches composing the offset before the heading, dropping either rotation, drawing all three scale axes from one sample, an axis that escapes its range, and a uniform set whose `scale3` differs from its `scale`.
 * @evidence contracts/testing.md#independent-expectations The heading quaternion `(0, sqrt(1/2), 0, sqrt(1/2))` is the half-angle form of a quarter turn about +Y, and the composed value `(h sin15, h cos15, -h sin15, h cos15)` is the hand product of that heading with a 30-degree +X turn; axis ranges restate the authored `scale3`, and the 90% independence threshold is statistical, since two shared draws would make every x and y offset equal.
 * @evidence contracts/testing.md#distinguishing-cases Positive heading alone and heading with a zero-width offset range, so every one of 16 members must land exactly; per-axis ranges with distinct bounds; boundary of uniform scale with no `scale3`, where the three axes must repeat the scalar; seeded scalar ranges belong to `test_engine_instance_slot_range_seed`, and the presence of these output fields to `test_engine_instance_slot_variation`.
 */
export const test_engine_instance_transform_axes = (): void => {
  // 7. Rotation composes the heading, then the seeded offset.
  const half = Math.SQRT1_2;
  const sin15 = Math.sin(Math.PI / 12);
  const cos15 = Math.cos(Math.PI / 12);
  const quarter = slots(
    crowd({
      count: 16,
      facingDeg: 90,
      prototypes: [{ id: "default", modelRecipe: "body", weight: 1 }],
    }),
  );
  const offset = slots(
    crowd({
      count: 16,
      facingDeg: 90,
      variation: {
        ...crowd().variation,
        rotationDeg: {
          x: { min: 30, max: 30 },
          y: { min: 0, max: 0 },
          z: { min: 0, max: 0 },
        },
      },
    }),
  );
  TestValidator.equals(
    "a member's rotation is the heading followed by its seeded offset",
    namedFacts([
      [
        "heading",
        () =>
          quarter.every((member) =>
            qclose(member.rotation!, { x: 0, y: half, z: 0, w: half }, 1e-12),
          ),
      ],
      [
        "headingThenOffset",
        () =>
          offset.every((member) =>
            qclose(
              member.rotation!,
              {
                x: half * sin15,
                y: half * cos15,
                z: -half * sin15,
                w: half * cos15,
              },
              1e-12,
            ),
          ),
      ],
    ]),
    { heading: true, headingThenOffset: true },
  );


  // 8. Per-axis scale.
  const perAxis = slots(
    crowd({
      variation: {
        ...crowd().variation,
        scale3: { min: { x: 1, y: 2, z: 3 }, max: { x: 1.5, y: 2.5, z: 3.5 } },
      },
    }),
  );
  const uniform = slots(
    crowd({ prototypes: [{ id: "default", modelRecipe: "body", weight: 1 }] }),
  );
  TestValidator.equals(
    "per-axis scale stays in each axis range and is drawn per axis",
    namedFacts([
      [
        "ranges",
        () =>
          perAxis.every(
            (member) =>
              member.scale3!.x >= 1 &&
              member.scale3!.x <= 1.5 &&
              member.scale3!.y >= 2 &&
              member.scale3!.y <= 2.5 &&
              member.scale3!.z >= 3 &&
              member.scale3!.z <= 3.5,
          ),
      ],
      [
        "independentAxes",
        () =>
          perAxis.filter(
            (member) => member.scale3!.x - 1 !== member.scale3!.y - 2,
          ).length >
          COUNT * 0.9,
      ],
      [
        "uniformRepeats",
        () =>
          uniform.every(
            (member) =>
              member.scale3!.x === member.scale &&
              member.scale3!.y === member.scale &&
              member.scale3!.z === member.scale,
          ),
      ],
    ]),
    { ranges: true, independentAxes: true, uniformRepeats: true },
  );
};
