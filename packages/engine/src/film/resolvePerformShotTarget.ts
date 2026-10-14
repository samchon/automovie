import {
  IAutoMovieActionTarget,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { POSITIONAL_TARGET_SHAPE } from "../perform/constants/POSITIONAL_TARGET_SHAPE";
import { positionalTargetFault } from "../perform/positionalTargetFault";
import { resolveTargetPoint } from "../perform/resolveTargetPoint";
import { ViolationCollector } from "../validation/ViolationCollector";
import { describeInvalidValue } from "../validation/describeInvalidValue";
import { isRecord } from "../validation/isRecord";
import { IPerformShotGateContext } from "./IPerformShotGateContext";
import { isFiniteStageVector3 } from "./staging/isFiniteStageVector3";
import { validatePerformShotId } from "./validatePerformShotId";

/**
 * Gate one positional target of a performance and resolve it to a world point, or report why it cannot be and answer `null`.
 *
 * Positional targets are a `lookAt`, `reach` or `locomote` destination, a `react` source, a `point` or `strike` gesture aim, a `launch` aim, a `frame` subject or focus, and a coverage subject. They resolve against every staged placement, cameras included, so an actor may look down the lens.
 *
 * The checks run in this order, each answering `null` after its violation:
 *
 * 1. Unless `formationsFramed` is true, a group naming any formation is refused first, because only a lens frames a mass and every other target asks one body for one point; checking membership first would hide that.
 * 2. The target must be a record; a `bone` target's actor must be a staged node with an actor context and a rig carrying that bone; a `group` must list its nodes as an array with every member staged, and each formation it names must be one this shot compiled. Every id must be a non-blank string.
 * 3. Missing nodes, malformed point vectors, empty groups and non-positional kinds are refused before invoking the live resolver.
 * 4. The point comes from the live resolver at `seconds` when it answers, and otherwise from the staged placements and opening formation points; a missing or non-finite point is refused naming the id that failed.
 *
 * @param context The shot's staged tables and collector.
 * @param props.target The target as authored.
 * @param props.path Violation path of the target.
 * @param props.label Name of the target in id messages, such as `lookAt target`.
 * @param props.subject Name of the target in point messages, such as `a lookAt target`.
 * @param props.seconds Shot-local instant the live resolver is asked at.
 * @param props.formationsFramed Whether the target asks where to point a lens.
 * @returns The resolved world point in metres, or `null` after a violation.
 *
 * @evidence contracts/common.md#principled-implementation Structural checks on the untyped target precede resolution, so `resolveTargetPoint`, which trusts its input, only sees a well-formed target; the formation refusal runs before the id checks because it is the one fault the author can act on, and the live resolver is preferred because it reports where a moving target actually is.
 * @evidence contracts/common.md#clear-and-simple-design Resolution is the reference synthesizer's own `resolveTargetPoint` over the same placement table, so a target the gate accepts is a target the performer can aim at; the fault text is the shared `positionalTargetFault`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cameras resolve as placements without becoming performers; every named group member must exist so no centroid silently drops an authored member, and formation groups are accepted only by camera framing. Malformed or unsupported targets cannot be made valid by a permissive live callback.
 * @evidence contracts/common.md#meaningful-documentation States which targets reach it, the order of the checks and why the formation refusal is first, what each kind requires, where the point comes from, and the `null` answer after every violation.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes id trimming, group member/id/resolution walks and a bone target's rig scan; each absent formation also lists the supplied formation table, so repeated failures can repeat that population scan. Diagnostic representation size, user-defined conversion hooks and caller-supplied target/rig callbacks add their own unbounded work beyond those local traversals.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Gates one target per call; the placement and formation tables it reads are built once per shot in the context and shared by every call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pushes violations into the shared collector and retains nothing; the returned point is a staged or resolved vector the caller only reads.
 */
export function resolvePerformShotTarget (
  context: IPerformShotGateContext,
  props: {
    target: unknown;
    path: string;
    label: string;
    subject: string;
    seconds: number;
    formationsFramed: boolean;
  },
): IAutoMovieVector3 | null {
  const target: unknown = props.target;
  const path: string = props.path;
  const subject: string = props.subject;
  if (props.formationsFramed === false && isRecord(target)) {
    const named: unknown[] = Array.isArray(target.formations)
      ? target.formations
      : [];
    if (named.length > 0) {
      context.out.push(
        "type",
        path,
        `${subject} must resolve to a point (${POSITIONAL_TARGET_SHAPE}), but its group names formation ${named
          .map((formation: unknown): string => `"${describeInvalidValue(formation)}"`)
          .join(
            ", ",
          )}: a formation is a mass a camera frames, not one body with one point to aim at; name the staged nodes to aim at instead`,
        target,
      );
      return null;
    }
  }
  if (!validateTargetIds(context, target, path, props.label)) return null;
  if (
    (target.kind === "node" && !context.nodePositions.has(target.node)) ||
    (target.kind === "point" && !isFiniteStageVector3(target.point)) ||
    (target.kind === "group" && target.nodes.length + (target.formations?.length ?? 0) === 0) ||
    (target.kind !== "node" && target.kind !== "bone" && target.kind !== "point" && target.kind !== "group")
  ) {
    context.out.push("type", path, `${subject} must resolve to a point (${POSITIONAL_TARGET_SHAPE}), but ${positionalTargetFault(target)}`, target);
    return null;
  }
  const point: IAutoMovieVector3 | null | undefined =
    context.targetAt?.(target, props.seconds) ??
    resolveTargetPoint(target, context.nodePositions, context.formationPoints);
  if (
    point === null ||
    point === undefined ||
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    !Number.isFinite(point.z)
  ) {
    context.out.push(
      "type",
      path,
      `${subject} must resolve to a point (${POSITIONAL_TARGET_SHAPE}), but ${positionalTargetFault(target)}`,
      target,
    );
    return null;
  }
  return point;
}

/**
 * Check the ids an untyped target carries, answering whether it is a target record resolution may read.
 */
function validateTargetIds (
  context: IPerformShotGateContext,
  target: unknown,
  path: string,
  label: string,
): target is IAutoMovieActionTarget {
  const out: ViolationCollector = context.out;
  const initial: number = out.items.length;
  if (!isRecord(target)) {
    out.push("type", path, `${label} must be an action target`, target);
    return false;
  }
  if (target.kind === "node") {
    validatePerformShotId(out, target.node, `${path}.node`, `${label} node id`);
    return out.items.length === initial;
  }
  if (target.kind === "bone") {
    validatePerformShotId(
      out,
      target.node,
      `${path}.node`,
      `${label} bone node id`,
    );
    validatePerformShotId(out, target.bone, `${path}.bone`, `${label} bone id`);
    if (typeof target.node === "string" && typeof target.bone === "string")
      validateBoneTarget(context, target.node, target.bone, path);
    return out.items.length === initial;
  }
  if (target.kind === "group") {
    if (!Array.isArray(target.nodes)) {
      out.push(
        "type",
        `${path}.nodes`,
        `${label} group nodes must be an array`,
        target.nodes,
      );
      return false;
    }
    target.nodes.forEach((node: unknown, index: number): void => {
      validatePerformShotId(
        out,
        node,
        `${path}.nodes[${index}]`,
        `${label} group node id`,
      );
      if (
        typeof node === "string" &&
        node.trim().length > 0 &&
        !context.nodePositions.has(node)
      )
        out.push(
          "type",
          `${path}.nodes[${index}]`,
          `${label} group member "${node}" must name a staged placement; omitting an unplaced member would change the authored group centroid`,
          node,
        );
    });
    if (target.formations === undefined) return out.items.length === initial;
    if (!Array.isArray(target.formations)) {
      out.push(
        "type",
        `${path}.formations`,
        `${label} group formations must be an array`,
        target.formations,
      );
      return false;
    }
    // A formation id must name a unit this shot compiled; otherwise the group
    // would fall back to its nodes and frame one figure instead of the crowd.
    target.formations.forEach((formation: unknown, index: number): void => {
      validatePerformShotId(
        out,
        formation,
        `${path}.formations[${index}]`,
        `${label} group formation id`,
      );
      if (
        typeof formation === "string" &&
        formation.trim().length > 0 &&
        !context.formationById.has(formation)
      )
        out.push(
          "type",
          `${path}.formations[${index}]`,
          `${label} group formation "${formation}" is not one of this shot's compiled formations (${
            context.formationById.size === 0
              ? "none were supplied"
              : [...context.formationById.keys()].join(", ")
          })`,
          formation,
        );
    });
    return out.items.length === initial;
  }
  return true;
}

/** Check that a bone target names a rigged staged actor carrying the bone. */
function validateBoneTarget (
  context: IPerformShotGateContext,
  node: string,
  bone: string,
  path: string,
): void {
  if (!context.nodeIds.has(node)) {
    context.out.push(
      "type",
      `${path}.node`,
      `bone target actor "${node}" must be a staged scene node`,
      node,
    );
    return;
  }
  if (context.hasActorContext !== undefined && !context.hasActorContext(node)) {
    context.out.push(
      "type",
      `${path}.node`,
      `staged bone target actor "${node}" has no actor context`,
      node,
    );
    return;
  }
  const rig: IAutoMovieSkeleton | null = context.skeleton(node);
  if (rig === null)
    context.out.push(
      "type",
      `${path}.bone`,
      `staged bone target actor "${node}" has no rig`,
      bone,
    );
  else if (
    !rig.bones.some(
      (entry: IAutoMovieSkeleton["bones"][number]): boolean =>
        entry.bone === bone,
    )
  )
    context.out.push(
      "type",
      `${path}.bone`,
      `bone "${bone}" is not carried by rigged staged actor "${node}"`,
      bone,
    );
}
