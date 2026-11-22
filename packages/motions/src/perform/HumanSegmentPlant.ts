import type {
  AutoMovieHumanLimb,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMoviePose,
  IAutoMovieSwivelNear,
} from "@automovie/interface";

import { HumanPosture } from "../posture/HumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { refitHumanPosture } from "../posture/refitHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanSegmentPose } from "./HumanSegmentPose";
import { HumanSegmentPoseSeeds } from "./HumanSegmentPoseSeeds";

/**
 * The final planted-limb refit of a displayed pose after its range clamp.
 * The pose evaluator retains clamp/transition order and named-seed assembly.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Owns final planted-goal selection and its matching nearby continuations, after the displayed evaluator's clamp.
 * @evidence contracts/development/design.md#principled-representation Reads the existing posture goals and canonical pose and returns the resolver's existing pose/seed/value record, at the same world-frame units.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One final-stage fit serves HumanSegmentPose.seeded; selection, continuation names and refitting have no separate authored representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture resolver's complete attachment ordering, paired-arm behavior and clinical constraints; no limb or production receives a special fit.
 */
export namespace HumanSegmentPlant {
  /**
   * Whether a displayed pose's planted limbs already stand on their goals
   * when the final clamp returns: the evaluation fitted each planted goal
   * itself (its leaf fit), nothing moved the pose between that fit and the
   * clamp, and the clamp left every record of each planted limb as the fit
   * wrote it. The planted stage exists so that a fade, an offset or the
   * clamp cannot move a contact; when none of them touched the limb, the
   * leaf fit's solution of that same goal is the contact's, and its seed is
   * recorded as the planted stage's.
   *
   * @param before The pose the leaf fits left, before the final clamp.
   * @param clamped The same pose after the clamp, record for record in the same order.
   * @param limbs The current complete goals.
   * @param seeds The evaluation's named seeds; each planted limb's `planted:` seed is set from its `leaf::` seed when the result is true.
   * @returns Whether every planted limb keeps its leaf solution; false sends the pose to {@link fit}.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when a planted limb needs no second fit, what is compared, what is written to the seeds and what false means.
   * @evidence contracts/development/implementation.md#principled-implementation A fit's solution places the limb on its goal within the fit's own resolution; a second fit of the same goal on a pose that differs from the first fit's only by that solution solves the same task again. The clamp is the one operation between them in the caller's plain case, so exact equality of the limb's records across it shows the solution untouched.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the pose's records for the planted limbs' bones, then the seeds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A planted limb without a leaf seed of its own (not fitted by this evaluation) or with any record the clamp changed is not accepted, and then every plant is fitted as before. The pose kept is the leaf's, which differs from a second fit's within the fit's resolution.
   * @evidence contracts/development/implementation.md#efficient-algorithms J name tests and at most four exact record comparisons a planted limb, in place of one limb fit each.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The leaf fit and the planted stage of one evaluation ask the same goal object of the same body at the same second; the solution is shared only while the limb's records are exactly the fit's.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; writes at most four seeds into the caller's map.
   */
  export function settled(
    before: IAutoMoviePose,
    clamped: IAutoMoviePose,
    limbs: IAutoMovieMotionHumanPosture["limbs"],
    seeds: HumanSegmentPose.IFits,
  ): boolean {
    const planted: AutoMovieHumanLimb[] = [];
    const bones: Set<string> = new Set();
    for (const limb of HumanPosture.LIMBS) {
      if (limbs[limb]?.planted !== true) continue;
      if (!seeds.has(`leaf::${limb}`)) return false;
      planted.push(limb);
      const side: "left" | "right" = limb.startsWith("left") ? "left" : "right";
      for (const part of limb.endsWith("Arm") ? ["UpperArm", "LowerArm", "Hand"] : ["UpperLeg", "LowerLeg", "Foot", "Toes"])
        bones.add(`${side}${part}`);
    }
    if (before.joints.length !== clamped.joints.length) return false;
    for (let i: number = 0; i < before.joints.length; ++i) {
      const was: IAutoMoviePose["joints"][number] = before.joints[i]!;
      if (!bones.has(was.bone)) continue;
      const now: IAutoMoviePose["joints"][number] = clamped.joints[i]!;
      if (now.bone !== was.bone || !Object.is(now.flexion, was.flexion) ||
        !Object.is(now.abduction, was.abduction) || !Object.is(now.twist, was.twist)) return false;
    }
    for (const limb of planted) seeds.set(`planted:${limb}`, seeds.get(`leaf::${limb}`) ?? null);
    return true;
  }

