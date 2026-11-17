import { clampPose } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
} from "@automovie/interface";

/**
 * A body's ordinary ROM projection: every actual joint of a pose projected in
 * order through the engine's pose clamp, with no pose or projected answer
 * stored. The projection is the body's own constant (`IHumanBody.projection`),
 * built once on the rig the body was made from; this reads it, so every
 * operation of a body projects through the same prepared metadata.
 *
 * @param body The body.
 * @returns The body's pose clamp.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the body-owned projector, ordinary per-call projection and what a function that is not the body's does. Member facts: joints: Defines the one-joint callable of the body's own projector, no admission verdict and the analytic consumer's full before/after live-check obligation.
 * @evidence contracts/development/implementation.md#principled-implementation Actual projection is the engine's clampPose.prepare on the body's rig; first-bone constraints, clinical frames, last-declared axes and numerical clamping retain their engine owners. A body describes the rig it was made from (`IHumanBody`), so its projector is prepared once with it and a rig edit is adopted by making a body. Member facts: joints: The body's pose clamp lends the exact joint owner it projects with, while every current Jacobian articulation still receives its numerical projection.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The body owns the projector; this entry and its two companions only read it, and assembleHumanPosture remains the direct-joint assembly owner. Member facts: joints: One identity test before the engine's factory lookup; HumanJacobian retains current projections, factor order and derivative formation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No projected result, raw posture, goal, time, resolved flag or numerical acceptance decision is stored; every joint is still projected in original order. Member facts: joints: A function that is not this body's projector declines without invocation. This lends no source-validation or differentiability verdict and skips neither live body checks nor actual tuple validation.
 * @evidence contracts/development/implementation.md#efficient-algorithms One property read. The projector prepares O(B+D) bone/name metadata for B bones and D joint names once a body, at each name's first projection, and every call retains O(J) actual projections and fresh output wrappers/arrays for J joints. Member facts: joints: Reads the projector's existing index and swing-axis metadata; derivative/projection arithmetic remains and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every operation of one body shares the body's one projector because the body and its rig are one value; nothing is compared or looked up. Member facts: joints: The same projector's one-joint owner; no prior numerical answer supplies the derivative.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing: the body owns its projector and its static rig metadata for the body's life, never a pose, target, result, FK reader or query history; returned pose ownership remains the engine's fresh wrapper/array and borrowed-member contract. Member facts: joints: The borrower holds the body's callable only for its operation.
 */
export function prepareHumanPostureProjection(
  body: IAutoMovieMotionHumanBody,
): (pose: IAutoMoviePose) => IAutoMoviePose {
  return body.projection;
}

/**
 * Consumption of a body's projector where a caller may pass a function.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines project input/output, the identity that selects a passed function and the body's own projector otherwise.
 * @evidence contracts/development/design.md#principled-representation A body's projector is one function owned by the body; a passed function is that projector or it is not, by identity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface project serves direct posture assembly; joints lends the projector's one-joint owner to the analytic Jacobian.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No public marker or writable token asserts admission; any other function is not used and the body's own projector projects.
 */
export namespace prepareHumanPostureProjection {
  /**
   * The one-joint ROM projection of a body's own projector. An analytic
   * consumer still performs its full live rig checks before and after use.
   * No projected joint or source-validation verdict is returned.
   *
   * @param body The body.
   * @param source The pose clamp the caller holds, if any.
   * @returns The body's projector's one-joint owner when `source` is that projector, or undefined for ordinary cold preparation.
   *
   * Identity with the body's projector is tested before its joints member
   * is read. Another function declines without being invoked. No
   * numerical answer, verdict, query history or handle is retained.
   */
  export function joints(
    body: IAutoMovieMotionHumanBody,
    source?: (pose: IAutoMoviePose) => IAutoMoviePose,
  ): clampPose.IPrepared["joints"] | undefined {
    return source !== undefined && source === body.projection ? body.projection.joints : undefined;
  }

  /**
   * The angle-taking form of the body's projector's one-joint owner
   * (`clampPose.IPrepared.values`, a member of the projector): a joint's record made in range from its bone and
   * three clinical angles, the record `joints`' owner gives for the record
   * of those values. Identity with the body's projector is tested first;
   * another function declines without being invoked.
   *
   * @param body The body.
   * @param source The pose clamp the caller holds, if any.
   * @returns The form when `source` is the body's projector, or undefined.
   */
  export function values(
    body: IAutoMovieMotionHumanBody,
    source?: (pose: IAutoMoviePose) => IAutoMoviePose,
  ): clampPose.IPrepared["values"] | undefined {
    return source !== undefined && source === body.projection ? body.projection.values : undefined;
  }

  /** Project every actual joint of a pose through the body's projector; `source`, the function a caller passes along, is used only when it is that projector, which it then is. */
  export function project(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    _source?: (pose: IAutoMoviePose) => IAutoMoviePose,
  ): IAutoMoviePose {
    return body.projection(pose);
  }
}
