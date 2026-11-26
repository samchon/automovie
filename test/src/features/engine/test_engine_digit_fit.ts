import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Vector3,
  AutoMovieEngineViolationCollector,
  fitDigitToTarget,
  getConstraint,
  resolveAutoMovieHumanoidSurfaces,
  validateJointRom,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieFitDigitToTarget,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
  IAutoMovieViolationCollector,
} from "@automovie/interface";
import { poseBones } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A reached point's bound, metres: #3444's first two acceptance lines (each
 * workspace point within 0.5 mm; an unreachable point's residual within 0.5
 * mm).
 */
const REACH: number = 5e-4;

/**
 * The largest joint move between targets 1 mm apart, degrees: #3444's third
 * acceptance line.
 */
const STEP: number = 5;

/**
 * The opposition bound, metres: #3444's fourth acceptance line (the thumb tip
 * on the index pad within 1 mm).
 */
const PINCH: number = 1e-3;

/** The digits by rig name. */
const DIGITS = ["Thumb", "Index", "Middle", "Ring", "Little"] as const;

/**
 * A deterministic generator in [0, 1): Park and Miller's minimal standard
 * (1988).
 */
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
  ).map(
    (s: string): AutoMovieHumanoidBone =>
      `${side}${digit}${s}` as AutoMovieHumanoidBone,
  );

/** A pose with the given digit joints over the rest. */
const posed = (
  body: IAutoMovieMotionHumanBody,
  joints: readonly IAutoMovieJointPose[],
): IAutoMoviePose => ({
  skeleton: body.skeleton.id,
  root: null,
  joints: [...joints],
});

/** A digit region's world point under a pose. */
const surfaceAt = (
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  region: AutoMovieHumanoidRegion,
): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } => {
  const frame: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.regions[region];
  const bone: IAutoMovieResolvedBone = poseBones(body, pose).get(frame.bone)!;
  return resolveAutoMovieHumanoidSurfaces.place(frame, bone);
};

