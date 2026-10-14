import type {
  AutoMovieHumanoidBone,
  AutoMovieInterpolation,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HUMANOID_JOINT_AXES } from "../kinematics/constants/HUMANOID_JOINT_AXES";
import { decomposeJointRotation } from "../kinematics/decomposeJointRotation";
import { Quaternion } from "../math/Quaternion";
import { channelKey } from "../resolve/channelKey";
import { sampleClip } from "../resolve/sampleClip";
import { HUMANOID_REST_FRAME } from "../rom/constants/HUMANOID_REST_FRAME";
import { getConstraint } from "../rom/getConstraint";
import { compareCodeUnits } from "../text/compareCodeUnits";
import { IAutoMovieImportedNodeBoneMapping } from "./IAutoMovieImportedNodeBoneMapping";
import { IAutoMovieImportedNodeMotionProps } from "./IAutoMovieImportedNodeMotionProps";

/**
 * Lower admitted imported node tracks into clinical keyframes at the sorted union of source key times. Every mapped node needs a rotation track; only hips translation is supported, all tracks share step or linear interpolation, and unsupported/missing/duplicate/nonfinite content throws. Key orientations are retained within clinical inversion tolerance; inter-key linear clinical interpolation generally differs from quaternion slerp.
 *
 * @evidence contracts/common.md#principled-implementation Samples the union of authored times, removes source rest rotation, and decomposes local quaternions into clinical axes/rest frames under actual rig domains; hips translation subtracts hips rest offset. One common law is representable by keyframe easing, but only step is identical throughout each source interval in general.
 * @evidence contracts/common.md#clear-and-simple-design Conversion owns explicit channel/mapping admission and source clinical lowering; target-rig contact retargeting remains a subsequent operation, while existing sampleClip and decomposeJointRotation own interpolation/inversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unmapped channels, non-hips translation, scale/weights, mixed/cubic laws and malformed quaternions refuse; no inferred mapping or denser approximating bake hides these differences. Finite normalized source rig and well-formed track buffers remain the imported-clip caller's admission premise.
 * @evidence contracts/common.md#meaningful-documentation States retained key times, supported channels/laws, named refusal, clinical inversion tolerance and the inter-key quaternion-versus-axis limitation without claiming lossless linear-curve preservation.
 * @evidence contracts/performance.md#efficient-algorithms Indexes source bones/mappings/tracks once, unions/sorts K source times, then samples T tracks and decomposes M mapped bones per output time; output stores O(KM) joint records and no full frame-rate bake.
 * @evidence contracts/performance.md#reuse-equivalent-work Source bone and channel maps are reused at all key times, each sampleClip result supplies every mapped rotation/root value for that time, and no conversion cache survives mutable clip/skeleton edits.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary maps/sets and key-time union live for this conversion; the caller owns new keyframes/root/joint records and no source buffer, native resource or callback is retained independently.
 */
