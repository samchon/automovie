import { AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";

/*
 * Share rig preparation and exact FK prerequisites across one person's
 * synchronous displayed evaluation, including its transition-rate samples. The
 * body and its rig stay unchanged until that evaluation returns or throws.
 * Parameter body: The unchanged performer body of every borrowing stage.
 * Returns: Metadata and a lazy FK reader; no pose history or fit is retained.
 */
export function prepareHumanSegmentPose(
  body: IAutoMovieMotionHumanBody,
): prepareHumanSegmentPose.IPrepared {
  return fresh(body, prepareHumanPostureProjection(body));
}

/*
 * One independent FK workspace paired only with an owner-issued ROM mapper.
 */
function fresh(
  body: IAutoMovieMotionHumanBody,
  clamp: ReturnType<typeof prepareHumanPostureProjection>,
): prepareHumanSegmentPose.IPrepared {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  return {
    body,
    clamp,
    resolution,
  };
}

/*
 * Operation-owned preparation borrowed by displayed-pose stages.
 */
export namespace prepareHumanSegmentPose {
  /*
   * Issue independent evaluations within one synchronous unchanged-body scan:
   * the body's ROM metadata is prepared once here; each invocation creates a
   * fresh FK workspace and retains no prior workspace or result. Changed
   * body/rig/ROM data require a new scan producer.
   */
  export function queries(body: IAutoMovieMotionHumanBody): () => IPrepared {
    const clamp: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(body);
    return (): IPrepared => fresh(body, clamp);
  }

  /*
   * One synchronous evaluation's rig metadata and lazily demanded FK.
   *
   * The seeded evaluator checks the unchanged body's identity and lends only
   * its clamp and FK getter. Actual pose/joint scalars stay numerical inputs at
   * every use; no time, target or solved answer is stored here.
   */
  export interface IPrepared {
    /*
     * Same body identity required by every borrower.
     */
    readonly body: IAutoMovieMotionHumanBody;

    /*
     * Project each actual pose through the unchanged rig's ordinary ROM.
     */
    clamp(pose: IAutoMoviePose): IAutoMoviePose;

    /*
     * First demand acquires the exact reader; release this getter with the
     * evaluation.
     */
    resolution(): ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>;
  }
}
