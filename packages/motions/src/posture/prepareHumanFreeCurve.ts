import {
  type IAutoMovieResolvedBone,
  type IAutoMovieSwivelNear,
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  getConstraint,
  hingedArmSwivel,
  jointRomOvershoot,
  samplePoseVelocity,
  swingTwistRange,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanPosturePreparation } from "./HumanPosturePreparation";
import { HumanLimbFitFrame } from "./HumanLimbFitFrame";
import { HumanPostureRaw } from "./HumanPostureRaw";
import type { IHumanPosture } from "./IHumanPosture";
import { poseBones } from "./poseBones";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { prepareHumanPostureRigCheck } from "./prepareHumanPostureRigCheck";
import type { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";
import type { resolveHumanPosture } from "./resolveHumanPosture";

/**
 * Continue a constructor-owned, pure free-leg goal curve from its phase-zero
 * anchor. This explicit continuous constrained-IK policy is separate from
 * public cold minimization: current goals remain actual solves, and no pose
 * is replayed or interpolated. The supplied producer owns copied curve
 * coefficients and never exposes or changes them during this preparation.
 *
 * @param body The curve's actual canonical body; changed live rig prerequisites permanently return this curve to ordinary cold fitting.
 * @param at Pure constructor-owned authoring at a phase in [0,1], with fresh records and closed direct-joint/free-world-leg goals only.
 * @param duration The physical duration in seconds, used by the existing velocity-continuation angular-resolution law.
 * @returns A current-phase preparation reader borrowing only a genuine native synchronous FK/projector source; foreign sources keep ordinary cold behavior.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines curve ownership, normalized phase/second units, deterministic dyadic predecessor anchors, exact current solves, supported free-goal domain, full physical gates and cold fallback.
 * @evidence contracts/development/implementation.md#principled-implementation Predictor-corrector continuation uses the existing near-basin hinged solver. Canonical preceding dyadic anchors refine until both the actual swivel bracket and actual postclamp chain rotations stay inside the original one-degree search step. FK independently checks each current ankle, requested end orientation, pole side and ROM. This defines continuous constrained IK, not the public cold score winner. A unique smooth local basin is a premise between actual branch events; C1 at anchor-policy seams is not yet qualified by runtime momentum checks.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pure phase reader owns source preparation; observe owns actual constraints and scalar seed/rotation observations. solve selects canonical predecessors while seedAt retains only deterministic anchors. A singular endpoint remains cold and a canonical one-sided interior phase may supply a new valid anchor; singularity alone never disables the entire curve. Unsupported/invalid/precision-limited cases use cold fitting.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No body/law/fixture switch, approximate result key, sampled global smoothness certificate, arbitrary time grid, skipped physical bound or whole-pose result cache is used. Unknown callbacks/readers, changed rig, contacts, attached goals, digits and external clearance cannot enter this narrow constructor path. At every candidate endpoint/rotation/ROM/pole are checked after actual fitting; fallback never manufactures success.
 * @evidence contracts/development/implementation.md#efficient-algorithms Smooth eligible branches replace repeated360-position cold sweeps by local refinement plus actual demanded-chain FK. Refinement work follows actual angular change; no iteration cap or coarse trajectory approximation substitutes for a solve. Recomputed anchors use the same deterministic construction, and total gains remain unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only primitive seeds/chain quaternions of canonical dyadic anchors share under unchanged rig/curve prerequisites. Each current target is solved or read from exact full-dependency continuous-policy memory, with signed zero preserved; the public legacy quantized key is not used by this policy. Cached/evicted anchor availability cannot choose a previous queried pose or change the canonical construction.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns its immutable coefficient reader, fixed ROM scorers, root seed and at most one small seed/rotation record per binary64 subdivision level. Finite scale doubling bounds the population by the numeric exponent range; replacement discards an older same-level anchor. No canonical pose, public output, FK loan, input graph, query history, handle or task is retained.
 */
export function prepareHumanFreeCurve(
  body: IHumanBody,
  at: (share: number) => IHumanPosture,
  duration: number,
): (share: number, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: ReturnType<typeof prepareHumanPostureProjection>) => HumanPosturePreparation.IPrepared {
  const unchanged: (() => boolean) | undefined = prepareHumanPostureRigCheck(body);
  const tolerance: number = Number.isFinite(duration) && duration > 0
    ? samplePoseVelocity.tolerance(1e-3, duration) : NaN;
  const radians: number = ROM_TOLERANCE * Math.PI / 180;
  const legality: Map<AutoMovieHumanoidBone, (joint: IAutoMovieJointPose) => number> = new Map();
  for (const bone of body.skeleton.bones)
    legality.set(bone.bone, jointRomOvershoot.prepare(bone.bone,
      getConstraint(bone.bone, bone.constraint ?? null), swingTwistRange.of(bone.bone, body.skeleton)));
  const anchors: Map<number, { share: number; value: IAnchor }> = new Map();
  let origin: IAnchor | undefined;
  let originRead: boolean = false;
  let supported: boolean = unchanged !== undefined && Number.isFinite(tolerance) && tolerance > 0 && tolerance < hingedArmSwivel.STEP;

  /** Actual current admission/solve remains the ordinary owner in every fallback. */
  function cold(share: number, resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined, anchor: boolean = false): HumanPosturePreparation.IPrepared {
    HumanLimbFitFrame.work(body, anchor ? "curveColdAnchors" : "curveColdFallbacks");
    return HumanPosturePreparation.prepare(body, at(share), resolution, projection);
  }

  /** Observe native output independently; no seed or fitted endpoint is a target substitute. */
  function observe(prepared: HumanPosturePreparation.IPrepared, raw: IHumanPosture): IAnchor | undefined {
    if (raw.rotation !== undefined || !HumanPostureRaw.eligible(raw)) return undefined;
    const limbs: [IHumanPosture.Limb, IHumanPosture.IGoal][] = Object.entries(raw.limbs) as [IHumanPosture.Limb, IHumanPosture.IGoal][];
    if (limbs.length === 0) return undefined;
    const pose: HumanPosturePreparation.IPrepared["pose"] = prepared.pose;
    for (const joint of pose.joints)
      if ((legality.get(joint.bone)?.(joint) ?? Infinity) > ROM_TOLERANCE) return undefined;
    const names: Set<AutoMovieHumanoidBone> = new Set();
    for (const [limb] of limbs) {
      const side: "left" | "right" = limb === "leftLeg" ? "left" : "right";
      names.add(`${side}UpperLeg`); names.add(`${side}LowerLeg`); names.add(`${side}Foot`);
    }
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, pose, undefined, names);
    const rotations: IAutoMovieQuaternion[] = [];
    for (const [limb, goal] of limbs) {
      const side: "left" | "right" = limb === "leftLeg" ? "left" : "right";
      const hip: IAutoMovieResolvedBone = bones.get(`${side}UpperLeg`)!;
      const knee: IAutoMovieResolvedBone = bones.get(`${side}LowerLeg`)!;
      const foot: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
      const length: number = Vector3.distance(hip.worldPosition, knee.worldPosition) + Vector3.distance(knee.worldPosition, foot.worldPosition);
      const precision: number = length * radians;
      if (!(precision > 0) || Vector3.distance(foot.worldPosition, goal.point) > precision) return undefined;
      if (goal.rotation !== undefined && Quaternion.angleAfterNormalize(foot.worldRotation, Quaternion.normalize(goal.rotation)) * 180 / Math.PI > ROM_TOLERANCE) return undefined;
      const reach: IAutoMovieVector3 = Vector3.subtract(goal.point, hip.worldPosition);
      const distance: number = Vector3.length(reach);
      if (!(distance > precision)) return undefined;
      const axis: IAutoMovieVector3 = Vector3.scale(reach, 1 / distance);
      const off: (point: IAutoMovieVector3) => IAutoMovieVector3 = (point: IAutoMovieVector3): IAutoMovieVector3 => {
        const offset: IAutoMovieVector3 = Vector3.subtract(point, hip.worldPosition);
        return Vector3.subtract(offset, Vector3.scale(axis, Vector3.dot(offset, axis)));
      };
      const bent: IAutoMovieVector3 = off(knee.worldPosition);
      const asked: IAutoMovieVector3 = off(goal.bend);
      if (!(Vector3.length(bent) > precision) || !(Vector3.length(asked) > precision) || !(Vector3.dot(bent, asked) > 0)) return undefined;
      rotations.push(hip.worldRotation, knee.worldRotation, foot.worldRotation);
    }
    const seeds: resolveHumanPosture.ISeeded["seeds"] = HumanPosturePreparation.seeds(prepared);
    if (limbs.some(([limb]: [IHumanPosture.Limb, IHumanPosture.IGoal]): boolean => seeds[limb] === null || seeds[limb] === undefined)) return undefined;
    return { seeds, rotations };
  }

  /** A retained anchor always has the same canonical construction, even after eviction. */
  function seedAt(share: number, level: number, resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined): IAnchor | undefined {
    if (share === 0) return origin;
    const kept: { share: number; value: IAnchor } | undefined = anchors.get(level);
    if (kept?.share === share) return kept.value;
    const prepared: HumanPosturePreparation.IPrepared = origin === undefined
      ? cold(share, resolution, projection, true) : solve(share, resolution, projection);
    const value: IAnchor | undefined = observe(prepared, at(share));
    if (value !== undefined) anchors.set(level, { share, value });
    return value;
  }

  /** Correct actual goals from canonical preceding anchors, never from query order. */
  function solve(share: number, resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined): HumanPosturePreparation.IPrepared {
    const raw: IHumanPosture = at(share);
    let previous: number = -1;
    for (let level: number = 0, scale: number = 1; Number.isFinite(scale); ++level, scale *= 2) {
      let anchor: number = Math.floor(share * scale) / scale;
      if (anchor === share) anchor -= 1 / scale;
      if (anchor < 0 || !(anchor < share)) return cold(share, resolution, projection);
      if (anchor === previous) continue;
      previous = anchor;
      const prior: IAnchor | undefined = seedAt(anchor, level, resolution, projection);
      if (prior === undefined) {
        if (anchor === 0) continue;
        return cold(share, resolution, projection);
      }
      const near: resolveHumanPosture.INear = Object.fromEntries(Object.entries(prior.seeds).flatMap(
        ([limb, seed]: [string, resolveHumanPosture.ISeeded["seeds"][IHumanPosture.Limb]]): [IHumanPosture.Limb, IAutoMovieSwivelNear][] =>
          seed === null || seed === undefined ? [] : [[limb as IHumanPosture.Limb, { ...seed, tolerance }]],
      ));
      HumanLimbFitFrame.work(body, "curveProbes");
      const prepared: HumanPosturePreparation.IPrepared = HumanPosturePreparation.continued(body, raw, near, resolution, projection);
      const seeds: resolveHumanPosture.ISeeded["seeds"] = HumanPosturePreparation.seeds(prepared);
      const interior: boolean = Object.entries(seeds).every(([limb, seed]: [string, resolveHumanPosture.ISeeded["seeds"][IHumanPosture.Limb]]): boolean => {
        const before: resolveHumanPosture.ISeeded["seeds"][IHumanPosture.Limb] = prior.seeds[limb as IHumanPosture.Limb];
        return seed !== null && seed !== undefined && before !== null && before !== undefined && seed.branch === before.branch &&
          Math.abs(seed.swivel - before.swivel) < hingedArmSwivel.STEP - tolerance;
      });
      if (!interior) { HumanLimbFitFrame.work(body, "curveRefinements"); continue; }
      const value: IAnchor | undefined = observe(prepared, raw);
      if (value === undefined) return cold(share, resolution, projection);
      const continuous: boolean = value.rotations.length === prior.rotations.length && value.rotations.every(
        (rotation: IAutoMovieQuaternion, i: number): boolean => Quaternion.angleAfterNormalize(rotation, prior.rotations[i]!) * 180 / Math.PI <= hingedArmSwivel.STEP,
      );
      if (continuous) { HumanLimbFitFrame.work(body, "curveAccepted"); return prepared; }
      HumanLimbFitFrame.work(body, "curveRefinements");
    }
    return cold(share, resolution, projection);
  }

  return (share: number, resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>): HumanPosturePreparation.IPrepared => {
    HumanLimbFitFrame.work(body, "curveQueries");
    if (!supported || !(share > 0 && share <= 1) || !prepareHumanPoseResolution.isNativeSource(resolution)) return cold(share, resolution, projection);
    if (!unchanged!()) {
      supported = false; origin = undefined; anchors.clear();
      return cold(share, resolution, projection);
    }
    if (!originRead) {
      originRead = true;
      const initial: IHumanPosture = at(0);
      if (initial.rotation !== undefined || !HumanPostureRaw.eligible(initial)) { supported = false; return cold(share, resolution, projection); }
      const prepared: HumanPosturePreparation.IPrepared = cold(0, resolution, projection, true);
      origin = observe(prepared, at(0));
    }
    return solve(share, resolution, projection);
  };
}

/** Only primitive fit seeds and native quaternion observations survive a query. */
interface IAnchor {
  /** Actual branch and degree swivel of the validated canonical predecessor. */
  seeds: resolveHumanPosture.ISeeded["seeds"];
  /** Actual postclamp chain world rotations, in supported goal insertion order. */
  rotations: readonly IAutoMovieQuaternion[];
}
