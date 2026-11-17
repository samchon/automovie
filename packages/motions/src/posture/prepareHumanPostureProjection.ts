import { HUMANOID_JOINT_AXES, clampPose, getConstraint } from "@automovie/engine";
import type {
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMoviePose,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";

/**
 * A body's ordinary ROM projection: every actual joint of a pose projected in
 * order through the engine's pose clamp, with no pose or projected answer
 * stored. A body keeps one genuine projector while its rig's records stay the
 * ones the projector was prepared on; each request compares them and prepares
 * a new projector when any was replaced, so a constraint or axes record put on
 * a bone is read by the next request. Its private provenance also lets direct
 * posture assembly borrow the same metadata instead of preparing a second
 * index.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the body's kept projector, which rig records decide that it is still current, ordinary per-call projection, private issued-function provenance and the kept fallback. Member facts: joints: Defines the same issued body/skeleton/rig/topology domain, actual one-joint callable loan, no admission verdict and the analytic consumer's full before/after live-check obligation.
 * @evidence contracts/development/implementation.md#principled-implementation Delegates actual projection to clampPose.prepare; first-bone constraints, clinical frames, last-declared axes and numerical clamping retain their engine owners, which read every interval bound at each projection. The prepared closure holds only what it read from the rig's records at preparation (each bone's constraint and axes references and a gated joint's normalized axes), so comparing those records by reference, and a gated joint's axis components by value, proves the closure still describes the rig. project accepts only an issued same-body/skeleton/rig/topology function and otherwise projects through the body's kept one.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One factory mints the genuine engine closure with the record snapshot that keeps it and companion project checks provenance before use; assembleHumanPosture remains the direct-joint assembly owner. Member facts: joints: This owner validates issued-domain membership before the engine's actual factory lookup; HumanJacobian retains current projections, factor order and derivative formation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An identity function or copied wrapper cannot bypass admission. No projected result, raw posture, goal, time, resolved flag or numerical acceptance decision is stored; every joint is still projected in original order. The canonical ROM and axes tables are read through their records, so an entry replaced in them is seen like a bone's own. Member facts: joints: Unknown/wrapped/different-body loans decline without invocation. This lends no source-validation or differentiability verdict and skips neither live body checks nor actual tuple validation.
 * @evidence contracts/development/implementation.md#efficient-algorithms A request compares B bone records, each with its constraint, gate and axes references and nine components for a gated joint's axes, and prepares O(B+D) bone/name metadata for D joint names only when one differs; every call retains O(J) actual projections and fresh output wrappers/arrays for J joints. Member facts: joints: Reusing that index and swing-axis metadata removes a redundant O(B) preparation per eligible instantaneous Jacobian read; derivative/projection arithmetic remains and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Equivalence is the body's skeleton, prepared rig and topology identities, the bones array with each record, each bone's effective constraint, swing-twist gate and axes records, and a gated joint's axis components and twist placement; any difference prepares a new projector. Interval bounds are not part of it because the engine clamp reads them at each projection. Member facts: joints: Borrows the actual synchronous evaluator's genuine projection metadata within that same original operation boundary; no prior numerical answer supplies the derivative.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A weak body entry owns one genuine clamp closure and one O(B) record snapshot, replaced when the rig's records change and released with the body. Only static rig metadata is retained, never a pose, target, result, FK reader or query history; returned pose ownership remains the engine's fresh wrapper/array and borrowed-member contract. Member facts: joints: The borrower releases the already owned callable on operation completion/refusal/throw; no extra body pool, comparison verdict, joint or history is retained.
 */
export function prepareHumanPostureProjection(
  body: IHumanBody,
): ReturnType<typeof clampPose.prepare> {
  const kept: IKept | undefined = KEPT.get(body);
  if (kept !== undefined && current(kept, body)) return kept.project;

  const project: ReturnType<typeof clampPose.prepare> = clampPose.prepare(body.skeleton);
  ISSUED.set(project, { body, skeleton: body.skeleton, rig: body.poseResolution, topology: body.topology });
  KEPT.set(body, snapshot(body, project));
  return project;
}

/**
 * Checked consumption of one operation's genuine projection function.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines project input/output and exact producer membership checks, unchanged-body premise and the kept projector an invalid loan falls back to.
 * @evidence contracts/development/design.md#principled-representation Weak issued-function provenance binds an actual engine projection to its body and static rig domain, without representing a solved posture or admitting a caller-supplied verdict.
 * @evidence contracts/development/design.md#minimal-and-owned-surface project serves direct posture assembly; joints lends its actual same-operation ROM owner to the analytic Jacobian. The ordinary returned clamp also serves existing final transition/contact projections in that operation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No public marker or writable token asserts admission; unknown functions and changed body/rig identities fall back to the body's own current projector.
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

  /** Project every actual joint using a genuine same-operation loan, or the body's own current projector without one. */
  export function project(
    body: IHumanBody,
    pose: IAutoMoviePose,
    source?: ReturnType<typeof clampPose.prepare>,
  ): IAutoMoviePose {
    const issued: ISource | undefined = source === undefined ? undefined : ISSUED.get(source);
    return issued !== undefined && issued.body === body && issued.skeleton === body.skeleton &&
      issued.rig === body.poseResolution && issued.topology === body.topology
      ? source!(pose) : prepareHumanPostureProjection(body)(pose);
  }
}

