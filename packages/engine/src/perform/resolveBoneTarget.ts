import { IAutoMovieActionCall, IAutoMovieActionTarget, IAutoMovieKeyframe, IAutoMovieMotion, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";
import { HUMANOID_JOINT_AXES } from "../kinematics/humanoidJointAxes";
import { resolvePose } from "../kinematics/resolvePose";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { locomoteMotion } from "../motion/locomoteMotion";
import { sampleMotion } from "../motion/sampleMotion";
import { timeScaleMotion } from "../motion/timeScale";
import { IAutoMovieActorContext } from "./IAutoMovieActorContext";

/**
 * Resolve a bone target into world coordinates from a sampled actor motion.
 *
 * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-target-space Resolves a moving bone target into the explicit world space consumed by IK.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Transforms a sampled rig-bone position into world target space.
 */
export const resolveBoneTarget = (
  target: IAutoMovieActionTarget,
  contexts: ReadonlyMap<string, IAutoMovieActorContext>,
  motions: Readonly<Record<string, IAutoMovieMotion>> | undefined,
  seconds: number,
): IAutoMovieVector3 | null => {
  if (target.kind !== "bone") return null;
  const context = contexts.get(target.node);
  if (context?.rig === undefined) return null;
  const motion = motions?.[target.node];
  const pose =
    motion === undefined
      ? context.restPose
      : sampleMotion(motion, seconds).pose;
  const resolved = resolvePose(
    pose,
    context.rig,
    HUMANOID_JOINT_AXES,
    context.restFrames,
  ).find((entry) => entry.bone === target.bone);
  if (resolved === undefined) return null;
  const facing = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    context.facingDeg,
  );
  return Vector3.add(
    context.position,
    // `resolvePose` starts its FK walk at `pose.root.translation`, so its
    // world position already carries locomotion exactly once. Rotate that
    // model-space point into the staged facing, then translate to the actor.
    Quaternion.rotateVector(facing, resolved.worldPosition),
  );
};

/** A rest → strike → rest jab: snap out to `pose` early, then retract. */
const jabClip = (
  id: string,
  skeleton: string,
  pose: IAutoMoviePose,
  duration: number,
): IAutoMovieMotion => {
  const rest: IAutoMoviePose = { skeleton, root: null, joints: [] };
  const key = (
    time: number,
    p: IAutoMoviePose,
    easing: IAutoMovieKeyframe["easing"],
  ): IAutoMovieKeyframe => ({
    time,
    pose: p,
    expression: null,
    easing,
    bezier: null,
  });
  return {
    id,
    skeleton,
    duration,
    loop: false,
    keyframes: [
      key(0, rest, "easeIn"),
      key(duration * 0.4, pose, "easeOut"),
      key(duration, rest, "easeInOut"),
    ],
  };
};

/**
 * Fit a synthesised locomotion clip onto the span its action DECLARES.
 *
 * `IAutoMovieActionBase.duration` is defined as "length in seconds, or `"auto"`
 * to let the engine pick a natural duration", and every other verb here sizes
 * its clip by that number. `locomote` did not: it sized the walk from distance
 * and the actor's speed and discarded what the author wrote, so a walk declared
 * 7.5s compiled to 3.0s with no violation, no warning, and nothing in the guide
 * corpus saying it would (#1366). That is the substitute-in-silence shape #1349
 * refused for channels, moved from content to timing, and it is the one
 * quantity `performShot` already treats as authoritative everywhere else: its
 * `spanOf` gates overlaps and covers blocking anchors with exactly this
 * number.
 *
 * The fit is a uniform time scale, so the walk still arrives exactly where
 * {@link locomoteMotion} landed it and still plays whole gait cycles: only the
 * cadence changes, which is how a body covers the same ground in more or less
 * time. It deliberately overrides the ½-nominal-speed floor `locomoteMotion`
 * holds for its OWN sizing (#1065), because that floor bounds what the engine
 * may choose when nobody said, not what an author may state.
 *
 * `"auto"` is untouched, and remains the way to ask for the engine's sizing.
 */
const fitDeclaredSpan = (
  motion: IAutoMovieMotion,
  duration: IAutoMovieActionCall["duration"],
): IAutoMovieMotion =>
  duration === "auto"
    ? motion
    : timeScaleMotion(motion, duration / motion.duration);

/** Preserve carried articulation on gait bones the new cycle does not drive. */
const seedRestArticulation = (
  motion: IAutoMovieMotion,
  restPose: IAutoMoviePose,
): IAutoMovieMotion => ({
  ...motion,
  keyframes: motion.keyframes.map((keyframe) => {
    const driven = new Set(keyframe.pose.joints.map((joint) => joint.bone));
    return {
      ...keyframe,
      pose: {
        ...keyframe.pose,
        joints: [
          ...keyframe.pose.joints,
          ...restPose.joints
            .filter((joint) => driven.has(joint.bone) === false)
            .map((joint) => ({ ...joint })),
        ],
      },
    };
  }),
});
