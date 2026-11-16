import {
  type IAutoMovieResolvedBone,
  type IAutoMovieRestFrame,
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
import { qclose } from "../internal/qclose";
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
 * 6. A prepared bone demand and fixed pose's bound demand copy membership.
 *    Later source-set edits affect ordinary live queries and explicit query
 *    overrides while leaving both bound demand readers unchanged.
 * 7. A null clinical coordinate cannot certify its unused malformed affine
 *    frame. Its first nonnull use still refuses before a later nonfinite
 *    coordinate, and failed admission leaves null-axis recovery valid.
 * 8. A public prepared joint read uses the same immutable clinical convention
 *    before/after pose reads, but returns fresh quaternions and reads every
 *    current angle. It never certifies a later pose's other authored records.
 * 9. Typed inherited axis and non-enumerable affine mappings retain direct
 *    lookup semantics and snapshot isolation. An own undefined shadow and
 *    an unrelated bone override preserve the original default/spread rules.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States static-rig/fixed-pose snapshots, metre coordinates, ordered admission, effective inherited/hidden mapping lookup and shadow/override rules, demanded ancestors, bound/live membership, individual/full-pose admission and fresh ownership in nine scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public prepared and raw requested FK with changing pose/root/static inputs and demand sets. Actual returned coordinates detect stale transforms; an owned rest getter observes snapshot isolation, and an owned raw-operation reader observes ordered admission and demanded compositions without replacing a library function.
 * @evidence contracts/development/testing.md#independent-expectations Right-hand Y90 maps plus X to minus Z; Z90 maps it to plus Y, raising the hand0.75m above its1.4m chest to2.15m. Literal rest offsets sum to left-hand(0.75,1.4,0) and right-lower-arm(-0.5,1.4,0). Requested ancestry follows the authored graph. Direct property lookup keeps inherited/non-enumerable values and own undefined shadows; the existing skeleton-axis spread discards inherited entries when a bone overrides. These are geometric/dependency expectations, not output snapshots.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers rest/rotated ancestors, root/arm edits, rig/pose snapshots, fixed-edit restoration, bound/live demand mutation, empty/single/two-branch demand, duplicate/stray admission, output mutation, individual-row admission and inherited/hidden/undefined-shadow/override mapping lifetimes. Unreachable topology/general IK remain separately owned.
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

  const demanded: Set<AutoMovieHumanoidBone> = new Set(["leftHand"]);
  const bound: ReturnType<typeof prepared.prepareBones> = prepared.prepareBones(demanded);
  const fixedDemand: ReturnType<typeof prepared.preparePose> = prepared.preparePose(
    makePose([joint("chest", { twist: 90 })]), demanded,
  );
  demanded.clear();
  demanded.add("rightLowerArm");
  TestValidator.equals("prepared demand owns original membership", bound.resolve(makePose([])).map(
    (value: IAutoMovieResolvedBone): AutoMovieHumanoidBone => value.bone,
  ), ["leftHand"]);
  TestValidator.equals("ordinary demand reads current membership", prepared.resolve(makePose([]), undefined, demanded).map(
    (value: IAutoMovieResolvedBone): AutoMovieHumanoidBone => value.bone,
  ), ["rightLowerArm"]);
  check("fixed pose bound demand keeps its original requested hand", fixedDemand.resolve([]),
    "leftHand", { x: 0, y: 1.4, z: -0.75 },
  );
  check("an explicit fixed-pose demand override stays live", fixedDemand.resolve([], demanded),
    "rightLowerArm", { x: 0, y: 1.4, z: 0.5 },
  );

  const nullable: ReturnType<typeof prepareSkeletonPoseResolution> = prepareSkeletonPoseResolution(
    createSkeleton(), {}, { chest: { flexion: { sign: 1, neutral: NaN } } },
  );
  const nullOperation: ReturnType<typeof preparePoseResolution> = preparePoseResolution();
  nullable.resolve(makePose([joint("chest", { flexion: null, abduction: 0 })]), nullOperation, new Set());
  TestValidator.predicate("null history cannot certify the first actual malformed affine-frame use",
    throwsError((): IAutoMovieResolvedBone[] => nullable.resolve(makePose([
      joint("chest", { flexion: 0, abduction: NaN }),
    ]), nullOperation, new Set()), "rest frame neutral"),
  );
  TestValidator.predicate("an unused bad frame leaves the later actual coordinate's own refusal",
    throwsError((): IAutoMovieResolvedBone[] => nullable.resolve(makePose([
      joint("chest", { flexion: null, abduction: NaN }),
    ]), nullOperation, new Set()), "jointToQuaternion abduction"),
  );
  TestValidator.equals("failed frame admission preserves valid null-coordinate recovery",
    nullable.resolve(makePose([joint("chest", { flexion: null, abduction: 0 })]), nullOperation, new Set()), [],
  );

  const currentJoint: IAutoMovieJointPose = joint("chest", { twist: 90 });
  const local: IAutoMovieQuaternion = prepared.joint(currentJoint, operation);
  const quarter: IAutoMovieQuaternion = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };
  TestValidator.predicate("a prepared joint uses its snapshotted clinical axis convention",
    qclose(local, quarter, 1e-12),
  );
  local.y = 123;
  currentJoint.twist = 0;
  const restJoint: IAutoMovieQuaternion = prepared.joint(currentJoint, operation);
  TestValidator.predicate("current joint coordinates and output ownership remain independent",
    qclose(restJoint, { x: 0, y: 0, z: 0, w: 1 }, 1e-12) && restJoint !== local && local.y === 123,
  );
  check("joint admission cannot leave an old world transform behind", prepared.resolve(
    makePose([currentJoint]), operation, new Set(["leftHand"]),
  ), "leftHand", { x: 0.75, y: 1.4, z: 0 });
  currentJoint.twist = 90;
  prepared.resolve(makePose([currentJoint]), operation, new Set(["leftHand"]));
  TestValidator.predicate("pose followed by a joint read retains the actual local rotation",
    qclose(prepared.joint(currentJoint, operation), quarter, 1e-12),
  );
  currentJoint.twist = NaN;
  TestValidator.predicate("individual prepared joint reads still admit each current coordinate",
    throwsError((): IAutoMovieQuaternion => prepared.joint(currentJoint, operation), "finite"),
  );
  currentJoint.twist = 0;
  prepared.joint(currentJoint, operation);
  TestValidator.predicate("an admitted individual row never certifies a later full authored scan",
    throwsError((): IAutoMovieResolvedBone[] => prepared.resolve(makePose([
      joint("chest", { twist: NaN }), currentJoint,
    ]), operation, new Set()), "finite"),
  );

  const mappingSkeleton: IAutoMovieSkeleton = createSkeleton();
  const zTwist: IAutoMovieJointAxes = {
    flexion: { x: 1, y: 0, z: 0 }, abduction: { x: 0, y: 1, z: 0 }, twist: { x: 0, y: 0, z: 1 },
  };
  const parentAxes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> = { chest: zTwist };
  const inherited: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> = Object.create(parentAxes);
  const affine: IAutoMovieRestFrame = { twist: { sign: -1, neutral: 10 } };
  const hidden: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>> = {};
  Object.defineProperty(hidden, "chest", { value: affine, enumerable: false });
  const mapped: ReturnType<typeof prepareSkeletonPoseResolution> = prepareSkeletonPoseResolution(
    mappingSkeleton, inherited, hidden,
  );
  const mappedPose: IAutoMoviePose = makePose([joint("chest", { twist: -80 })]);
  check("inherited axes and hidden affine frame retain literal Z90 geometry",
    mapped.resolve(mappedPose, undefined, new Set(["leftHand"])), "leftHand", { x: 0, y: 2.15, z: 0 });
  parentAxes.chest = {
    flexion: { x: 1, y: 0, z: 0 }, abduction: { x: 0, y: 0, z: 1 }, twist: { x: 0, y: 1, z: 0 },
  };
  affine.twist!.neutral = -80;
  check("later prototype and hidden-frame edits cannot alter an earlier snapshot",
    mapped.resolve(mappedPose, undefined, new Set(["leftHand"])), "leftHand", { x: 0, y: 2.15, z: 0 });
  check("a new mapping snapshot reads the current zero rig angle",
    prepareSkeletonPoseResolution(mappingSkeleton, inherited, hidden).resolve(
      mappedPose, undefined, new Set(["leftHand"])), "leftHand", { x: 0.75, y: 1.4, z: 0 });

  parentAxes.chest = zTwist;
  Object.defineProperty(inherited, "chest", { value: undefined, enumerable: false });
  check("an own undefined mapping shadows the inherited Z axis and uses default Y",
    prepareSkeletonPoseResolution(mappingSkeleton, inherited, {}).resolve(
      makePose([joint("chest", { twist: 90 })]), undefined, new Set(["leftHand"])),
    "leftHand", { x: 0, y: 1.4, z: -0.75 });
  const overriding: IAutoMovieSkeleton = createSkeleton();
  overriding.bones.find((bone: IAutoMovieBone): boolean => bone.bone === "head")!.axes = zTwist;
  const discarded: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> = Object.create(parentAxes);
  check("a bone override retains the ordinary host spread's discarded inherited entries",
    prepareSkeletonPoseResolution(overriding, discarded, {}).resolve(
      makePose([joint("chest", { twist: 90 })]), undefined, new Set(["leftHand"])),
    "leftHand", { x: 0, y: 1.4, z: -0.75 });
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
