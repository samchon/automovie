import type { IAutoMovieSwivelNear } from "@automovie/engine";
import type { IAutoMoviePose } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { refitHumanPosture } from "../posture/refitHumanPosture";
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
    body: IHumanBody,
    pose: IAutoMoviePose,
    limbs: IHumanPosture["limbs"],
    near?: HumanSegmentPose.INear,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): resolveHumanPosture.ISeeded {
    const selected: [string, IHumanPosture.IGoal][] = Object.entries(limbs).filter(
      ([, goal]: [string, IHumanPosture.IGoal]): boolean => goal.planted === true,
    );
    if (selected.length === 0 && near === undefined) return { pose, seeds: {}, values: {} };
    const plants: IHumanPosture["limbs"] = Object.fromEntries(selected);
    const ordered: IHumanPosture.Limb[] = resolveHumanPosture.order(plants);

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
