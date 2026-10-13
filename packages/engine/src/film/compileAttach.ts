import {
  AutoMovieHumanoidBone,
  IAutoMovieAttachment,
  IAutoMovieClip,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieJointAxes } from "../kinematics/IAutoMovieJointAxes";
import { resolveAttachment } from "../kinematics/resolveAttachment";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { sampleMotion } from "../motion/sampleMotion";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";

/** The child rides the bone directly: origin on the bone, no extra offset. */
const IDENTITY_OFFSET: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

/**
 * Bake the `attachTo` verb into the child object's follow clip, the per-frame
 * realisation of a rigid coupling to a parent's bone (a sword in a hand, a prop
 * on a saddle). The child is not a rig, so, like a projectile, it moves by a
 * node clip of translation and rotation tracks, not a pose motion.
 *
 * Each sample resolves the parent's posed skeleton at that instant through
 * {@link resolveAttachment}, which runs the parent's FK, to find the bone's
 * frame in the parent's model space, then composes that onto the parent's world
 * frame: its staged placement, or, when the parent itself rides a coupling this
 * shot, its ridden frame from `parentTransformAt` (#1140):
 *
 * - `translation = parentPos + parentRot · boneLocal.translation`
 * - `rotation = parentRot ∘ boneLocal.rotation`
 *
 * The parent's scale is not applied, which matches the renderer for the
 * unit-scale actors staging places. Pass the same `jointAxes` the renderer
 * poses the parent with (`HUMANOID_JOINT_AXES`), plus the same `restFrames`
 * when parent clips are authored in clinical space, or the child follows a
 * bone where the renderer does not draw it. A parent with no motion holds its
 * rest pose.
 *
 * The clip is shot-local: `round(duration × fps)` evenly spaced samples plus
 * the end, over `[start, start + duration]`, with the clip's duration set to
 * `shotDuration`, the same convention as `cameraMotion`. Read alone through
 * `sampleClip` it clamps to the bone's first frame before `start`; playback
 * reads it through `sampleClipSequence`, where it writes nothing before
 * `start` and holds its last frame after the coupling ends. The clip id is
 * `attach:<child>`; a caller baking several couplings of one child suffixes
 * repeats. Throws a `RangeError` when `duration` is not positive or `fps` is
 * not finite and positive.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Samples the parent's motion at a fixed rate, resolves the bone by the same forward kinematics the renderer poses with, and composes it onto the parent's world translation and rotation, the rigid fixed-joint relation; linear keys between samples are exact for a parent that holds still or translates at constant velocity and approximate other motion to the sample spacing, and a non-positive span or a rate that is not finite and positive is refused because it would emit duplicate, no, or endless keys.
 * @evidence contracts/common.md#clear-and-simple-design One baker for both per-beat `attachTo` and staged mounts, called by `coupleObjects`, which owns chain order and id uniqueness; the optional `parentTransformAt` is the single seam through which a chained parent's ridden frame enters, so the composition is not duplicated for chains.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no bone, rig or prop; the identity offset is the verb's contract that the child's origin sits on the bone, and the unapplied parent scale is stated as a limit rather than compensated.
 * @evidence contracts/common.md#meaningful-documentation States the per-sample composition formula, the parent frame choices, the unapplied scale, which joint tables must match the renderer, the rest-pose case, the clip's time base, sample count, id and both read semantics, and the throw.
 * @evidence contracts/performance.md#efficient-algorithms O(S · B) for S = round(duration × fps) + 1 samples over a parent rig of B bones, one FK per sample; a parent with no motion has one constant bone frame, resolved once instead of per sample.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call bakes one coupling from its own inputs; `coupleObjects` coordinates the shot's couplings and shares a parent's baked clips with its riders.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing after returning; the clip's three arrays, 3 + 3 + 4 numbers per sample, belong to the caller.
 */
