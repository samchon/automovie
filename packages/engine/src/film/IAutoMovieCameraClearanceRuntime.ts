import { IAutoMovieClip, IAutoMovieModel, IAutoMovieMotion, IAutoMovieScene, IAutoMovieShot, IAutoMovieTransform } from "@automovie/interface";
import { sampleTimes } from "../motion/sampleTimes";
import { sampleMotion } from "../motion/sampleMotion";
import { channelKey } from "../resolve/channelKey";
import { sampleClipSequence } from "../resolve/sampleClipSequence";
import { foldRoot } from "./foldRoot";
import { computeModelRestExtent } from "./computeModelRestExtent";

/**
 * Geometry-revision and fixed-clock authority supplied by the builder.
 *
 * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-spatial-geometry-revision Binds one clearance evaluation to the geometry revision read and the revision still current.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-camera-path-constraints-refusal Supplies the deterministic clock and freshness authority used before a take is admitted.
 */
export interface IAutoMovieCameraClearanceRuntime {
  /**
   * Revision from which staged models were materialized.
   *
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-spatial-geometry-revision Identifies the exact staged geometry snapshot inspected.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-camera-path-constraints-refusal Names the staged geometry snapshot the evaluation measured, which is the value the gate compares against the one still current.
   */
  revision: string;
  /**
   * Revision still current at the performance gate.
   *
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-spatial-geometry-revision Prevents a stale measured snapshot from being accepted as current.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-camera-path-constraints-refusal Supplies the revision freshness comparison.
   */
  currentRevision: string;
  /**
   * Fixed-clock inspection samples per second.
   *
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-dynamic-spatial-sampling Declares the endpoint-inclusive inspection clock.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-camera-path-constraints-refusal Supplies the deterministic path gate sample rate.
   */
  sampleRate: number;
}

/** A measured model and the conservative radius used while it moves. */
interface IMeasuredObstacle {
  node: IAutoMovieScene["nodes"][number];
  extent: NonNullable<ReturnType<typeof computeModelRestExtent>>;
  radius: number;
  dynamic: boolean;
}

/** One motion sequence whose authored key boundaries refine the fixed clock. */
interface IClearanceTimedSequence {
  duration: number;
  loop: boolean;
  times: readonly number[];
}

/** Maximum distance from model origin to any corner of its measured box. */
const originRadius = (
  extent: NonNullable<ReturnType<typeof computeModelRestExtent>>,
): number =>
  Math.max(
    ...[extent.min.x, extent.max.x].flatMap((x) =>
      [extent.min.y, extent.max.y].flatMap((y) =>
        [extent.min.z, extent.max.z].map((z) => Math.hypot(x, y, z)),
      ),
    ),
  );

/**
 * Maximum root-to-influencing-bone segment-length sum of one validated rig.
 *
 * The adapter runs the public model validator first, so parent closure, finite
 * rest transforms, non-negative normalized skin weights, and valid skin-joint
 * indices are established here. Bone scale is deliberately absent because
 * both Engine FK and the Viewer ignore rig rest scale. Overflow of an otherwise
 * finite chain remains an addressed error at this consumer.
 */
const maximumRigReach = (model: IAutoMovieModel): number => {
  const skeleton = model.skeleton;
  if (skeleton === null) return 0;
  const bones = new Map(skeleton.bones.map((bone) => [bone.bone, bone]));
  const reaches = new Map<(typeof skeleton.bones)[number]["bone"], number>();
  const resolve = (name: (typeof skeleton.bones)[number]["bone"]): number => {
    const cached = reaches.get(name);
    if (cached !== undefined) return cached;
    const bone = bones.get(name)!;
    const segment = Math.hypot(
      bone.rest.translation.x,
      bone.rest.translation.y,
      bone.rest.translation.z,
    );
    const reach = segment + (bone.parent === null ? 0 : resolve(bone.parent));
    if (!Number.isFinite(reach))
      throw new Error(
        `camera clearance rig "${skeleton.id}" chain to bone "${name}" overflows`,
      );
    reaches.set(name, reach);
    return reach;
  };
  const influenced = model.parts.flatMap((part) => {
    if (part.attachedBone !== null) return [part.attachedBone];
    if (part.geometry.type === "mesh" && part.geometry.mesh.skin !== null)
      return part.geometry.mesh.skin.joints;
    return [];
  });
  return Math.max(0, ...influenced.map(resolve));
};

