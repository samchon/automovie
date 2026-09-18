import { IAutoMovieActionCall, IAutoMovieActionTarget, IAutoMovieBeatEndState, IAutoMovieKeyframe, IAutoMovieMotion, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";
import { aimYawPitch } from "../kinematics/aimYawPitch";
import { gazeChainJoints } from "../kinematics/gazeChain";
import { reachPose } from "../kinematics/reachPose";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { holdMotion } from "../motion/holdMotion";
import { gaitMotion } from "../motion/gaitMotion";
import { gestureMotion } from "../motion/gestureMotion";
import { classifyLocomoteGroundDisplacement } from "../motion/classifyLocomoteGroundDisplacement";
import { locomoteMotion } from "../motion/locomoteMotion";
import { reactMotion } from "../motion/react";
import { IAutoMovieActorContext } from "./IAutoMovieActorContext";
import { IAutoMovieActionSynthesizer } from "./IAutoMovieActionSynthesizer";
import { resolveTargetPoint } from "./resolveTargetPoint";
import { IAutoMovieActorWorldFrame } from "./IAutoMovieActorWorldFrame";

/**
 * Build a reference {@link IAutoMovieActionSynthesizer} (the content seam
 * {@link compilePerformance} injects) for the verbs the engine can fatten
 * **deterministically** from an actor's context:
 *
 * - `locomote` → the actor's matching {@link IAutoMovieGait}; if its target
 *   resolves to a world point ({@link resolveTargetPoint}, against `nodes`), the
 *   gait is carried that far at the actor's speed ({@link locomoteMotion}),
 *   otherwise it steps in place (a relative target, "off to the left", has no
 *   positional point yet). Either way an explicit `duration` sets the clip's
 *   span ({@link fitDeclaredSpan}) and `"auto"` keeps the engine's own sizing;
 * - `hold` → the actor's rest pose held for the duration ({@link holdMotion});
 * - `lookAt` → the gaze chain turned to aim at a resolved target, resolved
 *   against the **aim points** rather than the raw placements (see below), and
 *   distributed over `neck`/`head` by the context's declared ROM when it
 *   carries a `rig` ({@link gazeChainJoints});
 * - `emote` → a face-region expression clip;
 * - `gesture` → the postural/whole-body gestures (bow/nod/shake/crouch/kick/
 *   stagger/wave/celebrate/jump) via {@link gestureMotion}, plus the reachPose
 *   arm gestures: `point` (arm extended toward `at`, held) and `strike` (a jab
 *   thrown at `at`, then retracted); the remaining combat kinds return null;
 * - `reach` → analytic two-bone arm IK to a resolved target ({@link reachPose}),
 *   the target dropped into the actor's model space; needs the context's `rig`
 *   and is left unclamped so an impossible reach fails the shot's ROM gate;
 * - `react` → a ROM-clamped flinch away from the blow ({@link reactMotion}),
 *   decomposed into the actor's frame so a front hit snaps the torso back and a
 *   side hit leans it; needs the context's `rig` (the flinch is bounded by
 *   joint ROM), so a rig-less context synthesises nothing for it.
 *
 * Every other verb returns `null` (the host supplies its rig-specific content,
 * or a richer synthesiser does), and an unknown actor returns `null`. This is
 * the bridge that makes the action builder actually produce motion from the
 * declarative gait/profile data: the thin verb in, dense motion out.
 *
 * `lookAt` resolves against {@link aimPointsOf} instead of `nodes` because a
 * placement is a **ground** point: staging writes an actor's position straight
 * into its node transform, and a humanoid rig's origin sits between its feet,
 * so "look at him" aimed the head at the floor and two actors at conversational
 * range could not regard each other at all (1.6 m of eye height over 0.7 m of
 * separation is 66.37 degrees of flexion against a 45 degree head limit). The
 * camera solve met the same wall and answered it with a measured aim fraction
 * of the subject's height; this is the aim verbs' half of that answer, using
 * the one datum the context already carries for exactly this purpose. Since
 * #1360 that same 66.37 degrees is legal on a declared chain, which does not
 * soften the reason: a gaze aimed between the subject's feet is a stoop, and
 * the lift is what makes it a look.
 *
 * @evidence requirements/actors/performance-and-story-binding.md#actor-performance-capability-plan Rejects an action when the actor lacks its required synthesis capability.
 * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-story-performance-state Builds actor motion from the selected authored action.
 * @author Samchon
 */
export const makeActorSynthesizer = (
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
    const live = resumedRuntime(contexts, placements, previous);
    const nodes = live.nodes;
    const aimPoints = aimPointsOf(live.contexts, nodes);
    const ctx = live.contexts.get(actor);
    if (ctx === undefined) return null;
    const staticFrame = staticActorWorldFrame(ctx);
    const frameAt = (seconds: number): IAutoMovieActorWorldFrame =>
      actorFrameAt?.(actor, seconds) ?? staticFrame;
    const resolveTarget = (
      target: IAutoMovieActionTarget,
      table: Map<string, IAutoMovieVector3>,
      seconds: number,
    ): IAutoMovieVector3 | null =>
      target.kind === "bone"
        ? (boneTargetAt?.(target, seconds) ?? null)
        : resolveTargetPoint(target, table);
    if (action.verb === "locomote") {
      const gait = ctx.gaits.find((g) => g.name === action.gait);
      if (gait === undefined) return null;
      const cycle = seedRestArticulation(
        gaitMotion(
          `${actor}:${action.gait}`,
          ctx.skeleton,
          gait,
          GAIT_SAMPLES,
          ctx.gaitPhase ?? 0,
        ),
        ctx.restPose,
      );
      const dest = resolveTarget(action.to, nodes, action.start);
      // Every arm below is fitted to a DECLARED duration (#1366). The engine
      // sizes the walk from distance and speed, which is what `"auto"` asks
      // for; a number is the author stating the span, exactly as it does on
      // every other verb, and it used to be discarded here in silence (a walk
      // declared 7.5s compiled to 3.0s with no violation and no warning).
      if (dest === null) return fitDeclaredSpan(cycle, action.duration); // relative/unresolved → step in place
      // Travel is baked onto the pose root, which the renderer applies in the
      // actor's model frame (under its staged facing). So aim it in model space
      // (undo the facing) and the composed render carries it to the world
      // destination; a turned actor would otherwise walk off its heading.
      const local = toModelSpace(dest, staticFrame);
      const displacement = classifyLocomoteGroundDisplacement(local);
      if (displacement.alreadyThere)
        return fitDeclaredSpan(cycle, action.duration); // already there → step in place
      // A gait cannot realize a purely vertical displacement. Returning null
      // makes the performance gate report the unsupported ground destination;
      // pretending it is "already there" would silently leave the actor at
      // the wrong height, while carrying it vertically would turn a walk into
      // an elevator. The same epsilon prevents an unbounded slope ratio.
      if (displacement.verticalOnly) return null;
      // A locomote destination is the ground point the actor must actually
      // reach, including a ramp's rise. Keep gait cadence governed by the XZ
      // distance (the actor profile's speed is its ground speed), but carry the
      // complete displacement through locomoteMotion. Scaling the 3D speed by
      // the same slope ratio leaves distance / speed, cycle count, and duration
      // identical to the planar walk while making the baked root arrive at the
      // authored Y instead of silently discarding it (#1473).
      const travelSpeed =
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
      // The AIM table, not the placement table: a look meets the subject's
      // eyes, not the ground its feet stand on (see the aim-point note above).
      const duration = action.duration === "auto" ? 1 : action.duration;
      // Turn the gaze CHAIN: twist toward the target, flexion to tilt (up =
      // extension), spread over `neck` and `head` as the rig declares they can
      // hold it (#1360). Piling the whole solved angle on the head emitted
      // poses the rig itself forbade for any target much below eye level, and
      // the `head` region this verb drives already owns the neck, so nothing
      // downstream had to change for the second joint to survive the mask.
      const poseAt = (time: number): IAutoMoviePose | null => {
        const frame = frameAt(action.start + time);
        const eye = Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, {
            x: 0,
            y: ctx.eyeHeight,
            z: 0,
          }),
        );
        const target = resolveTarget(action.to, aimPoints, action.start + time);
        if (target === null) return null;
        const { yawDeg, pitchDeg } = aimYawPitch(eye, target, frame.facingDeg);
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
        return dynamicPoseClip({
          id: `${actor}:lookAt`,
          skeleton: ctx.skeleton,
          duration,
          poseAt,
        });
      const pose = poseAt(0);
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
      // a face-region clip: only the expression, no body joints to merge
      const duration = action.duration === "auto" ? 1 : action.duration;
      const expression = {
        preset: action.preset,
        intensity: action.intensity,
        blendshapes: null,
      };
      const frame = (time: number): IAutoMovieKeyframe => ({
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
      const duration = action.duration === "auto" ? 1 : action.duration;
      // `point` rides reachPose (an arm extended toward `at`; reachPose
      // clamps a far target onto the reach shell, which is exactly a pointing
      // arm). Left unclamped like `reach`, so an impossible point fails the
      // shot's ROM gate. Needs the rig and a resolvable target.
      //
      // The arm verbs resolve `nodes`, NOT `aimPoints`: the lift is deliberately
      // not applied here. `eyeHeight` answers "where does a gaze meet this
      // actor", and an arm does not reach for eyes; the chest/hand datum an arm
      // target would need does not exist on the context, and inventing a
      // fraction here would be the guess the "measure, don't hope" doctrine
      // forbids. Author an explicit `point` for a precise arm goal until a
      // measured datum exists.
      if (action.kind === "point" && ctx.rig !== undefined) {
        const world =
          action.at === undefined
            ? null
            : resolveTarget(action.at, nodes, action.start);
        if (world === null) return null;
        if (
          action.at?.kind === "bone" ||
          (actorFrameAt?.(actor, action.start) ?? null) !== null
        )
          return dynamicExtendHoldClip({
            id: `${actor}:point`,
            skeleton: ctx.skeleton,
            duration,
            poseAt: (time) => {
              const point = resolveTarget(
                action.at!,
                nodes,
                action.start + time,
              );
              return point === null
                ? null
                : reachPose(
                    ctx.rig!,
                    "right",
                    toModelSpace(point, frameAt(action.start + time)),
                    ctx.restFrames,
                  );
            },
          });
        const pose = reachPose(
          ctx.rig,
          "right",
          toModelSpace(world, staticFrame),
          ctx.restFrames,
        );
        return pose === null
          ? null
          : extendHoldClip(`${actor}:point`, ctx.skeleton, pose, duration);
      }
      // `strike` (a jab) also rides reachPose (the fist thrown toward the
      // target), but snaps out and retracts (jabClip) instead of holding, so it
      // reads as a punch. Same rig + resolvable-target requirement as point,
      // and the same placement-not-aim-point resolution (see above).
      if (action.kind === "strike" && ctx.rig !== undefined) {
        const world =
          action.at === undefined
            ? null
            : resolveTarget(action.at, nodes, action.start);
        if (world === null) return null;
        if (
          action.at?.kind === "bone" ||
          (actorFrameAt?.(actor, action.start) ?? null) !== null
        )
          return dynamicJabClip({
            id: `${actor}:strike`,
            skeleton: ctx.skeleton,
            duration,
            poseAt: (time) => {
              const point = resolveTarget(
                action.at!,
                nodes,
                action.start + time,
              );
              return point === null
                ? null
                : reachPose(
                    ctx.rig!,
                    "right",
                    toModelSpace(point, frameAt(action.start + time)),
                    ctx.restFrames,
                  );
            },
          });
        const pose = reachPose(
          ctx.rig,
          "right",
          toModelSpace(world, staticFrame),
          ctx.restFrames,
        );
        return pose === null
          ? null
          : jabClip(`${actor}:strike`, ctx.skeleton, pose, duration);
      }
      // The postural gestures (bow/nod/shake/crouch) are engine-authored; the
      // remaining arm/combat kinds return null (rig-specific or reach-dependent).
      return gestureMotion(
        `${actor}:${action.kind}`,
        ctx.skeleton,
        action.kind,
        duration,
      );
    }
    if (action.verb === "reach") {
      // An IK verb: needs the rig geometry (arm lengths, rest FK). Resolve the
      // target to a world point, drop it into the actor's model space (undo the
      // placement), and solve the arm. reachPose SEEKS a ROM-valid pose but
      // never CLAMPS to one (#1345): where the rig's declared ranges admit no
      // articulation that reaches, it returns the least-violating candidate and
      // the shot's ROM gate rejects it. The model must reposition, not the
      // engine hide it.
      //
      // `nodes`, not `aimPoints`, for the reason spelled out at the `point`
      // gesture: an arm target is not an eye, and the context carries no
      // measured chest/hand height to lift by.
      if (ctx.rig === undefined) return null;
      const world = resolveTarget(action.to, nodes, action.start);
      if (world === null) return null; // relative target: no point to reach
      const duration = action.duration === "auto" ? 0.6 : action.duration;
      if (
        action.to.kind === "bone" ||
        (actorFrameAt?.(actor, action.start) ?? null) !== null
      )
        return dynamicExtendHoldClip({
          id: `${actor}:reach`,
          skeleton: ctx.skeleton,
          duration,
          poseAt: (time) => {
            const point = resolveTarget(action.to, nodes, action.start + time);
            return point === null
              ? null
              : reachPose(
                  ctx.rig!,
                  action.hand,
                  toModelSpace(point, frameAt(action.start + time)),
                  ctx.restFrames,
                );
          },
        });
      const reach = reachPose(
        ctx.rig,
        action.hand,
        toModelSpace(world, staticFrame),
        ctx.restFrames,
      );
      if (reach === null) return null;
      return extendHoldClip(`${actor}:reach`, ctx.skeleton, reach, duration);
    }
    if (action.verb === "react") {
      // A physics verb: the flinch is clamped to each joint's ROM, so it needs
      // the rig geometry. Without it (a context built only for gait/hold), the
      // reference synthesiser produces nothing.
      if (ctx.rig === undefined) return null;
      const duration = action.duration === "auto" ? 0.5 : action.duration;
      const magnitude =
        REACT_MAX_DEFLECTION *
        Math.max(0, Math.min(1, action.force)) *
        (action.unbalance === true ? REACT_UNBALANCE_GAIN : 1);

      // Decompose the blow into the actor's own frame so a front hit snaps the
      // torso back (extension, −flexion) and a side hit leans it (abduction).
      // `from` is where the blow comes from; the body recoils away from it.
      const source = resolveTarget(action.from, nodes, action.start);
      const facing = (ctx.facingDeg * Math.PI) / 180;
      const forward = { x: Math.sin(facing), y: 0, z: Math.cos(facing) };
      // Anatomical right: facing 0 looks down +Z and the actor's LEFT is +X
      // (aimYawPitch's +90° yaw), so right is −X there. Positive spine
      // abduction tilts toward −X, so dot(away, right) leans AWAY from the
      // blow. The previous +X "right" leaned the body into it.
      const right = { x: -Math.cos(facing), y: 0, z: Math.sin(facing) };
      let push;
      if (source === null)
        push = { flexion: -magnitude }; // unknown → snap back
      else {
        const away = {
          x: ctx.position.x - source.x,
          y: 0,
          z: ctx.position.z - source.z,
        };
        const dir =
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

/** Keyframes per gait cycle the reference synthesiser bakes. */
const GAIT_SAMPLES = 8;

/** Peak flinch deflection (degrees) a full-force (1.0) blow drives. */
const REACT_MAX_DEFLECTION = 32;

/** An unbalancing blow flinches this much harder (a floored reaction). */
const REACT_UNBALANCE_GAIN = 1.5;

/** The chain a torso/head blow ripples down: head whips most, hips least. */
const REACT_CHAIN = ["head", "neck", "chest", "spine"] as const;

const assertUniqueActorGaits = (
  actor: string,
  gaits: IAutoMovieActorContext["gaits"],
): void => {
  const seen = new Set<string>();
  for (const gait of gaits) {
    if (seen.has(gait.name))
      throw new Error(`duplicate actor gait name ${actor}.${gait.name}`);
    seen.add(gait.name);
  }
};
