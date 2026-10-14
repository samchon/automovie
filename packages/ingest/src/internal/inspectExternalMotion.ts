import type { IAccessorSource } from "./IAccessorSource";
import type { IAutoMovieExternalMotionInspection } from "../IAutoMovieExternalMotionInspection";
import type { IAutoMovieExternalMotionNodeInspection } from "../IAutoMovieExternalMotionNodeInspection";
import { inspectExternalMotionNodes } from "./inspectExternalMotionNodes";
import { readMotionAccessor } from "./readMotionAccessor";
import type { IAutoMovieClip, IAutoMovieTrack } from "@automovie/interface";
import { object } from "./object";
import { requiredArray } from "./requiredArray";
import { integerIndex } from "./integerIndex";
import { AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE } from "../AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE";
import { SHAPE_COMPONENTS } from "./SHAPE_COMPONENTS";

type AutoMovieMotionTargetPath =
  | "translation"
  | "rotation"
  | "scale"
  | "weights";

/** Accessor shape each target path's output must use. */
const MOTION_OUTPUT_TYPES: Readonly<
  Record<AutoMovieMotionTargetPath, "SCALAR" | "VEC3" | "VEC4">
> = {
  translation: "VEC3",
  rotation: "VEC4",
  scale: "VEC3",
  weights: "SCALAR",
};

/**
 * Normalize glTF animation samplers into deterministic node tracks.
 *
 * @evidence contracts/common.md#principled-implementation Validated FLOAT accessors, strictly increasing nonnegative times, supported interpolation and target-specific arity determine copied clips.
 * @evidence contracts/common.md#clear-and-simple-design Motion normalization owns sampler/channel relationships while hierarchy, node TRS and byte readers remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate targets, nonfinite values and nonunit quaternion keyframes throw; profile limitations never become guessed channels.
 * @evidence contracts/common.md#meaningful-documentation Prose describes clip/channel ordering, exact keyframe ownership, interpolation, arity and quaternion checks.
 * @evidence contracts/performance.md#efficient-algorithms Cost follows node/channel counts and decoded/copied keyframe values; shared accessors are decoded once but each track owns a copy.
 * @evidence contracts/performance.md#reuse-equivalent-work Accessor index plus expected shape keys per-call decoding; immutable source/payload dependencies justify reuse and track arrays remain independent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The decode cache lives only for one inspection; returned clips retain arrays proportional to keyframe counts without raw payload bytes.
 * @author Samchon
 */