export const importedNodeClipToAutoMovieMotion: (
  props: IAutoMovieImportedNodeMotionProps,
) => IAutoMovieMotion = (
  props: IAutoMovieImportedNodeMotionProps,
): IAutoMovieMotion => {
  if (props.motionId.trim().length === 0)
    throw new Error("imported motion id must not be blank");
  if (props.sourceSkeleton.id.trim().length === 0)
    throw new Error("imported motion source skeleton id must not be blank");
  if (props.mapping.length === 0)
    throw new Error(
      "imported motion requires an explicit node-to-bone mapping",
    );

  const skeletonBones: Set<AutoMovieHumanoidBone> = new Set();
  const sourceBones: Map<
    AutoMovieHumanoidBone,
    IAutoMovieSkeleton["bones"][number]
  > = new Map<AutoMovieHumanoidBone, IAutoMovieSkeleton["bones"][number]>();
  for (const bone of props.sourceSkeleton.bones) {
    if (skeletonBones.has(bone.bone))
      throw new Error(
        `imported motion source skeleton repeats bone "${bone.bone}"`,
      );
    skeletonBones.add(bone.bone);
    sourceBones.set(bone.bone, bone);
    for (const axis of ["x", "y", "z"] as const)
      if (!Number.isFinite(bone.rest.translation[axis]))
        throw new Error(
          `imported motion source bone "${bone.bone}" rest translation.${axis} must be finite`,
        );
    finiteUnitQuaternion(
      [
        bone.rest.rotation.x,
        bone.rest.rotation.y,
        bone.rest.rotation.z,
        bone.rest.rotation.w,
      ],
      `${bone.bone} rest`,
      0,
    );
  }
  const nodeToBone: Map<string, AutoMovieHumanoidBone> = new Map();
  const mappedBones: Set<AutoMovieHumanoidBone> = new Set();
  for (const entry of props.mapping) {
    if (entry.node.trim().length === 0)
      throw new Error("imported motion mapping node must not be blank");
    if (nodeToBone.has(entry.node))
      throw new Error(`imported motion mapping repeats node "${entry.node}"`);
    if (mappedBones.has(entry.bone))
      throw new Error(`imported motion mapping repeats bone "${entry.bone}"`);
    if (!skeletonBones.has(entry.bone))
      throw new Error(
        `imported motion mapping bone "${entry.bone}" is absent from source skeleton "${props.sourceSkeleton.id}"`,
      );
    nodeToBone.set(entry.node, entry.bone);
    mappedBones.add(entry.bone);
  }

  const channelTracks: Map<string, (typeof props.clip.tracks)[number]> =
    new Map();
  let interpolation: Exclude<AutoMovieInterpolation, "cubicspline"> | null =
    null;
  for (const track of props.clip.tracks) {
    if (track.channel.kind !== "node")
      throw new Error("imported humanoid motion supports only node channels");
    const key: string = channelKey(track.channel);
    if (channelTracks.has(key))
      throw new Error(`imported motion repeats channel "${key}"`);
    channelTracks.set(key, track);
    const bone: AutoMovieHumanoidBone | undefined = nodeToBone.get(
      track.channel.node,
    );
    if (bone === undefined)
      throw new Error(
        `imported motion node "${track.channel.node}" has no explicit bone mapping`,
      );
    if (track.channel.path === "scale" || track.channel.path === "weights")
      throw new Error(
        `imported motion ${track.channel.path} channel "${key}" cannot be represented by a clinical pose`,
      );
    if (track.channel.path === "translation" && bone !== "hips")
      throw new Error(
        `imported motion translation channel "${key}" must map to hips`,
      );
    if (track.interpolation === "cubicspline")
      throw new Error(
        `imported motion channel "${key}" uses cubic-spline interpolation that a clinical pose keyframe cannot preserve`,
      );
    if (interpolation !== null && track.interpolation !== interpolation)
      throw new Error(
        "imported motion channels use different interpolation laws that one clinical keyframe cannot preserve",
      );
    interpolation = track.interpolation;
  }
  if (interpolation === null)
    throw new Error("imported motion clip has no mapped channels");
  const law: Exclude<AutoMovieInterpolation, "cubicspline"> = interpolation;

  // Bone identities are already unique, so they alone define the stable order.
  const orderedMapping: IAutoMovieImportedNodeBoneMapping[] = [
    ...props.mapping,
  ].sort(
    (
      left: IAutoMovieImportedNodeBoneMapping,
      right: IAutoMovieImportedNodeBoneMapping,
    ): number => compareCodeUnits(left.bone, right.bone),
  );
  for (const entry of orderedMapping) {
    const rotationKey: string = channelKey({
      kind: "node",
      node: entry.node,
      path: "rotation",
    });
    if (!channelTracks.has(rotationKey))
      throw new Error(
        `imported motion mapped node "${entry.node}" has no rotation channel`,
      );
  }

  const keyTimes: number[] = [
    ...new Set(
      props.clip.tracks.flatMap(
        (track: (typeof props.clip.tracks)[number]): number[] => track.times,
      ),
    ),
  ].sort((left: number, right: number): number => left - right);
  if (keyTimes.length < 2)
    throw new Error(
      "imported motion needs at least two distinct authored key times",
    );

  const hips: IAutoMovieImportedNodeBoneMapping | undefined =
    orderedMapping.find(
      (entry: IAutoMovieImportedNodeBoneMapping): boolean =>
        entry.bone === "hips",
    );
  const hipsTranslationKey: string | null =
    hips === undefined
      ? null
      : channelKey({ kind: "node", node: hips.node, path: "translation" });
  const hasRootTranslation: boolean =
    hipsTranslationKey !== null && channelTracks.has(hipsTranslationKey);

  return {
    id: props.motionId,
    skeleton: props.sourceSkeleton.id,
    duration: props.clip.duration,
    loop: props.clip.loop,
    keyframes: keyTimes.map((time: number): IAutoMovieKeyframe => {
      const sampled: ReturnType<typeof sampleClip> = sampleClip(
        props.clip,
        time,
      );
      return {
        time,
        pose: {
          skeleton: props.sourceSkeleton.id,
          root: hasRootTranslation
            ? rootTransform(
                sampled.get(hipsTranslationKey!)!.value,
                sourceBones.get("hips")!.rest.translation,
              )
            : null,
          joints: orderedMapping.map(
            (entry: IAutoMovieImportedNodeBoneMapping): IAutoMovieJointPose => {
              const value: number[] = sampled.get(
                channelKey({
                  kind: "node",
                  node: entry.node,
                  path: "rotation",
                }),
              )!.value;
              const quaternion: IAutoMovieQuaternion = finiteUnitQuaternion(
                value,
                entry.node,
                time,
              );
              const rest: IAutoMovieQuaternion = sourceBones.get(entry.bone)!
                .rest.rotation;
              const relative: IAutoMovieQuaternion = Quaternion.multiply(
                Quaternion.inverse(rest),
                quaternion,
              );
              const angles: ReturnType<typeof decomposeJointRotation> =
                decomposeJointRotation(
                  relative,
                  props.sourceJointAxes?.[entry.bone] ??
                    HUMANOID_JOINT_AXES[entry.bone],
                  props.sourceRestFrames?.[entry.bone] ??
                    HUMANOID_REST_FRAME[entry.bone],
                  {
                    bone: entry.bone,
                    constraint: getConstraint(
                      entry.bone,
                      sourceBones.get(entry.bone)!.constraint,
                    ),
                  },
                );
              return { bone: entry.bone, ...angles };
            },
          ),
        },
        expression: null,
        easing: law,
        bezier: null,
      };
    }),
    gaitCycle: null,
  };
};

