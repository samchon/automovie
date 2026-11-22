import type {
  IAutoMovieActionTarget,
  IAutoMovieCameraIntent,
  IAutoMovieCompilePerformShotCameras,
  IAutoMovieCompiledFormation,
  IAutoMovieEnginePerformShotGateContext,
  IAutoMovieMotion,
  IAutoMoviePerformShotFrameJob,
  IAutoMovieQuaternion,
  IAutoMovieSampledChannel,
  IAutoMovieVector3,
} from "@automovie/interface";

import { resolveTargetPoint } from "../perform/resolveTargetPoint";
import { channelKey } from "../resolve/channelKey";
import { sampleClipSequence } from "../resolve/sampleClipSequence";
import { sampleFormationMotion } from "../sampleFormationMotion";
import { transformFormationPoint } from "../transformFormationPoint";
import { isRecord } from "../validation/isRecord";
import { animatedBaseAt } from "./animatedBaseAt";
import { resolvePerformShotTarget } from "./resolvePerformShotTarget";

/**
 * Admit and resolve one frame action's two focus marks in world metres.
 * The caller consumes located findings before publishing the shot. An
 * automatic frame ends at the next frame's start or the shot end. An explicit
 * frame can end earlier. Both are bounded by the next frame start.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the units, automatic boundary and handling of findings. Returns two points and the shot-local seconds of their marks when both are admitted.
 * @evidence contracts/development/implementation.md#principled-implementation The existing positional-target gate prefers the live point and otherwise samples the compiled actor roots, object translation and formation centroids at each mark.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admits shape and time here. The shared point gate validates targets and coordinates, and motion samplers own interpolation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Requires an explicit source and refuses collapsed marks or endpoints beyond the frame-overlap tolerance. Endpoints inside that tolerance land on the span boundary. A bone needs the live target resolver. No camera pose or depth-of-field model is consulted.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most two target resolves. Each mark may sample object clips once, plus the motion and cues for the named members. It does not enumerate frames.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One object sample serves the named nodes of a group at each mark. The two marks query distinct instants.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Point tables and sampled channels are local to one mark. The return owns two copies of the resolved vectors.
 */
export function compilePerformShotFocusPull(
  context: IAutoMovieEnginePerformShotGateContext,
  props: IAutoMovieCompilePerformShotCameras.IProps,
  job: IAutoMoviePerformShotFrameJob,
  nextStart: number,
): {
  focus: IAutoMovieVector3;
  focusPull: NonNullable<IAutoMovieCameraIntent["focusPull"]>;
} | null {
  const action: IAutoMoviePerformShotFrameJob["action"] = job.action;
  const pull: unknown = action.focusPull;
  const path: string = `${context.base}[${job.index}]`;
  const pullPath: string = `${path}.focusPull`;
  if (!isRecord(pull)) {
    context.out.push("type", pullPath, "a focus pull must be an object", pull);
    return null;
  }

  if (action.focus === undefined)
    context.out.push(
      "type",
      `${path}.focus`,
      "a focus pull requires an explicit source target",
      action.focus,
    );
  const offset: number =
    typeof pull.start === "number" ? pull.start : Number.NaN;
  const duration: number =
    typeof pull.duration === "number" ? pull.duration : Number.NaN;
  const validOffset: boolean = Number.isFinite(offset) && offset >= 0;
  const validDuration: boolean = Number.isFinite(duration) && duration > 0;
  if (!validOffset)
    context.out.push(
      "range",
      `${pullPath}.start`,
      "a focus pull start must be finite seconds >= 0 from the frame start",
      pull.start,
    );
  if (!validDuration)
    context.out.push(
      "range",
      `${pullPath}.duration`,
      "a focus pull duration must be finite seconds > 0",
      pull.duration,
    );
  if (!validOffset || !validDuration) return null;

  const start: number = action.start + offset;
  const requestedEnd: number = action.start + (offset + duration);
  const frameEnd: number =
    action.duration === "auto"
      ? nextStart
      : Math.min(nextStart, action.start + action.duration);

  // Canonicalize decimal sums at a frame boundary using the overlap tolerance.
  const difference: number = requestedEnd - frameEnd;
  const end: number = Math.abs(difference) <= 1e-9 ? frameEnd : requestedEnd;
  if (end <= start || difference > 1e-9) {
    context.out.push(
      "range",
      `${pullPath}.duration`,
      `focus pull marks must be distinct and lie within the frame ending at ${frameEnd}s`,
      pull.duration,
    );
    return null;
  }

  const motionContext: IAutoMovieEnginePerformShotGateContext = {
    ...context,
    targetAt: (
      target: IAutoMovieActionTarget,
      seconds: number,
    ): IAutoMovieVector3 | null =>
      context.targetAt?.(target, seconds) ??
      sampledPoint(context, props, target, seconds),
  };
  const focus: IAutoMovieVector3 | null =
    action.focus === undefined
      ? null
      : resolvePerformShotTarget(motionContext, {
          target: action.focus,
          path: `${path}.focus`,
          label: "focus pull source",
          subject: "the first focus mark",
          seconds: start,
          formationsFramed: true,
        });
  const from: IAutoMovieVector3 | null = focus === null ? null : { ...focus };
  const to: IAutoMovieVector3 | null = resolvePerformShotTarget(motionContext, {
    target: pull.to,
    path: `${pullPath}.to`,
    label: "focus pull destination",
    subject: "the second focus mark",
    seconds: end,
    formationsFramed: true,
  });
  return from === null || to === null
    ? null
    : { focus: from, focusPull: { start, end, to: { ...to } } };
}

/** Read the timed world point when the live target resolver has no answer. */
function sampledPoint(
  context: IAutoMovieEnginePerformShotGateContext,
  props: IAutoMovieCompilePerformShotCameras.IProps,
  target: IAutoMovieActionTarget,
  seconds: number,
): IAutoMovieVector3 | null {
  if (target.kind === "point") return target.point;
  if (target.kind !== "node" && target.kind !== "group") return null;

  const nodes: readonly string[] =
    target.kind === "node" ? [target.node] : target.nodes;
  const sampled: Map<string, IAutoMovieSampledChannel> = sampleClipSequence(
    nodes.length === 0 ? [] : props.objectMotions,
    seconds,
  );
  const positions: Map<string, IAutoMovieVector3> = new Map();
  for (const node of nodes) {
    const base: IAutoMovieVector3 | undefined = context.nodePositions.get(node);
    if (base === undefined) return null;
    const channel: number[] | undefined = sampled.get(
      channelKey({ kind: "node", node, path: "translation" }),
    )?.value;
    const motion: IAutoMovieMotion | undefined = props.motions[node];
    const facing: IAutoMovieQuaternion | undefined = props.rotations.get(node);
    const position: IAutoMovieVector3 =
      channel !== undefined
        ? { x: channel[0]!, y: channel[1]!, z: channel[2]! }
        : motion !== undefined && facing !== undefined
          ? animatedBaseAt(base, facing, motion)(seconds)
          : base;
    positions.set(node, position);
  }

  const formations: Map<string, IAutoMovieVector3> = new Map();
  if (target.kind === "group")
    for (const id of target.formations ?? []) {
      const formation: IAutoMovieCompiledFormation | undefined =
        context.formationById.get(id);
      if (formation === undefined) return null;
      formations.set(
        id,
        transformFormationPoint(
          formation.centroid,
          formation.anchor,
          sampleFormationMotion(props.formationMotions, id, seconds),
          formation.facingDeg,
        ),
      );
    }
  return resolveTargetPoint(target, positions, formations);
}
