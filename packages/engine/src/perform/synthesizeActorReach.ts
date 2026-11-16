import type {
  IAutoMovieActionCall, IAutoMovieActionTarget, IAutoMovieMotion,
  IAutoMoviePose, IAutoMovieSkeleton, IAutoMovieVector3,
} from "@automovie/interface";

import { reachPose } from "../kinematics/reachPose";
import type { IAutoMovieActorContext } from "./IAutoMovieActorContext";
import type { IAutoMovieActorWorldFrame } from "./IAutoMovieActorWorldFrame";
import { actorPointInModelSpace } from "./actorPointInModelSpace";
import { createActorExtendClip } from "./createActorExtendClip";
import { createActorJabClip } from "./createActorJabClip";
import { createDynamicActorExtendClip } from "./createDynamicActorExtendClip";
import { createDynamicActorJabClip } from "./createDynamicActorJabClip";

/** Current staged/live target and frame readers borrowed from one actor action. */
interface IContext {
  /** Actual actor identity and resumed context of this action. */
  actor: string;
  ctx: IAutoMovieActorContext;

  /** Current placements and the original action's rigid staged frame. */
  nodes: Map<string, IAutoMovieVector3>;
  staticFrame: IAutoMovieActorWorldFrame;

  /** The original live target resolver, invoked at every original sample. */
  resolveTarget: (
    target: IAutoMovieActionTarget,
    nodes: Map<string, IAutoMovieVector3>,
    seconds: number,
  ) => IAutoMovieVector3 | null;

  /** Current rigid actor frame; called only after a sample's target resolves. */
  frameAt: (seconds: number) => IAutoMovieActorWorldFrame;

  /** Original dynamic-path admission query; bones short-circuit it as before. */
  actorFrameAt?: (actor: string, seconds: number) => IAutoMovieActorWorldFrame | null;
}

/** Gesture duration is read before target resolution; reaches read it afterward. */
type IProps = IContext & (
  | { kind: "point" | "strike"; action: Extract<IAutoMovieActionCall, { verb: "gesture" }>; duration: number }
  | { kind: "reach"; action: Extract<IAutoMovieActionCall, { verb: "reach" }> }
);

/** A plain callable retains reachPose's arguments without its prepare companion. */
type IReach = (...args: Parameters<typeof reachPose>) => ReturnType<typeof reachPose>;

/** The single actual fixed-source binding currently serving one synchronous bake. */
interface IBinding {
  /** Actual current source identities; replacements require a new producer. */
  skeleton: IAutoMovieSkeleton;
  side: "left" | "right";
  restFrames: Parameters<typeof reachPose>[3];

  /** Genuine lazy source admission and independent per-target solving. */
  read: ReturnType<typeof reachPose.prepare>;
}

/**
 * Synthesize native point, strike and reach arm targets for one actor action.
 * The selected gesture branch already admitted its rig; a reach retains its
 * original missing-rig refusal. Rig geometry/clinical mappings stay unchanged
 * within a synchronous bake; different actions always prepare independently.
 * Live target/actor-frame reads, absolute sample times and every target's
 * original candidate/ROM decisions remain live. Only actual fixed source
 * metadata is shared, and no callback or reader enters the returned clip.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States branch/rig admission, model/world metre conversion, original duration timing, unchanged source scope, live callbacks, null/throw propagation and numeric-result ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Retains each verb's initial target read, dynamic-path test, static solve or original 24 Hz envelope bake. Every moving sample resolves its current target before its current frame and invokes the same reachPose solve in model space. The genuine prepare source performs original full-rest-FK admission once, while each target retains all candidate/clinical/ROM decisions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns the three native arm-target branches and their static/dynamic envelope choice. makeActorSynthesizer keeps verb dispatch/gesture fallback. One private source-binding reader delegates fixed source preparation to reachPose and sampling/weighting to existing clip owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No target, callback, time, chosen articulation or previous pose is cached. Missing targets still refuse the whole clip, thrown callbacks propagate, source replacements prepare anew, and no sample count, envelope, candidate, ROM bound or frame arithmetic is changed. Direct reachPose remains the raw static path.
 * @evidence contracts/development/implementation.md#efficient-algorithms For F original samples, fixed source diagnosis/axes/full-rest-FK prepare once per actual source binding instead of F times; all F target callbacks, frame conversions and original bounded hinge solves remain. Binding checks are constant-size and runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One synchronous bake owns an actual lazy reachPose.prepare result for its fixed rig/side/frame inputs. Argument identities select only source metadata, with replacement creating a new producer; they never certify a target solution. Cross-action mutable contexts are reread by the caller and no binding crosses actions.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The bake holds at most one actual source binding, replacing and releasing the previous one. Existing clip builders consume callbacks synchronously and retain only fresh numeric poses/keyframes. Source metadata and callback closures end on return/null/throw; no FK reader, target history, handle or task escapes.
 */