const rootTransform: (
  value: readonly number[],
  rest: IAutoMovieVector3,
) => IAutoMovieTransform = (
  value: readonly number[],
  rest: IAutoMovieVector3,
): IAutoMovieTransform => ({
  translation: {
    x: value[0]! - rest.x,
    y: value[1]! - rest.y,
    z: value[2]! - rest.z,
  },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const finiteUnitQuaternion: (
  value: readonly number[],
  node: string,
  time: number,
) => IAutoMovieQuaternion = (
  value: readonly number[],
  node: string,
  time: number,
): IAutoMovieQuaternion => {
  if (value.some((component: number): boolean => !Number.isFinite(component)))
    throw new Error(
      `imported motion node "${node}" quaternion at ${time} must contain only finite components`,
    );
  const quaternion: IAutoMovieQuaternion = {
    x: value[0]!,
    y: value[1]!,
    z: value[2]!,
    w: value[3]!,
  };
  const squaredLength: number =
    quaternion.x * quaternion.x +
    quaternion.y * quaternion.y +
    quaternion.z * quaternion.z +
    quaternion.w * quaternion.w;
  if (Math.abs(squaredLength - 1) > 1e-6)
    throw new Error(
      `imported motion node "${node}" quaternion at ${time} must be unit length`,
    );
  return quaternion;
};
