import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchPath,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../features/internal/motionHumanBody";

/**
 * The direction a hand lies on a region when the arm chooses it: from the
 * elbow hanging under the shoulder to the place, across the region's normal.
 *
 * On four bodies of the population, standing at the origin heading +Z
 * unless said, the hanging elbow `E` is written from the measures: a
 * shoulder's half width to the hand's side (the left is +X), the upper arm's
 * length under the shoulder's height.
 *
 * Scenarios:
 * 1. The right palm on the own belly, a point on the midline at the waist's
 *    height and half a chest's depth forward, facing +Z: the direction is
 *    `(shoulderHalfWidth, waistHeight - E.y, 0)` normalised; it has no
 *    forward part and runs toward the left, across the belly.
 * 2. The right palm on the front of the right thigh, a point under the hip
 *    at mid-thigh, facing +Z: the direction points down the thigh, more
 *    down than sideways.
 * 3. The left hand on the mirrored place lies along the mirrored direction.
 * 4. A performer at `(1, 0, 2)` heading 90 degrees, with the belly's point
 *    and normal turned and moved the same way, has the direction turned the
 *    same way.
 * 5. A place straight along the normal from the elbow has no direction
 *    across it, so the fallback is returned.
 * 6. The boundary: a way 18 degrees off the normal (`sin 18 = 0.309` of it
 *    across) is laid along its part across the normal; a way 17 degrees off
 *    (`sin 17 = 0.292`) takes the fallback.
 * 7. Every direction laid is a unit vector perpendicular to the normal.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public direction on real bodies; a wrong side of the shoulder, a direction off the surface, a heading that is not followed or a fallback on the wrong side of the boundary fails.
 * @evidence contracts/development/testing.md#independent-expectations Each direction is written from the body's measures and the geometry of the place; the turned case is turned by a rotation written in the test.
 * @evidence contracts/development/testing.md#distinguishing-cases A place across the body and one under the shoulder, both hands, two headings, the fallback and both sides of its boundary, on four builds.
 * @evidence contracts/development/testing.md#execution-ownership In memory; named `test_human_` because it prepares real bodies, which the CI test job leaves to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States the elbow's place and lists the 7 scenarios with their numbers.
 */
export function test_human_motion_compose_touch_path(): void {
  const near = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-9;
  const same = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean =>
    near(a.x, b.x) && near(a.y, b.y) && near(a.z, b.z);
  const unit = (v: IAutoMovieVector3): IAutoMovieVector3 => {
    const length: number = Math.hypot(v.x, v.y, v.z);
    return { x: v.x / length, y: v.y / length, z: v.z / length };
  };
  const mirror = (v: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: -v.x,
    y: v.y,
    z: v.z,
  });
  // A quarter turn about +Y takes the heading +Z to +X and the left +X to -Z.
  const turn = (v: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: v.z,
    y: v.y,
    z: -v.x,
  });
  const rad = (degrees: number): number => (degrees * Math.PI) / 180;
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const front: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const fallback: IAutoMovieVector3 = { x: 0.6, y: 0.8, z: 0 };

  for (const name of [
    "m-average",
    "f-minus-one",
    "f-small",
    "m-large",
  ] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const m = body.measure;
    const elbow: IAutoMovieVector3 = {
      x: -m.shoulderHalfWidth,
      y: m.shoulderHeight - m.upperArm,
      z: 0,
    };
    const laid: IAutoMovieVector3[] = [];
    const lay = (
      side: "left" | "right",
      point: IAutoMovieVector3,
      normal: IAutoMovieVector3,
      root: IAutoMovieVector3 = origin,
      yaw: number = 0,
    ): IAutoMovieVector3 => {
      const out: IAutoMovieVector3 = AutoMovieMotionHumanTouchPath.lay(
        body,
        { root, yaw },
        side,
        point,
        normal,
        fallback,
      );
      if (out !== fallback) {
        TestValidator.predicate(
          `${name}: a laid direction is a unit vector across the normal`,
          near(Math.hypot(out.x, out.y, out.z), 1) &&
            near(out.x * normal.x + out.y * normal.y + out.z * normal.z, 0),
        );
        laid.push(out);
      }
      return out;
    };

    // 1. the belly
    const belly: IAutoMovieVector3 = {
      x: 0,
      y: m.waistHeight,
      z: m.chestDepth / 2,
    };
    const across: IAutoMovieVector3 = lay("right", belly, front);
    TestValidator.predicate(
      `${name}: the palm lies across the belly`,
      same(
        across,
        unit({ x: m.shoulderHalfWidth, y: m.waistHeight - elbow.y, z: 0 }),
      ) && across.x > 0,
    );

    // 2. the thigh
    const thigh: IAutoMovieVector3 = {
      x: -m.hipHalfWidth,
      y: m.hipHeight - m.thigh / 2,
      z: m.thighRadius,
    };
    const down: IAutoMovieVector3 = lay("right", thigh, front);
    TestValidator.predicate(
      `${name}: the palm points down the thigh`,
      same(
        down,
        unit({
          x: m.shoulderHalfWidth - m.hipHalfWidth,
          y: thigh.y - elbow.y,
          z: 0,
        }),
      ) &&
        down.y < 0 &&
        -down.y > Math.abs(down.x),
    );

    // 3. the left hand
    for (const point of [belly, thigh])
      TestValidator.predicate(
        `${name}: the left hand mirrors the right`,
        same(
          lay("left", mirror(point), front),
          mirror(lay("right", point, front)),
        ),
      );

    // 4. another place and heading
    const root: IAutoMovieVector3 = { x: 1, y: 0, z: 2 };
    const moved: IAutoMovieVector3 = turn(belly);
    TestValidator.predicate(
      `${name}: the direction turns with the performer`,
      same(
        lay(
          "right",
          { x: root.x + moved.x, y: moved.y, z: root.z + moved.z },
          turn(front),
          root,
          90,
        ),
        turn(across),
      ),
    );

    // 5. straight along the normal
    TestValidator.equals(
      `${name}: a place along the normal takes the fallback`,
      lay("right", { x: elbow.x, y: elbow.y, z: 0.2 }, front),
      fallback,
    );

    // 6. the boundary
    const off = (degrees: number): IAutoMovieVector3 => ({
      x: elbow.x,
      y: elbow.y + 0.2 * Math.sin(rad(degrees)),
      z: 0.2 * Math.cos(rad(degrees)),
    });
    TestValidator.predicate(
      `${name}: 18 degrees off the normal is laid`,
      same(lay("right", off(18), front), { x: 0, y: 1, z: 0 }),
    );
    TestValidator.equals(
      `${name}: 17 degrees off the normal takes the fallback`,
      lay("right", off(17), front),
      fallback,
    );

    // 7. counted by `lay`
    TestValidator.equals(`${name}: the directions laid`, laid.length, 8);
  }
}
