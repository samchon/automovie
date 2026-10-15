import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieTrack,
  IAutoMovieVector3,
} from "@automovie/interface";

import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { skeletonJointAxes } from "../kinematics/skeletonJointAxes";
import { Quaternion } from "../math/Quaternion";
import { MOTION_ROOT_NODE_ID } from "../resolve/constants/MOTION_ROOT_NODE_ID";
import { lowerSkeletonNodes } from "../resolve/lowerSkeletonNodes";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { IAutoMovieMotionClipBridge } from "./IAutoMovieMotionClipBridge";
import { sampleMotion } from "./sampleMotion";
import { sampleTimes } from "./sampleTimes";

const DEFAULT_SAMPLE_RATE: number = 24;

/**
 * Bake admitted clinical motion into general node tracks at a positive sample rate, default24Hz, with matching rig clinical tables. Full local bone rotations and rigid root translation/rotation reproduce FK at bake times; bone/root scale is ignored as in resolvePose, expressions are omitted, and inter-sample quaternion interpolation approximates clinical easing rather than preserving it exactly.
 *
 * @evidence contracts/common.md#principled-implementation Lowers skeleton nodes with unit scale, samples motion on the shared endpoint-inclusive clock, composes each articulated bone's rest rotation with clinical quaternion, and emits linear/slerp tracks plus rigid root channels when authored roots exist. Unchanged unreachable/stray-joint behavior remains admitted rig/motion semantics.
 * @evidence contracts/common.md#clear-and-simple-design The bridge owns sampled track packaging and actor node-prefix identity; sampleMotion owns clinical interpolation and lowerSkeletonNodes owns the matching rig graph.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid rate/duration/empty keyframes and articulated absent bones throw; no unsupported expression track is invented. Dense bake accuracy is exact at samples and may differ between them, especially at easing/step discontinuities.
 * @evidence contracts/common.md#meaningful-documentation States sample rate, node prefixes, complete local rotation, no-scale FK matching, omitted expressions and between-sample limitation without a universal O(step squared) claim across discontinuities.
 * @evidence contracts/performance.md#efficient-algorithms For F baked times, A articulated bones and J sampled joints, builds one first-occurrence joint map per sample then performs O(FA) track lookups, with O(FJ) temporary map storage plus output buffers; graph lowering is O(bones) and motion interpolation owns its segment/joint cost.
 * @evidence contracts/performance.md#reuse-equivalent-work One sampleMotion pose and joint lookup map per bake time serve all bone tracks; root translation/rotation share the sampled poses, and track time arrays are independent outputs rather than a retained cross-clip cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns nodes, per-track time/value buffers and clip; sampled pose arrays are released after packaging, output grows with rate*duration and articulated bones, and no renderer/native handle is acquired.
 */
export const motionToClip: (props: {
  /** The humanoid motion to lower. */ motion: IAutoMovieMotion;
  /** The rig the motion articulates; lowered to the returned nodes. */ skeleton: IAutoMovieSkeleton;
  /** Optional per-bone clinical-axis remap, as {@link resolvePose} takes. */ jointAxes?: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>
  >;
  /** Optional per-bone rest-frame remap, as {@link resolvePose} takes. */ restFrames?: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
  >;
  /** Bake samples per second. Defaults to `24`. */ sampleRate?: number;
  /** Node-id prefix applied to every lowered node AND every clip channel ref (root and bones alike). Defaults to `""`: the bare single-actor naming. A multi-actor graph (see `sceneToNodes`) passes the placement prefix (e.g. `"figureA/"`) so each actor's channels drive its own subtree. */ nodePrefix?: string;
}) => IAutoMovieMotionClipBridge = (props: {
  /** The humanoid motion to lower. */
  motion: IAutoMovieMotion;

  /** The rig the motion articulates; lowered to the returned nodes. */
  skeleton: IAutoMovieSkeleton;

  /**
   * Optional per-bone clinical-axis remap, as {@link resolvePose} takes; a
   * bone's own declared axes take precedence.
   */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /** Optional per-bone rest-frame remap, as {@link resolvePose} takes. */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

  /** Bake samples per second. Defaults to `24`. */
  sampleRate?: number;

  /**
   * Node-id prefix applied to every lowered node AND every clip channel ref
   * (root and bones alike). Defaults to `""`: the bare single-actor naming. A
   * multi-actor graph (see `sceneToNodes`) passes the placement prefix (e.g.
   * `"figureA/"`) so each actor's channels drive its own subtree.
   */
  nodePrefix?: string;
}): IAutoMovieMotionClipBridge => {
  const { motion, skeleton }: typeof props = props;
  const prefix: string = props.nodePrefix ?? "";
  const sampleRate: number = props.sampleRate ?? DEFAULT_SAMPLE_RATE;
  if (!Number.isFinite(sampleRate) || sampleRate <= 0)
    throw new Error(
      `motionToClip sampleRate must be a finite number > 0, but was ${sampleRate}`,
    );
  if (!Number.isFinite(motion.duration) || motion.duration <= 0)
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

  const nodes: ReturnType<typeof lowerSkeletonNodes> = lowerSkeletonNodes({
    skeleton,
    prefix,
  });
  const jointAxes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
    skeletonJointAxes(skeleton, props.jointAxes);
  const times: number[] = sampleTimes(motion.duration, sampleRate);
  const samples: IAutoMoviePose[] = times.map(
    (time: number): IAutoMoviePose => sampleMotion(motion, time).pose,
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
};

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
