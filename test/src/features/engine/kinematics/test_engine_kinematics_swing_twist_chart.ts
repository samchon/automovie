import {
  DEFAULT_HUMANOID_ROM,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  swingTwistRange,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `swingTwistRange` charts a ball joint's range: the swing as a share of the
 * region's radius on its great circle laid on the unit disc by azimuth, the
 * twist inside its interval; `placed` inverts `chart`, `project` brings a
 * rotation into range, `blend` moves straight across the chart, `radius`
 * interpolates the region's ray table, and `of`, `fromAxes` and `humanoid` give
 * a bone's frame.
 *
 * Fixture: the first humanoid bone whose default range is gated by swing and
 * twist; the chart place P = (0.3, 0.2) at the interval's middle twist T.
 *
 * Scenarios:
 *
 * 1. `of` gives the humanoid axes and rest frame; `fromAxes` without axes none;
 *    `humanoid` returns the table's own prepared frame each time.
 * 2. `radius` at azimuth 0 is the table's first ray, and half way between the
 *    first two rays of different radii their mean.
 * 3. `chart(placed(P, T))` is P, T within 1e-9; the rotation is inside, so its
 *    overshoot is 0 and `project` returns it as it is.
 * 4. The place (1.2, 0) lies outside: positive overshoot, and its projection has
 *    none. A twist 10 past the interval's top or 7 below its bottom overshoots
 *    by exactly that, and its projection keeps the swing and clamps the twist
 *    to the bound.
 * 5. Blending two inside rotations meets each end at shares 0 and 1, charts to the
 *    midpoint at 0.5, and the prepared blend equals the blend.
 */
export function test_engine_kinematics_swing_twist_chart(): void {
  const gated = (b: AutoMovieHumanoidBone): boolean => {
    const c: IAutoMovieJointConstraint | null | undefined =
      DEFAULT_HUMANOID_ROM[b];
    return (
      c !== undefined &&
      c !== null &&
      c.swingTwist !== undefined &&
      c.swingTwist !== null
    );
  };
  const candidates: AutoMovieHumanoidBone[] = [
    "leftUpperArm",
    "leftUpperLeg",
    "rightUpperArm",
    "rightUpperLeg",
  ];
  const bone: AutoMovieHumanoidBone = candidates.find(gated)!;
  const range: IAutoMovieJointConstraint = DEFAULT_HUMANOID_ROM[bone]!;
  const T: number =
    (range.swingTwist!.twist.min + range.swingTwist!.twist.max) / 2;
  const same = (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): boolean =>
    Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w) >= 1 - 1e-12;

  // 1.
  TestValidator.equals("of", swingTwistRange.of(bone), {
    axes: HUMANOID_JOINT_AXES[bone]!,
    frame: HUMANOID_REST_FRAME[bone],
  });
  TestValidator.equals(
    "no axes",
    swingTwistRange.fromAxes(bone, undefined),
    undefined,
  );
  const joint = swingTwistRange.humanoid(bone, range)!;
  TestValidator.predicate(
    "shared",
    swingTwistRange.humanoid(bone, range) === joint,
  );

  // 2.
  const table: Float64Array = joint.region.table;
  const step: number = 360 / table.length;
  TestValidator.equals("ray", swingTwistRange.radius(joint, 0), table[0]);
  const k: number = Array.from(table).findIndex(
    (r: number, i: number): boolean =>
      Math.abs(r - table[(i + 1) % table.length]!) > 1e-6,
  );
  TestValidator.predicate(
    "between",
    k >= 0 &&
      Math.abs(
        swingTwistRange.radius(joint, (k + 0.5) * step) -
          (table[k]! + table[(k + 1) % table.length]!) / 2,
      ) <= 1e-9,
  );

  // 3.
  const inside: IAutoMovieQuaternion = swingTwistRange.placed(
    { x: 0.3, y: 0.2, twist: T },
    joint,
  );
  const back = swingTwistRange.chart(inside, range, joint);
  TestValidator.predicate(
    "round trip",
    Math.abs(back.x - 0.3) <= 1e-9 &&
      Math.abs(back.y - 0.2) <= 1e-9 &&
      Math.abs(back.twist - T) <= 1e-9,
  );
  TestValidator.predicate(
    "inside",
    swingTwistRange.overshoot(inside, range, joint) <= 1e-9,
  );
  TestValidator.predicate(
    "kept",
    swingTwistRange.project(inside, range, joint) === inside ||
      same(swingTwistRange.project(inside, range, joint), inside),
  );

  // 4.
  const outside: IAutoMovieQuaternion = swingTwistRange.placed(
    { x: 1.2, y: 0, twist: T },
    joint,
  );
  TestValidator.predicate(
    "outside",
    swingTwistRange.overshoot(outside, range, joint) > 1,
  );
  TestValidator.predicate(
    "projected",
    swingTwistRange.overshoot(
      swingTwistRange.project(outside, range, joint),
      range,
      joint,
    ) <= 1e-9,
  );

  const { min, max } = range.swingTwist!.twist;
  for (const [label, twist, past, bound] of [
    ["above", max + 10, 10, max],
    ["below", min - 7, 7, min],
  ] satisfies [string, number, number, number][]) {
    const twisted: IAutoMovieQuaternion = swingTwistRange.placed(
      { x: 0.3, y: 0.2, twist },
      joint,
    );
    const kept = swingTwistRange.chart(
      swingTwistRange.project(twisted, range, joint),
      range,
      joint,
    );
    TestValidator.predicate(
      `twist ${label}`,
      Math.abs(swingTwistRange.overshoot(twisted, range, joint) - past) <=
        1e-6 &&
        Math.abs(kept.twist - bound) <= 1e-6 &&
        Math.abs(kept.x - 0.3) <= 1e-6,
    );
  }

  // 5.
  const other: IAutoMovieQuaternion = swingTwistRange.placed(
    { x: -0.4, y: 0.1, twist: T + 5 },
    joint,
  );
  TestValidator.predicate(
    "ends",
    same(swingTwistRange.blend(inside, other, 0, range, joint), inside) &&
      same(swingTwistRange.blend(inside, other, 1, range, joint), other),
  );
  const middle = swingTwistRange.chart(
    swingTwistRange.blend(inside, other, 0.5, range, joint),
    range,
    joint,
  );
  TestValidator.predicate(
    "midpoint",
    Math.abs(middle.x + 0.05) <= 1e-9 &&
      Math.abs(middle.y - 0.15) <= 1e-9 &&
      Math.abs(middle.twist - (T + 2.5)) <= 1e-9,
  );
  TestValidator.equals(
    "prepared",
    swingTwistRange.prepareBlend(inside, other, range, joint)(0.5),
    swingTwistRange.blend(inside, other, 0.5, range, joint),
  );
}