/**
 * Pose-independent radius for rigid and skinned geometry on one actor rig.
 *
 * For a rest vertex `p` bound at a joint whose chain reach is `c`, its local
 * joint offset is at most `|p| + c`; after arbitrary joint rotations its posed
 * distance is therefore at most `|p| + 2c`. Non-negative normalized skin
 * weights form a convex combination of those bounded influenced positions, so
 * the same radius contains skinned vertices as well as rigid bone attachments.
 */
const conservativeDeformationRadius = (
  model: IAutoMovieModel,
  extent: NonNullable<ReturnType<typeof computeModelRestExtent>>,
  rigReach: number,
): number => {
  const radius = originRadius(extent) + 2 * rigReach;
  if (!Number.isFinite(radius))
    throw new Error(
      `camera clearance deformation radius for model "${model.id}" overflows`,
    );
  return radius;
};

/** Describe an evaluator throw without letting hostile coercion escape. */
const safeThrownDescription = (error: unknown): string => {
  try {
    return String(error);
  } catch {
    return "an uninspectable thrown value";
  }
};

/** Whether two authored component vectors are exactly identical. */
const sameComponents = (left: readonly number[], right: readonly number[]) =>
  left.length === right.length &&
  left.every((component, index) => component === right[index]);

/** Whether a looping actor returns its clearance-relevant root to the seam. */
const actorLoopIsClosed = (motion: IAutoMovieMotion): boolean => {
  if (!motion.loop) return true;
  const first = motion.keyframes[0]?.pose.root;
  const last = motion.keyframes[motion.keyframes.length - 1]?.pose.root;
  if (first === undefined || last === undefined) return false;
  if (first === null || last === null) return first === last;
  return (
    sameComponents(
      [first.translation.x, first.translation.y, first.translation.z],
      [last.translation.x, last.translation.y, last.translation.z],
    ) &&
    Math.max(
      Math.abs(first.scale.x),
      Math.abs(first.scale.y),
      Math.abs(first.scale.z),
    ) ===
      Math.max(
        Math.abs(last.scale.x),
        Math.abs(last.scale.y),
        Math.abs(last.scale.z),
      )
  );
};

/** Whether every geometry-relevant clip channel returns to its loop seam. */
const clipLoopIsClosed = (
  clip: IAutoMovieClip,
  rotationMatters: boolean,
): boolean => {
  if (!clip.loop) return true;
  return clip.tracks.every((track) => {
    if (
      track.channel.kind !== "node" ||
      (track.channel.path === "rotation" && !rotationMatters)
    )
      return true;
    const width = track.values.length / track.times.length;
    if (!(Number.isSafeInteger(width) && width > 0)) return false;
    const first = track.values.slice(0, width);
    const last = track.values.slice(track.values.length - width);
    if (track.channel.path !== "rotation") return sameComponents(first, last);
    return (
      sameComponents(first, last) ||
      sameComponents(
        first,
        last.map((component) => -component),
      )
    );
  });
};

/** Add every in-shot key boundary, repeating a looping sequence deterministically. */
const addSequenceBoundaries = (
  result: Set<number>,
  shotDuration: number,
  sequence: IClearanceTimedSequence,
): void => {
  if (!(Number.isFinite(sequence.duration) && sequence.duration > 0))
    throw new Error(
      "camera clearance cannot sample a motion sequence without a finite positive duration",
    );
  const cycles = sequence.loop
    ? Math.ceil(shotDuration / sequence.duration)
    : 1;
  for (let cycle = 0; cycle < cycles; cycle++)
    for (const time of sequence.times) {
      const absolute = cycle * sequence.duration + time;
      if (Number.isFinite(absolute) && absolute > 0 && absolute < shotDuration)
        result.add(absolute);
    }
};