/** Random in-range angles of a digit's free axes. */
const random = (
  body: IAutoMovieMotionHumanBody,
  bones: readonly AutoMovieHumanoidBone[],
  draw: () => number,
): IAutoMovieJointPose[] =>
  bones.map((bone: AutoMovieHumanoidBone): IAutoMovieJointPose => {
    const c = getConstraint(
      bone,
      body.skeleton.bones.find((b) => b.bone === bone)?.constraint ?? null,
    );
    const pick = (
      r: { min: number; max: number } | null | undefined,
    ): number | null =>
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
  body: IAutoMovieMotionHumanBody,
  side: "left" | "right",
  digit: (typeof DIGITS)[number],
  target: IAutoMovieVector3,
  from: IAutoMoviePose = posed(body, []),
  rate?: number,
): IAutoMovieFitDigitToTarget.IResult => {
  const region: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.regions[
      `${digit.toLowerCase()}Tip${side === "left" ? "Left" : "Right"}` as AutoMovieHumanoidRegion
    ];
  return fitDigitToTarget({
    skeleton: body.skeleton,
    pose: from,
    bones: digitBones(side, digit),
    effector: { bone: region.bone, point: region.point, normal: region.normal },
    target,
    ...(digit === "Thumb" ? {} : { coupling: 2 / 3 }),
    ...(rate === undefined ? {} : { rate }),
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
 * 1. Points of each right digit's workspace, each the tip under random in-range
 *    angles from a fixed seed, are reached within 0.5 mm.
 * 2. A point 0.2 m beyond the fingertip ends at the reachable point nearest it:
 *    the residual is the distance left and no sampled workspace point is nearer
 *    by more than 0.5 mm.
 * 3. A target moved 1 mm at a time along a 20 mm line from the tip toward the
 *    finger's knuckle, inside the workspace, each fit seeded from the one
 *    before (continuation), moves every joint by at most 5 degrees per step and
 *    is reached all the way. Drawn instead straight down past the straightened
 *    finger's full reach, soft IK (`rate`) eases the radial distance in the
 *    cosine-rule-derived band; its tip reaches that eased distance within 0.5
 *    mm, the joints move at most 5 degrees per step and the original target's
 *    residual, once out of reach, only grows. Below that band the answer is
 *    bit-identical to the unsoftened fit.
 * 4. Opposition: the thumb's tip reaches the index pad of a pinching index within
 *    1 mm on every body of `EXTREMES`.
 * 5. No fitted joint leaves its range.
 * 6. A zero, negative or non-finite radial rate is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the engine's digit fit on generated bodies and measures the displayed tip by forward kinematics.
 * @evidence contracts/development/testing.md#independent-expectations Targets are forward kinematics of in-range angles, so reachable by construction; the bounds are the issue's (0.5 mm, 5 degrees, 1 mm) and the rig's own ranges. The soft band's width follows the cosine rule for the body's link lengths and the exponential soft-IK law, independently of the solver's output.
 * @evidence contracts/development/testing.md#distinguishing-cases In-workspace, out-of-reach, a continuous path through full extension with the reach trade measured, unchanged targets below the band, malformed rates and opposition across four bodies.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test on prepared bodies; no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and the behaviour each pins.
 */
export function test_engine_digit_fit(): void {
  const complaints: string[] = [];
  const check = (label: string, ok: boolean): void => {
    if (!ok) complaints.push(label);
  };
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const draw: () => number = lcg(3444);

  // 1. Workspace points.
  let worst: number = 0;
  const outside: string[] = [];
  for (const digit of DIGITS) {
    const bones: AutoMovieHumanoidBone[] = digitBones("right", digit);
    for (let k: number = 0; k < 6; k++) {
      const goal: IAutoMoviePose = posed(body, random(body, bones, draw));
      const target: IAutoMovieVector3 = surfaceAt(
        body,
        goal,
        `${digit.toLowerCase()}TipRight` as AutoMovieHumanoidRegion,
      ).point;
      const result: IAutoMovieFitDigitToTarget.IResult = fit(
        body,
        "right",
        digit,
        target,
      );
      worst = Math.max(worst, result.residual);
      // The rig's own ranges, read by the engine's range validator (the
      // verdicts' measure), not by the clamp the fit projects with: a
      // thumb base gated by swing and twist is judged by its cone.
      for (const j of result.joints) {
        const constraint: IAutoMovieJointConstraint | null = getConstraint(
          j.bone,
          body.skeleton.bones.find((b) => b.bone === j.bone)?.constraint ??
            null,
        );
        if (constraint === null) continue;
        const collector: IAutoMovieViolationCollector =
          new AutoMovieEngineViolationCollector();
        validateJointRom({ joint: j, constraint, path: j.bone, collector });
        for (const item of collector.items)
          outside.push(JSON.stringify(item).slice(0, 160));
      }
    }
  }
  check(
    `every workspace point is reached within 0.5 mm (worst ${(worst * 1000).toFixed(3)} mm)`,
    worst <= REACH,
  );
  check(
    `no fitted joint leaves its range (${outside.slice(0, 4).join("; ")})`,
    outside.length === 0,
  );

  // 2. Out of reach.
  const rest: IAutoMovieVector3 = surfaceAt(
    body,
    posed(body, []),
    "indexTipRight",
  ).point;
  const far: IAutoMovieVector3 = Vector3.add(rest, { x: -0.2, y: 0, z: 0 });
  const beyond: IAutoMovieFitDigitToTarget.IResult = fit(
    body,
    "right",
    "Index",
    far,
  );
  let nearest: number = Infinity;
  for (let k: number = 0; k < 200; k++) {
    const pose: IAutoMoviePose = posed(
      body,
      random(body, digitBones("right", "Index"), draw),
    );
    nearest = Math.min(
      nearest,
      Vector3.length(
        Vector3.subtract(surfaceAt(body, pose, "indexTipRight").point, far),
      ),
    );
  }
  check(
    `an unreachable point leaves ${beyond.residual.toFixed(4)} m, the reached point's own distance, and no sampled point is nearer by more than 0.5 mm`,
    Math.abs(
      beyond.residual - Vector3.length(Vector3.subtract(beyond.point, far)),
    ) <= REACH && beyond.residual <= nearest + REACH,
  );

  // 3. Continuity along a path.
  const start: IAutoMoviePose = posed(body, [
    { bone: "rightIndexProximal", flexion: 30, abduction: 0, twist: null },
    {
      bone: "rightIndexIntermediate",
      flexion: 30,
      abduction: null,
      twist: null,
    },
    { bone: "rightIndexDistal", flexion: 20, abduction: null, twist: null },
  ]);
  const origin: IAutoMovieVector3 = surfaceAt(
    body,
    start,
    "indexTipRight",
  ).point;
  // The path runs from the tip toward the finger's knuckle, so it stays
  // inside the workspace: a path that drew the tip away would straighten
  // the finger toward its full reach, the kinematic singularity where the
  // joints' rate per millimetre grows without bound and no continuity is
  // owed (#3444 asks it of targets the digit reaches).
  const knuckle: IAutoMovieVector3 = poseBones(body, start).get(
    "rightIndexProximal",
  )!.worldPosition;
  const inward: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(knuckle, origin),
  );
  let jump: number = 0;
  let pathMiss: number = 0;
  let where: string = "";
  let previous: IAutoMovieJointPose[] | undefined;
  for (let mm: number = 0; mm <= 20; mm++) {
    const result: IAutoMovieFitDigitToTarget.IResult = fit(
      body,
      "right",
      "Index",
      Vector3.add(origin, Vector3.scale(inward, mm / 1000)),
      // Continuation: each fit seeded from the one before, as a caller
      // following a moving target does.
      previous === undefined ? start : posed(body, previous),
    );
    pathMiss = Math.max(pathMiss, result.residual);
    if (previous !== undefined)
      result.joints.forEach((j: IAutoMovieJointPose, i: number): void => {
        const moved: number = Math.max(
          Math.abs((j.flexion ?? 0) - (previous![i]!.flexion ?? 0)),
          Math.abs((j.abduction ?? 0) - (previous![i]!.abduction ?? 0)),
        );
        if (moved > jump) {
          jump = moved;
          where = `${mm} mm, ${j.bone} from ${JSON.stringify(previous![i])} to ${JSON.stringify(j)}, residual ${(result.residual * 1000).toFixed(3)} mm`;
        }
      });
    previous = result.joints;
  }
  check(
    `a target moved 1 mm at a time moves no joint more than 5 degrees (largest ${jump.toFixed(2)}, at ${where})`,
    jump <= STEP,
  );
  check(
    `every target of the path is reached within 0.5 mm (worst ${(pathMiss * 1000).toFixed(3)} mm)`,
    pathMiss <= REACH,
  );

  // 3b. The cosine rule for the chain divided at either internal hinge:
  // L-d = ab/(2L) theta² near full extension, with theta in radians.
  // The least curvature gives the widest band required by #3444's rate.
  const initial: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    start,
  );
  const middle: IAutoMovieVector3 = initial.get(
    "rightIndexIntermediate",
  )!.worldPosition;
  const distal: IAutoMovieVector3 =
    initial.get("rightIndexDistal")!.worldPosition;
  const proximalLength: number = Vector3.length(
    Vector3.subtract(middle, knuckle),
  );
  const middleLength: number = Vector3.length(Vector3.subtract(distal, middle));
  const tipLength: number = Vector3.length(
    body.surfaces.regions.indexTipRight.point,
  );
  const chainLength: number = proximalLength + middleLength + tipLength;
  const curvature: number =
    (Math.min(
      proximalLength * (middleLength + tipLength),
      (proximalLength + middleLength) * tipLength,
    ) /
      (2 * chainLength)) *
    (Math.PI / 180) ** 2;
  const softWidth: number = 1 / (4 * curvature * (STEP * 1000) ** 2);
  const interiorTarget: IAutoMovieVector3 = Vector3.add(
    origin,
    Vector3.scale(inward, 0.02),
  );
  check(
    "soft reach leaves a target below its band bit-identical",
    JSON.stringify(fit(body, "right", "Index", interiorTarget, start)) ===
      JSON.stringify(
        fit(body, "right", "Index", interiorTarget, start, STEP * 1000),
      ),
  );

  // Through full reach, the tip follows the independently eased radius.
  // Its residual continues to report the original target's distance.
  let swing: number = 0;
  let at: string = "";
  let before: IAutoMovieFitDigitToTarget.IResult | undefined;
  let shrinks: boolean = false;
  let radialMiss: number = 0;
  for (let mm: number = 0; mm <= 20; mm++) {
    const target: IAutoMovieVector3 = Vector3.add(origin, {
      x: 0,
      y: -mm / 1000,
      z: 0,
    });
    const distance: number = Vector3.length(Vector3.subtract(target, knuckle));
    const expected: number =
      distance <= chainLength - softWidth
        ? distance
        : chainLength -
          softWidth *
            Math.exp(-(distance - chainLength + softWidth) / softWidth);
    const result: IAutoMovieFitDigitToTarget.IResult = fit(
      body,
      "right",
      "Index",
      target,
      before === undefined ? start : posed(body, before.joints),
      STEP * 1000,
    );
    radialMiss = Math.max(
      radialMiss,
      Math.abs(
        Vector3.length(Vector3.subtract(result.point, knuckle)) - expected,
      ),
    );
    if (before !== undefined) {
      result.joints.forEach((j: IAutoMovieJointPose, i: number): void => {
        const moved: number = Math.max(
          Math.abs((j.flexion ?? 0) - (before!.joints[i]!.flexion ?? 0)),
          Math.abs((j.abduction ?? 0) - (before!.joints[i]!.abduction ?? 0)),
        );
        if (moved > swing) {
          swing = moved;
          at = `${mm} mm, ${j.bone}`;
        }
      });
      if (before.residual > REACH && result.residual < before.residual)
        shrinks = true;
    }
    before = result;
  }
  check(
    `a target drawn past full reach moves no joint more than 5 degrees per millimetre (largest ${swing.toFixed(2)}, at ${at})`,
    swing <= STEP,
  );
  check(
    "a target out of reach leaves a residual that grows as it moves away",
    !shrinks,
  );
  check(
    `soft reach follows its eased radial distance within 0.5 mm (worst ${(radialMiss * 1000).toFixed(3)} mm)`,
    radialMiss <= REACH,
  );

  // 4. Opposition on every body.
  for (const name of motionHumanBody.EXTREMES) {
    const person: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const pinch: IAutoMoviePose = posed(person, [
      { bone: "rightIndexProximal", flexion: 45, abduction: 0, twist: null },
      {
        bone: "rightIndexIntermediate",
        flexion: 45,
        abduction: null,
        twist: null,
      },
      { bone: "rightIndexDistal", flexion: 30, abduction: null, twist: null },
    ]);
    const pad: IAutoMovieVector3 = surfaceAt(
      person,
      pinch,
      "indexPadRight",
    ).point;
    const result: IAutoMovieFitDigitToTarget.IResult = fit(
      person,
      "right",
      "Thumb",
      pad,
      pinch,
    );
    check(
      `${name}: the thumb tip reaches the pinching index pad within 1 mm (${(result.residual * 1000).toFixed(3)} mm)`,
      result.residual <= PINCH,
    );
  }

  // 6. A radial rate is a positive rate, not a division by zero.
  for (const rate of [0, -1, NaN]) {
    let refused: boolean = false;
    try {
      fit(body, "right", "Index", origin, start, rate);
    } catch {
      refused = true;
    }
    check(`rate ${rate} is refused`, refused);
  }
  TestValidator.equals("the digit fit", complaints, []);
}
