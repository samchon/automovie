import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Vector3,
  fitDigitToTarget,
  getConstraint,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import { type IHumanBody, poseBones } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/** The digits by rig name. */
const DIGITS = ["Thumb", "Index", "Middle", "Ring", "Little"] as const;

/** A deterministic generator in [0, 1): Park and Miller's minimal standard (1988). */
const lcg = (seed: number): (() => number) => {
  let s: number = seed;
  return (): number => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
};

/** A digit's joints, proximal to distal, as the rig names them. */
const digitBones = (
  side: "left" | "right",
  digit: (typeof DIGITS)[number],
): AutoMovieHumanoidBone[] =>
  (digit === "Thumb"
    ? ["Metacarpal", "Proximal", "Distal"]
    : ["Proximal", "Intermediate", "Distal"]
  ).map((s: string): AutoMovieHumanoidBone => `${side}${digit}${s}` as AutoMovieHumanoidBone);

/** A pose with the given digit joints over the rest. */
const posed = (body: IHumanBody, joints: readonly IAutoMovieJointPose[]): IAutoMoviePose => ({
  skeleton: body.skeleton.id,
  root: null,
  joints: [...joints],
});

/** A digit region's world point under a pose. */
const surfaceAt = (
  body: IHumanBody,
  pose: IAutoMoviePose,
  region: AutoMovieHumanoidRegion,
): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } => {
  const frame: resolveAutoMovieHumanoidSurfaces.IFrame = body.surfaces.regions[region];
  const bone: IAutoMovieResolvedBone = poseBones(body, pose).get(frame.bone)!;
  return resolveAutoMovieHumanoidSurfaces.place(frame, bone);
};

/** Random in-range angles of a digit's free axes. */
const random = (
  body: IHumanBody,
  bones: readonly AutoMovieHumanoidBone[],
  draw: () => number,
): IAutoMovieJointPose[] =>
  bones.map((bone: AutoMovieHumanoidBone): IAutoMovieJointPose => {
    const c = getConstraint(bone, body.skeleton.bones.find((b) => b.bone === bone)?.constraint ?? null);
    const pick = (r: { min: number; max: number } | null | undefined): number | null =>
      r === null || r === undefined ? null : r.min + (r.max - r.min) * draw();
    return {
      bone,
      flexion: pick(c?.flexion),
      abduction: pick(c?.abduction),
      twist: c?.swingTwist ? pick(c.swingTwist.twist) : pick(c?.twist),
    };
  });

/** Fit a digit's tip to a point from the rest. */
const fit = (
  body: IHumanBody,
  side: "left" | "right",
  digit: (typeof DIGITS)[number],
  target: IAutoMovieVector3,
  from: IAutoMoviePose = posed(body, []),
): fitDigitToTarget.IResult => {
  const region: resolveAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.regions[`${digit.toLowerCase()}Tip${side === "left" ? "Left" : "Right"}` as AutoMovieHumanoidRegion];
  return fitDigitToTarget({
    skeleton: body.skeleton,
    pose: from,
    bones: digitBones(side, digit),
    effector: { bone: region.bone, point: region.point, normal: region.normal },
    target,
    ...(digit === "Thumb" ? {} : { coupling: 2 / 3 }),
    jointAxes: HUMANOID_JOINT_AXES,
    restFrames: HUMANOID_REST_FRAME,
  });
};

/**
 * The digit's inverse kinematics puts a tip on a point inside the range of
 * motion (#3444).
 *
 * Scenarios:
 *
 * 1. Points of each right digit's workspace, each the tip under random
 *    in-range angles from a fixed seed, are reached within 0.5 mm.
 * 2. A point 0.2 m beyond the fingertip ends at the reachable point nearest
 *    it: the residual is the distance left and no sampled workspace point is
 *    nearer by more than 0.5 mm.
 * 3. A target moved 1 mm at a time along a 20 mm line moves every joint by at
 *    most 5 degrees per step.
 * 4. Opposition: the thumb's tip reaches the index pad of a pinching index
 *    within 1 mm on every body of `EXTREMES`.
 * 5. No fitted joint leaves its range.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the engine's digit fit on generated bodies and measures the displayed tip by forward kinematics.
 * @evidence contracts/development/testing.md#independent-expectations Targets are forward kinematics of in-range angles, so reachable by construction; the bounds are the issue's (0.5 mm, 5 degrees, 1 mm) and the rig's own ranges.
 * @evidence contracts/development/testing.md#distinguishing-cases In-workspace, out-of-reach, a continuous path and opposition across four bodies.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test on prepared bodies; no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and the behaviour each pins.
 */
