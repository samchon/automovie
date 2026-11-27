import type {
  AutoMovieEasing,
  AutoMovieExpressionPreset,
  AutoMovieHumanoidBone,
  IAutoMovieActionCall,
  IAutoMovieActionSynthesizer,
  IAutoMovieActionTarget,
  IAutoMovieActorContext,
  IAutoMovieActorWorldFrame,
  IAutoMovieBeatEndState,
  IAutoMovieExpression,
  IAutoMovieGait,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieRecoilPush,
  IAutoMovieTransform,
  IAutoMovieVector3,
  IAutoMovieYawPitch,
} from "@automovie/interface";

import { aimYawPitch } from "../../kinematics/internal/aimYawPitch";
import { gazeChainJointsImplementation } from "../../kinematics/internal/gazeChainJointsImplementation";
import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { classifyLocomoteGroundDisplacement } from "../../motion/internal/classifyLocomoteGroundDisplacement";
import { gaitMotion } from "../../motion/internal/gaitMotion";
import { gestureMotion } from "../../motion/internal/gestureMotion";
import { holdMotion } from "../../motion/internal/holdMotion";
import { locomoteMotion } from "../../motion/internal/locomoteMotion";
import { reactMotion } from "../../motion/internal/reactMotion";
import { timeScaleMotion } from "../../motion/internal/timeScaleMotion";
import { actorAimPoints } from "./actorAimPoints";
import { actorContextWorldFrame } from "./actorContextWorldFrame";
import { actorPointInModelSpace } from "./actorPointInModelSpace";
import { createDynamicActorPoseClip } from "./createDynamicActorPoseClip";
import { resolveTargetPoint } from "./resolveTargetPoint";
import { resumeActorSynthesisRuntime } from "./resumeActorSynthesisRuntime";
import { synthesizeActorReach } from "./synthesizeActorReach";

/*
 * Create the reference actor action callback from borrowed contexts and
 * placements. It supports gait locomotion, hold, gaze, expression, reference
 * gestures, analytic arm targets and ROM-bounded reactions; unknown actors or
 * unsupported/unresolvable content return null. Duplicate gait names throw at
 * construction.
 */