export const inspectExternalMotion: (props: {
  path: string;
  byteLength: number;
  animations: unknown[];
  nodes: unknown[];
  parentByIndex: readonly (number | undefined)[];
  source: IAccessorSource;
}) => IAutoMovieExternalMotionInspection | undefined = (props: {
  path: string;
  byteLength: number;
  animations: unknown[];
  nodes: unknown[];
  parentByIndex: readonly (number | undefined)[];
  source: IAccessorSource;
}): IAutoMovieExternalMotionInspection | undefined => {
  if (props.animations.length === 0) return undefined;
  const nodes: IAutoMovieExternalMotionNodeInspection[] =
    inspectExternalMotionNodes(props.nodes, props.parentByIndex);
  const nodeIds: string[] = nodes.map(
    (node: IAutoMovieExternalMotionNodeInspection): string => node.id,
  );
  // Shared accessors reuse finite FLOAT decoding; each track owns a copy and
  // still checks its times, interpolation-specific arity and quaternion values.
  const decoded: Map<string, number[]> = new Map<string, number[]>();
  const readOnce: (accessorIndex: number, expectedType: "SCALAR" | "VEC3" | "VEC4", path: string) => number[] = (
    accessorIndex: number,
    expectedType: "SCALAR" | "VEC3" | "VEC4",
    path: string,
  ): number[] => {
    const key: string = `${accessorIndex}:${expectedType}`;
    let values: number[] | undefined = decoded.get(key);
    if (values === undefined) {
      values = readMotionAccessor(
        props.source,
        accessorIndex,
        expectedType,
        path,
      );
      decoded.set(key, values);
    }
    return values.slice();
  };
  const takes: IAutoMovieClip[] = props.animations.map(
    (value: unknown, animationIndex: number): IAutoMovieClip => {
      const animation: Record<string, unknown> = object(
        value,
        `animations[${animationIndex}]`,
      );
      const samplers: unknown[] = requiredArray(
        animation.samplers,
        `animations[${animationIndex}].samplers`,
      );
      const channels: unknown[] = requiredArray(
        animation.channels,
        `animations[${animationIndex}].channels`,
      );
      if (samplers.length === 0 || channels.length === 0)
        throw new Error(
          `animations[${animationIndex}] needs at least one sampler and channel.`,
        );
      const targets: Set<string> = new Set<string>();
      const tracks: IAutoMovieTrack[] = channels.map(
        (channelValue: unknown, channelIndex: number): IAutoMovieTrack => {
          const channelPath: string = `animations[${animationIndex}].channels[${channelIndex}]`;
          const channel: Record<string, unknown> = object(
            channelValue,
            channelPath,
          );
          integerIndex(
            channel.sampler,
            samplers.length,
            `${channelPath}.sampler`,
            true,
          );
          const target: Record<string, unknown> = object(
            channel.target,
            `${channelPath}.target`,
          );
          integerIndex(
            target.node,
            props.nodes.length,
            `${channelPath}.target.node`,
            true,
          );
          if (
            typeof target.path !== "string" ||
            Object.hasOwn(MOTION_OUTPUT_TYPES, target.path) === false
          )
            throw new Error(
              `${channelPath}.target.path must be translation, rotation, scale, or weights.`,
            );
          const targetPath: AutoMovieMotionTargetPath =
            target.path as AutoMovieMotionTargetPath;
          const targetKey: string = `${String(target.node)}\u0000${targetPath}`;
          if (targets.has(targetKey))
            throw new Error(
              `${channelPath} duplicates the ${targetPath} channel for node ${String(target.node)}.`,
            );
          targets.add(targetKey);

          const samplerPath: string = `animations[${animationIndex}].samplers[${String(channel.sampler)}]`;
          const sampler: Record<string, unknown> = object(
            samplers[channel.sampler as number],
            samplerPath,
          );
          integerIndex(
            sampler.input,
            props.source.accessors.length,
            `${samplerPath}.input`,
            true,
          );
          integerIndex(
            sampler.output,
            props.source.accessors.length,
            `${samplerPath}.output`,
            true,
          );
          const interpolation: IAutoMovieTrack["interpolation"] =
            motionInterpolation(
              sampler.interpolation,
              `${samplerPath}.interpolation`,
            );
          const times: number[] = readOnce(
            sampler.input as number,
            "SCALAR",
            `${samplerPath}.input`,
          );
          const values: number[] = readOnce(
            sampler.output as number,
            MOTION_OUTPUT_TYPES[targetPath],
            `${samplerPath}.output`,
          );
          validateMotionTimes(times, `${samplerPath}.input`);
          validateMotionOutput({
            path: `${samplerPath}.output`,
            targetPath,
            interpolation,
            keyframes: times.length,
            values,
          });
          return {
            channel: {
              kind: "node",
              node: nodeIds[target.node as number]!,
              path: targetPath,
            },
            times,
            values,
            interpolation,
          };
        },
      );
      const name: unknown = animation.name;
      if (name !== undefined && typeof name !== "string")
        throw new Error(
          `animations[${animationIndex}].name must be a string.`,
        );
      return {
        id: `clip_${animationIndex}`,
        name: name === undefined || name.length === 0 ? null : name,
        duration: tracks.reduce(
          (maximum: number, track: IAutoMovieTrack): number =>
            Math.max(maximum, track.times[track.times.length - 1]!),
          0,
        ),
        loop: false,
        tracks,
      };
    },
  );
  return {
    path: props.path,
    byteLength: props.byteLength,
    interpretation: AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE,
    nodes,
    nodeIds,
    takes,
  };
};

const motionInterpolation: (value: unknown, path: string) => IAutoMovieTrack["interpolation"] = (
  value: unknown,
  path: string,
): IAutoMovieTrack["interpolation"] => {
  if (value === undefined || value === "LINEAR") return "linear";
  if (value === "STEP") return "step";
  if (value === "CUBICSPLINE") return "cubicspline";
  throw new Error(`${path} must be LINEAR, STEP, or CUBICSPLINE.`);
};

const validateMotionTimes: (times: number[], path: string) => void = (times: number[], path: string): void => {
  for (let index: number = 0; index < times.length; ++index)
    if (times[index]! < 0 || (index > 0 && times[index]! <= times[index - 1]!))
      throw new Error(
        `${path} keyframe times must be non-negative and strictly increasing.`,
      );
};

const validateMotionOutput: (props: {
  path: string;
  targetPath: AutoMovieMotionTargetPath;
  interpolation: IAutoMovieTrack["interpolation"];
  keyframes: number;
  values: number[];
}) => void = (props: {
  path: string;
  targetPath: AutoMovieMotionTargetPath;
  interpolation: IAutoMovieTrack["interpolation"];
  keyframes: number;
  values: number[];
}): void => {
  const factor: number = props.interpolation === "cubicspline" ? 3 : 1;
  const width: number | null =
    props.targetPath === "weights"
      ? null
      : SHAPE_COMPONENTS[MOTION_OUTPUT_TYPES[props.targetPath]]!;
  const group: number = props.keyframes * factor;
  if (
    group === 0 ||
    (width === null
      ? props.values.length === 0 || props.values.length % group !== 0
      : props.values.length !== group * width)
  )
    throw new Error(
      `${props.path} does not match the ${props.targetPath} keyframe arity.`,
    );
  if (props.targetPath !== "rotation") return;
  for (let frame: number = 0; frame < props.keyframes; ++frame) {
    // A cubic-spline keyframe stores in-tangent, value, out-tangent; only the
    // value must be a unit quaternion.
    const at: number =
      (props.interpolation === "cubicspline" ? frame * 3 + 1 : frame) * 4;
    const magnitude: number = Math.hypot(
      props.values[at]!,
      props.values[at + 1]!,
      props.values[at + 2]!,
      props.values[at + 3]!,
    );
    if (Math.abs(magnitude - 1) > 1e-4)
      throw new Error(`${props.path} contains a non-unit rotation keyframe.`);
  }
};