export function compileAttach (props: {
  /** The coupled child's scene node: the clip's target. */
  child: string;

  /** The parent bone the child rides. */
  bone: AutoMovieHumanoidBone;

  /** The parent's staged world placement. */
  parentTransform: IAutoMovieTransform;

  /**
   * The parent's world frame at shot-local second `t` when the parent itself
   * rides a coupling this shot (#1140), so a pole in a mounted rider's hand
   * rides the mount. It returns null at an instant where no coupling moves the
   * parent yet, and `parentTransform` is used there. Omit it for a parent that
   * stands on its staged placement all shot.
   */
  parentTransformAt?: (t: number) => IAutoMovieTransform | null;

  /** The parent's rig, for the per-frame FK. */
  parentSkeleton: IAutoMovieSkeleton;

  /** The parent's compiled pose motion; absent, the parent holds its rest pose. */
  parentMotion?: IAutoMovieMotion;

  /** Shot-local second the coupling begins. */
  start: number;

  /** Length of the coupling in seconds; must be positive. */
  duration: number;

  /** The shot's length in seconds, which the clip's duration spans. */
  shotDuration: number;

  /** Samples per second of the baked follow; defaults to 30. */
  fps?: number;

  /** Clinical-axis remap for the parent's FK, such as `HUMANOID_JOINT_AXES`. */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /** Per-rig clinical rest-frame remap for the parent's FK. */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
}): IAutoMovieClip {
  const fps: number = props.fps ?? 30;
  // `performShot` rejects a zero-span coupling before it reaches here; this
  // precondition, the one `projectileTrajectory` enforces, keeps any other
  // caller from baking duplicate key times.
  if (!(props.duration > 0))
    throw new RangeError(
      `attach follow duration must be > 0 seconds, but was ${props.duration}`,
    );
  // A rate that is not finite and positive would bake no key (NaN), one key
  // pair (zero or negative), or never stop sampling (infinity).
  if (!Number.isFinite(fps) || !(fps > 0))
    throw new RangeError(
      `attach follow fps must be a finite number > 0, but was ${fps}`,
    );
  const attachment: IAutoMovieAttachment = {
    parentBone: props.bone,
    offset: IDENTITY_OFFSET,
  };
  function boneAt (pose: IAutoMoviePose): IAutoMovieTransform { return resolveAttachment(
      pose,
      props.parentSkeleton,
      attachment,
      props.jointAxes,
      props.restFrames,
    ); }
  const parentMotion: IAutoMovieMotion | undefined = props.parentMotion;
  const restBone: IAutoMovieTransform | null =
    parentMotion === undefined
      ? boneAt({ skeleton: props.parentSkeleton.id, root: null, joints: [] })
      : null;

  const count: number = Math.max(1, Math.round(props.duration * fps));
  const times: number[] = [];
  const pos: number[] = [];
  const rot: number[] = [];
  for (let i: number = 0; i <= count; ++i) {
    const t: number = props.start + (i / count) * props.duration;
    const local: IAutoMovieTransform =
      restBone ?? boneAt(sampleMotion(parentMotion!, t).pose);
    const parentWorld: IAutoMovieTransform =
      props.parentTransformAt?.(t) ?? props.parentTransform;
    const worldPos: IAutoMovieVector3 = Vector3.add(
      parentWorld.translation,
      Quaternion.rotateVector(parentWorld.rotation, local.translation),
    );
    const worldRot: IAutoMovieQuaternion = Quaternion.multiply(
      parentWorld.rotation,
      local.rotation,
    );
    times.push(t);
    pos.push(worldPos.x, worldPos.y, worldPos.z);
    rot.push(worldRot.x, worldRot.y, worldRot.z, worldRot.w);
  }
  return {
    id: `attach:${props.child}`,
    name: null,
    duration: props.shotDuration,
    loop: false,
    tracks: [
      {
        channel: { kind: "node", node: props.child, path: "translation" },
        times,
        values: pos,
        interpolation: "linear",
      },
      {
        channel: { kind: "node", node: props.child, path: "rotation" },
        times,
        values: rot,
        interpolation: "linear",
      },
    ],
  };
}
