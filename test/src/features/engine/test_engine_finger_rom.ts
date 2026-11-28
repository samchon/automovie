import {
  AutoMovieEngineDefaultHumanoidRom,
  AutoMovieEngineKinematics,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
} from "@automovie/interface";
import {
  HumanHandShape
} from "../../../../packages/motions/src/posture/internal/HumanHandShape";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The least spread of index and middle in the victory sign, degrees: #3442's
 * second acceptance line.
 */
const SPREAD: number = 8;

/**
 * The finger and thumb ranges of motion (#3442).
 *
 * The expected numbers are written here from their sources, not read from the
 * table: the upper values of the active norms of the McGraw-Hill goniometry
 * table (Prentice, "Rehabilitation Techniques for Sports Medicine and Athletic
 * Training", ch. 8: MCP flexion 85-90, extension 30-45, abduction 20-30; PIP
 * flexion 100-115; DIP flexion 80-90, extension 20; thumb MCP flexion 50-55;
 * thumb IP flexion 85-90, extension 0-5) and the thumb carpometacarpal arcs of
 * Cooney, Lucca, Chao and Linscheid 1981 (J Bone Joint Surg Am 63:1371-1381:
 * flexion-extension 53, abduction- adduction 42, axial rotation 17 degrees),
 * with the carpometacarpal's retroposition behind the palm's plane at the low
 * end of the normal 25-38 degrees of Barakat, Field and Taylor 2013 (Hand
 * 8(2):179-182).
 *
 * Scenarios:
 *
 * 1. Every finger and thumb joint of both hands has the range its source gives.
 * 2. `victory` keeps a spread of at least 8 degrees between the forefinger's and
 *    the middle finger's knuckles after the clamp, and `crossed` keeps its
 *    cross (the two knuckles turned toward each other).
 * 3. A thumb carpometacarpal posture with palmar abduction and in-plane flexion
 *    inside the new range survives `AutoMovieEngineKinematics.clampPose` unchanged.
 * 4. Every working shape (`relaxed`, `flat`, `point`, `fist`) survives the clamp
 *    unchanged.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the engine's table and clamps hand shapes through `clampPose` on a generated body.
 * @evidence contracts/development/testing.md#independent-expectations The ranges are written from the cited sources; the emblems' and shapes' angles must survive a clamp that only removes motion outside the anatomy.
 * @evidence contracts/development/common.md#meaningful-documentation Both hands match authored joint ranges. A victory pose, a thumb posture and four working shapes exercise the clamp's retained anatomy.
 */
export function test_engine_finger_rom(): void {
  const range = (min: number, max: number): { min: number; max: number } => ({
    min,
    max,
  });
  const expected: Record<
    string,
    Pick<IAutoMovieJointConstraint, "flexion" | "abduction" | "twist">
  > = {
    Proximal: {
      flexion: range(-45, 90),
      abduction: range(-30, 30),
      twist: null,
    },
    Intermediate: { flexion: range(0, 115), abduction: null, twist: null },
    Distal: { flexion: range(-20, 90), abduction: null, twist: null },
    ThumbMetacarpal: {
      flexion: range(-25, 42),
      abduction: range(-26.5, 26.5),
      twist: range(-8.5, 8.5),
    },
    ThumbProximal: { flexion: range(0, 55), abduction: null, twist: null },
    ThumbDistal: { flexion: range(-5, 90), abduction: null, twist: null },
  };
  const wrong: string[] = [];
  for (const side of ["left", "right"])
    for (const digit of ["Thumb", "Index", "Middle", "Ring", "Little"])
      for (const segment of digit === "Thumb"
        ? ["Metacarpal", "Proximal", "Distal"]
        : ["Proximal", "Intermediate", "Distal"]) {
        const bone: AutoMovieHumanoidBone =
          `${side}${digit}${segment}` as AutoMovieHumanoidBone;
        const want = expected[digit === "Thumb" ? `Thumb${segment}` : segment]!;
        const have: IAutoMovieJointConstraint | undefined =
          AutoMovieEngineDefaultHumanoidRom[bone];
        const same = (
          a: { min: number; max: number } | null | undefined,
          b: { min: number; max: number } | null,
        ): boolean =>
          b === null
            ? a === null || a === undefined
            : a !== null &&
              a !== undefined &&
              a.min === b.min &&
              a.max === b.max;
        const twist = have?.swingTwist ? have.swingTwist.twist : have?.twist;
        if (
          !same(have?.flexion, want.flexion) ||
          !same(have?.abduction, want.abduction) ||
          !same(twist, want.twist)
        )
          wrong.push(bone);
      }
  TestValidator.equals(
    "every finger and thumb joint has its source's range",
    wrong,
    [],
  );

  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const clamped = (
    joints: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    >,
  ): Map<AutoMovieHumanoidBone, IAutoMovieJointPose> => {
    const pose: IAutoMoviePose = {
      skeleton: body.skeleton.id,
      root: null,
      joints: Object.entries(joints).map(
        ([bone, a]): IAutoMovieJointPose => ({
          bone: bone as AutoMovieHumanoidBone,
          flexion: a![0],
          abduction: a![1],
          twist: a![2],
        }),
      ),
    };
    return new Map(
      AutoMovieEngineKinematics.clampPose(pose, body.skeleton).joints.map(
        (
          j: IAutoMovieJointPose,
        ): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [j.bone, j],
      ),
    );
  };
  const victory = clamped(HumanHandShape.emblem("right", "victory"));
  const crossed = clamped(HumanHandShape.emblem("right", "crossed"));
  const spread = (m: Map<AutoMovieHumanoidBone, IAutoMovieJointPose>): number =>
    (m.get("rightMiddleProximal")!.abduction ?? 0) -
    (m.get("rightIndexProximal")!.abduction ?? 0);
  TestValidator.predicate(
    `victory keeps a spread of at least ${SPREAD} degrees (${spread(victory).toFixed(2)})`,
    Math.abs(spread(victory)) >= SPREAD,
  );
  TestValidator.predicate(
    `crossed keeps its cross (${spread(crossed).toFixed(2)})`,
    Math.sign(spread(crossed)) === -Math.sign(spread(victory)) &&
      Math.abs(spread(crossed)) > 0,
  );

  const saddle = clamped({ rightThumbMetacarpal: [30, 15, 0] }).get(
    "rightThumbMetacarpal",
  )!;
  TestValidator.predicate(
    "a thumb carpometacarpal posture inside the range survives the clamp",
    Math.abs((saddle.flexion ?? 0) - 30) <= 1e-6 &&
      Math.abs((saddle.abduction ?? 0) - 15) <= 1e-6 &&
      Math.abs(saddle.twist ?? 0) <= 1e-6,
  );

  const moved: string[] = [];
  for (const form of ["relaxed", "flat", "point", "fist"] as const) {
    const shape = HumanHandShape("right", form);
    const after = clamped(shape);
    for (const [bone, a] of Object.entries(shape)) {
      const j: IAutoMovieJointPose = after.get(bone as AutoMovieHumanoidBone)!;
      if (
        Math.abs((j.flexion ?? 0) - a![0]) > 1e-6 ||
        Math.abs((j.abduction ?? 0) - a![1]) > 1e-6
      )
        moved.push(`${form}:${bone}`);
    }
  }
  TestValidator.equals("every working shape survives the clamp", moved, []);
}
