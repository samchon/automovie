import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanLimbFitFrame,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";
import { vclose } from "../internal/vclose";

/**
 * An issued limb fit owns its pose, seed, value and unchanged-joint metadata;
 * edits cannot change the source, private remembered fit or another issue.
 *
 * Scenarios:
 * 1. A fresh canonical body owner fits a reachable right hand with actual
 *    strain scoring. Mutating every issued root field, a fitted joint, an
 *    unrelated annotated joint, its nested annotation, seed and value cannot
 *    alter the unchanged original source or the next actual memory hit.
 * 2. Repeated issues retain the original wrist target within0.001m and all
 *    original joints/world frames within1e-9. The hit adds no new miss;
 *    later issues do not repair the caller's earlier poisoned objects.
 * 3. With public memory disabled, each actual direct fit has the same
 *    independent-output/input ownership and target. No cache read/insert is
 *    counted. A structurally extended unrelated clinical record retains its
 *    ordinary nested data instead of being rebuilt from known angles only.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines input/cache/issued ownership, actual strain metadata, structural joint extension, public memory switch lifetime and original metre/angle bounds in three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public resolveHumanPosture.refit with enabled and disabled memory, edits every returned mutable category, observes real per-body hit/miss counts, original source scalars/annotation, retained earlier poison, independent new wrappers/arrays, actual wrist contact and full canonical FK/joint/seed/value replay.
 * @evidence contracts/development/testing.md#independent-expectations The authored world point rises4cm and moves5cm forward from the canonical hand and must remain within0.001m. A remembered pure fit changes no clinical coordinate or world frame at the existing1e-9 comparison bound; copied pre-edit numerical values supplement that physical target. Source ownership requires exact scalar preservation, and the independently authored annotation label/sequence must survive verbatim with separate nested ownership.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers first miss versus repeated hits, enabled versus actual direct disabled fits, root translation/rotation/scale, fitted and unrelated joints, nested foreign metadata, seed/value and old-output edits. Fresh body identities isolate each mode; no global geometry, table or shared fixture is mutated.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable numerical unit borrows immutable canonical geometry through fresh body wrappers and owns source poses/goals/annotations. It uses public resolver/statistics/switch/FK APIs, restores enabled memory in finally, and adds no internal import, test-only export, foreign replacement, host or compiler.
 */
