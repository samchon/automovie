import type { IAutoMovieSwivelNear } from "@automovie/engine";
import type { IAutoMoviePose } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanSegmentPose } from "./HumanSegmentPose";

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
   * Refit every planted goal on the already clamped displayed pose.
   * Attachment admission always precedes resolution, including a cold query.
   *
   * @param body The performer whose unchanged rig resolves the goals.
   * @param pose The pose after the displayed evaluator's final clamp.
   * @param limbs The current complete goals, including carried or stopped ones.
   * @param near Nearby fits, matched only by each existing planted-stage name.
   * @returns The resolver's pose, seeds and values with their original ownership.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the post-clamp input, complete current goals, planted-stage continuation names and returned resolver record.
   * @evidence contracts/development/implementation.md#principled-implementation Fits exactly the goals with planted equal to true on the actual displayed pose, after transitions and applicable clamps; ordered attachment admission and the ordinary resolver keep connected goals and paired arms coherent.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered goal filter, one attachment-order check, an optional nearby-name projection and one ordinary refit keep this final physical stage together.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No plant, fit, contact field, clamp, ordering check or near seed is skipped. A cold query omits only lookups whose nearby reader would return undefined; it still executes attachment admission and refitting.
   * @evidence contracts/development/implementation.md#efficient-algorithms Scans L goal entries and checks the four canonical limbs' attachment order before the full existing refit cost. A cold query allocates no unused nearby keys, tuples or projection map; a continued query reads all four existing candidate names. Absent goals still invoke no fit or FK. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates the physical solve to resolveHumanPosture.refit and continuation interpretation to HumanSegmentPose.nearby. Different poses, goals, cold queries and nearby histories still resolve independently, with no fitted-pose memo.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The filtered goal dictionary, order and optional nearby projection belong to this synchronous call and release on return or failure. Goal payloads remain borrowed; the resolver preserves its no-plant pose identity or fitted-result ownership. No callback, reader, cache or process is retained here.
   */
  export function fit(
    body: IHumanBody,
    pose: IAutoMoviePose,
    limbs: IHumanPosture["limbs"],
    near?: HumanSegmentPose.INear,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): resolveHumanPosture.ISeeded {
    const plants: IHumanPosture["limbs"] = Object.fromEntries(
      Object.entries(limbs).filter(
        ([, goal]: [string, IHumanPosture.IGoal]): boolean =>
          goal.planted === true,
      ),
    );
    const ordered: IHumanPosture.Limb[] = resolveHumanPosture.order(plants);
    return resolveHumanPosture.refit(
      body,
      pose,
      plants,
      near === undefined
        ? undefined
        : Object.fromEntries(
            ordered.flatMap(
              (
                limb: IHumanPosture.Limb,
              ): [IHumanPosture.Limb, IAutoMovieSwivelNear][] => {
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
