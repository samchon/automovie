import { TestValidator } from "@nestia/e2e";

import { createInstanceVariationPlacement as crowd } from "../internal/createInstanceVariationPlacement";
import { namedFacts, qclose, vclose } from "../internal/predicates";
import { sampleInstanceVariationSlots as slots } from "../internal/sampleInstanceVariationSlots";

const COUNT: number = 2_000;

/**
 * Instance rotations compose the authored heading before fixed offsets, while seeded per-axis draws differ and uniform scale remains the same value on all axes.
 *
 * Scenarios:
 * 1. Sixteen fixed quaternion twins follow the hand-derived quarter-turn and 30-degree offset.
 * 2. All 2,000 axis draws stay in range, most axis pairs differ, and the uniform twin repeats exactly.
 *
 * @evidence contracts/testing.md#behavioral-verification Regenerates actual member rotations and scales, observing heading-then-offset quaternion composition, per-axis interval bounds, differing axis draws and exact uniform-scale replication.
 * @evidence contracts/testing.md#independent-expectations Hand-derived quarter-turn and 30-degree offset quaternion components determine the transform oracle. Literal axis ranges and the original >90-percent differing-axis threshold witness this fixed seeded population without proving statistical independence for every input.
 * @evidence contracts/testing.md#distinguishing-cases Preserves sixteen fixed heading/offset twins, all 2000 ranged-axis draws and the enhanced uniform twin; original qclose 1e-12 and exact uniform comparisons remain equally strong through vclose zero tolerance. Other units own layout, palette, visibility and malformed admission.
 * @evidence contracts/testing.md#execution-ownership This named synchronous entry owns placements/member arrays through existing canonical fixtures, opens no filesystem/renderer/browser/GPU and replaces no foreign method or installed consumer.
 */
export function test_engine_instance_transform_axes(): void {
  // 7. Rotation composes the heading, then the seeded offset.
  const half: number = Math.SQRT1_2;
  const sin15: number = Math.sin(Math.PI / 12);
  const cos15: number = Math.cos(Math.PI / 12);
  const quarter: ReturnType<typeof slots> = slots(
    crowd({
      count: 16,
      facingDeg: 90,
      prototypes: [{ id: "default", modelRecipe: "body", weight: 1 }],
    }),
  );
  const offset: ReturnType<typeof slots> = slots(
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
        (): boolean =>
          quarter.every((member: (typeof quarter)[number]): boolean =>
            qclose(member.rotation!, { x: 0, y: half, z: 0, w: half }, 1e-12),
          ),
      ],
      [
        "headingThenOffset",
        (): boolean =>
          offset.every((member: (typeof offset)[number]): boolean =>
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
  const perAxis: ReturnType<typeof slots> = slots(
    crowd({
      variation: {
        ...crowd().variation,
        scale3: { min: { x: 1, y: 2, z: 3 }, max: { x: 1.5, y: 2.5, z: 3.5 } },
      },
    }),
  );
  const uniform: ReturnType<typeof slots> = slots(
    crowd({ prototypes: [{ id: "default", modelRecipe: "body", weight: 1 }] }),
  );
  TestValidator.equals(
    "per-axis scale stays in each axis range and is drawn per axis",
    namedFacts([
      [
        "ranges",
        (): boolean =>
          perAxis.every(
            (member: (typeof perAxis)[number]): boolean =>
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
        (): boolean =>
          perAxis.filter(
            (member: (typeof perAxis)[number]): boolean =>
              member.scale3!.x - 1 !== member.scale3!.y - 2,
          ).length >
          COUNT * 0.9,
      ],
      [
        "uniformRepeats",
        (): boolean =>
          uniform.every((member: (typeof uniform)[number]): boolean =>
            vclose(
              member.scale3!,
              { x: member.scale, y: member.scale, z: member.scale },
              0,
            ),
          ),
      ],
    ]),
    { ranges: true, independentAxes: true, uniformRepeats: true },
  );
}