export function test_motion_limb_memory_ownership(): void {
  const shared: IHumanBody = motionHumanBody("m-average");
  try {
    for (const enabled of [true, false]) {
      const body: IHumanBody = { ...shared };
      const source: IAutoMoviePose = resolveHumanPosture(body, {
        root: { x: 2, y: 0.6, z: -1 }, yaw: 17, pitch: 0, roll: 0, joints: {}, limbs: {},
      });
      const marker: IMarkedJoint = { bone: "head", flexion: 7, abduction: 0, twist: 0,
        annotation: { label: "owned-input", sequence: [2, 3] } };
      source.joints = source.joints.map((joint: IAutoMovieJointPose): IAutoMovieJointPose =>
        joint.bone === "head" ? marker : joint);
      const original: IAutoMoviePose = structuredClone(source);
      const rest: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, source);
      const wrist: IAutoMovieVector3 = rest.get("rightHand")!.worldPosition;
      const goal: IHumanPosture.IGoal = {
        point: { x: wrist.x, y: wrist.y + 0.04, z: wrist.z + 0.05 },
        bend: { ...rest.get("rightLowerArm")!.worldPosition },
        rotation: { ...rest.get("rightHand")!.worldRotation }, elbow: "strain",
      };
      resolveHumanPosture.memory(enabled);
      const first: resolveHumanPosture.ISeeded = resolveHumanPosture.refit(body, source, { rightArm: goal });
      const pristine: resolveHumanPosture.ISeeded = structuredClone(first);
      verify(body, first, pristine, goal);
      let previous: resolveHumanPosture.ISeeded = first;
      for (let replay: number = 0; replay < 2; replay++) {
        poison(previous);
        unchanged(source, original);
        const before: HumanLimbFitFrame.IStatistics = HumanLimbFitFrame.statistics(body);
        const current: resolveHumanPosture.ISeeded = resolveHumanPosture.refit(body, source, { rightArm: goal });
        const after: HumanLimbFitFrame.IStatistics = HumanLimbFitFrame.statistics(body);
        verify(body, current, pristine, goal);
        TestValidator.predicate("public memory mode retains its actual read/insert semantics",
          enabled ? after.hits > before.hits && after.misses === before.misses
            : after.hits === before.hits && after.misses === before.misses,
        );
        const oldHead: IAutoMovieJointPose | undefined = previous.pose.joints.find(
          (joint: IAutoMovieJointPose): boolean => joint.bone === "head");
        const head: IAutoMovieJointPose | undefined = current.pose.joints.find(
          (joint: IAutoMovieJointPose): boolean => joint.bone === "head");
        TestValidator.predicate("issued pose/root/clinical/seed/value records never borrow an earlier issue",
          current.pose !== previous.pose && current.pose !== source &&
          current.pose.root !== previous.pose.root && current.pose.root !== source.root &&
          current.pose.root!.translation !== previous.pose.root!.translation &&
          current.pose.root!.rotation !== previous.pose.root!.rotation &&
          current.pose.root!.scale !== previous.pose.root!.scale &&
          current.pose.joints !== previous.pose.joints && head !== marker && head !== oldHead &&
          current.seeds.rightArm !== previous.seeds.rightArm && current.values.rightArm !== previous.values.rightArm,
        );
        TestValidator.predicate("nested ordinary joint metadata survives with independent ownership",
          marked(head) && marked(oldHead) && head.annotation !== marker.annotation &&
          head.annotation !== oldHead.annotation && head.annotation.sequence !== oldHead.annotation.sequence &&
          head.annotation.label === "owned-input" && head.annotation.sequence.length === 2 &&
          head.annotation.sequence[0] === 2 && head.annotation.sequence[1] === 3 &&
          oldHead.annotation.label === "poisoned-output" && oldHead.annotation.sequence.length === 3,
        );
        TestValidator.predicate("new reads cannot repair caller-owned earlier poison",
          previous.pose.root!.translation.x === 123 && previous.pose.root!.rotation.w === 0 &&
          previous.pose.root!.scale.y === 8 && previous.seeds.rightArm?.swivel === 12345 &&
          previous.values.rightArm?.strain === 333,
        );
        previous = current;
      }
      unchanged(source, original);
    }
  } finally {
    resolveHumanPosture.memory(true);
  }
}

/** Ordinary structural extension must pass through unrelated clinical rows intact. */
interface IMarkedJoint extends IAutoMovieJointPose {
  annotation: { label: string; sequence: number[] };
}

/** Inspect actual extension data without asserting a foreign row's type. */
function marked(joint: IAutoMovieJointPose | undefined): joint is IMarkedJoint {
  if (joint === undefined || !("annotation" in joint) || typeof joint.annotation !== "object" || joint.annotation === null)
    return false;
  return "label" in joint.annotation && typeof joint.annotation.label === "string" &&
    "sequence" in joint.annotation && Array.isArray(joint.annotation.sequence) &&
    joint.annotation.sequence.every((value: unknown): boolean => typeof value === "number");
}

/** Damage only issued records; later successful reads must leave these edits in place. */
function poison(result: resolveHumanPosture.ISeeded): void {
  result.pose.root!.translation.x = 123;
  result.pose.root!.rotation.w = 0;
  result.pose.root!.scale.y = 8;
  result.pose.joints.find((joint: IAutoMovieJointPose): boolean => joint.bone === "rightUpperArm")!.flexion = 111;
  const head: IAutoMovieJointPose | undefined = result.pose.joints.find(
    (joint: IAutoMovieJointPose): boolean => joint.bone === "head");
  if (marked(head)) {
    head.flexion = 88;
    head.annotation.label = "poisoned-output";
    head.annotation.sequence.push(999);
  }
  if (result.seeds.rightArm !== null && result.seeds.rightArm !== undefined) {
    result.seeds.rightArm.swivel = 12345;
    result.seeds.rightArm.branch = 678;
  }
  if (result.values.rightArm !== undefined) {
    result.values.rightArm.overshoot = 111;
    result.values.rightArm.error = 222;
    result.values.rightArm.strain = 333;
  }
}

