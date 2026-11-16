import { type IAutoMovieResolvedBone, Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanColliders,
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

/**
 * Limb memory may remove a whole posture's vertical translation, while
 * preserving every relative target and every world-bound exclusion.
 *
 * Scenarios:
 * 1. Two free arms and a free leg on a canonical Human are translated only
 *    in Y, together with all world points and bend hints. The second and
 *    reverse-order heights hit existing fits without adding a miss. Actual
 *    joints and full world FK equal both the independently translated first
 *    solve and the public memory-disabled solve within the existing1e-9m.
 *    Both arm goals remain present, so their coming rival wrists must move.
 * 2. A leg goal stays fixed in the world while only the root rises3cm. That
 *    changes relative geometry, requires a miss and still reaches the
 *    original fixed point within0.001m rather than moving the old answer.
 * 3. Attached, clear and rests goals retain their world-keyed policy across
 *    a vertical move. Real distant partner colliders stay fixed; every
 *    moved request misses and agrees with the actual memory-disabled solve.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States full-Y rigid invariance, unchanged local joints/rotation, rival transport, world-goal exclusions, memory switch lifetime and existing1e-9m/0.001m bounds in three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Resolves actual canonical-body arm/leg requests through the public resolver and its public memory switch, observes owned-body hit/miss statistics and full canonical FK, and checks Y-translated coordinates, unchanged clinical joints, actual endpoint contacts and world-bound cache misses.
 * @evidence contracts/development/testing.md#independent-expectations A rigid Y translation adds dy to every world joint and target while preserving angles and rotations. That geometric equation supplies the expected moved frames independently of the changed frame helper. Public disabled solves additionally guard cache equivalence at the original1e-9m acceptance; actual free endpoint requests retain0.001m. A root-only move leaves world-fixed targets unchanged and therefore cannot reuse the original relative fit.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers positive/reverse/repeated Y heights, both coming rival wrists, a free leg, all-joint and full-frame parity, a world-fixed goal after a root-only move, attached local goals and actual fixed clear/rests collider contexts. Existing tests own horizontal/heading covariance, contact rotations and general memory eviction.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable in-memory unit borrows immutable canonical geometry through fresh body wrappers, owns all postures/collider placements, invokes public solver/FK/statistics/switch APIs and restores enabled memory in finally. It replaces no foreign function/global and starts no host/compiler.
 */
export function test_motion_limb_frame_vertical_memory(): void {
  const body: IHumanBody = { ...motionHumanBody("m-average") };
  const raw: IHumanPosture = {
    root: { x: 1, y: 0.75, z: -2 }, yaw: 23, pitch: 0, roll: 0,
    joints: { head: [7, 0, 0] }, limbs: {},
  };
  try {
    resolveHumanPosture.memory(true);
    const rest: IAutoMoviePose = resolveHumanPosture(body, raw);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, rest);
    const asked: IHumanPosture = { ...raw, limbs: {
      leftArm: goal(bones, "leftHand", "leftLowerArm", 0.04, 0.05),
      rightArm: goal(bones, "rightHand", "rightLowerArm", 0.04, 0.05),
      leftLeg: goal(bones, "leftFoot", "leftLowerLeg", 0.06, 0.04),
    } };
    const origin: IAutoMoviePose = resolveHumanPosture(body, asked);
    equalFrames(body, origin, cold(body, asked));
    contacts(body, origin, asked);
    for (const dy of [2.25, -0.5, 2.25]) {
      const moved: IHumanPosture = translated(asked, dy);
      const before: HumanLimbFitFrame.IStatistics = HumanLimbFitFrame.statistics(body);
      const actual: IAutoMoviePose = resolveHumanPosture(body, moved);
      const after: HumanLimbFitFrame.IStatistics = HumanLimbFitFrame.statistics(body);
      TestValidator.predicate(`whole-posture Y translation ${dy} reuses only equal relative fits`,
        after.hits > before.hits && after.misses === before.misses,
      );
      equalFrames(body, actual, origin, dy);
      equalFrames(body, actual, cold(body, moved));
      contacts(body, actual, moved);
    }

    const leg: IHumanPosture = { ...raw, limbs: { leftLeg: asked.limbs.leftLeg! } };
    resolveHumanPosture(body, leg);
    const rootOnly: IHumanPosture = { ...leg, root: { ...leg.root, y: leg.root.y + 0.03 } };
    const beforeRoot: HumanLimbFitFrame.IStatistics = HumanLimbFitFrame.statistics(body);
    const fixed: IAutoMoviePose = resolveHumanPosture(body, rootOnly);
    TestValidator.predicate("moving only the root keeps the fixed-world leg target distinct",
      HumanLimbFitFrame.statistics(body).misses > beforeRoot.misses,
    );
    contacts(body, fixed, rootOnly);
    equalFrames(body, fixed, cold(body, rootOnly));

    const partner: IAutoMoviePose = resolveHumanPosture(body, {
      ...raw, root: { x: 10, y: 0, z: 10 }, limbs: {},
    });
    const distant: readonly HumanColliders.IPlaced[] = HumanColliders.placed(body, poseBones(body, partner));
    const right: IHumanPosture.IGoal = asked.limbs.rightArm!;
    const hips: IAutoMovieResolvedBone = bones.get("hips")!;
    const onHips: IHumanPosture.IGoal = {
      ...right, on: "hips", point: local(hips, right.point), bend: local(hips, right.bend),
    };
    for (const [kind, current] of [
      ["on", onHips], ["clear", { ...right, clear: distant }], ["rests", { ...right, rests: distant }],
    ] as const) {
      const own: IHumanBody = { ...body };
      const source: IHumanPosture = { ...raw, limbs: { rightArm: current } };
      TestValidator.equals(`${kind} retains the explicit world-frame exclusion`,
        HumanLimbFitFrame.of(rest, current), null,
      );
      resolveHumanPosture(own, source);
      const dy: number = 0.375;
      const moved: IHumanPosture = kind === "on"
        ? { ...source, root: { ...source.root, y: source.root.y + dy } }
        : translated(source, dy);
      const before: HumanLimbFitFrame.IStatistics = HumanLimbFitFrame.statistics(own);
      const actual: IAutoMoviePose = resolveHumanPosture(own, moved);
      TestValidator.predicate(`${kind} cannot share a whole-world key across a Y move`,
        HumanLimbFitFrame.statistics(own).misses > before.misses,
      );
      equalFrames(own, actual, cold(own, moved));
      const point: IAutoMovieVector3 = poseBones(own, actual).get("rightHand")!.worldPosition;
      const target: IAutoMovieVector3 = { ...right.point, y: right.point.y + dy };
      TestValidator.predicate(`${kind} still meets its actual moved endpoint`,
        Math.hypot(point.x - target.x, point.y - target.y, point.z - target.z) <= 0.001,
      );
    }
  } finally {
    resolveHumanPosture.memory(true);
  }
}