/** Base fixed clock refined by every camera, actor, and object key boundary. */
const clearanceSampleTimes = (props: {
  duration: number;
  sampleRate: number;
  cameraMotion: IAutoMovieShot["cameraMotion"];
  motions: Readonly<Record<string, IAutoMovieMotion>>;
  objectMotions: readonly IAutoMovieClip[];
}): number[] => {
  for (const motion of Object.values(props.motions)) {
    if (motion.keyframes.some((keyframe) => keyframe.easing === "cubicBezier"))
      throw new Error(
        `camera clearance cannot conservatively bound actor motion "${motion.id}" with cubicBezier easing; use linear, step, or named non-overshooting easing`,
      );
    if (!actorLoopIsClosed(motion))
      throw new Error(
        `camera clearance cannot conservatively bound actor motion "${motion.id}" across an open loop seam; close its root translation and clearance radius`,
      );
  }
  for (const clip of props.objectMotions) {
    if (clip.tracks.some((track) => track.interpolation === "cubicspline"))
      throw new Error(
        `camera clearance cannot conservatively bound clip "${clip.id}" with cubicspline interpolation; use linear or step interpolation`,
      );
    if (!clipLoopIsClosed(clip, false))
      throw new Error(
        `camera clearance cannot conservatively bound clip "${clip.id}" across an open loop seam; close its node translation and scale channels`,
      );
  }
  if (props.cameraMotion !== null) {
    if (
      props.cameraMotion.tracks.some(
        (track) => track.interpolation === "cubicspline",
      )
    )
      throw new Error(
        `camera clearance cannot conservatively bound clip "${props.cameraMotion.id}" with cubicspline interpolation; use linear or step interpolation`,
      );
    if (!clipLoopIsClosed(props.cameraMotion, true))
      throw new Error(
        `camera clearance cannot conservatively bound clip "${props.cameraMotion.id}" across an open loop seam; close its camera transform channels`,
      );
  }
  const result = new Set(sampleTimes(props.duration, props.sampleRate));
  const sequences: IClearanceTimedSequence[] = [
    ...Object.values(props.motions).map((motion) => ({
      duration: motion.duration,
      loop: motion.loop,
      times: motion.keyframes.map((keyframe) => keyframe.time),
    })),
    ...props.objectMotions.map((clip) => ({
      duration: clip.duration,
      loop: clip.loop,
      times: clip.tracks.flatMap((track) => track.times),
    })),
    ...(props.cameraMotion === null
      ? []
      : [
          {
            duration: props.cameraMotion.duration,
            loop: props.cameraMotion.loop,
            times: props.cameraMotion.tracks.flatMap((track) => track.times),
          },
        ]),
  ];
  for (const sequence of sequences)
    addSequenceBoundaries(result, props.duration, sequence);
  return [...result].sort((left, right) => left - right);
};

/** Resolve actor and object root authority at one shot-local instant. */
const nodeTransformAt = (
  node: IAutoMovieScene["nodes"][number],
  actorMotion: IAutoMovieMotion | undefined,
  objectMotions: readonly IAutoMovieClip[],
  seconds: number,
): IAutoMovieTransform => {
  const base =
    actorMotion === undefined
      ? node.transform
      : foldRoot(node.transform, sampleMotion(actorMotion, seconds).pose.root);
  const sampled = sampleClipSequence(objectMotions, seconds);
  const translation = sampled.get(
    channelKey({ kind: "node", node: node.id, path: "translation" }),
  )?.value;
  const rotation = sampled.get(
    channelKey({ kind: "node", node: node.id, path: "rotation" }),
  )?.value;
  const scale = sampled.get(
    channelKey({ kind: "node", node: node.id, path: "scale" }),
  )?.value;
  return {
    translation:
      translation === undefined
        ? base.translation
        : { x: translation[0]!, y: translation[1]!, z: translation[2]! },
    rotation:
      rotation === undefined
        ? base.rotation
        : {
            x: rotation[0]!,
            y: rotation[1]!,
            z: rotation[2]!,
            w: rotation[3]!,
          },
    scale:
      scale === undefined
        ? base.scale
        : { x: scale[0]!, y: scale[1]!, z: scale[2]! },
  };
};