/** Protect the original source's exact numeric fields and independently authored metadata. */
function unchanged(actual: IAutoMoviePose, expected: IAutoMoviePose): void {
  sameJoints(actual, expected, 0);
  TestValidator.predicate("issued output edits never alter the supplied source root",
    vclose(actual.root!.translation, expected.root!.translation, 0) &&
    vclose(actual.root!.scale, expected.root!.scale, 0) &&
    (["x", "y", "z", "w"] as const).every((axis: "x" | "y" | "z" | "w"): boolean =>
      Object.is(actual.root!.rotation[axis], expected.root!.rotation[axis])),
  );
  const head: IAutoMovieJointPose | undefined = actual.joints.find(
    (joint: IAutoMovieJointPose): boolean => joint.bone === "head");
  TestValidator.predicate("source metadata remains the independently authored original",
    marked(head) && head.annotation.label === "owned-input" && head.annotation.sequence.length === 2 &&
    head.annotation.sequence[0] === 2 && head.annotation.sequence[1] === 3,
  );
}

/** Replayed metadata/geometry remains the original fit and still meets its actual task. */
function verify(body: IHumanBody, actual: resolveHumanPosture.ISeeded,
  expected: resolveHumanPosture.ISeeded, goal: IHumanPosture.IGoal): void {
  sameJoints(actual.pose, expected.pose, 1e-9);
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, actual.pose);
  const reference: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, expected.pose);
  const wrist: IAutoMovieVector3 = bones.get("rightHand")!.worldPosition;
  TestValidator.predicate("replayed fit retains the original target and every full world frame",
    Math.hypot(wrist.x - goal.point.x, wrist.y - goal.point.y, wrist.z - goal.point.z) <= 0.001 &&
    bones.size === reference.size && Array.from(reference).every(
      ([name, before]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): boolean => {
        const after: IAutoMovieResolvedBone | undefined = bones.get(name);
        return after !== undefined && Math.hypot(after.worldPosition.x - before.worldPosition.x,
          after.worldPosition.y - before.worldPosition.y, after.worldPosition.z - before.worldPosition.z) <= 1e-9 &&
          qclose(after.worldRotation, before.worldRotation, 1e-9);
      }),
  );
  const seed: resolveHumanPosture.ISeeded["seeds"]["rightArm"] = actual.seeds.rightArm;
  const original: resolveHumanPosture.ISeeded["seeds"]["rightArm"] = expected.seeds.rightArm;
  const value: resolveHumanPosture.ISeeded["values"]["rightArm"] = actual.values.rightArm;
  const old: resolveHumanPosture.ISeeded["values"]["rightArm"] = expected.values.rightArm;
  TestValidator.predicate("actual strain fitting issues its original continuation seed and score",
    seed !== undefined && seed !== null && original !== undefined && original !== null &&
    seed.branch === original.branch && nclose(seed.swivel, original.swivel, 1e-9) &&
    value !== undefined && old !== undefined && nclose(value.overshoot, old.overshoot, 1e-9) &&
    nclose(value.error, old.error, 1e-9) && nclose(value.strain, old.strain, 1e-9),
  );
}

/** Preserve every current clinical row, with null rest distinct from numeric zero. */
function sameJoints(actual: IAutoMoviePose, expected: IAutoMoviePose, tolerance: number): void {
  TestValidator.predicate("cache ownership cannot change any original clinical coordinate",
    actual.joints.length === expected.joints.length && actual.joints.every(
      (joint: IAutoMovieJointPose, index: number): boolean => {
        const before: IAutoMovieJointPose = expected.joints[index]!;
        return joint.bone === before.bone && (["flexion", "abduction", "twist"] as const).every(
          (axis: "flexion" | "abduction" | "twist"): boolean => joint[axis] === null || before[axis] === null
            ? joint[axis] === before[axis] : nclose(joint[axis], before[axis], tolerance));
      }),
  );
}
