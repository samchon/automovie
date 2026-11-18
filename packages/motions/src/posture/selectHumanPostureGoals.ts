import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLimbFit } from "./HumanLimbFit";
import { HumanPosture } from "./HumanPosture";

/**
 * Select world limb fits needed by explicit bone observations.
 * All directly authored joints are already clamped/admitted by the caller.
 * Any requested arm solve, attached/reference/external goal, digit
 * context or unsupported raw field keeps the complete original fit request.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines free goals and foot-contact support, prior full direct-joint admission, requested-frame guarantee and conservative full fallback.
 * @evidence contracts/development/implementation.md#principled-implementation A fitted chain changes its three joints and a contacting leg may change its toes; an observation depends on it only when a changed joint is an ancestor. Leg/contact re-aim has no arm input, while an arm reads both thighs, rival/placed arms and coupled clearance, so any needed arm retains every fit.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This selector alone owns the supported dependency proof; seeded retains ordinary root turning, complete joint clamping and unchanged actual fitting of selected goals.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unsupported or malformed contexts return the original full goal object for ordinary admission; retained foot contacts still run the original re-aim and toe correction, and no goals, thresholds, seeds or audit demands change.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds O(B) parent metadata and visits at most B ancestors for each of K requested bones, then tests four constant-size chains; omitted free limbs perform no target solve, without a measured speedup claim.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses only the current authored goals and actual skeleton ancestry; selected goal records are borrowed unchanged, with no previous request/result or mutable identity cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Parent/ancestor sets end with this synchronous selection; the returned at-most-four-member record borrows original goals only and retains no body, reader, numerical answer or external handle.
 */
export function selectHumanPostureGoals(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  requested: ReadonlySet<AutoMovieHumanoidBone>,
): IAutoMovieMotionHumanPosture["limbs"] {
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = posture.limbs;
  if (posture.digits !== undefined) return limbs;
  try {
    for (const [name, goal] of Object.entries(limbs)) {
      if (!LIMBS.has(name) || goal === undefined || !simple(goal, name.endsWith("Leg"))) return limbs;
    }
  } catch {
    return limbs;
  }
  const byName: Map<AutoMovieHumanoidBone, IAutoMovieBone> = new Map();
  for (const bone of body.skeleton.bones) byName.set(bone.bone, bone);
  const ancestors: Set<AutoMovieHumanoidBone> = new Set();
  for (const bone of requested) {
    let current: AutoMovieHumanoidBone | null | undefined = bone;
    while (current !== undefined && current !== null && !ancestors.has(current)) {
      ancestors.add(current);
      current = byName.get(current)?.parent;
    }
  }
  const selected: IAutoMovieMotionHumanPosture["limbs"] = {};
  for (const limb of HumanPosture.LIMBS) {
    const goal: IAutoMovieHumanLimbGoal | undefined = limbs[limb];
    if (goal === undefined) continue;
    const chain: HumanLimbFit.IChain = HumanLimbFit.chain(limb);
    const changed: AutoMovieHumanoidBone[] = [chain.upper, chain.lower, chain.effector];
    if (limb.endsWith("Leg") && goal.contact !== undefined && goal.rotation !== undefined)
      changed.push(limb === "leftLeg" ? "leftToes" : "rightToes");
    if (!changed.some(
      (bone: AutoMovieHumanoidBone): boolean => ancestors.has(bone),
    )) continue;
    if (limb.endsWith("Arm")) return limbs;
    selected[limb] = goal;
  }
  return selected;
}

/** Admit only the fields whose free-world independence the selector proves. */
function simple(goal: IAutoMovieHumanLimbGoal, leg: boolean): boolean {
  return Object.keys(goal).every((key: string): boolean =>
    FIELDS.has(key) || (leg && LEG_FIELDS.has(key)),
  ) &&
    finite(goal.point) && finite(goal.bend) &&
    (goal.contact === undefined || (leg && finite(goal.contact))) &&
    (goal.planted === undefined || (leg && typeof goal.planted === "boolean")) &&
    (goal.rotation === undefined || [
      goal.rotation.x, goal.rotation.y, goal.rotation.z, goal.rotation.w,
    ].every(Number.isFinite));
}

/** Nonfinite omitted demands must reach the original numerical admission. */
function finite(point: IAutoMovieVector3): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z);
}

/** Canonical goal names; unknown raw properties conservatively keep full resolution. */
const LIMBS: ReadonlySet<string> = new Set(HumanPosture.LIMBS);

/** Arm contacts, attachments, reference, strain and external geometry fall back. */
const FIELDS: ReadonlySet<string> = new Set(["point", "bend", "rotation"]);

/** Foot re-aim and planting have no arm input; their actual fit remains unchanged. */
const LEG_FIELDS: ReadonlySet<string> = new Set(["contact", "planted"]);
