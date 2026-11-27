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

import { resolveTargetPoint } from "../../perform/internal/resolveTargetPoint";
import { sampleFormationMotion } from "../../populationRuntime/formation/sampleFormationMotion";
import { transformFormationPoint } from "../../populationRuntime/formation/internal/transformFormationPoint";
import { channelKey } from "../../resolve/internal/channelKey";
import { sampleClipSequence } from "../../resolve/internal/sampleClipSequence";
import { animatedBaseAt } from "./animatedBaseAt";
import { resolvePerformShotTarget } from "./resolvePerformShotTarget";

/**
 * Admit and resolve one frame action's two focus marks in world metres. The
 * caller consumes located findings before publishing the shot. An automatic
 * frame ends at the next frame's start or the shot end. An explicit frame can
 * end earlier. Both are bounded by the next frame start.
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
  const pull: NonNullable<
    IAutoMoviePerformShotFrameJob["action"]["focusPull"]
  > = action.focusPull!;
  const path: string = `${context.base}[${job.index}]`;
  const pullPath: string = `${path}.focusPull`;

  if (action.focus === undefined)
    context.out.push(
      "type",
      `${path}.focus`,
      "a focus pull requires an explicit source target",
      action.focus,
    );
  const offset: number = pull.start;
  const duration: number = pull.duration;
  const validOffset: boolean = offset >= 0;
  const validDuration: boolean = duration > 0;
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
