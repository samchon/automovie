import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  ROM_TOLERANCE,
  fitSeededChainToTarget as fit,
  indexSkeletonTopology,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieFitChainToTargetProps,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieSeededChainFit,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { motionFitArms } from "../internal/motionFitArms";
import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";

/**
 * One fixed chain source may bind different complete goal/search requests
 * without inheriting another binding's reference, mode, callbacks or result.
 *
 * Scenarios:
 * 1. Existing isolated engine links0.3m and0.25m reach literal neighbouring
 *    A/B/A targets through cold, weighted-reference, zero-weight reference,
 *    caller-strain, near-seeded and omitted-options bindings. Actual FK and
 *    current one-shot results preserve each binding's complete meaning.
 * 2. All bindings are created before reads; returning to the original one
 *    after later reference/near/empty bindings must retain its own policy.
 *    A binding's owned obstruction executes only in that binding, even
 *    though every callback returns zero and source geometry is shared.
 * 3. Returned changed-chain joints, seeds and score metadata may be edited
 *    without changing later fits. Fixed unrelated source records stay
 *    borrowed and unchanged as the existing workspace contract requires.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines isolated engine metre geometry, fixed-source versus live-bound fields, source immutability, owned callback effects, generated-result versus borrowed-prefix ownership and three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls actual public prepareSource bindings and ordinary one-shot fitting, observes physical endpoint/link geometry, clinical/seed/value parity, workspace rotation/full-FK agreement, required per-binding callback execution, earlier-workspace replay and source/result mutation isolation.
 * @evidence contracts/development/testing.md#independent-expectations Literal reachable targets and0.3/0.25m rigid lengths fix endpoint and segment checks at existing0.001m/1e-9m. One-shot cold/near/reference/strain equivalence is a supplementary purity oracle for changed binding dependencies, not a global-optimum proof; original1e-9 clinical/metadata precision and1e-12 quaternion-dot precision remain. Owned callbacks define which binding's effects are required independently of cached numeric geometry.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers nonzero/zero/omitted reference weight, explicit/omitted bend and rotation, strain versus near/cold, all-created-before-read binding lifetimes, A/B/A targets, callback isolation, generated joint/seed/value edits and unchanged borrowed unrelated source. Existing engine workspace tests own unreachable/degenerate/malformed admission and real Human tests own anatomical interactions.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable engine unit owns the existing kernel fixture, fixed source, goal options and callback counters. It calls public APIs without a Human imitation, internal import, test-only export, foreign replacement, host or compiler; producer-consumer wiring remains the product owners' responsibility.
 */