export function makeActorSynthesizer(
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
): IAutoMovieActionSynthesizer {
  for (const [actor, ctx] of contexts) assertUniqueActorGaits(actor, ctx.gaits);
  return (
    action: IAutoMovieActionCall,
    actor: string,
    previous?: IAutoMovieBeatEndState | null,
  ): IAutoMovieMotion | null => {
    const live: {
      contexts: Map<string, IAutoMovieActorContext>;
      nodes: Map<string, IAutoMovieVector3>;
    } = resumeActorSynthesisRuntime(contexts, placements, previous);
    const nodes: Map<string, IAutoMovieVector3> = live.nodes;
    const ctx: IAutoMovieActorContext | undefined = live.contexts.get(actor);
    if (ctx === undefined) return null;
    const staticFrame: IAutoMovieActorWorldFrame = actorContextWorldFrame(ctx);
    const frameAt: (seconds: number) => IAutoMovieActorWorldFrame = (
      seconds: number,
    ): IAutoMovieActorWorldFrame =>
      actorFrameAt?.(actor, seconds) ?? staticFrame;
    const resolveTarget: (
      target: IAutoMovieActionTarget,
      table: Map<string, IAutoMovieVector3>,
      seconds: number,
    ) => IAutoMovieVector3 | null = (
      target: IAutoMovieActionTarget,
      table: Map<string, IAutoMovieVector3>,
      seconds: number,
    ): IAutoMovieVector3 | null =>
      target.kind === "bone"
        ? (boneTargetAt?.(target, seconds) ?? null)
        : resolveTargetPoint(target, table);
    if (action.verb === "locomote") {
      const gait: IAutoMovieGait | undefined = ctx.gaits.find(
        (g: IAutoMovieGait): boolean => g.name === action.gait,
      );
      if (gait === undefined) return null;
      const phase: number = ctx.gaitPhase ?? 0;
      const previousPeriod: number | undefined = ctx.gaitPeriod;
      const cycle: IAutoMovieMotion = seedRestArticulation(
        gaitMotion(
          `${actor}:${action.gait}`,
          ctx.skeleton,
          gait,
          GAIT_SAMPLES,
          previousPeriod !== undefined &&
            previousPeriod > 0 &&
            Number.isFinite(previousPeriod) &&
            previousPeriod !== gait.period
            ? (phase / previousPeriod) * gait.period
            : phase,
        ),
        ctx.restPose,
      );
      const dest: IAutoMovieVector3 | null = resolveTarget(
        action.to,
        nodes,
        action.start,
      );

      if (dest === null) return fitDeclaredSpan(cycle, action.duration); // relative/unresolved → step in place

      const local: IAutoMovieVector3 = actorPointInModelSpace(
        dest,
        staticFrame,
      );
      const displacement: {
        groundDistance: number;
        travelDistance: number;
        alreadyThere: boolean;
        verticalOnly: boolean;
      } = classifyLocomoteGroundDisplacement(local);
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
      const aimPoints: Map<string, IAutoMovieVector3> = actorAimPoints(
        live.contexts,
        nodes,
      );

      const duration: number = action.duration === "auto" ? 1 : action.duration;

      const poseAt: (time: number) => IAutoMoviePose | null = (
        time: number,
      ): IAutoMoviePose | null => {
        const frame: IAutoMovieActorWorldFrame = frameAt(action.start + time);
        const eye: IAutoMovieVector3 = AutoMovieEngineVector3.add(
          frame.position,
          AutoMovieEngineQuaternion.rotateVector(frame.rotation, {
            x: 0,
            y: ctx.eyeHeight,
            z: 0,
          }),
        );
        const target: IAutoMovieVector3 | null = resolveTarget(
          action.to,
          aimPoints,
          action.start + time,
        );
        if (target === null) return null;
        const { yawDeg, pitchDeg }: IAutoMovieYawPitch = aimYawPitch(
          eye,
          target,
          frame.facingDeg,
        );
        return {
          skeleton: ctx.skeleton,
          root: null,
          joints: gazeChainJointsImplementation.run({
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
      const expression: {
        preset: AutoMovieExpressionPreset;
        intensity: number;
        blendshapes: null;
      } = {
        preset: action.preset,
        intensity: action.intensity,
        blendshapes: null,
      };
      const frame: (time: number) => IAutoMovieKeyframe = (
        time: number,
      ): IAutoMovieKeyframe => ({
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
        return synthesizeActorReach({
          kind: "point",
          action,
          duration,
          actor,
          ctx,
          nodes,
          staticFrame,
          frameAt,
          actorFrameAt,
          resolveTarget,
        });
      }

      if (action.kind === "strike" && ctx.rig !== undefined) {
        return synthesizeActorReach({
          kind: "strike",
          action,
          duration,
          actor,
          ctx,
          nodes,
          staticFrame,
          frameAt,
          actorFrameAt,
          resolveTarget,
        });
      }

      return gestureMotion(
        `${actor}:${action.kind}`,
        ctx.skeleton,
        action.kind,
        duration,
      );
    }
    if (action.verb === "reach") {
      return synthesizeActorReach({
        kind: "reach",
        action,
        actor,
        ctx,
        nodes,
        staticFrame,
        frameAt,
        actorFrameAt,
        resolveTarget,
      });
    }
    if (action.verb === "react") {
      if (ctx.rig === undefined) return null;
      const duration: number =
        action.duration === "auto" ? 0.5 : action.duration;
      const magnitude: number =
        REACT_MAX_DEFLECTION *
        Math.max(0, Math.min(1, action.force)) *
        (action.unbalance === true ? REACT_UNBALANCE_GAIN : 1);

      const source: IAutoMovieVector3 | null = resolveTarget(
        action.from,
        nodes,
        action.start,
      );
      const facing: number = (ctx.facingDeg * Math.PI) / 180;
      const forward: { x: number; y: number; z: number } = {
        x: Math.sin(facing),
        y: 0,
        z: Math.cos(facing),
      };

      const right: { x: number; y: number; z: number } = {
        x: -Math.cos(facing),
        y: 0,
        z: Math.sin(facing),
      };
      let push: IAutoMovieRecoilPush;
      if (source === null)
        push = { flexion: -magnitude }; // unknown → snap back
      else {
        const away: { x: number; y: number; z: number } = {
          x: ctx.position.x - source.x,
          y: 0,
          z: ctx.position.z - source.z,
        };
        const dir: IAutoMovieVector3 =
          AutoMovieEngineVector3.length(away) < 1e-6 ? forward : AutoMovieEngineVector3.normalize(away);
        push = {
          flexion: AutoMovieEngineVector3.dot(dir, forward) * magnitude,
          abduction: AutoMovieEngineVector3.dot(dir, right) * magnitude,
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
}

const GAIT_SAMPLES: number = 8 as const;

const REACT_MAX_DEFLECTION: number = 32 as const;

const REACT_UNBALANCE_GAIN: number = 1.5 as const;

const REACT_CHAIN: readonly ["head", "neck", "chest", "spine"] = [
  "head",
  "neck",
  "chest",
  "spine",
] as const;

function assertUniqueActorGaits(
  actor: string,
  gaits: IAutoMovieActorContext["gaits"],
): void {
  const seen: Set<string> = new Set<string>();
  for (const gait of gaits) {
    if (seen.has(gait.name))
      throw new Error(`duplicate actor gait name ${actor}.${gait.name}`);
    seen.add(gait.name);
  }
}

function fitDeclaredSpan(
  motion: IAutoMovieMotion,
  duration: IAutoMovieActionCall["duration"],
): IAutoMovieMotion {
  return duration === "auto"
    ? motion
    : timeScaleMotion(motion, duration / motion.duration);
}

function seedRestArticulation(
  motion: IAutoMovieMotion,
  restPose: IAutoMoviePose,
): IAutoMovieMotion {
  return {
    ...motion,
    keyframes: motion.keyframes.map(
      (
        keyframe: IAutoMovieKeyframe,
      ): {
        pose: {
          joints: IAutoMovieJointPose[];
          skeleton: string;
          root: IAutoMovieTransform | null;
        };
        time: number;
        expression: IAutoMovieExpression | null;
        easing: AutoMovieEasing;
        bezier: [number, number, number, number] | null;
      } => {
        const driven: Set<AutoMovieHumanoidBone> = new Set(
          keyframe.pose.joints.map(
            (joint: IAutoMovieJointPose): AutoMovieHumanoidBone => joint.bone,
          ),
        );
        return {
          ...keyframe,
          pose: {
            ...keyframe.pose,
            joints: [
              ...keyframe.pose.joints,
              ...restPose.joints
                .filter(
                  (joint: IAutoMovieJointPose): boolean =>
                    driven.has(joint.bone) === false,
                )
                .map(
                  (
                    joint: IAutoMovieJointPose,
                  ): {
                    bone: AutoMovieHumanoidBone;
                    flexion: number | null;
                    abduction: number | null;
                    twist: number | null;
                  } => ({ ...joint }),
                ),
            ],
          },
        };
      },
    ),
  };
}