/** One motion sequence whose authored key boundaries refine the fixed clock. */
interface IClearanceTimedSequence {
  duration: number;
  loop: boolean;
  times: readonly number[];
}

/** Maximum distance from model origin to any corner of its measured box. */
const originRadius = (
  extent: NonNullable<ReturnType<typeof computeModelRestExtent>>,
): number =>
  Math.max(
    ...[extent.min.x, extent.max.x].flatMap((x) =>
      [extent.min.y, extent.max.y].flatMap((y) =>
        [extent.min.z, extent.max.z].map((z) => Math.hypot(x, y, z)),
      ),
    ),
  );

/** Whether two authored component vectors are exactly identical. */
const sameComponents = (left: readonly number[], right: readonly number[]) =>
  left.length === right.length &&
  left.every((component, index) => component === right[index]);

/** Whether a looping actor returns its clearance-relevant root to the seam. */
const actorLoopIsClosed = (motion: IAutoMovieMotion): boolean => {
  if (!motion.loop) return true;
  const first = motion.keyframes[0]?.pose.root;
  const last = motion.keyframes[motion.keyframes.length - 1]?.pose.root;
  if (first === undefined || last === undefined) return false;
  if (first === null || last === null) return first === last;
  return (
    sameComponents(
      [first.translation.x, first.translation.y, first.translation.z],
      [last.translation.x, last.translation.y, last.translation.z],
    ) &&
    Math.max(
      Math.abs(first.scale.x),
      Math.abs(first.scale.y),
      Math.abs(first.scale.z),
    ) ===
      Math.max(
        Math.abs(last.scale.x),
        Math.abs(last.scale.y),
        Math.abs(last.scale.z),
      )
  );
};

/** Whether every geometry-relevant clip channel returns to its loop seam. */
const clipLoopIsClosed = (
  clip: IAutoMovieClip,
  rotationMatters: boolean,
): boolean => {
  if (!clip.loop) return true;
  return clip.tracks.every((track) => {
    if (
      track.channel.kind !== "node" ||
      (track.channel.path === "rotation" && !rotationMatters)
    )
      return true;
    const width = track.values.length / track.times.length;
    if (!(Number.isSafeInteger(width) && width > 0)) return false;
    const first = track.values.slice(0, width);
    const last = track.values.slice(track.values.length - width);
    if (track.channel.path !== "rotation") return sameComponents(first, last);
    return (
      sameComponents(first, last) ||
      sameComponents(
        first,
        last.map((component) => -component),
      )
    );
  });
};

/** Add every in-shot key boundary, repeating a looping sequence deterministically. */
const addSequenceBoundaries = (
  result: Set<number>,
  shotDuration: number,
  sequence: IClearanceTimedSequence,
): void => {
  if (!(Number.isFinite(sequence.duration) && sequence.duration > 0))
    throw new Error(
      "camera clearance cannot sample a motion sequence without a finite positive duration",
    );
  const cycles = sequence.loop
    ? Math.ceil(shotDuration / sequence.duration)
    : 1;
  for (let cycle = 0; cycle < cycles; cycle++)
    for (const time of sequence.times) {
      const absolute = cycle * sequence.duration + time;
      if (Number.isFinite(absolute) && absolute > 0 && absolute < shotDuration)
        result.add(absolute);
    }
};
