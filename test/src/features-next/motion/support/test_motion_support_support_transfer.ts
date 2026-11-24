import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  HumanFoot,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { throwsError } from "../../../features/internal/throwsError";
import { vclose } from "../../../features/internal/vclose";

/**
 * Heel-off transfers the foot’s pivot to its forefoot while that contact stays fixed.
 *
 * Scenarios:
 * 1. Rotate a foot in pitch around the ball of the sole and compare the heel and support point with a flat pose.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Heel-off transfers the foot’s pivot to its forefoot while that contact stays fixed.
 * @evidence contracts/development/testing.md#independent-expectations A rigid rotation about the front support moves the heel along a circular arc.
 * @evidence contracts/development/testing.md#distinguishing-cases Flat contact has a low heel; pitched contact preserves the support point with the heel raised.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_support_support_transfer(): void {
  const body = motionHumanBody("m-average");
  const anchor: IAutoMovieVector3 = { x: 1, y: 0, z: 2 };
  const ball: IAutoMovieVector3 = { x: 0, y: -0.07, z: 0.14 };
  for (const [ask, reached, extension] of [
    [0, -15, 15],
    [-10, -25, 15],
    [0, 5, 0],
  ] as const) {
    for (const yaw of [0, 40]) {
      const actualRotation = HumanFoot.rotation(yaw, reached);
      const off = HumanFoot.heelOff(
        HumanFoot.rotation(yaw, ask),
        actualRotation,
        anchor,
        ball,
      );
      TestValidator.predicate(
        "toe extension compensates lost pitch and preserves ball position under yaw",
        nclose(off.toes, extension, 1e-9) &&
          vclose(
            Vector3.add(
              off.ankle,
              Quaternion.rotateVector(actualRotation, ball),
            ),
            anchor,
            1e-12,
          ),
      );
    }
  }
  const zero = { x: 0, y: 0, z: 0 };
  const base = poseBones(
    body,
    resolveHumanPosture(
      body,
      AutoMovieMotionHumanStance.stand.posture(body, zero, 0),
    ),
  );
  const first = body.massModel.segments.find((s) => s.bone === "hips")!;
  const second = body.massModel.segments.find(
    (s) => s.bone === "leftUpperLeg",
  )!;
  const model = {
    mass: 3,
    segments: [
      { ...first, mass: 2, point: zero },
      { ...second, mass: 1, point: zero },
    ],
  };
  const actual = resolveAutoMovieCenterOfMass.place(model, base);
  const hips = base.get("hips")!.worldPosition,
    leg = base.get("leftUpperLeg")!.worldPosition;
  for (const axis of ["x", "y", "z"] as const)
    TestValidator.predicate(
      "two to one segment mass weighting",
      nclose(actual[axis], (2 * hips[axis] + leg[axis]) / 3, 1e-9),
    );
  const shifted = new Map(base);
  for (const [key, bone] of base)
    shifted.set(key, {
      ...bone,
      worldPosition: {
        x: bone.worldPosition.z + 1,
        y: bone.worldPosition.y,
        z: -bone.worldPosition.x + 2,
      },
    });
  TestValidator.predicate(
    "root yaw and translation carry the mass center",
    vclose(
      resolveAutoMovieCenterOfMass.place(model, shifted),
      { x: actual.z + 1, y: actual.y, z: 2 - actual.x },
      1e-9,
    ),
  );
  TestValidator.predicate(
    "a missing skeleton cannot bind a mass segment",
    throwsError(() =>
      resolveAutoMovieCenterOfMass(
        { ...body.skeleton, bones: [] },
        body.profile,
      ),
    ),
  );
  const square = [
    { x: -0.1, y: 0, z: -0.1 },
    { x: 0.1, y: 0, z: -0.1 },
    { x: 0.1, y: 0, z: 0.1 },
    { x: -0.1, y: 0, z: 0.1 },
  ];
  const com = resolveAutoMovieCenterOfMass;
  TestValidator.predicate(
    "signed distance to planar and degenerate support",
    nclose(com.margin(zero, square), 0.1, 1e-12) &&
      nclose(com.margin({ ...zero, x: 0.3 }, square), -0.2, 1e-12) &&
      nclose(
        com.margin({ ...zero, z: 0.05 }, square.slice(0, 2)),
        -0.15,
        1e-12,
      ),
  );
  const velocity = { ...zero, x: 1 };
  TestValidator.predicate(
    "unit pendulum lead",
    vclose(
      com.extrapolate(zero, velocity, 1),
      { ...zero, x: 1 / Math.sqrt(AutoMovieGravity.STANDARD) },
      1e-9,
    ),
  );
  TestValidator.predicate(
    "missing contact or pendulum length refused",
    throwsError(() => com.margin(zero, [])) &&
      throwsError(() => com.extrapolate(zero, velocity, 0)),
  );
  const flat: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
    body,
    "left",
    "ball",
    anchor,
    0,
    0,
  );
  const rocked: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
    body,
    "left",
    "ball",
    anchor,
    0,
    -20,
  );
  const heel = (
    foot: IAutoMovieMotionHumanFoot.IPlacement,
  ): IAutoMovieVector3 => HumanFoot.point(body, "left", "heel", foot);
  TestValidator.predicate(
    "fixed forefoot",
    vclose(HumanFoot.point(body, "left", "ball", rocked), anchor),
  );
  const before = heel(flat),
    after = heel(rocked);
  TestValidator.predicate("heel leaves the bearing plane", after.y > before.y);
  TestValidator.predicate(
    "rigid heel radius",
    Math.abs(
      Math.hypot(before.y - anchor.y, before.z - anchor.z) -
        Math.hypot(after.y - anchor.y, after.z - anchor.z),
    ) < 1e-8,
  );
}
