import {
  IAutoMovieActionTarget,
  type IAutoMovieEnginePerformShotGateContext,
  type IAutoMovieResolvePerformShotTarget,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
  type IAutoMovieViolationAppendItemsSink,
} from "@automovie/interface";

import { POSITIONAL_TARGET_SHAPE } from "../../perform/POSITIONAL_TARGET_SHAPE";
import { positionalTargetFault } from "../../perform/internal/positionalTargetFault";
import { resolveTargetPoint } from "../../perform/internal/resolveTargetPoint";

/*
 * Gate one positional target of a performance and resolve it to a world point,
 * or report why it cannot be and answer `null`.
 *
 * Positional targets are a `lookAt`, `reach` or `locomote` destination, a
 * `react` source, a `point` or `strike` gesture aim, a `launch` aim, a `frame`
 * subject or focus, and a coverage subject. They resolve against every staged
 * placement, cameras included, so an actor may look down the lens.
 *
 * The checks run in this order, each answering `null` after its violation:
 *
 * 1. Unless `formationsFramed` is true, a group naming any formation is refused
 *    first, because only a lens frames a mass and every other target asks one
 *    body for one point; checking membership first would hide that.
 * 2. A `bone` target's actor must be a staged node with an actor context and a rig
 *    carrying that bone; a `group` must have every member staged, and each
 *    formation it names must be one this shot compiled.
 * 3. Missing nodes, malformed point vectors, empty groups and non-positional kinds
 *    are refused before invoking the live resolver.
 * 4. The point comes from the live resolver at `seconds` when it answers, and
 *    otherwise from the staged placements and opening formation points; a
 *    missing or non-finite point is refused naming the id that failed.
 * Parameter context: The shot's staged tables and collector.
 * Parameter props.target: The target as authored.
 * Parameter props.path: Violation path of the target.
 * Parameter props.label: Name of the target in id messages, such as `lookAt
 * target`.
 * Parameter props.subject: Name of the target in point messages, such as `a lookAt
 * target`.
 * Parameter props.seconds: Shot-local instant the live resolver is asked at.
 * Parameter props.formationsFramed: Whether the target asks where to point a lens.
 * Returns: The resolved world point in metres, or `null` after a violation.
 */
export function resolvePerformShotTarget(
  context: ITargetContext,
  props: IAutoMovieResolvePerformShotTarget.IProps,
): IAutoMovieVector3 | null {
  const target: IAutoMovieActionTarget = props.target;
  const path: string = props.path;
  const subject: string = props.subject;
  if (props.formationsFramed === false && target.kind === "group") {
    const named: readonly string[] = target.formations ?? [];
    if (named.length > 0) {
      context.out.push(
        "type",
        path,
        `${subject} must resolve to a point (${POSITIONAL_TARGET_SHAPE}), but its group names formation ${named
          .map((formation: string): string => `"${formation}"`)
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
    target.kind === "direction" ||
    target.kind === "offscreen" ||
    (target.kind === "node" && !context.nodePositions.has(target.node)) ||
    (target.kind === "group" &&
      target.nodes.length + (target.formations?.length ?? 0) === 0)
  ) {
    context.out.push(
      "type",
      path,
      `${subject} must resolve to a point (${POSITIONAL_TARGET_SHAPE}), but ${positionalTargetFault(target)}`,
      target,
    );
    return null;
  }
  const point: IAutoMovieVector3 | null | undefined =
    context.targetAt?.(target, props.seconds) ??
    resolveTargetPoint(target, context.nodePositions, context.formationPoints);
  if (point === null || point === undefined) {
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

/*
 * The staged lookups and collector one positional target reads.
 */
type ITargetContext = Pick<
  IAutoMovieEnginePerformShotGateContext,
  | "out"
  | "nodeIds"
  | "nodePositions"
  | "formationPoints"
  | "formationById"
  | "skeleton"
  | "hasActorContext"
  | "targetAt"
>;

/*
 * Check the ids a target carries, answering whether resolution may read it.
 */
function validateTargetIds(
  context: ITargetContext,
  target: IAutoMovieActionTarget,
  path: string,
  label: string,
): boolean {
  const out: IAutoMovieViolationAppendItemsSink = context.out;
  const initial: number = out.items.length;
  if (target.kind === "bone") {
    validateBoneTarget(context, target.node, target.bone, path);
    return out.items.length === initial;
  }
  if (target.kind === "group") {
    for (let index: number = 0; index < target.nodes.length; index++) {
      const node: string = target.nodes[index]!;
      if (!context.nodePositions.has(node))
        out.push(
          "type",
          `${path}.nodes[${index}]`,
          `${label} group member "${node}" must name a staged placement; omitting an unplaced member would change the authored group centroid`,
          node,
        );
    }
    if (target.formations === undefined) return out.items.length === initial;
    // A formation id must name a unit this shot compiled; otherwise the group
    // would fall back to its nodes and frame one figure instead of the crowd.
    for (let index: number = 0; index < target.formations.length; index++) {
      const formation: string = target.formations[index]!;
      if (!context.formationById.has(formation))
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
    }
    return out.items.length === initial;
  }
  return true;
}

/*
 * Check that a bone target names a rigged staged actor carrying the bone.
 */
function validateBoneTarget(
  context: ITargetContext,
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