export function test_motion_fit_chain_source_bindings(): void {
  const skeleton: IAutoMovieSkeleton = motionFitArms.arms();
  const unrelated: IAutoMovieJointPose = { bone: "rightUpperArm", flexion: 11, abduction: 90, twist: 0 };
  const pose: IAutoMoviePose = { skeleton: skeleton.id, root: null, joints: [unrelated] };
  const source: fit.ISource = {
    skeleton, pose, topology: indexSkeletonTopology(skeleton),
    chain: { upper: "leftUpperArm", lower: "leftLowerArm", effector: "leftHand" },
    jointAxes: HUMANOID_JOINT_AXES, restFrames: HUMANOID_REST_FRAME,
  };
  const targets: readonly IAutoMovieVector3[] = [
    { x: 0.18, y: 1.2, z: 0.45 }, { x: 0.181, y: 1.2005, z: 0.449 },
  ];
  const bend: IAutoMovieVector3 = { x: 0.35, y: 1.25, z: 0.1 };
  const rotation: IAutoMovieQuaternion = motionFitArms.hand({ x: 0, y: 0, z: 1 }, { x: 0, y: 1, z: 0 });
  const anchor: IAutoMovieSeededChainFit = fit({ ...source, bend, effectorRotation: rotation, target: targets[0]! });
  TestValidator.predicate("reachable source anchor has an actual hinged continuation seed", anchor.seed !== null);
  const options: fit.IOptions[] = [
    { bend, effectorRotation: rotation },
    { bend: { x: 0.32, y: 1.28, z: 0.12 }, effectorRotation: rotation,
      referencePose: anchor.pose, referenceWeight: 0.7 },
    { bend, referencePose: anchor.pose, referenceWeight: 0 },
    { bend, effectorRotation: rotation,
      strain: (upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion, world: IAutoMovieQuaternion): number =>
        upper.x * upper.x + lower.y * lower.y + world.z * world.z },
    { bend, effectorRotation: rotation,
      ...(anchor.seed === null ? {} : { near: { ...anchor.seed, tolerance: ROM_TOLERANCE } }) },
    {},
  ];
  const counts: { shared: number; fresh: number }[] = options.map(
    (): { shared: number; fresh: number } => ({ shared: 0, fresh: 0 }));
  const bind: ReturnType<typeof fit.prepareSource> = fit.prepareSource(source);
  const workspaces: fit.IWorkspace[] = options.map((option: fit.IOptions, index: number): fit.IWorkspace =>
    bind(index === 5 ? option : { ...option,
      obstruction: (): number => { counts[index]!.shared++; return 0; } }));
  let earlier: IAutoMovieSeededChainFit | undefined;
  for (const index of [0, 1, 0, 2, 3, 4, 5, 0])
    for (const target of [targets[0]!, targets[1]!, targets[0]!]) {
      const before: number[] = counts.map((count: { shared: number; fresh: number }): number => count.shared);
      const actual: IAutoMovieSeededChainFit = workspaces[index]!.fit(target);
      const props: IAutoMovieFitChainToTargetProps = { ...source, ...options[index]!, target,
        ...(index === 5 ? {} : { obstruction: (): number => { counts[index]!.fresh++; return 0; } }) };
      const fresh: IAutoMovieSeededChainFit = fit(props);
      TestValidator.predicate("only the current binding performs its required callback work",
        (index === 5 ? counts[index]!.shared === before[index]! && counts[index]!.fresh === 0 :
          counts[index]!.shared > before[index]! && counts[index]!.fresh > 0) &&
        counts.every((count: { shared: number; fresh: number }, other: number): boolean =>
          other === index || count.shared === before[other]),
      );
      same(actual, fresh);
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = motionFitArms.fk(skeleton, actual.pose);
      const upper: IAutoMovieVector3 = bones.get("leftUpperArm")!.worldPosition;
      const lower: IAutoMovieVector3 = bones.get("leftLowerArm")!.worldPosition;
      const hand: IAutoMovieResolvedBone = bones.get("leftHand")!;
      TestValidator.predicate("every source binding retains current contact and rigid link lengths",
        distance(hand.worldPosition, target) <= 0.001 &&
        nclose(distance(upper, lower), 0.3, 1e-9) && nclose(distance(lower, hand.worldPosition), 0.25, 1e-9) &&
        qclose(workspaces[index]!.rotation(actual.pose), hand.worldRotation, 1e-12),
      );
      TestValidator.predicate("fixed unrelated source prefix remains unchanged",
        pose.root === null && pose.joints.length === 1 && pose.joints[0] === unrelated &&
        unrelated.flexion === 11 && unrelated.abduction === 90 && unrelated.twist === 0,
      );
      if (earlier !== undefined)
        TestValidator.predicate("later binding reads do not repair an earlier generated joint",
          earlier.pose.joints.find((joint: IAutoMovieJointPose): boolean => joint.bone === "leftUpperArm")!.flexion === 123,
        );
      actual.pose.joints.find((joint: IAutoMovieJointPose): boolean => joint.bone === "leftUpperArm")!.flexion = 123;
      if (actual.seed !== null) actual.seed.swivel = 456;
      if (actual.value !== undefined) actual.value.strain = 789;
      earlier = actual;
    }
}

/** Clinical/source metadata parity supplements independent endpoint and length checks. */
function same(actual: IAutoMovieSeededChainFit, expected: IAutoMovieSeededChainFit): void {
  TestValidator.predicate("each bound goal retains its actual current one-shot clinical result",
    actual.pose.joints.length === expected.pose.joints.length && actual.pose.joints.every(
      (joint: IAutoMovieJointPose, index: number): boolean => {
        const other: IAutoMovieJointPose = expected.pose.joints[index]!;
        return joint.bone === other.bone && (["flexion", "abduction", "twist"] as const).every(
          (axis: "flexion" | "abduction" | "twist"): boolean => joint[axis] === null || other[axis] === null
            ? joint[axis] === other[axis] : nclose(joint[axis], other[axis], 1e-9));
      }),
  );
  TestValidator.predicate("current binding keeps its own seed and optional strain mode",
    (actual.seed === null || expected.seed === null ? actual.seed === expected.seed :
      actual.seed.branch === expected.seed.branch && nclose(actual.seed.swivel, expected.seed.swivel, 1e-9)) &&
    (actual.value === undefined || expected.value === undefined ? actual.value === expected.value :
      nclose(actual.value.overshoot, expected.value.overshoot, 1e-9) &&
      nclose(actual.value.error, expected.value.error, 1e-9) && nclose(actual.value.strain, expected.value.strain, 1e-9)),
  );
}

/** Compare actual model-metre geometry without a prepared/cold numerical oracle. */
function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
