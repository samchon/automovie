import type { IAutoMovieJointPose, IAutoMovieTransform, IAutoMovieExpression, AutoMovieEasing, AutoMovieHumanoidBone, IAutoMovieGait, IAutoMovieYawPitch, AutoMovieExpressionPreset, IAutoMovieActionCall, IAutoMovieActionTarget, IAutoMovieBeatEndState, IAutoMovieKeyframe, IAutoMovieMotion, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import { aimYawPitch } from "../kinematics/aimYawPitch";
import { gazeChainJoints } from "../kinematics/gazeChainJoints";
import { reachPose } from "../kinematics/reachPose";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { classifyLocomoteGroundDisplacement } from "../motion/classifyLocomoteGroundDisplacement";
import { gaitMotion } from "../motion/gaitMotion";
import { gestureMotion } from "../motion/gestureMotion";
import { holdMotion } from "../motion/holdMotion";
import { locomoteMotion } from "../motion/locomoteMotion";
import { reactMotion } from "../motion/reactMotion";
import { timeScaleMotion } from "../motion/timeScaleMotion";
import { IAutoMovieActionSynthesizer } from "./IAutoMovieActionSynthesizer";
import { IAutoMovieActorContext } from "./IAutoMovieActorContext";
import { IAutoMovieActorWorldFrame } from "./IAutoMovieActorWorldFrame";
import { resolveTargetPoint } from "./resolveTargetPoint";
import type { IAutoMovieRecoilPush } from "../physics/IAutoMovieRecoilPush";
import { actorContextWorldFrame } from "./actorContextWorldFrame";
import { resumeActorSynthesisRuntime } from "./resumeActorSynthesisRuntime";
import { actorAimPoints } from "./actorAimPoints";
import { createActorExtendClip } from "./createActorExtendClip";
import { createDynamicActorPoseClip } from "./createDynamicActorPoseClip";
import { createDynamicActorExtendClip } from "./createDynamicActorExtendClip";
import { createDynamicActorJabClip } from "./createDynamicActorJabClip";
import { createActorJabClip } from "./createActorJabClip";
import { actorPointInModelSpace } from "./actorPointInModelSpace";

const GAIT_SAMPLES: number = 8 as const;

const REACT_MAX_DEFLECTION: number = 32 as const;

const REACT_UNBALANCE_GAIN: number = 1.5 as const;

const REACT_CHAIN: readonly ["head", "neck", "chest", "spine"] = ["head", "neck", "chest", "spine"] as const;

const assertUniqueActorGaits: (actor: string, gaits: IAutoMovieActorContext [ "gaits" ]) => void = (
  actor: string,
  gaits: IAutoMovieActorContext["gaits"],
): void => {
  const seen: Set<string> = new Set<string>();
  for (const gait of gaits) {
    if (seen.has(gait.name))
      throw new Error(`duplicate actor gait name ${actor}.${gait.name}`);
    seen.add(gait.name);
  }
};

const fitDeclaredSpan: (motion: IAutoMovieMotion, duration: IAutoMovieActionCall [ "duration" ]) => IAutoMovieMotion = (
  motion: IAutoMovieMotion,
  duration: IAutoMovieActionCall["duration"],
): IAutoMovieMotion =>
  duration === "auto"
    ? motion
    : timeScaleMotion(motion, duration / motion.duration);

const seedRestArticulation: (motion: IAutoMovieMotion, restPose: IAutoMoviePose) => IAutoMovieMotion = (
  motion: IAutoMovieMotion,
  restPose: IAutoMoviePose,
): IAutoMovieMotion => ({
  ...motion,
  keyframes: motion.keyframes.map((keyframe: IAutoMovieKeyframe) : { pose: { joints: IAutoMovieJointPose[]; skeleton: string; root: IAutoMovieTransform | null; }; time: number; expression: IAutoMovieExpression | null; easing: AutoMovieEasing; bezier: [number, number, number, number] | null; } => {
    const driven: Set<AutoMovieHumanoidBone> = new Set(keyframe.pose.joints.map((joint: IAutoMovieJointPose) : AutoMovieHumanoidBone => joint.bone));
    return {
      ...keyframe,
      pose: {
        ...keyframe.pose,
        joints: [
          ...keyframe.pose.joints,
          ...restPose.joints
            .filter((joint: IAutoMovieJointPose) : boolean => driven.has(joint.bone) === false)
            .map((joint: IAutoMovieJointPose) : { bone: AutoMovieHumanoidBone; flexion: number | null; abduction: number | null; twist: number | null; } => ({ ...joint })),
        ],
      },
    };
  }),
});

/**
 * Create the reference actor action callback from borrowed contexts and placements. It supports gait locomotion, hold, gaze, expression, reference gestures, analytic arm targets and ROM-bounded reactions; unknown actors or unsupported/unresolvable content return null. Duplicate gait names throw at construction.
 *
 * @evidence contracts/common.md#principled-implementation Uses resumed verified beat facts, shared rigid actor-frame conversion and the existing gait/IK primitives; explicit locomotion durations scale the clock, positional destinations preserve full displacement with ground-speed cadence, and live targets are sampled at 24 Hz.
 * @evidence contracts/common.md#clear-and-simple-design Verb dispatch remains here while shared frame/continuation, static and dynamic envelopes own their isolated responsibilities; both frame readers use one staged conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reference constants 8 gait samples, 24 Hz live targets, 40% jab peaks and 32 degree maximum reaction are declared choreography policies, not measured physical guarantees; no guessed rig geometry or hidden ROM clamp is introduced for reaches.
 * @evidence contracts/common.md#meaningful-documentation States supported verbs, geometry requirements, rigid model/world frames, eye-height gaze lifting, prior-beat ownership, callback failure and null outcomes; returned clips still require downstream gates and live-target interpolation is approximate.
 * @evidence contracts/performance.md#efficient-algorithms Construction checks gait names linearly; each action rebuilds O(A+N+P) resumed maps for contexts, nodes and prior actors, plus verb-specific gait lookup, keyframe copies, analytic IK or 24 Hz target sampling. Different actions may observe mutable inputs, so snapshots are not cached.
 * @evidence contracts/performance.md#reuse-equivalent-work A resumed snapshot and static frame serve the action, static targets solve once, repeat consumers reuse the resulting clip, and dynamic sampling evaluates each distinct time once; mutable host maps and callbacks prevent unjustified cross-action caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The host owns captured context/placement maps for the callback lifetime; invocation-local snapshots and intermediate poses are released on success/null/throw, returned clips belong to callers, and no process or renderer handle is retained.
 */
export const makeActorSynthesizer: (contexts: Map < string , IAutoMovieActorContext >, placements: Map < string , IAutoMovieVector3 >, boneTargetAt?: ( target : IAutoMovieActionTarget , seconds : number , ) => IAutoMovieVector3 | null, actorFrameAt?: ( actor : string , seconds : number , ) => IAutoMovieActorWorldFrame | null) => IAutoMovieActionSynthesizer = (
  contexts: Map<string, IAutoMovieActorContext>,
  placements: Map<string, IAutoMovieVector3>,
  boneTargetAt?: (
    target: IAutoMovieActionTarget,
    seconds: number,
  ) => IAutoMovieVector3 | null,
  actorFrameAt?: (
    actor: string,
    seconds: number,
  ) => IAutoMovieActorWorldFrame | null,
): IAutoMovieActionSynthesizer => {
  for (const [actor, ctx] of contexts) assertUniqueActorGaits(actor, ctx.gaits);
  return (
    action: IAutoMovieActionCall,
    actor: string,
    previous?: IAutoMovieBeatEndState | null,
  ): IAutoMovieMotion | null => {
    const live: { contexts: Map<string, IAutoMovieActorContext>; nodes: Map<string, IAutoMovieVector3>; } = resumeActorSynthesisRuntime(contexts, placements, previous);
    const nodes: Map<string, IAutoMovieVector3> = live.nodes;
    const ctx: IAutoMovieActorContext | undefined = live.contexts.get(actor);
    if (ctx === undefined) return null;
    const staticFrame: IAutoMovieActorWorldFrame = actorContextWorldFrame(ctx);
    const frameAt: (seconds: number) => IAutoMovieActorWorldFrame = (seconds: number): IAutoMovieActorWorldFrame =>
      actorFrameAt?.(actor, seconds) ?? staticFrame;
    const resolveTarget: (target: IAutoMovieActionTarget, table: Map < string , IAutoMovieVector3 >, seconds: number) => IAutoMovieVector3 | null = (
      target: IAutoMovieActionTarget,
      table: Map<string, IAutoMovieVector3>,
      seconds: number,
    ): IAutoMovieVector3 | null =>
      target.kind === "bone"
        ? (boneTargetAt?.(target, seconds) ?? null)
        : resolveTargetPoint(target, table);
    if (action.verb === "locomote") {
      const gait: IAutoMovieGait | undefined = ctx.gaits.find((g: IAutoMovieGait) : boolean => g.name === action.gait);
      if (gait === undefined) return null;
      const cycle: IAutoMovieMotion = seedRestArticulation(
        gaitMotion(
          `${actor}:${action.gait}`,
          ctx.skeleton,
          gait,
          GAIT_SAMPLES,
          ctx.gaitPhase ?? 0,
        ),
        ctx.restPose,
      );
      const dest: IAutoMovieVector3 | null = resolveTarget(action.to, nodes, action.start);



      if (dest === null) return fitDeclaredSpan(cycle, action.duration); // relative/unresolved → step in place



      const local: IAutoMovieVector3 = actorPointInModelSpace(dest, staticFrame);
      const displacement: { groundDistance: number; travelDistance: number; alreadyThere: boolean; verticalOnly: boolean; } = classifyLocomoteGroundDisplacement(local);
      if (displacement.alreadyThere)
        return fitDeclaredSpan(cycle, action.duration); // already there → step in place



      if (displacement.verticalOnly) return null;





      const travelSpeed: number =
        ctx.speed * (displacement.travelDistance / displacement.groundDistance);
      return fitDeclaredSpan(
        locomoteMotion(
          `${actor}:${action.gait}:travel`,
          cycle,
          displacement.travelDistance,
          travelSpeed,
          local,
          action.faceTravel === true,
        ),
        action.duration,
      );
    }
    if (action.verb === "hold")
      return holdMotion(
        `${actor}:hold`,
        ctx.skeleton,
        ctx.restPose,
        action.duration,
      );
    if (action.verb === "lookAt") {
      const aimPoints: Map<string, IAutoMovieVector3> = actorAimPoints(live.contexts, nodes);

      const duration: number = action.duration === "auto" ? 1 : action.duration;




      const poseAt: (time: number) => IAutoMoviePose | null = (time: number): IAutoMoviePose | null => {
        const frame: IAutoMovieActorWorldFrame = frameAt(action.start + time);
        const eye: IAutoMovieVector3 = Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, {
            x: 0,
            y: ctx.eyeHeight,
            z: 0,
          }),
        );
        const target: IAutoMovieVector3 | null = resolveTarget(action.to, aimPoints, action.start + time);
        if (target === null) return null;
        const { yawDeg, pitchDeg }: IAutoMovieYawPitch = aimYawPitch(eye, target, frame.facingDeg);
        return {
          skeleton: ctx.skeleton,
          root: null,
          joints: gazeChainJoints({
            rig: ctx.rig ?? null,
            flexionDeg: -pitchDeg,
            twistDeg: yawDeg,
          }),
        };
      };
      if (
        action.to.kind === "bone" ||
        (actorFrameAt?.(actor, action.start) ?? null) !== null
      )
        return createDynamicActorPoseClip({
          id: `${actor}:lookAt`,
          skeleton: ctx.skeleton,
          duration,
          poseAt,
        });
      const pose: IAutoMoviePose | null = poseAt(0);
      return pose === null
        ? null
        : {
            id: `${actor}:lookAt`,
            skeleton: ctx.skeleton,
            duration,
            loop: false,
            keyframes: [
              {
                time: 0,
                pose,
                expression: null,
                easing: "linear",
                bezier: null,
              },
              {
                time: duration,
                pose,
                expression: null,
                easing: "linear",
                bezier: null,
              },
            ],
          };
    }
    if (action.verb === "emote") {

      const duration: number = action.duration === "auto" ? 1 : action.duration;
      const expression: { preset: AutoMovieExpressionPreset; intensity: number; blendshapes: null; } = {
        preset: action.preset,
        intensity: action.intensity,
        blendshapes: null,
      };
      const frame: (time: number) => IAutoMovieKeyframe = (time: number): IAutoMovieKeyframe => ({
        time,
        pose: { skeleton: ctx.skeleton, root: null, joints: [] },
        expression,
        easing: "linear",
        bezier: null,
      });
      return {
        id: `${actor}:emote`,
        skeleton: ctx.skeleton,
        duration,
        loop: false,
        keyframes: [frame(0), frame(duration)],
      };
    }
    if (action.verb === "gesture") {
      const duration: number = action.duration === "auto" ? 1 : action.duration;








      if (action.kind === "point" && ctx.rig !== undefined) {
        const world: IAutoMovieVector3 | null =
          action.at === undefined
            ? null
            : resolveTarget(action.at, nodes, action.start);
        if (world === null) return null;
        if (
          action.at?.kind === "bone" ||
          (actorFrameAt?.(actor, action.start) ?? null) !== null
        )
          return createDynamicActorExtendClip({
            id: `${actor}:point`,
            skeleton: ctx.skeleton,
            duration,
            poseAt: (time: number) : IAutoMoviePose | null => {
              const point: IAutoMovieVector3 | null = resolveTarget(
                action.at!,
                nodes,
                action.start + time,
              );
              return point === null
                ? null
                : reachPose(
                    ctx.rig!,
                    "right",
                    actorPointInModelSpace(point, frameAt(action.start + time)),
                    ctx.restFrames,
                  );
            },
          });
        const pose: IAutoMoviePose | null = reachPose(
          ctx.rig,
          "right",
          actorPointInModelSpace(world, staticFrame),
          ctx.restFrames,
        );
        return pose === null
          ? null
          : createActorExtendClip(`${actor}:point`, ctx.skeleton, pose, duration);
      }



      if (action.kind === "strike" && ctx.rig !== undefined) {
        const world: IAutoMovieVector3 | null =
          action.at === undefined
            ? null
            : resolveTarget(action.at, nodes, action.start);
        if (world === null) return null;
        if (
          action.at?.kind === "bone" ||
          (actorFrameAt?.(actor, action.start) ?? null) !== null
        )
          return createDynamicActorJabClip({
            id: `${actor}:strike`,
            skeleton: ctx.skeleton,
            duration,
            poseAt: (time: number) : IAutoMoviePose | null => {
              const point: IAutoMovieVector3 | null = resolveTarget(
                action.at!,
                nodes,
                action.start + time,
              );
              return point === null
                ? null
                : reachPose(
                    ctx.rig!,
                    "right",
                    actorPointInModelSpace(point, frameAt(action.start + time)),
                    ctx.restFrames,
                  );
            },
          });
        const pose: IAutoMoviePose | null = reachPose(
          ctx.rig,
          "right",
          actorPointInModelSpace(world, staticFrame),
          ctx.restFrames,
        );
        return pose === null
          ? null
          : createActorJabClip(`${actor}:strike`, ctx.skeleton, pose, duration);
      }

      return gestureMotion(
        `${actor}:${action.kind}`,
        ctx.skeleton,
        action.kind,
        duration,
      );
    }
    if (action.verb === "reach") {







      if (ctx.rig === undefined) return null;
      const world: IAutoMovieVector3 | null = resolveTarget(action.to, nodes, action.start);
      if (world === null) return null; // relative target: no point to reach
      const duration: number = action.duration === "auto" ? 0.6 : action.duration;
      if (
        action.to.kind === "bone" ||
        (actorFrameAt?.(actor, action.start) ?? null) !== null
      )
        return createDynamicActorExtendClip({
          id: `${actor}:reach`,
          skeleton: ctx.skeleton,
          duration,
          poseAt: (time: number) : IAutoMoviePose | null => {
            const point: IAutoMovieVector3 | null = resolveTarget(action.to, nodes, action.start + time);
            return point === null
              ? null
              : reachPose(
                  ctx.rig!,
                  action.hand,
                  actorPointInModelSpace(point, frameAt(action.start + time)),
                  ctx.restFrames,
                );
          },
        });
      const reach: IAutoMoviePose | null = reachPose(
        ctx.rig,
        action.hand,
        actorPointInModelSpace(world, staticFrame),
        ctx.restFrames,
      );
      if (reach === null) return null;
      return createActorExtendClip(`${actor}:reach`, ctx.skeleton, reach, duration);
    }
    if (action.verb === "react") {


      if (ctx.rig === undefined) return null;
      const duration: number = action.duration === "auto" ? 0.5 : action.duration;
      const magnitude: number =
        REACT_MAX_DEFLECTION *
        Math.max(0, Math.min(1, action.force)) *
        (action.unbalance === true ? REACT_UNBALANCE_GAIN : 1);



      const source: IAutoMovieVector3 | null = resolveTarget(action.from, nodes, action.start);
      const facing: number = (ctx.facingDeg * Math.PI) / 180;
      const forward: { x: number; y: number; z: number; } = { x: Math.sin(facing), y: 0, z: Math.cos(facing) };



      const right: { x: number; y: number; z: number; } = { x: -Math.cos(facing), y: 0, z: Math.sin(facing) };
      let push: IAutoMovieRecoilPush;
      if (source === null)
        push = { flexion: -magnitude }; // unknown → snap back
      else {
        const away: { x: number; y: number; z: number; } = {
          x: ctx.position.x - source.x,
          y: 0,
          z: ctx.position.z - source.z,
        };
        const dir: IAutoMovieVector3 =
          Vector3.length(away) < 1e-6 ? forward : Vector3.normalize(away);
        push = {
          flexion: Vector3.dot(dir, forward) * magnitude,
          abduction: Vector3.dot(dir, right) * magnitude,
        };
      }
      return reactMotion(
        `${actor}:react`,
        ctx.rig,
        push,
        [...REACT_CHAIN],
        duration,
      );
    }
    return null;
  };
};
