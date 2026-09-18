import { IAutoMovieKeyframe, IAutoMovieMotion, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";
import { reachPose } from "../kinematics/reachPose";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ease } from "../motion/ease";
import { sampleMotion } from "../motion/sampleMotion";
import { IAutoMovieActorContext } from "./IAutoMovieActorContext";
import { IAutoMovieActorWorldFrame } from "./IAutoMovieActorWorldFrame";

/**
 * Resolve a motion root on top of the actor's staged world transform.
 *
 * @evidence requirements/motion/root-motion-and-trajectories.md#motion-root-authority-mode Composes clip-local root motion with the authored staged transform without double authority.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Produces the world root at one sampled instant.
 */
export const resolveActorWorldFrame = (
  context: IAutoMovieActorContext,
  motion: IAutoMovieMotion | undefined,
  seconds: number,
): IAutoMovieActorWorldFrame | null => {
  if (motion === undefined) return null;
  const root = sampleMotion(motion, seconds).pose.root;
  if (root === null) return null;
  const staged = staticActorWorldFrame(context);
  const rotation = Quaternion.multiply(staged.rotation, root.rotation);
  const forward = Quaternion.rotateVector(rotation, { x: 0, y: 0, z: 1 });
  return {
    position: Vector3.add(
      staged.position,
      Quaternion.rotateVector(staged.rotation, root.translation),
    ),
    rotation,
    facingDeg: (Math.atan2(forward.x, forward.z) * 180) / Math.PI,
  };
};

/** Drop a world point into an actor's model space (undo its live frame). */
const toModelSpace = (
  world: IAutoMovieVector3,
  frame: IAutoMovieActorWorldFrame,
): IAutoMovieVector3 =>
  Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.subtract(world, frame.position),
  );

/**
 * The placement table lifted to **aim** points: every id an actor context knows
 * is raised by that actor's `eyeHeight`, every other id keeps its placement.
 *
 * A placement is where a thing stands, which for a humanoid is the floor under
 * it; an aim point is where another actor's gaze meets it. `eyeHeight` is
 * already defined as "where a `lookAt` aims from", so using it as where a
 * `lookAt` aims TO is the symmetric read (eyes meet eyes) and invents no
 * number. Ids with no context keep their placement on purpose: a prop's origin
 * is wherever staging put it rather than a floor convention, and a camera's
 * translation is already its optical point.
 *
 * The key set is identical to the placement table's, so the perform gate (which
 * asks only whether a target resolves) and this synthesizer can never disagree
 * about which ids are legal. Routing the lift through the table rather than
 * through the verb is what makes a `group` target average EYE points instead of
 * ground points without a second code path.
 *
 * **Only `lookAt` reads this table**, and that is a decision, not an oversight.
 * `locomote` walks to a place on the ground, so its destination is the
 * placement itself. The arm verbs (`reach`, the `point` and `strike` gestures)
 * do not reach for eyes, and no measured chest/hand datum exists on the context
 * to lift them by; each of those branches says so where it resolves.
 */
const aimPointsOf = (
  contexts: ReadonlyMap<string, IAutoMovieActorContext>,
  nodes: ReadonlyMap<string, IAutoMovieVector3>,
): Map<string, IAutoMovieVector3> =>
  new Map(
    [...nodes].map(([id, point]) => {
      const eyeHeight = contexts.get(id)?.eyeHeight;
      return [
        id,
        eyeHeight === undefined
          ? point
          : { x: point.x, y: point.y + eyeHeight, z: point.z },
      ] as const;
    }),
  );

/** A rest → hold-pose → hold clip: ease into `pose` over half the span, hold. */
const extendHoldClip = (
  id: string,
  skeleton: string,
  pose: IAutoMoviePose,
  duration: number,
): IAutoMovieMotion => {
  const rest: IAutoMoviePose = { skeleton, root: null, joints: [] };
  const key = (time: number, p: IAutoMoviePose): IAutoMovieKeyframe => ({
    time,
    pose: p,
    expression: null,
    easing: "easeInOut",
    bezier: null,
  });
  return {
    id,
    skeleton,
    duration,
    loop: false,
    keyframes: [key(0, rest), key(duration * 0.5, pose), key(duration, pose)],
  };
};