/** Derive a nearby reachable world task from the canonical body's actual rest geometry. */
function goal(bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  end: AutoMovieHumanoidBone, middle: AutoMovieHumanoidBone, rise: number, forward: number): IHumanPosture.IGoal {
  const point: IAutoMovieVector3 = bones.get(end)!.worldPosition;
  const bend: IAutoMovieVector3 = bones.get(middle)!.worldPosition;
  return { point: { x: point.x, y: point.y + rise, z: point.z + forward },
    bend: { x: bend.x, y: bend.y, z: bend.z + (end.endsWith("Foot") ? 0.3 : 0) } };
}

/** Move every free world point with the root, leaving all clinical/local values intact. */
function translated(source: IHumanPosture, dy: number): IHumanPosture {
  const limbs: IHumanPosture["limbs"] = {};
  for (const limb of Object.keys(source.limbs) as IHumanPosture.Limb[]) {
    const value: IHumanPosture.IGoal = source.limbs[limb]!;
    limbs[limb] = { ...value, point: { ...value.point, y: value.point.y + dy },
      bend: { ...value.bend, y: value.bend.y + dy } };
  }
  return { ...source, root: { ...source.root, y: source.root.y + dy }, limbs };
}

/** Use the public cache bypass and restore the shared setting even on refusal. */
function cold(body: IHumanBody, raw: IHumanPosture): IAutoMoviePose {
  resolveHumanPosture.memory(false);
  try { return resolveHumanPosture(body, raw); }
  finally { resolveHumanPosture.memory(true); }
}

/** Compare all actual world frames and clinical joints at the existing rigid-covariance bound. */
function equalFrames(body: IHumanBody, actual: IAutoMoviePose, reference: IAutoMoviePose, dy: number = 0): void {
  const before: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, reference);
  const after: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, actual);
  TestValidator.predicate("every actual bone keeps the independently translated world transform",
    before.size === after.size && Array.from(before).every(
      ([name, frame]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): boolean => {
        const current: IAutoMovieResolvedBone | undefined = after.get(name);
        return current !== undefined && Math.hypot(current.worldPosition.x - frame.worldPosition.x,
          current.worldPosition.y - frame.worldPosition.y - dy,
          current.worldPosition.z - frame.worldPosition.z) <= 1e-9 &&
          qclose(current.worldRotation, frame.worldRotation, 1e-9);
      }),
  );
  TestValidator.predicate("vertical cache reuse preserves every clinical joint",
    actual.joints.length === reference.joints.length && actual.joints.every(
      (value: IAutoMovieJointPose, index: number): boolean => {
        const other: IAutoMovieJointPose = reference.joints[index]!;
        return value.bone === other.bone && (["flexion", "abduction", "twist"] as const).every(
          (axis: "flexion" | "abduction" | "twist"): boolean => value[axis] === null || other[axis] === null
            ? value[axis] === other[axis] : nclose(value[axis], other[axis], 1e-9));
      }),
  );
}

/** Actual displayed endpoints retain the original metre contact requirement. */
function contacts(body: IHumanBody, pose: IAutoMoviePose, raw: IHumanPosture): void {
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, pose);
  for (const [limb, name] of [["leftArm", "leftHand"], ["rightArm", "rightHand"], ["leftLeg", "leftFoot"]] as const) {
    const target: IHumanPosture.IGoal | undefined = raw.limbs[limb];
    if (target === undefined) continue;
    const point: IAutoMovieVector3 = bones.get(name)!.worldPosition;
    TestValidator.predicate(`actual ${limb} target remains physically satisfied`,
      Math.hypot(point.x - target.point.x, point.y - target.point.y, point.z - target.point.z) <= 0.001,
    );
  }
}

/** Invert the independently observed attachment transform for a literal local goal. */
function local(frame: IAutoMovieResolvedBone, point: IAutoMovieVector3): IAutoMovieVector3 {
  return Quaternion.rotateVector(Quaternion.inverse(frame.worldRotation), {
    x: point.x - frame.worldPosition.x, y: point.y - frame.worldPosition.y, z: point.z - frame.worldPosition.z,
  });
}
