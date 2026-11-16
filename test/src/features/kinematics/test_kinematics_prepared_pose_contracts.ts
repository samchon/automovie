import {
  type IAutoMovieResolvedBone,
  preparePoseResolution,
  prepareSkeletonPoseResolution,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../internal/createSkeleton";
import { joint } from "../internal/joint";
import { makePose } from "../internal/makePose";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

/**
 * A prepared rig resolves a static snapshot while admitting every current
 * authored joint and returning only the requested rooted subtree readings.
 *
 * Scenarios:
 * 1. The conventional rig's chest Y90 sends its left hand's 0.75 metre
 *    horizontal offset to minus Z. A later root translation moves every
 *    requested result, while an arm change leaves the opposite arm unchanged.
 * 2. Rest offsets, axes and hierarchy edited after preparation leave the
 *    earlier rig snapshot intact; a newly prepared rig reads the new offset.
 * 3. Raw requested FK computes a hand's ancestor closure, omitting the opposite
 *    branch. Empty demand performs no bone composition. Joint admission still
 *    visits duplicate and stray records in authored order and refuses NaN.
 * 4. Earlier records and nested transforms remain caller-owned across replay,
 *    output mutation, changed input joints and a second operation reader.
 * 5. A fixed-source pose reader snapshots baseline joints/root once. Ordered
 *    current edits can change a parent, while an omitted edit restores the
 *    baseline; an overwritten invalid edit still refuses even at empty demand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States static-rig and fixed-pose snapshot ownership, metre coordinates, ordered current-joint/edit admission, requested ancestor closure and fresh result ownership in five scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public prepared and raw requested FK with changing pose/root/static inputs and demand sets. Actual returned coordinates detect stale transforms; an owned rest getter observes snapshot isolation, and an owned raw-operation reader observes ordered admission and demanded compositions without replacing a library function.
 * @evidence contracts/development/testing.md#independent-expectations Right-hand Y90 maps plus X to minus Z; literal rest offsets sum to left-hand (0.75,1.4,0) and right-lower-arm (-0.5,1.4,0). Requested hand ancestry follows the explicitly authored parent graph. These are geometric and dependency expectations, not cold/prepared parity or output snapshots.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers rest, nonidentity ancestor, changed root and one arm, static input mutation versus fresh preparation, empty/single/two-branch demand, duplicate and stray authored joints, nonfinite admission, output mutation and separate operation lifetimes. Unreachable topology and general inverse kinematics remain separately owned.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable unit owns all skeletons, poses, demand sets and the observational reader. It invokes no host, viewer, capture, compiler or foreign function replacement; the structural count measures requested bone composition calls rather than hidden floating-point operations.
 */
export function test_kinematics_prepared_pose_contracts(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const hand: IAutoMovieBone = skeleton.bones.find(
    (bone: IAutoMovieBone): boolean => bone.bone === "leftHand",
  )!;
  let restReads: number = 0;
  let handOffset: number = 0.25;
  hand.rest.translation = {
    /** Observe accesses to this test-owned static input. */
    get x(): number { restReads++; return handOffset; },
    /** Keep source edits observable separately from snapshot reads. */
    set x(value: number) { handOffset = value; },
    y: 0,
    z: 0,
  };
  const axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> = {
    chest: {
      flexion: { x: 1, y: 0, z: 0 },
      abduction: { x: 0, y: 0, z: 1 },
      twist: { x: 0, y: 1, z: 0 },
    },
  };
  const prepared: ReturnType<typeof prepareSkeletonPoseResolution> =
    prepareSkeletonPoseResolution(skeleton, axes, {});
  const preparedReads: number = restReads;
  TestValidator.predicate("preparation reads the static offset", preparedReads > 0);
  const operation: ReturnType<typeof preparePoseResolution> =
    preparePoseResolution();
  const pose: IAutoMoviePose = makePose([joint("chest", { twist: 90 })]);
  const both: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftHand",
    "rightLowerArm",
  ]);
  const first: IAutoMovieResolvedBone[] = prepared.resolve(pose, operation, both);
  TestValidator.equals(
    "requested readings retain parent-first traversal order",
    first.map((bone: IAutoMovieResolvedBone): AutoMovieHumanoidBone => bone.bone),
    ["leftHand", "rightLowerArm"],
  );
  check("quarter-turned hand", first, "leftHand", { x: 0, y: 1.4, z: -0.75 });
  check("quarter-turned opposite arm", first, "rightLowerArm", {
    x: 0,
    y: 1.4,
    z: 0.5,
  });

  pose.root = {
    translation: { x: 2, y: -1, z: 3 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const moved: IAutoMovieResolvedBone[] = prepared.resolve(pose, operation, both);
  check("changed root invalidates hand ancestors", moved, "leftHand", {
    x: 2,
    y: 0.4,
    z: 2.25,
  });
  check("changed root invalidates opposite ancestors", moved, "rightLowerArm", {
    x: 2,
    y: 0.4,
    z: 3.5,
  });
  pose.joints.push(joint("leftUpperArm", { abduction: 90 }));
  const bent: IAutoMovieResolvedBone[] = prepared.resolve(pose, operation, both);
  check("changed arm rotates its descendants", bent, "leftHand", {
    x: 2,
    y: 0.95,
    z: 2.8,
  });
  check("changed arm preserves opposite branch", bent, "rightLowerArm", {
    x: 2,
    y: 0.4,
    z: 3.5,
  });

  hand.rest.translation.x = 1;
  axes.chest!.twist = { x: 1, y: 0, z: 0 };
  skeleton.bones.reverse();
  check("prepared static rig ignores later mutations", prepared.resolve(
    makePose([]), operation, new Set(["leftHand"]),
  ), "leftHand", { x: 0.75, y: 1.4, z: 0 });
  TestValidator.equals("prepared queries do not reread raw static transforms",
    restReads, preparedReads,
  );
  const rebuilt: ReturnType<typeof prepareSkeletonPoseResolution> =
    prepareSkeletonPoseResolution(skeleton, {}, {});
  check("new preparation owns the edited rest offset", rebuilt.resolve(
    makePose([]), undefined, new Set(["leftHand"]),
  ), "leftHand", { x: 1.5, y: 1.4, z: 0 });

  const boneCalls: AutoMovieHumanoidBone[] = [];
  const jointCalls: AutoMovieHumanoidBone[] = [];
  const reader: ReturnType<typeof preparePoseResolution> = {
    joint: (
      input: IAutoMovieJointPose,
      basis: Parameters<typeof operation.joint>[1],
      frame: Parameters<typeof operation.joint>[2],
    ): IAutoMovieQuaternion => {
      jointCalls.push(input.bone);
      return operation.joint(input, basis, frame);
    },
    bone: (
      input: IAutoMovieBone,
      rotation: IAutoMovieQuaternion,
      position: IAutoMovieVector3,
      articulation: IAutoMovieQuaternion,
    ): IAutoMovieResolvedBone => {
      boneCalls.push(input.bone);
      return operation.bone(input, rotation, position, articulation);
    },
  };
  const authored: IAutoMoviePose = makePose([
    joint("chest", { twist: 0 }),
    joint("rightFoot", { flexion: 5 }),
    joint("chest", { twist: 90 }),
  ]);
  const raw: IAutoMovieSkeleton = createSkeleton();
  resolvePose(authored, raw, undefined, {}, undefined, reader, new Set(["leftHand"]));
  TestValidator.equals("only requested ancestors compose", boneCalls, [
    "hips", "spine", "chest", "leftUpperArm", "leftLowerArm", "leftHand",
  ]);
  TestValidator.equals("every authored record is admitted", jointCalls, [
    "chest", "rightFoot", "chest",
  ]);
  boneCalls.length = 0;
  jointCalls.length = 0;
  TestValidator.equals("empty demand returns no readings", resolvePose(
    authored, raw, undefined, {}, undefined, reader, new Set(),
  ), []);
  TestValidator.equals("empty demand performs no composition", boneCalls, []);
  TestValidator.equals("empty demand keeps admission", jointCalls, [
    "chest", "rightFoot", "chest",
  ]);
  authored.joints[0]!.twist = NaN;
  TestValidator.predicate("overwritten invalid authored angle still refuses",
    throwsError((): IAutoMovieResolvedBone[] => prepared.resolve(
      authored, reader, new Set(),
    )),
  );

  const earlier: IAutoMovieResolvedBone = first[0]!;
  earlier.worldPosition.x = 123;
  earlier.worldRotation.w = 456;
  earlier.localRotation.w = 789;
  const replay: IAutoMovieResolvedBone[] = prepared.resolve(
    makePose([joint("chest", { twist: 90 })]), operation, both,
  );
  check("mutated output cannot poison prepared replay", replay, "leftHand", {
    x: 0, y: 1.4, z: -0.75,
  });
  TestValidator.predicate("earlier nested output remains caller owned",
    earlier.worldPosition.x === 123 && earlier.worldRotation.w === 456 &&
    earlier.localRotation.w === 789 && replay[0] !== earlier &&
    replay[0]!.worldPosition !== earlier.worldPosition &&
    replay[0]!.worldRotation !== earlier.worldRotation &&
    replay[0]!.localRotation !== earlier.localRotation,
  );
  check("new operation shares no mutable result", prepared.resolve(
    makePose([]), preparePoseResolution(), new Set(["leftHand"]),
  ), "leftHand", { x: 0.75, y: 1.4, z: 0 });

  const baseline: IAutoMoviePose = makePose([joint("chest", { twist: 90 })], {
    translation: { x: 1, y: 2, z: 3 },
    rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 },
  });
  const fixed: ReturnType<typeof prepared.preparePose> = prepared.preparePose(baseline);
  baseline.root!.translation.x = 99;
  baseline.joints[0]!.twist = 0;
  check("fixed pose snapshots its original joint and root", fixed.resolve(
    [], new Set(["leftHand"]),
  ), "leftHand", { x: 1, y: 3.4, z: 2.25 });
  check("current edit changes every demanded descendant", fixed.resolve(
    [joint("chest", { twist: 0 })], new Set(["leftHand"]),
  ), "leftHand", { x: 1.75, y: 3.4, z: 3 });
  check("absent edit restores the fixed baseline", fixed.resolve(
    [], new Set(["leftHand"]),
  ), "leftHand", { x: 1, y: 3.4, z: 2.25 });
  TestValidator.predicate("fixed pose still admits every ordered edit before demand",
    throwsError((): IAutoMovieResolvedBone[] => fixed.resolve([
      joint("chest", { twist: NaN }), joint("chest", { twist: 0 }),
    ], new Set())),
  );
  check("failed edit cannot poison fixed baseline recovery", fixed.resolve(
    [], new Set(["leftHand"]),
  ), "leftHand", { x: 1, y: 3.4, z: 2.25 });
}

/** Check hand-derived world positions and finite unit world rotations. */
function check(
  label: string,
  readings: readonly IAutoMovieResolvedBone[],
  name: AutoMovieHumanoidBone,
  expected: IAutoMovieVector3,
): void {
  const reading: IAutoMovieResolvedBone | undefined = readings.find(
    (bone: IAutoMovieResolvedBone): boolean => bone.bone === name,
  );
  TestValidator.predicate(label, reading !== undefined &&
    vclose(reading.worldPosition, expected, 1e-12) &&
    Math.abs(Math.hypot(reading.worldRotation.x, reading.worldRotation.y,
      reading.worldRotation.z, reading.worldRotation.w) - 1) <= 1e-12,
  );
}