const boneTargetTimes = (
  duration: number,
  landmarks: readonly number[] = [],
): number[] => {
  const count = Math.max(2, Math.ceil(duration * BONE_TARGET_HZ) + 1);
  return [
    ...new Set([
      ...Array.from(
        { length: count },
        (_, index) => (duration * index) / (count - 1),
      ),
      ...landmarks,
    ]),
  ].sort((a, b) => a - b);
};

const dynamicPoseClip = (props: {
  id: string;
  skeleton: string;
  duration: number;
  poseAt: (time: number) => IAutoMoviePose | null;
  landmarks?: readonly number[];
}): IAutoMovieMotion | null => {
  const keyframes: IAutoMovieKeyframe[] = [];
  for (const time of boneTargetTimes(props.duration, props.landmarks)) {
    const pose = props.poseAt(time);
    if (pose === null) return null;
    keyframes.push({
      time,
      pose,
      expression: null,
      easing: "linear",
      bezier: null,
    });
  }
  return {
    id: props.id,
    skeleton: props.skeleton,
    duration: props.duration,
    loop: false,
    keyframes,
  };
};

const weightedArmPose = (
  skeleton: string,
  pose: IAutoMoviePose,
  weight: number,
): IAutoMoviePose => ({
  skeleton,
  root: null,
  joints:
    weight === 0
      ? []
      : pose.joints.map((joint) => ({
          bone: joint.bone,
          // Every caller supplies reachPose's two clinical arm joints, whose
          // three axes are numbers by construction. Preserve that stronger
          // internal invariant instead of branching on impossible null axes.
          flexion: joint.flexion! * weight,
          abduction: joint.abduction! * weight,
          twist: joint.twist! * weight,
        })),
});

/** A sampled live-target version of rest -> extend -> hold. */
const dynamicExtendHoldClip = (props: {
  id: string;
  skeleton: string;
  duration: number;
  poseAt: (time: number) => IAutoMoviePose | null;
}): IAutoMovieMotion | null => {
  const extendedAt = props.duration * 0.5;
  return dynamicPoseClip({
    ...props,
    landmarks: [extendedAt],
    poseAt: (time) => {
      const pose = props.poseAt(time);
      if (pose === null) return null;
      const weight =
        time >= extendedAt ? 1 : ease("easeInOut", time / extendedAt);
      return weightedArmPose(props.skeleton, pose, weight);
    },
  });
};

/** A sampled live-target version of rest -> 40% strike peak -> rest. */
const dynamicJabClip = (props: {
  id: string;
  skeleton: string;
  duration: number;
  poseAt: (time: number) => IAutoMoviePose | null;
}): IAutoMovieMotion | null => {
  const peakAt = props.duration * 0.4;
  return dynamicPoseClip({
    ...props,
    landmarks: [peakAt],
    poseAt: (time) => {
      const pose = props.poseAt(time);
      if (pose === null) return null;
      const weight =
        time <= peakAt
          ? ease("easeIn", time / peakAt)
          : 1 - ease("easeOut", (time - peakAt) / (props.duration - peakAt));
      return weightedArmPose(props.skeleton, pose, weight);
    },
  });
};

/** Keyframes per second for a target that is itself animated. */
const BONE_TARGET_HZ = 24;

const boneTargetTimes = (
  duration: number,
  landmarks: readonly number[] = [],
): number[] => {
  const count = Math.max(2, Math.ceil(duration * BONE_TARGET_HZ) + 1);
  return [
    ...new Set([
      ...Array.from(
        { length: count },
        (_, index) => (duration * index) / (count - 1),
      ),
      ...landmarks,
    ]),
  ].sort((a, b) => a - b);
};

const weightedArmPose = (
  skeleton: string,
  pose: IAutoMoviePose,
  weight: number,
): IAutoMoviePose => ({
  skeleton,
  root: null,
  joints:
    weight === 0
      ? []
      : pose.joints.map((joint) => ({
          bone: joint.bone,
          // Every caller supplies reachPose's two clinical arm joints, whose
          // three axes are numbers by construction. Preserve that stronger
          // internal invariant instead of branching on impossible null axes.
          flexion: joint.flexion! * weight,
          abduction: joint.abduction! * weight,
          twist: joint.twist! * weight,
        })),
});
