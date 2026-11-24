import {
  jointToQuaternionOnBasis,
  normalizeJointAxes,
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
  IAutoMovieResolvedBone,
  IAutoMovieRestFrame,
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
 *    new record's angles; admitted records are values, so a changed angle is
 *    a new record and a record read again gives the rotation it was admitted
 *    as. It never certifies a later pose's other authored records.
 * 9. Typed inherited axis and non-enumerable affine mappings retain direct
 *    lookup semantics and snapshot isolation. An own undefined shadow and
 *    an unrelated bone override preserve the original default/spread rules.
 * 10. A raw operation joint reader preserves direct clinical/frame admission:
 *     null bypasses owned throwing sign/neutral getters, each nonfinite
 *     coordinate fails before its frame, and a used frame still fails before
 *     the next coordinate. Same-record affine edits, replacement frames and
 *     null recovery stay live. A reentrant getter's inner X90 cannot replace
 *     the outer call's clinical60-neutral30=X30 mapping.
 *     Individual rotation reads do not need a clinical record's bone name;
 *     only the full pose traversal performs that identity lookup.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States static-rig/fixed-pose snapshots, metre coordinates, ordered clinical/frame admission including null bypass, effective inherited/hidden lookup and shadow/override rules, demanded ancestors, bound/live membership, individual/full-pose admission and fresh ownership in ten scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public prepared and raw requested FK with changing pose/root/static inputs and demand sets. Actual returned coordinates detect stale transforms; an owned rest getter observes snapshot isolation, and an owned raw-operation reader observes ordered admission and demanded compositions without replacing a library function. Public operation.joint and direct OnBasis separately observe owned throwing affine getters, current invalid clinical coordinates, same-record scalar edits, frame replacement and recovery against literal identity/X90 rotations; a reentrant getter independently requires simultaneous innerX90/outerX30 results.
 * @evidence contracts/development/testing.md#independent-expectations Right-hand Y90 maps plus X to minus Z; Z90 maps it to plus Y, raising the hand0.75m above its1.4m chest to2.15m. Literal rest offsets sum to left-hand(0.75,1.4,0) and right-lower-arm(-0.5,1.4,0). Requested ancestry follows the authored graph. Direct lookup keeps inherited/non-enumerable values and own undefined shadows; the original skeleton-axis spread discards inherited entries when a bone overrides. Null rest uses rig zero without sign/neutral conversion; finite clinical admission and each used frame precede the next axis. Sign1/neutral20 maps clinical20 to identity and110 to X90; editing that same neutral to110 gives identity. A nested clinical90/neutral0 call cannot replace outerclinical60/neutral30=X30. These are geometric/dependency/admission expectations, not output snapshots.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers rest/rotated ancestors, root/arm edits, rig/pose snapshots, fixed-edit restoration, bound/live demand mutation, empty/single/two-branch demand, duplicate/stray admission, output mutation, individual-row admission, inherited/hidden/undefined-shadow/override mapping lifetimes and raw-operation null/finite/used-getter failure order, same-identity scalar edits, replacement recovery and reentrant frame isolation. Unreachable topology/general IK remain separately owned.
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

  const currentJoint: IAutoMovieJointPose = joint("chest", { twist: 90 });
  const local: IAutoMovieQuaternion = prepared.joint(currentJoint, operation);
  const quarter: IAutoMovieQuaternion = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };
  TestValidator.predicate("a prepared joint uses its snapshotted clinical axis convention",
    qclose(local, quarter, 1e-12),
  );
  local.y = 123;
  // An admitted record is a value: each changed chest is a new record.
  const restingJoint: IAutoMovieJointPose = joint("chest", { twist: 0 });
  const restJoint: IAutoMovieQuaternion = prepared.joint(restingJoint, operation);
  TestValidator.predicate("a new record's coordinates and output ownership remain independent",
    qclose(restJoint, { x: 0, y: 0, z: 0, w: 1 }, 1e-12) && restJoint !== local && local.y === 123,
  );
  check("joint admission cannot leave an old world transform behind", prepared.resolve(
    makePose([restingJoint]), operation, new Set(["leftHand"]),
  ), "leftHand", { x: 0.75, y: 1.4, z: 0 });
  prepared.resolve(makePose([currentJoint]), operation, new Set(["leftHand"]));
  TestValidator.predicate("pose followed by a joint read retains the actual local rotation",
    qclose(prepared.joint(currentJoint, operation), quarter, 1e-12),
  );
  TestValidator.predicate("a record read again is the value it was admitted as",
    qclose(prepared.joint(currentJoint, operation), quarter, 1e-12) &&
    qclose(prepared.joint(restingJoint, operation), { x: 0, y: 0, z: 0, w: 1 }, 1e-12),
  );

  rawFrameAdmission();
}

