import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { poseBones, resolveHumanPosture } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../internal/motionHumanBody";

/** A digit region's world point on a pose. */
const at = (
  body: IAutoMovieMotionHumanBody,
  bones: ReturnType<typeof poseBones>,
  region: AutoMovieHumanoidRegion,
): IAutoMovieVector3 => {
  const frame: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.regions[region];
  const bone: IAutoMovieResolvedBone = bones.get(frame.bone)!;
  return resolveAutoMovieHumanoidSurfaces.place(frame, bone).point;
};

/**
 * Digit goals on the posture (#3445).
 *
 * The average man stands with his right arm forward, the hand held by an arm
 * goal; digit goals are given on top.
 *
 * Scenarios:
 *
 * 1. A forefinger goal at a reachable point (the tip under a known pinch) is met
 *    within 0.5 mm in the resolved pose, the issue's bound, on both sides.
 * 2. A goal on a bone rides it: the thumb's tip on the forefinger's pad (`on` its
 *    distal phalanx) is met within 0.5 mm.
 * 3. A posture with no digit goals resolves exactly as before: the same pose, to
 *    the bit, as one whose `digits` is empty.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves postures with digit goals on a generated body and reads the actual tip and pad on the resolved pose.
 * @evidence contracts/development/testing.md#independent-expectations Goals are surface points of in-range poses, so reachable; the bound is the issue's.
 * @evidence contracts/development/testing.md#distinguishing-cases Both sides, a world and a bone goal, empty and absent goals.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test preparing one polygon man; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the cast and the three scenarios.
 */
export function test_motion_contact_hand_rotation(): void {
  const complaints: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const forward = (side: AutoMovieHumanSide): IAutoMovieMotionHumanPosture => ({
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {
      [`${side}Arm`]: {
        point: {
          x: (side === "left" ? 1 : -1) * m.shoulderHalfWidth,
          y: m.shoulderHeight - 0.2,
          z: 0.8 * (m.upperArm + m.forearm),
        },
        bend: { x: (side === "left" ? 1 : -1) * 0.5, y: 0, z: 0 },
        rotation: Quaternion.identity(),
      },
    },
  });

  // 1. A reachable forefinger point, on both sides.
  for (const side of ["left", "right"] as const) {
    const Side: string = side === "left" ? "Left" : "Right";
    const base: IAutoMovieMotionHumanPosture = forward(side);
    const pinch: IAutoMovieMotionHumanPosture = {
      ...base,
      joints: {
        [`${side}IndexProximal`]: [40, 0, 0],
        [`${side}IndexIntermediate`]: [40, 0, 0],
        [`${side}IndexDistal`]: [26.67, 0, 0],
      },
    };
    const goal: IAutoMovieVector3 = at(
      body,
      poseBones(body, resolveHumanPosture(body, pinch)),
      `indexTip${Side}` as AutoMovieHumanoidRegion,
    );
    const reached: IAutoMoviePose = resolveHumanPosture(body, {
      ...base,
      digits: { [`${side}Index`]: { point: goal, surface: "tip" } },
    });
    const miss: number = Vector3.length(
      Vector3.subtract(
        at(
          body,
          poseBones(body, reached),
          `indexTip${Side}` as AutoMovieHumanoidRegion,
        ),
        goal,
      ),
    );
    if (!(miss <= 5e-4))
      complaints.push(
        `${side}: the forefinger's tip misses its goal by ${(miss * 1000).toFixed(3)} mm, within 0.5 mm expected`,
      );
  }

  // 2. A goal on a bone: the thumb's tip on the forefinger's pad.
  const base: IAutoMovieMotionHumanPosture = {
    ...forward("right"),
    joints: {
      rightIndexProximal: [45, 0, 0],
      rightIndexIntermediate: [45, 0, 0],
      rightIndexDistal: [30, 0, 0],
    },
  };
  const pad: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.regions.indexPadRight;
  const pinched: IAutoMoviePose = resolveHumanPosture(body, {
    ...base,
    digits: {
      rightThumb: {
        point: pad.point,
        normal: pad.normal,
        surface: "tip",
        on: pad.bone,
      },
    },
  });
  const pinchedBones: ReturnType<typeof poseBones> = poseBones(body, pinched);
  const opposition: number = Vector3.length(
    Vector3.subtract(
      at(body, pinchedBones, "thumbTipRight"),
      at(body, pinchedBones, "indexPadRight"),
    ),
  );
  if (!(opposition <= 5e-4))
    complaints.push(
      `the thumb's tip misses the forefinger's pad by ${(opposition * 1000).toFixed(3)} mm, within 0.5 mm expected`,
    );

  // 3. No digit goals: the pose as before.
  const plain: IAutoMoviePose = resolveHumanPosture(body, forward("right"));
  const empty: IAutoMoviePose = resolveHumanPosture(body, {
    ...forward("right"),
    digits: {},
  });
  if (JSON.stringify(plain) !== JSON.stringify(empty))
    complaints.push(
      "a posture with empty digit goals resolves differently from one with none",
    );

  TestValidator.equals(
    "digit goals meet their displayed targets",
    complaints,
    [],
  );
}
