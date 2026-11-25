import { impactRecoil, validatePoseResult } from "@automovie/engine";
import type {
  IAutoMovieBone,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";

/** Rounding of a clamped angle, degrees. */
const ROUNDING: number = 1e-9;

/** The identity rest transform. */
const REST: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

/** A bone at rest under a parent, with its own range or the humanoid one. */
function bone(
  name: IAutoMovieBone["bone"],
  parent: IAutoMovieBone["parent"],
  constraint: IAutoMovieBone["constraint"] = null,
): IAutoMovieBone {
  return { bone: name, parent, rest: REST, constraint };
}

/** Whether an angle is a number within rounding of another. */
function near(angle: number | null | undefined, expected: number): boolean {
  return (
    angle !== null &&
    angle !== undefined &&
    Math.abs(angle - expected) <= ROUNDING
  );
}

/**
 * `impactRecoil` spreads a push down a bone chain, attenuated by `falloff` per
 * link, each joint yielding only within its range of motion; an axis the push
 * leaves untouched stays at rest (`null`), even where the range excludes 0, and
 * every result passes the ordinary pose validator.
 *
 * Scenarios:
 *
 * 1. A flexion push of 10 down `spine` and `chest`: falloff 0 moves only the
 *    spine, falloff 1 both; a falloff of Infinity, -0.1 or 1.1 is refused.
 * 2. Over a spine ranged flexion -30 to 40 and abduction ±15, a push of (200, 100,
 *    10) clamps the spine to (40, 15, 10) and the humanoid chest to its own 40
 *    and 25; a push of -200 clamps to -30; a bone the skeleton lacks is
 *    unclamped.
 * 3. A humanoid elbow's immobile abduction is forced to 0, and a hip's (120, 45)
 *    is pulled inside its swing cone.
 * 4. Over an elbow ranged flexion 10 to 145 and abduction 5 to 30 with no twist, a
 *    twist push leaves flexion and abduction at rest and forces the twist to 0;
 *    an explicit zero push rests too; (200, 1) clamps to (145, 5); a falloff of
 *    0 leaves the next link at rest, not at its minimum.
 */
export function test_unit_engine_physics_impact_recoil(): void {
  // 1. The falloff.
  const chain: IAutoMovieSkeleton = {
    id: "falloff-rig",
    bones: [bone("spine", null), bone("chest", "spine")],
  };
  const stopped = impactRecoil({ flexion: 10 }, ["spine", "chest"], chain, 0);
  const kept = impactRecoil({ flexion: 10 }, ["spine", "chest"], chain, 1);
  TestValidator.equals(
    "the falloff",
    [
      stopped.joints[0]!.flexion,
      stopped.joints[1]!.flexion,
      kept.joints[0]!.flexion,
      kept.joints[1]!.flexion,
    ],
    [10, null, 10, 10],
  );
  for (const falloff of [Infinity, -0.1, 1.1])
    TestValidator.predicate(
      `falloff ${falloff}`,
      throwsError(() =>
        impactRecoil({ flexion: 10 }, ["spine", "chest"], chain, falloff),
      ),
    );

  // 2. Clamped to the range.
  const ranged: IAutoMovieSkeleton = {
    id: "recoil-rig",
    bones: [
      bone("spine", null, {
        flexion: { min: -30, max: 40 },
        abduction: { min: -15, max: 15 },
        twist: { min: -20, max: 20 },
      }),
      bone("chest", "spine"),
    ],
  };
  const pose = impactRecoil(
    { flexion: 200, abduction: 100, twist: 10 },
    ["spine", "chest"],
    ranged,
    0.6,
  );
  const [spine, chest] = pose.joints;
  TestValidator.predicate(
    "clamped to the range",
    near(spine!.flexion, 40) &&
      near(spine!.abduction, 15) &&
      near(spine!.twist, 10) &&
      near(chest!.flexion, 40) &&
      near(chest!.abduction, 25) &&
      near(
        impactRecoil({ flexion: -200 }, ["spine"], ranged, 1).joints[0]!
          .flexion,
        -30,
      ) &&
      near(
        impactRecoil({ abduction: 15 }, ["leftHand"], ranged, 0.6).joints[0]!
          .abduction,
        15,
      ),
  );
  TestValidator.equals("valid", validatePoseResult(pose, ranged), {
    success: true,
  });

  // 3. The humanoid elbow and hip.
  const elbowRig: IAutoMovieSkeleton = {
    id: "elbow-rig",
    bones: [bone("leftLowerArm", null)],
  };
  const elbow = impactRecoil({ abduction: 8 }, ["leftLowerArm"], elbowRig, 1);
  const hipRig: IAutoMovieSkeleton = {
    id: "hip-rig",
    bones: [bone("leftUpperLeg", null)],
  };
  const hip = impactRecoil(
    { flexion: 120, abduction: 45 },
    ["leftUpperLeg"],
    hipRig,
    1,
  );
  TestValidator.predicate(
    "the elbow and the hip",
    near(elbow.joints[0]!.abduction, 0) &&
      hip.joints[0]!.flexion! < 120 &&
      hip.joints[0]!.abduction! < 45,
  );
  TestValidator.equals(
    "both valid",
    [validatePoseResult(elbow, elbowRig), validatePoseResult(hip, hipRig)],
    [{ success: true }, { success: true }],
  );

  // 4. Axes at rest.
  const stiff: IAutoMovieSkeleton = {
    id: "stiff-rig",
    bones: [
      bone("leftLowerArm", null, {
        flexion: { min: 10, max: 145 },
        abduction: { min: 5, max: 30 },
        twist: null,
      }),
      bone("leftHand", "leftLowerArm", {
        flexion: { min: 10, max: 90 },
        abduction: null,
        twist: null,
      }),
    ],
  };
  const twisted = impactRecoil({ twist: 8 }, ["leftLowerArm"], stiff, 1);
  const zero = impactRecoil({ flexion: 0 }, ["leftLowerArm"], stiff, 1);
  const pushed = impactRecoil(
    { flexion: 200, abduction: 1 },
    ["leftLowerArm"],
    stiff,
    1,
  );
  const downstream = impactRecoil(
    { flexion: 50 },
    ["leftLowerArm", "leftHand"],
    stiff,
    0,
  );
  TestValidator.equals(
    "at rest",
    [
      twisted.joints[0]!.flexion,
      twisted.joints[0]!.abduction,
      zero.joints[0]!.flexion,
      downstream.joints[1]!.flexion,
    ],
    [null, null, null, null],
  );
  TestValidator.predicate(
    "the pushed axes",
    near(twisted.joints[0]!.twist, 0) &&
      near(pushed.joints[0]!.flexion, 145) &&
      near(pushed.joints[0]!.abduction, 5) &&
      near(downstream.joints[0]!.flexion, 50),
  );
  TestValidator.equals(
    "all valid",
    [twisted, zero, pushed, downstream].map((p) =>
      validatePoseResult(p, stiff),
    ),
    [
      { success: true },
      { success: true },
      { success: true },
      { success: true },
    ],
  );
}
