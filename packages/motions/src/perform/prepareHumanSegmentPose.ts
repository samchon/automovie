import { preparePoseResolution } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";

/**
 * Share rig preparation and exact FK prerequisites across one person's
 * synchronous displayed evaluation, including its transition-rate samples.
 * The body and its rig stay unchanged until that evaluation returns or throws.
 *
 * @param body The unchanged performer body of every borrowing stage.
 * @returns Metadata and a lazy FK reader; no pose history or fit is retained.
 */
export function prepareHumanSegmentPose(
  body: IAutoMovieMotionHumanBody,
): prepareHumanSegmentPose.IPrepared {
  return fresh(body, prepareHumanPostureProjection(body));
}

/** One independent FK workspace paired only with an owner-issued ROM mapper. */
function fresh(body: IAutoMovieMotionHumanBody, clamp: ReturnType<typeof prepareHumanPostureProjection>):
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
 */
export namespace prepareHumanSegmentPose {
  /**
   * Issue independent evaluations within one synchronous unchanged-body scan.
   * The first actual query prepares genuine ROM metadata; each invocation
   * creates a fresh lazy FK workspace and retains no prior workspace or result.
   * Changed body/rig/ROM data require a new scan producer. Every actual joint
   * still projects normally, and release of the scan releases its mapper.
   */
  export function queries(body: IAutoMovieMotionHumanBody): () => IPrepared {
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
    readonly body: IAutoMovieMotionHumanBody;

    /** Project each actual pose through the unchanged rig's ordinary ROM. */
    clamp(pose: IAutoMoviePose): IAutoMoviePose;

    /** First demand acquires the exact reader; release this getter with the evaluation. */
    resolution(): ReturnType<typeof preparePoseResolution>;
  }
}
