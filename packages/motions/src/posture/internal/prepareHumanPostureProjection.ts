import {
  AutoMovieEngineKinematics,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
} from "@automovie/interface";

/*
 * A body's ordinary ROM projection: every actual joint of a pose projected in
 * order through the engine's pose clamp, with no pose or projected answer
 * stored. The projection is the body's own constant (`IHumanBody.projection`),
 * built once on the rig the body was made from; this reads it, so every
 * operation of a body projects through the same prepared metadata.
 * Parameter body: The body.
 * Returns: The body's pose clamp.
 */
export function prepareHumanPostureProjection(
  body: IAutoMovieMotionHumanBody,
): (pose: IAutoMoviePose) => IAutoMoviePose {
  return body.projection;
}

/*
 * Consumption of a body's projector where a caller may pass a function.
 */
export namespace prepareHumanPostureProjection {
  /*
   * The one-joint ROM projection of a body's own projector. An analytic
   * consumer still performs its full live rig checks before and after use. No
   * projected joint or source-validation verdict is returned.
   * Parameter body: The body.
   * Parameter source: The pose clamp the caller holds, if any.
   * Returns: The body's projector's one-joint owner when `source` is that
   * projector, or undefined for ordinary cold preparation.
   *
   * Identity with the body's projector is tested before its joints member is
   * read. Another function declines without being invoked. No numerical
   * answer, verdict, query history or handle is retained.
   */
  export function joints(
    body: IAutoMovieMotionHumanBody,
    source?: (pose: IAutoMoviePose) => IAutoMoviePose,
  ): ReturnType<typeof AutoMovieEngineKinematics.prepareClampPose>["joints"] | undefined {
    return source !== undefined && source === body.projection
      ? body.projection.joints
      : undefined;
  }

  /*
   * The angle-taking form of the body's projector's one-joint owner
   * (`AutoMovieEngineKinematics.prepareClampPose`, whose returned projector carries `values`): a joint's record
   * made in range from its bone and three clinical angles, the record `joints`'
   * owner gives for the record of those values. Identity with the body's
   * projector is tested first; another function declines without being
   * invoked.
   * Parameter body: The body.
   * Parameter source: The pose clamp the caller holds, if any.
   * Returns: The form when `source` is the body's projector, or undefined.
   */
  export function values(
    body: IAutoMovieMotionHumanBody,
    source?: (pose: IAutoMoviePose) => IAutoMoviePose,
  ): ReturnType<typeof AutoMovieEngineKinematics.prepareClampPose>["values"] | undefined {
    return source !== undefined && source === body.projection
      ? body.projection.values
      : undefined;
  }

  /*
   * Project every actual joint of a pose through the body's projector;
   * `source`, the function a caller passes along, is used only when it is that
   * projector, which it then is.
   */
  export function project(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    _source?: (pose: IAutoMoviePose) => IAutoMoviePose,
  ): IAutoMoviePose {
    return body.projection(pose);
  }
}
