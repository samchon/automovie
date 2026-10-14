import {
  DEFAULT_JOINT_AXES,
  HUMANOID_JOINT_AXES,
  type IAutoMovieResolvedBone,
  resolvePose,
  skeletonJointAxes,
} from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { bakeTimes, clipWorldParity } from "../internal/clipParity";
import { joint, keyframe, makeMotion, makePose } from "../internal/fixtures";
import { vclose } from "../internal/predicates";

/** Synthetic digit axes on the +X side: flexion about −Z carries +X to −Y. */
const PLUS_X_DIGIT: IAutoMovieJointAxes = {
  flexion: { x: 0, y: 0, z: -1 },
  abduction: { x: 0, y: -1, z: 0 },
  twist: { x: 1, y: 0, z: 0 },
};

/** The mirror of {@link PLUS_X_DIGIT} for a digit along −X: flexion about +Z. */
const MINUS_X_DIGIT: IAutoMovieJointAxes = {
  flexion: { x: 0, y: 0, z: 1 },
  abduction: { x: 0, y: 1, z: 0 },
  twist: { x: 1, y: 0, z: 0 },
};

/**
 * Pins that a bone's own declared axes decide what its clinical angles rotate
 * about in pose resolution and clip baking, ahead of the host's table.
 *
 * The rig is synthetic: identity rest rotations, a hand on each side along ±X,
 * and one digit bone per hand with a tip child 0.05 m further out. Its axes are
 * test inputs chosen so flexion turns each digit toward −Y, not measured
 * anatomy.
 *
 * Scenarios:
 *
 * 1. With declared axes, digit flexion 90 carries both tips 0.05 m straight
 *    down (−Y), on the +X and the −X side alike, with the humanoid table
 *    passed, without any table, and with a table whose own entry for the digit
 *    is the default basis.
 * 2. Without the declaration the same pose reads the table or the default
 *    basis, a roll about the digit's own X axis, and the tips do not move.
 * 3. `skeletonJointAxes` returns the host table itself when no bone declares
 *    axes and a frozen empty table when neither does, and puts each declared
 *    bone over the table's entry while keeping the others.
 * 4. A baked clip of a flexing motion reproduces the forward kinematics of the
 *    declared rig at every bake time.
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves poses on a rig with and without bone-declared axes and bakes a clip of it, asserting tip world positions and clip/FK parity; a resolver or baker that ignored the declaration, or let the host table win, moves the tips elsewhere or breaks parity.
 * @evidence contracts/testing.md#independent-expectations A 90-degree right-hand turn about −Z (+Z) carries +X (−X) to −Y, so each tip lands 0.05 m below its digit; an X-axis roll leaves an X-aligned tip in place. Clip parity compares two product paths and only shows they agree.
 * @evidence contracts/testing.md#distinguishing-cases Covers both mirrored sides, the declaration against the humanoid table, no table and a conflicting table entry, the undeclared negative, the identity and empty table returns and bake parity; malformed declared axes belong to the model validation entry and inverse solvers keep their own entries.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous kinematics unit entry that builds its own in-memory rig and calls engine source without a viewer, GPU or installed asset.
 */