/** A raw operation cannot sample an unused affine value ahead of the original joint owner. */
function rawFrameAdmission(): void {
  const basis: IAutoMovieJointAxes = normalizeJointAxes({ flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 }, twist: { x: 0, y: 0, z: 1 } }, "raw frame admission basis");
  const sentinel: Error = new Error("owned unused affine getter");
  const neutral: Error = new Error("owned used neutral getter");
  const unused: NonNullable<IAutoMovieRestFrame["flexion"]> = {
    get sign(): 1 { throw sentinel; }, get neutral(): number { throw sentinel; },
  };
  const frame: IAutoMovieRestFrame = { flexion: unused, abduction: unused, twist: unused };
  const current: IAutoMovieJointPose = { bone: "head", flexion: null, abduction: null, twist: null };
  const operation: ReturnType<typeof preparePoseResolution> = preparePoseResolution();
  const direct: () => IAutoMovieQuaternion = (): IAutoMovieQuaternion => jointToQuaternionOnBasis(current, basis, frame);
  const read: () => IAutoMovieQuaternion = (): IAutoMovieQuaternion => operation.joint(current, basis, frame);
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  TestValidator.predicate("raw operation null coordinates do not sample unused affine getters",
    qclose(direct(), identity, 1e-12) && qclose(read(), identity, 1e-12));
  current.flexion = 0;
  TestValidator.predicate("a used flexion frame is read before the later invalid coordinate",
    caught(direct) === sentinel && caught(read) === sentinel);
  frame.flexion = { sign: 1, get neutral(): number { throw neutral; } };
  TestValidator.predicate("used neutral admission cannot be skipped after a failed sign getter",
    caught(direct) === neutral && caught(read) === neutral);
  frame.flexion = { sign: 1, neutral: 20 };
  current.flexion = 20;
  current.abduction = null;
  TestValidator.predicate("valid affine replacement recovers the actual identity articulation",
    qclose(direct(), identity, 1e-12) && qclose(read(), identity, 1e-12));
  current.flexion = 110;
  const quarter: IAutoMovieQuaternion = { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
  TestValidator.predicate("raw operation still reads the current nonzero clinical rotation",
    qclose(direct(), quarter, 1e-12) && qclose(read(), quarter, 1e-12));
  frame.flexion!.neutral = 110;
  TestValidator.predicate("same frame identity cannot hide its current edited affine scalar",
    qclose(direct(), identity, 1e-12) && qclose(read(), identity, 1e-12));
  frame.flexion!.neutral = 20;
  Object.defineProperty(frame.flexion!, "sign", { value: 0, writable: true, enumerable: true, configurable: true });
  TestValidator.predicate("a cached factor cannot bypass current invalid sign admission on the same frame",
    throwsError(direct, ["sign"]) && throwsError(read, ["sign"]));
  Object.defineProperty(frame.flexion!, "sign", { value: 1 });
  TestValidator.predicate("repairing the same affine frame recovers its actual prior rotation",
    qclose(direct(), quarter, 1e-12) && qclose(read(), quarter, 1e-12));
  current.flexion = null;
  frame.flexion = unused;
  TestValidator.predicate("return to null after replacement bypasses all affine getters again",
    qclose(direct(), identity, 1e-12) && qclose(read(), identity, 1e-12));
  let inner: IAutoMovieQuaternion | undefined;
  const innerJoint: IAutoMovieJointPose = { bone: "head", flexion: 90, abduction: null, twist: null };
  const outerJoint: IAutoMovieJointPose = { bone: "head", flexion: 60, abduction: null, twist: null };
  const reentrant: IAutoMovieRestFrame = { flexion: { sign: 1,
    get neutral(): number {
      inner = operation.joint(innerJoint, basis, { flexion: { sign: 1, neutral: 0 } });
      return 30;
    },
  } };
  const outer: IAutoMovieQuaternion = operation.joint(outerJoint, basis, reentrant);
  TestValidator.predicate("reentrant affine access cannot replace an enclosing operation's current frame",
    inner !== undefined && qclose(inner, quarter, 1e-12) &&
    qclose(outer, { x: Math.sin(Math.PI / 12), y: 0, z: 0, w: Math.cos(Math.PI / 12) }, 1e-12));
  const anonymous: IAutoMovieJointPose = { get bone(): AutoMovieHumanoidBone { throw sentinel; },
    flexion: 90, abduction: null, twist: null };
  TestValidator.predicate("individual rotation reads do not sample an unused clinical bone getter",
    qclose(jointToQuaternionOnBasis(anonymous, basis, {}), quarter, 1e-12) &&
    qclose(operation.joint(anonymous, basis, {}), quarter, 1e-12));
}

/** Return only the actual owned thrown value, without manufacturing a failed read. */
function caught(task: () => unknown): unknown {
  try { task(); } catch (error) { return error; }
  return undefined;
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
