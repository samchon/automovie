import { clampPose, preparePoseResolution } from "@automovie/engine";
import type { IAutoMoviePose } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";

/**
 * Share rig preparation and exact FK prerequisites across one person's
 * synchronous displayed evaluation, including its transition-rate samples.
 * The body and its rig stay unchanged until that evaluation returns or throws.
 *
 * @param body The unchanged performer body of every borrowing stage.
 * @returns Metadata and a lazy FK reader; no displayed pose or fit is retained.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the one-person operation lifetime, unchanged rig premise and lazy reader ownership.
 * @evidence contracts/development/implementation.md#principled-implementation clampPose.prepare indexes unchanged rig constraints while preparePoseResolution shares only exact clinical/rest/ancestor scalars; numerical projections, target fits and fresh output records still run.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One record owns the clamp and one lazy FK getter; each physical stage receives the same explicit operation source without a global active context.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pose, goal, near seed, fit, time sample or callback result is memoized; changed FK dependencies reach the ordinary numerical owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Clamp metadata costs O(B+D) for B rig bones and D requested joint names once; the first actual FK demand creates one exact reader and subsequent demands return it in constant time. Every clamp still projects all its joints and every fit keeps its search; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work An explicitly lent record identifies one unchanged-body evaluation and shares only rig metadata and exact FK prerequisites across its overlays, carries, stops, transitions and final plants.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The outer seeded evaluation owns this record until synchronous return or throw. Clamp metadata and one last successful FK tuple per visited name release with it; no plan, transition offset, returned pose or result seed stores the record or reader.
 */
export function prepareHumanSegmentPose(
  body: IHumanBody,
): prepareHumanSegmentPose.IPrepared {
  let resolution: ReturnType<typeof preparePoseResolution> | undefined;
  return {
    body,
    clamp: clampPose.prepare(body.skeleton),
    resolution: (): ReturnType<typeof preparePoseResolution> =>
      (resolution ??= preparePoseResolution()),
  };
}

/**
 * Operation-owned preparation borrowed by displayed-pose stages.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents IPrepared's same-body admission, actual clamp behavior, lazy FK getter and synchronous release boundary; the companion record introduces no target or result state.
 * @evidence contracts/development/design.md#principled-representation One unchanged body supplies the rig; actual poses and FK dependencies remain inputs of each numerical operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The body admission, clamp and lazy reader are exactly the fields used by the seeded evaluator and its physical stages.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record carries no sample time, goal or fitted result and cannot act as a frame-result cache.
 */
export namespace prepareHumanSegmentPose {
  /**
   * One synchronous evaluation's rig metadata and lazily demanded FK.
   *
   * The seeded evaluator checks the unchanged body's identity and lends
   * only its clamp and FK getter. Actual pose/joint scalars stay numerical
   * inputs at every use; no time, target or solved answer is stored here.
   */
  export interface IPrepared {
    /** Same body identity required by every borrower. */
    readonly body: IHumanBody;

    /** Project each actual pose through the unchanged rig's ordinary ROM. */
    clamp(pose: IAutoMoviePose): IAutoMoviePose;

    /** First demand acquires the exact reader; release this getter with the evaluation. */
    resolution(): ReturnType<typeof preparePoseResolution>;
  }
}
