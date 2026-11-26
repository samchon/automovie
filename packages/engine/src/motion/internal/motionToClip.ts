import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  type IAutoMovieMotionClipBridge,
  type IAutoMovieMotionToClip,
  type IAutoMovieNode,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieTrack,
  IAutoMovieVector3,
} from "@automovie/interface";

import { jointToQuaternion } from "../../kinematics/internal/jointToQuaternion";
import { skeletonJointAxes } from "../../kinematics/internal/skeletonJointAxes";
import { Quaternion } from "../../math/Quaternion";
import { MOTION_ROOT_NODE_ID } from "../../resolve/constants/MOTION_ROOT_NODE_ID";
import { lowerSkeletonNodes } from "../../resolve/internal/lowerSkeletonNodes";
import { sampleMotion } from "../sampleMotion";
import { sampleTimes } from "./sampleTimes";

const DEFAULT_SAMPLE_RATE: number = 24;

/**
 * Bake admitted clinical motion into general node tracks at a positive sample
 * rate, default24Hz, with matching rig clinical tables. Full local bone
 * rotations and rigid root translation/rotation reproduce FK at bake times;
 * bone/root scale is ignored as in resolvePose, expressions are omitted, and
 * inter-sample quaternion interpolation approximates clinical easing rather
 * than preserving it exactly.
 */
export function motionToClip(
  props: IAutoMovieMotionToClip.IProps,
): IAutoMovieMotionClipBridge {
  const { motion, skeleton }: typeof props = props;
  const prefix: string = props.nodePrefix ?? "";
  const sampleRate: number = props.sampleRate ?? DEFAULT_SAMPLE_RATE;
  if (sampleRate <= 0)
    throw new Error(
      `motionToClip sampleRate must be a finite number > 0, but was ${sampleRate}`,
    );
  if (motion.duration <= 0)
    throw new Error(
      `motionToClip motion "${motion.id}" duration must be a finite number > 0, but was ${motion.duration}`,
    );
  if (motion.keyframes.length === 0)
    throw new Error(
      `motionToClip motion "${motion.id}" must have keyframes to bake`,
    );

  const boneNames: Set<AutoMovieHumanoidBone> = new Set(
    skeleton.bones.map(
      (bone: IAutoMovieBone): AutoMovieHumanoidBone => bone.bone,
    ),
  );
  const articulated: Set<AutoMovieHumanoidBone> = new Set();
  let hasRoot: boolean = false;
  for (const frame of motion.keyframes) {
    for (const joint of frame.pose.joints) {
      if (!boneNames.has(joint.bone))
        throw new Error(
          `motionToClip motion "${motion.id}" articulates bone "${joint.bone}" that skeleton "${skeleton.id}" does not have`,
        );
      articulated.add(joint.bone);
    }
    if (frame.pose.root !== null) hasRoot = true;
  }

  const nodes: IAutoMovieNode[] = lowerSkeletonNodes({
    skeleton,
    prefix,
  });
  const jointAxes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
    skeletonJointAxes(skeleton, props.jointAxes);
  const times: number[] = sampleTimes(motion.duration, sampleRate);
  const samples: IAutoMoviePose[] = times.map(
    (time: number): IAutoMoviePose => sampleMotion.pose(motion, time),
  );
  const jointsBySample: Map<AutoMovieHumanoidBone, IAutoMovieJointPose>[] =
    samples.map(
      (
        pose: IAutoMoviePose,
      ): Map<AutoMovieHumanoidBone, IAutoMovieJointPose> => {
        const joints: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> =
          new Map();
        for (const joint of pose.joints)
          if (!joints.has(joint.bone)) joints.set(joint.bone, joint);
        return joints;
      },
    );

  const tracks: IAutoMovieTrack[] = [];
  if (hasRoot) {
    tracks.push(
      rootTrack(times, samples, "translation", prefix),
      rootTrack(times, samples, "rotation", prefix),
    );
  }
  // Deterministic track order: skeleton declaration order, articulated only.
  // An unarticulated bone keeps its node rest transform, which already equals
  // resolvePose's identity-articulation local rotation.
  for (const bone of skeleton.bones) {
    if (!articulated.has(bone.bone)) continue;
    const values: number[] = [];
    for (const joints of jointsBySample) {
      const joint: IAutoMovieJointPose | undefined = joints.get(bone.bone);
      const articulation: IAutoMovieQuaternion =
        joint === undefined
          ? Quaternion.identity()
          : jointToQuaternion(
              joint,
              jointAxes[bone.bone],
              props.restFrames?.[bone.bone],
            );
      const local: IAutoMovieQuaternion = Quaternion.multiply(
        bone.rest.rotation,
        articulation,
      );
      values.push(local.x, local.y, local.z, local.w);
    }
    tracks.push({
      channel: {
        kind: "node",
        node: `${prefix}${bone.bone}`,
        path: "rotation",
      },
      times: [...times],
      values,
      interpolation: "linear",
    });
  }

  return {
    clip: {
      id: motion.id,
      name: null,
      duration: motion.duration,
      loop: motion.loop,
      tracks,
    },
    nodes,
  };
}

/** The root node's translation or rotation track from the sampled root. */
const rootTrack: (
  times: number[],
  samples: IAutoMoviePose[],
  path: "translation" | "rotation",
  prefix: string,
) => IAutoMovieTrack = (
  times: number[],
  samples: IAutoMoviePose[],
  path: "translation" | "rotation",
  prefix: string,
): IAutoMovieTrack => {
  const values: number[] = [];
  for (const pose of samples) {
    if (path === "translation") {
      const t: IAutoMovieVector3 = pose.root?.translation ?? {
        x: 0,
        y: 0,
        z: 0,
      };
      values.push(t.x, t.y, t.z);
    } else {
      const r: IAutoMovieQuaternion =
        pose.root?.rotation ?? Quaternion.identity();
      values.push(r.x, r.y, r.z, r.w);
    }
  }
  return {
    channel: { kind: "node", node: `${prefix}${MOTION_ROOT_NODE_ID}`, path },
    times: [...times],
    values,
    interpolation: "linear",
  };
};
