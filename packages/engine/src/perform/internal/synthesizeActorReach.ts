import type {
  IAutoMovieActionCall,
  IAutoMovieActionTarget,
  IAutoMovieActorContext,
  IAutoMovieActorWorldFrame,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { reachPose } from "../../kinematics/internal/reachPose";
import { actorPointInModelSpace } from "./actorPointInModelSpace";
import { createActorExtendClip } from "./createActorExtendClip";
import { createActorJabClip } from "./createActorJabClip";
import { createDynamicActorExtendClip } from "./createDynamicActorExtendClip";
import { createDynamicActorJabClip } from "./createDynamicActorJabClip";

/**
 * Synthesize native point, strike and reach arm targets for one actor action.
 * The selected gesture branch already admitted its rig; a reach retains its
 * original missing-rig refusal. Borrowed geometry and clinical mappings remain
 * live because target/frame callbacks can change them between samples. Live
 * target/actor-frame reads, absolute sample times and every target's original
 * candidate/ROM decisions remain live. No callback enters the clip.
 */
export function synthesizeActorReach(props: IProps): IAutoMovieMotion | null {
  const ctx: IAutoMovieActorContext = props.ctx;
  if (props.kind === "reach" && ctx.rig === undefined) return null;

  const world: IAutoMovieVector3 | null =
    props.kind === "reach"
      ? props.resolveTarget(props.action.to, props.nodes, props.action.start)
      : props.action.at === undefined
        ? null
        : props.resolveTarget(props.action.at, props.nodes, props.action.start);
  if (world === null) return null;

  const duration: number =
    props.kind === "reach"
      ? props.action.duration === "auto"
        ? 0.6
        : props.action.duration
      : props.duration;

  const liveBone: boolean =
    props.kind === "reach"
      ? props.action.to.kind === "bone"
      : props.action.at?.kind === "bone";
  if (
    liveBone ||
    (props.actorFrameAt?.(props.actor, props.action.start) ?? null) !== null
  ) {
    const bake: typeof createDynamicActorExtendClip =
      props.kind === "strike"
        ? createDynamicActorJabClip
        : createDynamicActorExtendClip;
    return bake({
      id: `${props.actor}:${props.kind}`,
      skeleton: ctx.skeleton,
      duration,
      poseAt: (time: number): IAutoMoviePose | null => {
        const point: IAutoMovieVector3 | null =
          props.kind === "reach"
            ? props.resolveTarget(
                props.action.to,
                props.nodes,
                props.action.start + time,
              )
            : props.resolveTarget(
                props.action.at!,
                props.nodes,
                props.action.start + time,
              );
        return point === null
          ? null
          : reachPose(
              ctx.rig!,
              props.kind === "reach" ? props.action.hand : "right",
              actorPointInModelSpace(
                point,
                props.frameAt(props.action.start + time),
              ),
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
    : createActorExtendClip(
        `${props.actor}:${props.kind}`,
        ctx.skeleton,
        pose,
        duration,
      );
}

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
  actorFrameAt?: (
    actor: string,
    seconds: number,
  ) => IAutoMovieActorWorldFrame | null;
}

/** Gesture duration is read before target resolution; reaches read it afterward. */
type IProps = IContext &
  (
    | {
        kind: "point" | "strike";
        action: Extract<IAutoMovieActionCall, { verb: "gesture" }>;
        duration: number;
      }
    | {
        kind: "reach";
        action: Extract<IAutoMovieActionCall, { verb: "reach" }>;
      }
  );
