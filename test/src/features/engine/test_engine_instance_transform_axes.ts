import { TestValidator } from "@nestia/e2e";
import { namedFacts, qclose } from "../internal/predicates";
import { sampleInstanceVariationSlots as slots } from "../internal/sampleInstanceVariationSlots";
import { createInstanceVariationPlacement as crowd } from "../internal/createInstanceVariationPlacement";

const COUNT = 2_000;

/**
 * Instance rotations compose the authored heading before fixed offsets, while per-axis scales are independent draws and uniform scale remains the same value on all axes.
 *
 * Scenarios:
 * 1. Sixteen fixed quaternion twins follow the hand-derived quarter-turn and 30-degree offset.
 * 2. All 2,000 axis draws stay in range, are independent, and the uniform twin repeats exactly.
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
