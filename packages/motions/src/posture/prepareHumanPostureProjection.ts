import { clampPose } from "@automovie/engine";
import type { IAutoMoviePose } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";

/**
 * Prepare ordinary ROM projection for one synchronous unchanged-body operation.
 * The returned function projects every actual joint in order, without storing
 * a pose or projected answer. Its private provenance also lets direct posture
 * assembly borrow these same metadata instead of preparing a second index.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines unchanged body/rig/table scope, ordinary per-call projection, private issued-function provenance, cold fallback and synchronous release. Member facts: joints: Defines the same issued body/skeleton/rig/topology domain, actual one-joint callable loan, no admission verdict and the analytic consumer's full before/after live-check obligation.
 * @evidence contracts/development/implementation.md#principled-implementation Delegates actual projection to clampPose.prepare; first-bone constraints, clinical frames, last-declared axes and numerical clamping retain their engine owners. project accepts only an issued same-body/skeleton/rig/topology function and otherwise runs the original standalone clamp. Member facts: joints: The genuine pose factory lends the exact joint owner already used in this unchanged operation, while every current Jacobian articulation still receives its numerical projection.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One factory mints the genuine engine closure and companion project checks provenance before use; assembleHumanPosture remains the direct-joint assembly owner. Member facts: joints: This owner validates issued-domain membership before the engine's actual factory lookup; HumanJacobian retains current projections, factor order and derivative formation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An identity function or copied wrapper cannot bypass admission. No projected result, raw posture, goal, time, resolved flag or numerical acceptance decision is stored; every joint is still projected in original order. Member facts: joints: Unknown/wrapped/different-body loans decline without invocation. This lends no source-validation or differentiability verdict and skips neither live body checks nor actual tuple validation.
 * @evidence contracts/development/implementation.md#efficient-algorithms One operation prepares O(B+D) bone/name metadata for B bones and D joint names, then every call retains O(J) actual projections and fresh output wrappers/arrays for J joints. Provenance checks cost constant work. Member facts: joints: Reusing that index and swing-axis metadata removes a redundant O(B) preparation per eligible instantaneous Jacobian read; derivative/projection arithmetic remains and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller explicitly keeps body, rig and canonical tables unchanged through its synchronous evaluation. Same-body/skeleton/rig/topology identities establish this loan's domain; changing that domain or supplying an unissued function selects ordinary cold projection. Member facts: joints: Borrows the actual synchronous evaluator's genuine projection metadata within that same original operation boundary; no prior numerical answer supplies the derivative.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The operation owns one genuine clamp closure and weak provenance entry until release or throw. Only static rig metadata is retained, never a pose, target, result, FK reader or query history; returned pose ownership remains the engine's fresh wrapper/array and borrowed-member contract. Member facts: joints: The borrower releases the already owned callable on operation completion/refusal/throw; no extra body pool, comparison verdict, joint or history is retained.
 */
export function prepareHumanPostureProjection(
  body: IHumanBody,
): ReturnType<typeof clampPose.prepare> {
  const project: ReturnType<typeof clampPose.prepare> = clampPose.prepare(body.skeleton);
  ISSUED.set(project, { body, skeleton: body.skeleton, rig: body.poseResolution, topology: body.topology });
  return project;
}

/**
 * Checked consumption of one operation's genuine projection function.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines project input/output and exact producer membership checks, unchanged-body premise and cold fallback on an invalid loan.
 * @evidence contracts/development/design.md#principled-representation Weak issued-function provenance binds an actual engine projection to its body and static rig domain, without representing a solved posture or admitting a caller-supplied verdict.
 * @evidence contracts/development/design.md#minimal-and-owned-surface project serves direct posture assembly; joints lends its actual same-operation ROM owner to the analytic Jacobian. The ordinary returned clamp also serves existing final transition/contact projections in that operation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No public marker or writable token asserts admission; unknown functions and changed body/rig identities fall back to the original engine mapper.
 */
export namespace prepareHumanPostureProjection {
  /**
   * Borrow an issued same-body operation's actual one-joint ROM projection.
   * The operation keeps its body and canonical tables unchanged; an analytic
   * consumer still performs its full live rig checks before and after use.
   * No projected joint or source-validation verdict is returned.
   *
   * @param body The same operation's unchanged body and rig domain.
   * @param source Its actual issued pose-clamp function, if supplied.
   * @returns The same factory's one-joint owner, or undefined for ordinary cold preparation.
   *
   * Issued-domain membership is checked before the engine's private factory
   * lookup. Unknown, wrapped or other-body functions decline without being
   * invoked. Borrowing avoids repeated index/swing-axis setup but retains
   * every actual projection and derivative check, with no numerical answer,
   * source-verdict cache, extra body pool, query history or handle retained.
   */
  export function joints(
    body: IHumanBody,
    source?: ReturnType<typeof clampPose.prepare>,
  ): ReturnType<typeof clampPose.joints> {
    const issued: ISource | undefined = source === undefined ? undefined : ISSUED.get(source);
    return issued !== undefined && issued.body === body && issued.skeleton === body.skeleton &&
      issued.rig === body.poseResolution && issued.topology === body.topology
      ? clampPose.joints(source!) : undefined;
  }

  /** Project every actual joint using a genuine same-operation loan or ordinary cold metadata. */
  export function project(
    body: IHumanBody,
    pose: IAutoMoviePose,
    source?: ReturnType<typeof clampPose.prepare>,
  ): IAutoMoviePose {
    const issued: ISource | undefined = source === undefined ? undefined : ISSUED.get(source);
    return issued !== undefined && issued.body === body && issued.skeleton === body.skeleton &&
      issued.rig === body.poseResolution && issued.topology === body.topology
      ? source!(pose) : clampPose(pose, body.skeleton);
  }
}

/** Static producer domain; the caller keeps these inputs unchanged for the operation. */
interface ISource {
  body: IHumanBody;
  skeleton: IHumanBody["skeleton"];
  rig: IHumanBody["poseResolution"];
  topology: IHumanBody["topology"];
}

/** A genuine function's metadata releases when that operation function is released. */
const ISSUED: WeakMap<ReturnType<typeof clampPose.prepare>, ISource> = new WeakMap();