export function test_kinematics_bone_declared_axes(): void {
  const declared: IAutoMovieSkeleton = rig(true);
  const undeclared: IAutoMovieSkeleton = rig(false);
  const curl: IAutoMoviePose = makePose([
    joint("leftIndexProximal", { flexion: 90 }),
    joint("rightIndexProximal", { flexion: 90 }),
  ]);

  // 1. the declaration flexes both digits toward −Y
  const conflicting: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>
  > = { ...HUMANOID_JOINT_AXES, leftIndexProximal: DEFAULT_JOINT_AXES };
  for (const [label, table] of [
    ["humanoid table", HUMANOID_JOINT_AXES],
    ["no table", undefined],
    ["conflicting table", conflicting],
  ] as const) {
    TestValidator.predicate(
      `left tip curls down with ${label}`,
      vclose(
        at(curl, declared, "leftIndexIntermediate", table),
        { x: 0.6, y: 0.95, z: 0 },
        1e-9,
      ),
    );
    TestValidator.predicate(
      `right tip curls down with ${label}`,
      vclose(
        at(curl, declared, "rightIndexIntermediate", table),
        { x: -0.6, y: 0.95, z: 0 },
        1e-9,
      ),
    );
  }

  // 2. without it the X-axis roll leaves the tips in place
  TestValidator.predicate(
    "undeclared left tip stays put",
    vclose(
      at(curl, undeclared, "leftIndexIntermediate", HUMANOID_JOINT_AXES),
      { x: 0.65, y: 1, z: 0 },
      1e-9,
    ),
  );
  TestValidator.predicate(
    "undeclared right tip stays put",
    vclose(
      at(curl, undeclared, "rightIndexIntermediate", undefined),
      { x: -0.65, y: 1, z: 0 },
      1e-9,
    ),
  );

  // 3. the precedence table
  TestValidator.equals(
    "no declaration returns the host table itself",
    skeletonJointAxes(undeclared, HUMANOID_JOINT_AXES) === HUMANOID_JOINT_AXES,
    true,
  );
  TestValidator.equals(
    "no declaration and no table is empty and frozen",
    [
      Object.keys(skeletonJointAxes(undeclared)).length,
      Object.isFrozen(skeletonJointAxes(undeclared)),
    ],
    [0, true],
  );
  const merged: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
    skeletonJointAxes(declared, conflicting);
  TestValidator.equals(
    "declared bones replace the table entry and the rest are kept",
    [
      merged.leftIndexProximal === declared.bones[2]!.axes,
      merged.rightIndexProximal === declared.bones[5]!.axes,
      merged.leftUpperArm === HUMANOID_JOINT_AXES.leftUpperArm,
      conflicting.leftIndexProximal === DEFAULT_JOINT_AXES,
    ],
    [true, true, true, true],
  );

  // 4. the baked clip agrees with the declared FK
  const motion: IAutoMovieMotion = makeMotion(
    [keyframe(0, makePose([])), keyframe(1, curl)],
    1,
  );
  TestValidator.predicate(
    "a baked clip reproduces the declared rig's FK",
    clipWorldParity({
      motion,
      skeleton: declared,
      times: bakeTimes(1),
      jointAxes: HUMANOID_JOINT_AXES,
    }),
  );
}

/** A hips root, a hand on each side and one digit with a tip per hand. */
function rig(declare: boolean): IAutoMovieSkeleton {
  const bone: (
    name: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    x: number,
    y: number,
    axes?: IAutoMovieJointAxes,
  ) => IAutoMovieBone = (
    name: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    x: number,
    y: number,
    axes?: IAutoMovieJointAxes,
  ): IAutoMovieBone => ({
    bone: name,
    parent,
    rest: {
      translation: { x, y, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    constraint: null,
    ...(declare && axes !== undefined ? { axes } : {}),
  });
  return {
    id: "skeleton-1",
    bones: [
      bone("hips", null, 0, 1),
      bone("leftHand", "hips", 0.5, 0),
      bone("leftIndexProximal", "leftHand", 0.1, 0, PLUS_X_DIGIT),
      bone("leftIndexIntermediate", "leftIndexProximal", 0.05, 0),
      bone("rightHand", "hips", -0.5, 0),
      bone("rightIndexProximal", "rightHand", -0.1, 0, MINUS_X_DIGIT),
      bone("rightIndexIntermediate", "rightIndexProximal", -0.05, 0),
    ],
  };
}

/** World position of `name` when `pose` is resolved against `skeleton`. */
function at(
  pose: IAutoMoviePose,
  skeleton: IAutoMovieSkeleton,
  name: AutoMovieHumanoidBone,
  table:
    | Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
    | undefined,
): IAutoMovieVector3 {
  return resolvePose(pose, skeleton, table).find(
    (bone: IAutoMovieResolvedBone): boolean => bone.bone === name,
  )!.worldPosition;
}
