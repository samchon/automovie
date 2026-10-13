import type {
  AutoMovieHumanoidBone,
  AutoMovieInterpolation,
  IAutoMovieMotion,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
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
import { IAutoMovieImportedNodeMotionProps } from "./IAutoMovieImportedNodeMotionProps";

/**
 * Lower an imported node-track clip into clinical pose keyframes.
 *
 * The output samples the sorted union of authored source key times. Every
 * mapped node must carry exactly one rotation channel, every other source
 * channel must also be explicitly mapped, and all retained tracks must share
 * one representable interpolation law. A mapped hips translation becomes
 * `pose.root`; other translations, scale, weights, cubic-spline tracks, corrupt
 * quaternions, and inferred mappings are refused rather than approximated.
 *
 * @author Samchon
 */
export const importedNodeClipToAutoMovieMotion = (
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

  const skeletonBones = new Set<AutoMovieHumanoidBone>();
  const sourceBones = new Map<
    AutoMovieHumanoidBone,
    IAutoMovieSkeleton["bones"][number]
  >();
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
  const nodeToBone = new Map<string, AutoMovieHumanoidBone>();
  const mappedBones = new Set<AutoMovieHumanoidBone>();
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

  const channelTracks = new Map<string, (typeof props.clip.tracks)[number]>();
  let interpolation: Exclude<AutoMovieInterpolation, "cubicspline"> | null =
    null;
  for (const track of props.clip.tracks) {
    if (track.channel.kind !== "node")
      throw new Error("imported humanoid motion supports only node channels");
    const key = channelKey(track.channel);
    if (channelTracks.has(key))
      throw new Error(`imported motion repeats channel "${key}"`);
    channelTracks.set(key, track);
    const bone = nodeToBone.get(track.channel.node);
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

  // Bone identities are already unique, so they alone define the stable order.
  const orderedMapping = [...props.mapping].sort((left, right) =>
    compareCodeUnits(left.bone, right.bone),
  );
  for (const entry of orderedMapping) {
    const rotationKey = channelKey({
      kind: "node",
      node: entry.node,
      path: "rotation",
    });
    if (!channelTracks.has(rotationKey))
      throw new Error(
        `imported motion mapped node "${entry.node}" has no rotation channel`,
      );
  }

  const keyTimes = [
    ...new Set(props.clip.tracks.flatMap((track) => track.times)),
  ].sort((left, right) => left - right);
  if (keyTimes.length < 2)
    throw new Error(
      "imported motion needs at least two distinct authored key times",
    );

  const hips = orderedMapping.find((entry) => entry.bone === "hips");
  const hipsTranslationKey =
    hips === undefined
      ? null
      : channelKey({ kind: "node", node: hips.node, path: "translation" });
  const hasRootTranslation =
    hipsTranslationKey !== null && channelTracks.has(hipsTranslationKey);

  return {
    id: props.motionId,
    skeleton: props.sourceSkeleton.id,
    duration: props.clip.duration,
    loop: props.clip.loop,
    keyframes: keyTimes.map((time) => {
      const sampled = sampleClip(props.clip, time);
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
          joints: orderedMapping.map((entry) => {
            const value = sampled.get(
              channelKey({
                kind: "node",
                node: entry.node,
                path: "rotation",
              }),
            )!.value;
            const quaternion = finiteUnitQuaternion(value, entry.node, time);
            const rest = sourceBones.get(entry.bone)!.rest.rotation;
            const relative = Quaternion.multiply(
              Quaternion.inverse(rest),
              quaternion,
            );
            const angles = decomposeJointRotation(
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
          }),
        },
        expression: null,
        easing: interpolation,
        bezier: null,
      };
    }),
    gaitCycle: null,
  };
};

const rootTransform = (value: readonly number[], rest: IAutoMovieVector3) => ({
  translation: {
    x: value[0]! - rest.x,
    y: value[1]! - rest.y,
    z: value[2]! - rest.z,
  },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const finiteUnitQuaternion = (
  value: readonly number[],
  node: string,
  time: number,
): IAutoMovieQuaternion => {
  if (value.some((component) => !Number.isFinite(component)))
    throw new Error(
      `imported motion node "${node}" quaternion at ${time} must contain only finite components`,
    );
  const quaternion = {
    x: value[0]!,
    y: value[1]!,
    z: value[2]!,
    w: value[3]!,
  };
  const squaredLength =
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