export function test_engine_digit_fit(): void {
  const complaints: string[] = [];
  const check = (label: string, ok: boolean): void => {
    if (!ok) complaints.push(label);
  };
  const body: IHumanBody = motionHumanBody("m-average");
  const draw: () => number = lcg(3444);

  // 1. Workspace points.
  let worst: number = 0;
  let inRange: boolean = true;
  for (const digit of DIGITS) {
    const bones: AutoMovieHumanoidBone[] = digitBones("right", digit);
    for (let k: number = 0; k < 6; k++) {
      const goal: IAutoMoviePose = posed(body, random(body, bones, draw));
      const target: IAutoMovieVector3 = surfaceAt(
        body,
        goal,
        `${digit.toLowerCase()}TipRight` as AutoMovieHumanoidRegion,
      ).point;
      const result: fitDigitToTarget.IResult = fit(body, "right", digit, target);
      worst = Math.max(worst, result.residual);
      inRange &&= result.joints.every((j: IAutoMovieJointPose): boolean => {
        const c = getConstraint(j.bone, null);
        const within = (v: number | null, r: { min: number; max: number } | null | undefined): boolean =>
          v === null || r === null || r === undefined || (v >= r.min - 0.01 && v <= r.max + 0.01);
        return within(j.flexion, c?.flexion) && within(j.abduction, c?.abduction);
      });
    }
  }
  check(`every workspace point is reached within 0.5 mm (worst ${(worst * 1000).toFixed(3)} mm)`, worst <= 5e-4);
  check("no fitted joint leaves its range", inRange);

  // 2. Out of reach.
  const rest: IAutoMovieVector3 = surfaceAt(body, posed(body, []), "indexTipRight").point;
  const far: IAutoMovieVector3 = Vector3.add(rest, { x: -0.2, y: 0, z: 0 });
  const beyond: fitDigitToTarget.IResult = fit(body, "right", "Index", far);
  let nearest: number = Infinity;
  for (let k: number = 0; k < 200; k++) {
    const pose: IAutoMoviePose = posed(body, random(body, digitBones("right", "Index"), draw));
    nearest = Math.min(nearest, Vector3.length(Vector3.subtract(surfaceAt(body, pose, "indexTipRight").point, far)));
  }
  check(
    `an unreachable point leaves ${beyond.residual.toFixed(4)} m, the reached point's own distance, and no sampled point is nearer by more than 0.5 mm`,
    Math.abs(beyond.residual - Vector3.length(Vector3.subtract(beyond.point, far))) <= 5e-4 &&
      beyond.residual <= nearest + 5e-4,
  );

  // 3. Continuity along a path.
  const start: IAutoMoviePose = posed(body, [
    { bone: "rightIndexProximal", flexion: 30, abduction: 0, twist: null },
    { bone: "rightIndexIntermediate", flexion: 30, abduction: null, twist: null },
    { bone: "rightIndexDistal", flexion: 20, abduction: null, twist: null },
  ]);
  const origin: IAutoMovieVector3 = surfaceAt(body, start, "indexTipRight").point;
  let jump: number = 0;
  let previous: IAutoMovieJointPose[] | undefined;
  for (let mm: number = 0; mm <= 20; mm++) {
    const result: fitDigitToTarget.IResult = fit(
      body,
      "right",
      "Index",
      Vector3.add(origin, { x: 0, y: -mm / 1000, z: 0 }),
      start,
    );
    if (previous !== undefined)
      result.joints.forEach((j: IAutoMovieJointPose, i: number): void => {
        jump = Math.max(
          jump,
          Math.abs((j.flexion ?? 0) - (previous![i]!.flexion ?? 0)),
          Math.abs((j.abduction ?? 0) - (previous![i]!.abduction ?? 0)),
        );
      });
    previous = result.joints;
  }
  check(`a target moved 1 mm at a time moves no joint more than 5 degrees (largest ${jump.toFixed(2)})`, jump <= 5);

  // 4. Opposition on every body.
  for (const name of motionHumanBody.EXTREMES) {
    const person: IHumanBody = motionHumanBody(name);
    const pinch: IAutoMoviePose = posed(person, [
      { bone: "rightIndexProximal", flexion: 45, abduction: 0, twist: null },
      { bone: "rightIndexIntermediate", flexion: 45, abduction: null, twist: null },
      { bone: "rightIndexDistal", flexion: 30, abduction: null, twist: null },
    ]);
    const pad: IAutoMovieVector3 = surfaceAt(person, pinch, "indexPadRight").point;
    const result: fitDigitToTarget.IResult = fit(person, "right", "Thumb", pad, pinch);
    check(
      `${name}: the thumb tip reaches the pinching index pad within 1 mm (${(result.residual * 1000).toFixed(3)} mm)`,
      result.residual <= 1e-3,
    );
  }
  TestValidator.equals("the digit fit", complaints, []);
}
