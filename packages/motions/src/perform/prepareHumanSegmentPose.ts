import type { preparePoseResolution } from "@automovie/engine";
import type { IAutoMoviePose } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";

/**
 * Share rig preparation and exact FK prerequisites across one person's
 * synchronous displayed evaluation, including its transition-rate samples.
 * The body and its rig stay unchanged until that evaluation returns or throws.
 *
 * @param body The unchanged performer body of every borrowing stage.
 * @returns Metadata and a lazy FK reader; no displayed pose or fit is retained.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States same-body unchanged-rig and lazy FK ownership. queries prepares one genuine static ROM mapper for a synchronous fixed-body scan while issuing independent FK workspaces for its actual queries.
 * @evidence contracts/development/implementation.md#principled-implementation Genuine clampPose.prepare provenance lets direct assembly/final clamps share ROM metadata. The lazy raw reader supplies an operation key; the canonical body.poseResolution producer owns exact joint/bone and relative/placed rows under that weak key. Raw adapter bone reads retain ordinary admission/getter order, and all projections, fits and outputs remain actual.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One private factory pairs a genuine clamp with the actual prepareHumanPoseResolution-issued lazy getter, preserving private native-source provenance without calling a supplier to inspect it. Ordinary preparation owns both; queries shares only fixed ROM metadata and issues a fresh getter per query.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pose, goal, near seed, fit, time sample or callback result is memoized; changed FK dependencies reach the ordinary numerical owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Genuine clamp metadata costs O(B+D) for B rig bones/D names once per ordinary evaluation or queries scan. Each fresh workspace creates its exact FK reader only on demand, with constant-time later access; every actual projection and fit remains, and no measured speedup is claimed.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each record identifies one unchanged-body evaluation. Genuine ROM metadata reaches all actual direct/final clamps; queries shares that static metadata across a fixed-body contact scan, while each query receives a separate empty FK source and reads its current poses, goals, stops and near contexts normally. No unknown projection is accepted.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The evaluation owns its record/raw operation key until return/throw; canonical body FK retains last successful dependency rows under that weak key. queries owns only body plus one lazy genuine ROM mapper until scan release, never prior keys/workspaces, poses, seeds or time history. No plan/offset/result stores either preparation.
 */
export function prepareHumanSegmentPose(
  body: IHumanBody,
): prepareHumanSegmentPose.IPrepared {
  return fresh(body, prepareHumanPostureProjection(body));
}

/** One independent FK workspace paired only with an owner-issued ROM mapper. */
function fresh(body: IHumanBody, clamp: ReturnType<typeof prepareHumanPostureProjection>):
  prepareHumanSegmentPose.IPrepared {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
  return {
    body,
    clamp,
    resolution,
  };
}

/**
 * Operation-owned preparation borrowed by displayed-pose stages.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents IPrepared's same-body admission, actual clamp behavior, lazy FK getter and synchronous release boundary; the companion record introduces no target or result state.
 * @evidence contracts/development/design.md#principled-representation One unchanged body supplies the rig; actual poses and FK dependencies remain inputs of each numerical operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Body admission, clamp and lazy FK reader serve displayed stages; the actual fixed-person contact scanner uses queries to issue those same records without re-preparing static ROM metadata.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record carries no sample time, goal or fitted result and cannot act as a frame-result cache.
 */
export namespace prepareHumanSegmentPose {
  /**
   * Issue independent evaluations within one synchronous unchanged-body scan.
   * The first actual query prepares genuine ROM metadata; each invocation
   * creates a fresh lazy FK workspace and retains no prior workspace or result.
   * Changed body/rig/ROM data require a new scan producer. Every actual joint
   * still projects normally, and release of the scan releases its mapper.
   */
  export function queries(body: IHumanBody): () => IPrepared {
    let clamp: ReturnType<typeof prepareHumanPostureProjection> | undefined;
    return (): IPrepared => {
      if (clamp === undefined) clamp = prepareHumanPostureProjection(body);
      return fresh(body, clamp);
    };
  }

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
