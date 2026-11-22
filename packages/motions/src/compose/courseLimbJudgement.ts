import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { HumanLimbFit } from "../posture/HumanLimbFit";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The limb goals a swivel course judges an interpolated swivel against
 * (`courseLimbSwivels.swivels`): each coursed limb's goal pinned to the end
 * joint the middle's own fit placed, on that end joint's attitude, in the
 * world. With the end joint fixed, a two-bone limb's one free coordinate is
 * its swivel (Tolani, Goswami and Badler 2000, section 3.2.4), so placing the
 * limb there at the interpolated swivel differs from the middle's own fit by
 * the swivel alone. The goal's contact pivot and point limits are dropped:
 * they re-aim the end joint, whose place the middle's fit already settled.
 * Its bend, reference and clearance stay, so the prescribed placement still
 * probes what the limb keeps clear of and reports a swivel that does not
 * stand. Uncoursed limbs keep the assembly's own goals.
 *
 * @param body The body.
 * @param assembly The second's assembly (`resolveHumanPosture.assemble`).
 * @param limbs The coursed limbs.
 * @param end Each coursed limb's end joint.
 * @param own The middle's own fitted bones, the end joints among them.
 * @returns The goals to fit the assembly with.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, why the swivel is then the only difference, what is dropped and what is kept.
 * @evidence contracts/development/implementation.md#principled-implementation On a fixed end joint the swivel is the limb's one free coordinate (Tolani 2000), so the judgement isolates the interpolation's error while the prescribed fit keeps its range and clearance checks.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Carry each coursed goal into the world, pin it to the fitted end joint, drop its re-aim terms.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the re-aim terms the fitted end joint already satisfies are dropped; clearance, bend and reference are the goal's own.
 * @evidence contracts/development/implementation.md#efficient-algorithms One world carry per coursed limb; the contact re-aim's passes are not run again for a placement whose end joint is already placed.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each judgement pins its own middle's end joints.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh goal record; retains nothing.
 */
export function courseLimbJudgement(
  body: IAutoMovieMotionHumanBody,
  assembly: resolveHumanPosture.IAssembled,
  limbs: readonly AutoMovieHumanLimb[],
  end: (limb: AutoMovieHumanLimb) => AutoMovieHumanoidBone,
  own: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): IAutoMovieMotionHumanPosture["limbs"] {
  const goals: IAutoMovieMotionHumanPosture["limbs"] = { ...assembly.limbs };
  for (const limb of limbs) {
    const authored: IAutoMovieHumanLimbGoal | undefined = assembly.limbs[limb];
    const fitted: IAutoMovieResolvedBone | undefined = own.get(end(limb));
    if (authored === undefined || fitted === undefined) continue;
    const pinned: IAutoMovieHumanLimbGoal = {
      ...HumanLimbFit.world(body, assembly.pose, limb, authored),
      point: fitted.worldPosition,
      rotation: fitted.worldRotation,
    };
    delete pinned.contact;
    delete pinned.limits;
    delete pinned.on;
    goals[limb] = pinned;
  }
  return goals;
}