export function synthesizeActorReach(props: IProps): IAutoMovieMotion | null {
  const ctx: IAutoMovieActorContext = props.ctx;
  if (props.kind === "reach" && ctx.rig === undefined) return null;

  const world: IAutoMovieVector3 | null = props.kind === "reach"
    ? props.resolveTarget(props.action.to, props.nodes, props.action.start)
    : props.action.at === undefined ? null
      : props.resolveTarget(props.action.at, props.nodes, props.action.start);
  if (world === null) return null;

  const duration: number = props.kind === "reach"
    ? props.action.duration === "auto" ? 0.6 : props.action.duration
    : props.duration;

  const liveBone: boolean = props.kind === "reach"
    ? props.action.to.kind === "bone" : props.action.at?.kind === "bone";
  if (liveBone || (props.actorFrameAt?.(props.actor, props.action.start) ?? null) !== null) {
    const read: IReach = prepareRead();
    const bake: typeof createDynamicActorExtendClip = props.kind === "strike"
      ? createDynamicActorJabClip : createDynamicActorExtendClip;
    return bake({
      id: `${props.actor}:${props.kind}`,
      skeleton: ctx.skeleton,
      duration,
      poseAt: (time: number): IAutoMoviePose | null => {
        const point: IAutoMovieVector3 | null = props.kind === "reach"
          ? props.resolveTarget(props.action.to, props.nodes, props.action.start + time)
          : props.resolveTarget(props.action.at!, props.nodes, props.action.start + time);
        return point === null ? null : read(
          ctx.rig!,
          props.kind === "reach" ? props.action.hand : "right",
          actorPointInModelSpace(point, props.frameAt(props.action.start + time)),
          ctx.restFrames,
        );
      },
    });
  }

  const pose: IAutoMoviePose | null = reachPose(
    ctx.rig!,
    props.kind === "reach" ? props.action.hand : "right",
    actorPointInModelSpace(world, props.staticFrame),
    ctx.restFrames,
  );
  if (pose === null) return null;

  return props.kind === "strike"
    ? createActorJabClip(`${props.actor}:strike`, ctx.skeleton, pose, duration)
    : createActorExtendClip(`${props.actor}:${props.kind}`, ctx.skeleton, pose, duration);
}

/** Bind only actual fixed source arguments; every varying target is solved anew. */
function prepareRead(): IReach {
  let binding: IBinding | undefined;
  return (
    skeleton: IAutoMovieSkeleton,
    side: "left" | "right",
    target: IAutoMovieVector3,
    restFrames?: Parameters<typeof reachPose>[3],
  ): IAutoMoviePose | null => {
    if (binding === undefined || binding.skeleton !== skeleton ||
      binding.side !== side || binding.restFrames !== restFrames)
      binding = { skeleton, side, restFrames, read: reachPose.prepare(skeleton, side, restFrames) };

    return binding.read(target);
  };
}
