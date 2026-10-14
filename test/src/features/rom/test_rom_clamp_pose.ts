import { clampJointRom, clampPose } from "@automovie/engine";
import {
  IAutoMovieBone,
  IAutoMovieJointConstraint,
  type IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  type IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

const REST: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};
const bone: (
  name: IAutoMovieBone["bone"],
  constraint: IAutoMovieJointConstraint | null,
) => IAutoMovieBone = (
  name: IAutoMovieBone["bone"],
  constraint: IAutoMovieJointConstraint | null,
): IAutoMovieBone => ({ bone: name, parent: null, rest: REST, constraint });

// leftLowerArm carries an explicit override; leftUpperArm falls back to the
// default table; hips has no constraint anywhere (pass-through).
const SKELETON: IAutoMovieSkeleton = {
  id: "s",
  bones: [
    bone("leftLowerArm", {
      flexion: { min: 0, max: 90 },
      abduction: null,
      twist: null,
    }),
    bone("leftUpperArm", null),
    bone("hips", null),
  ],
};

/**
 * Clamp joint angles into intervals, force immobile axes to zero and preserve unconstrained values. These engine interval examples do not prove skeleton membership, arbitrary cone projection or clinical suitability of the default table.
 *
 * Scenarios:
 *
 * 1. Per-bone override: leftLowerArm flexion 120 → 90 (above max), its `null`
 *    abduction 30 → 0 (immobile axis), its `null`-angle twist stays `null`.
 * 2. Default-table fallback: leftUpperArm flexion −200 → −60 (below min), and its
 *    in-range abduction 50 is left untouched.
 * 3. Bone not in the skeleton resolves to the default table (rightLowerArm flexion
 *    200 → 150).
 * 4. A bone with no constraint anywhere (hips) passes through unchanged, and the
 *    root transform is preserved.
 * 5. Non-finite constrained-axis values are neutralized before range clamping, so
 *    the clamp output remains finite.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs clampJointRom/clampPose and observes override/default/unconstrained values, null preservation, root preservation and neutral repair of specified nonfinite angles.
 * @evidence contracts/testing.md#independent-expectations The authored elbow override caps120 at90 and immobile abduction at0; current engine defaults supply shoulder min-60 and elbow max150, while null remains rest. These defaults are API conventions, not independently sourced clinical norms.
 * @evidence contracts/testing.md#distinguishing-cases Override/default/absent-bone/unconstrained paths, in-range/null axes, borrowed root and NaN/Infinity repair contrast projection with preservation; coupled cone behavior and broad fixed-point sweeps have separate tests.
 * @evidence contracts/testing.md#execution-ownership The named test_rom_clamp_pose entry directly executes portable synchronous angular projection on existing records, without new Human assets, live inspection or physiological validation.
 */
export function test_rom_clamp_pose(): void {
  const pose: IAutoMoviePose = {
    skeleton: "s",
    root: REST,
    joints: [
      { bone: "leftLowerArm", flexion: 120, abduction: 30, twist: null },
      { bone: "leftUpperArm", flexion: -200, abduction: 50, twist: 0 },
      { bone: "rightLowerArm", flexion: 200, abduction: null, twist: null },
      { bone: "hips", flexion: 999, abduction: null, twist: null },
    ],
  };
  const out: IAutoMoviePose = clampPose(pose, SKELETON);
  const byBone: (b: string) => IAutoMovieJointPose = (
    b: string,
  ): IAutoMovieJointPose =>
    out.joints.find((j: IAutoMovieJointPose): boolean => j.bone === b)!;

  // 1. override
  TestValidator.predicate(
    "flexion clamped to override max",
    nclose(byBone("leftLowerArm").flexion!, 90, 0),
  );
  TestValidator.predicate(
    "immobile abduction → 0",
    nclose(byBone("leftLowerArm").abduction!, 0, 0),
  );
  TestValidator.equals(
    "null twist stays null",
    byBone("leftLowerArm").twist,
    null,
  );

  // 2. default-table fallback
  TestValidator.predicate(
    "flexion clamped to table min",
    nclose(byBone("leftUpperArm").flexion!, -60, 0),
  );
  TestValidator.predicate(
    "in-range abduction untouched",
    nclose(byBone("leftUpperArm").abduction!, 50, 0),
  );

  // 3. bone absent from the skeleton → default table
  TestValidator.predicate(
    "absent bone uses table",
    nclose(byBone("rightLowerArm").flexion!, 150, 0),
  );

  // 4. unconstrained bone passes through; root preserved
  TestValidator.predicate(
    "unconstrained passes through",
    nclose(byBone("hips").flexion!, 999, 0),
  );
  TestValidator.predicate(
    "root preserved",
    out.root !== null &&
      vclose(out.root.translation, REST.translation, 0) &&
      vclose(out.root.scale, REST.scale, 0) &&
      nclose(out.root.rotation.x, REST.rotation.x, 0) &&
      nclose(out.root.rotation.y, REST.rotation.y, 0) &&
      nclose(out.root.rotation.z, REST.rotation.z, 0) &&
      nclose(out.root.rotation.w, REST.rotation.w, 0),
  );

  // 5. non-finite constrained axes are sanitized before clamping
  const sanitizedJoint: IAutoMovieJointPose = clampJointRom(
    {
      bone: "leftLowerArm",
      flexion: Number.NaN,
      abduction: null,
      twist: null,
    },
    SKELETON.bones[0]!.constraint!,
  );
  TestValidator.predicate(
    "NaN flexion neutralizes to rest",
    nclose(sanitizedJoint.flexion!, 0, 0),
  );

  const sanitizedPose: IAutoMoviePose = clampPose(
    {
      skeleton: "s",
      root: REST,
      joints: [
        {
          bone: "leftUpperArm",
          flexion: Number.NaN,
          abduction: Number.POSITIVE_INFINITY,
          twist: 0,
        },
      ],
    },
    SKELETON,
  );
  const sanitizedArm: IAutoMovieJointPose = sanitizedPose.joints[0]!;
  TestValidator.predicate(
    "pose NaN flexion neutralizes to rest",
    nclose(sanitizedArm.flexion!, 0, 0),
  );
  TestValidator.predicate(
    "pose infinite abduction neutralizes to rest",
    nclose(sanitizedArm.abduction!, 0, 0),
  );
  TestValidator.equals(
    "pose clamp output axes are finite",
    namedFacts([
      [
        "isFiniteSanitizedArmFlexion",
        (): boolean => Number.isFinite(sanitizedArm.flexion),
      ],
      [
        "isFiniteSanitizedArmAbduction",
        (): boolean => Number.isFinite(sanitizedArm.abduction),
      ],
      [
        "isFiniteSanitizedArmTwist",
        (): boolean => Number.isFinite(sanitizedArm.twist),
      ],
    ]),
    {
      isFiniteSanitizedArmFlexion: true,
      isFiniteSanitizedArmAbduction: true,
      isFiniteSanitizedArmTwist: true,
    },
  );
}