/** Static producer domain; the caller keeps these inputs unchanged for the operation. */
interface ISource {
  body: IHumanBody;
  skeleton: IHumanBody["skeleton"];
  rig: IHumanBody["poseResolution"];
  topology: IHumanBody["topology"];
}

/** A body's projector with the rig records it was prepared on. */
interface IKept extends Omit<ISource, "body"> {
  /** The genuine engine pose clamp. */
  project: ReturnType<typeof clampPose.prepare>;

  /** The skeleton's bones array. */
  list: readonly IAutoMovieBone[];

  /** Each bone record, in the array's order. */
  bones: readonly IAutoMovieBone[];

  /** Each bone's effective constraint record: its own, else the humanoid table's, else none. */
  constraints: readonly (IAutoMovieJointConstraint | null)[];

  /** Each bone's swing-twist gate record, which decides whether its clamp prepares a frame. */
  gates: readonly IAutoMovieJointConstraint["swingTwist"][];

  /** Each bone's effective axes record: its own, else the humanoid table's. */
  axes: readonly (IAutoMovieJointAxes | undefined)[];

  /** A gated bone's nine axis components and twist placement, which its prepared frame normalizes once; none for the others. */
  bases: readonly (readonly (number | string | undefined)[] | undefined)[];
}

/** A genuine function's metadata releases when that operation function is released. */
const ISSUED: WeakMap<ReturnType<typeof clampPose.prepare>, ISource> = new WeakMap();

/** Each live body's current projector. */
const KEPT: WeakMap<IHumanBody, IKept> = new WeakMap();

/** The rig records a new projector reads at its preparation. */
function snapshot(body: IHumanBody, project: ReturnType<typeof clampPose.prepare>): IKept {
  const list: readonly IAutoMovieBone[] = body.skeleton.bones;
  const bones: IAutoMovieBone[] = [];
  const constraints: (IAutoMovieJointConstraint | null)[] = [];
  const gates: IAutoMovieJointConstraint["swingTwist"][] = [];
  const axes: (IAutoMovieJointAxes | undefined)[] = [];
  const bases: (readonly (number | string | undefined)[] | undefined)[] = [];
  for (const bone of list) {
    const constraint: IAutoMovieJointConstraint | null = getConstraint(bone.bone, bone.constraint ?? null);
    const basis: IAutoMovieJointAxes | undefined = bone.axes ?? HUMANOID_JOINT_AXES[bone.bone];
    const gate: IAutoMovieJointConstraint["swingTwist"] = constraint?.swingTwist;
    bones.push(bone);
    constraints.push(constraint);
    gates.push(gate);
    axes.push(basis);
    bases.push(gate === undefined || gate === null || basis === undefined ? undefined : components(basis));
  }
  return { project, skeleton: body.skeleton, rig: body.poseResolution, topology: body.topology,
    list, bones, constraints, gates, axes, bases };
}

/** Whether every record a kept projector read is still the body's. */
function current(kept: IKept, body: IHumanBody): boolean {
  if (kept.skeleton !== body.skeleton || kept.rig !== body.poseResolution || kept.topology !== body.topology)
    return false;
  const list: readonly IAutoMovieBone[] = body.skeleton.bones;
  if (list !== kept.list || list.length !== kept.bones.length) return false;
  for (let i: number = 0; i < list.length; ++i) {
    const bone: IAutoMovieBone = list[i]!;
    if (bone !== kept.bones[i]) return false;
    const constraint: IAutoMovieJointConstraint | null = getConstraint(bone.bone, bone.constraint ?? null);
    const basis: IAutoMovieJointAxes | undefined = bone.axes ?? HUMANOID_JOINT_AXES[bone.bone];
    if (constraint !== kept.constraints[i] || constraint?.swingTwist !== kept.gates[i] || basis !== kept.axes[i])
      return false;
    const saved: readonly (number | string | undefined)[] | undefined = kept.bases[i];
    if (saved === undefined || basis === undefined) continue;
    const now: readonly (number | string | undefined)[] = components(basis);
    for (let k: number = 0; k < saved.length; ++k)
      if (!Object.is(saved[k], now[k])) return false;
  }
  return true;
}

/** An axes record's nine components and its twist placement, in one fixed order. */
function components(axes: IAutoMovieJointAxes): readonly (number | string | undefined)[] {
  return [
    axes.flexion.x, axes.flexion.y, axes.flexion.z,
    axes.abduction.x, axes.abduction.y, axes.abduction.z,
    axes.twist.x, axes.twist.y, axes.twist.z,
    axes.twistPlacement,
  ];
}