  /**
   * Refit every planted goal on the already clamped displayed pose.
   * With plants, attachment admission precedes resolution even on cold queries.
   *
   * @param body The performer whose unchanged rig resolves the goals.
   * @param pose The pose after the displayed evaluator's final clamp.
   * @param limbs The current complete goals, including carried or stopped ones.
   * @param near Nearby fits, matched only by each existing planted-stage name.
   * @returns The resolver's pose, seeds and values with their original ownership.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the post-clamp input, complete current goals, planted-stage continuation names and returned resolver record.
   * @evidence contracts/development/implementation.md#principled-implementation Fits exactly the goals with planted equal to true on the actual displayed pose, after transitions and applicable clamps; ordered attachment admission and the ordinary resolver keep connected goals and paired arms coherent.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered goal filter returns immediately for an empty cold request; nonempty or continued requests keep the original attachment-order check, nearby-name projection and ordinary refit.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every supplied goal's planted property is still inspected before an empty return; no selected plant, field, clamp, ordering check, near seed or actual solve is skipped. Empty goals have no attachment edge or fit and retain the original pose identity and fresh empty seed/value records.
   * @evidence contracts/development/implementation.md#efficient-algorithms Scans L entries once. An empty cold selection omits the goal dictionary, two four-node order traversals and unused native refit setup; nonempty selection retains the full existing fit cost. Continued queries preserve all four candidate-name reads, including empty selections. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates the physical solve to the private refitHumanPosture, the same ordered kernel and limb memory as resolveHumanPosture.refit with its native issuer: the input is the displayed evaluation's own clamped intermediate, so untouched records are shared rather than cloned twice per limb and once more for the result. Continuation interpretation stays with HumanSegmentPose.nearby; different poses, goals, cold queries and nearby histories still resolve independently.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The filtered goal dictionary, order and optional nearby projection belong to this synchronous call and release on return or failure. Goal payloads remain borrowed; the resolver preserves its no-plant pose identity or fitted-result ownership. No callback, reader, cache or process is retained here.
   */
  export function fit(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limbs: IAutoMovieMotionHumanPosture["limbs"],
    near?: HumanSegmentPose.INear,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
    const selected: [string, IAutoMovieHumanLimbGoal][] = Object.entries(limbs).filter(
      ([, goal]: [string, IAutoMovieHumanLimbGoal]): boolean => goal.planted === true,
    );
    if (selected.length === 0 && !HumanSegmentPoseSeeds.continues(near)) return { pose, seeds: {}, values: {} };
    const plants: IAutoMovieMotionHumanPosture["limbs"] = Object.fromEntries(selected);
    const ordered: AutoMovieHumanLimb[] = resolveHumanPosture.order(plants);

    // The pose is this evaluation's own clamped intermediate, so the private
    // refit may share its untouched records instead of issuing clones.
    return refitHumanPosture(
      body,
      pose,
      plants,
      near === undefined
        ? {}
        : Object.fromEntries(
            ordered.flatMap(
              (
                limb: AutoMovieHumanLimb,
              ): [AutoMovieHumanLimb, IAutoMovieSwivelNear][] => {
                const continued: IAutoMovieSwivelNear | undefined =
                  HumanSegmentPose.nearby(near, `planted:${limb}`);
                return continued === undefined ? [] : [[limb, continued]];
              },
            ),
          ),
      resolution,
    );
  }
}
