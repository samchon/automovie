import type {
  IAutoMovieAttachment,
  IAutoMovieClip,
  IAutoMovieCompileAttach,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { preparePoseResolution } from "../kinematics/preparePoseResolution";
import type { prepareSkeletonPoseResolution } from "../kinematics/prepareSkeletonPoseResolution";
import { resolveAttachment } from "../kinematics/resolveAttachment";
import { Quaternion } from "../math/Quaternion";
import { Transform } from "../math/Transform";
import { Vector3 } from "../math/Vector3";
import { sampleMotion } from "../motion/sampleMotion";

/** The child rides the bone directly: origin on the bone, no extra offset. */
const IDENTITY_OFFSET: IAutoMovieTransform = Transform.identity();

/**
 * Bake the `attachTo` verb into the child object's follow clip, the per-frame realisation of a rigid coupling to a parent's bone (a sword in a hand, a prop on a saddle). The child is not a rig, so, like a projectile, it moves by a node clip of translation and rotation tracks, not a pose motion.
 *
 * Each sample resolves the parent's posed skeleton at that instant through {@link resolveAttachment}, which runs the parent's FK, to find the bone's frame in the parent's model space, then composes that onto the parent's world frame: its staged placement, or, when the parent itself rides a coupling this shot, its ridden frame from `parentTransformAt` (#1140):
 *
 * - `translation = parentPos + parentRot · boneLocal.translation`
 * - `rotation = parentRot ∘ boneLocal.rotation`
 *
 * The parent's scale is not applied, which matches the renderer for the unit-scale actors staging places. Pass the same `jointAxes` the renderer poses the parent with (`HUMANOID_JOINT_AXES`), plus the same `restFrames` when parent clips are authored in clinical space, or the child follows a bone where the renderer does not draw it. A parent with no motion holds its rest pose.
 *
 * The clip is shot-local: N = max(1, round(duration × fps)) equal intervals give N + 1 keys including both ends of [start, start + duration], with duration set to `shotDuration`, the same convention as `cameraMotion`. Read alone through `sampleClip` it clamps to the bone's first frame before `start`; playback reads it through `sampleClipSequence`, where it writes nothing before `start` and holds its last frame after the coupling ends. The clip id is `attach:<child>`; a caller baking several couplings of one child suffixes repeats. Throws a `RangeError` for nonfinite/nonpositive duration or fps, or an unsafe rounded interval count that cannot support an advancing indexed loop. This representability gate is not a workload cap; callers still own feasible memory use and representable distinct key times.
 *
 *
 * @evidence contracts/development/implementation.md#principled-implementation Resolves the parent's bone by forward kinematics at evenly spaced keys and composes its world translation and rotation, the rigid fixed-joint relation. Linear keys are exact for a still or constant-velocity parent and approximate other motion; nonfinite/nonpositive spans and rates and unsafe interval counts are refused; feasible memory use and representable distinct key times remain caller premises.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One baker for both per-beat `attachTo` and staged mounts, called by `coupleObjects`, which owns chain order and id uniqueness; the optional `parentTransformAt` is the single seam through which a chained parent's ridden frame enters, so the composition is not duplicated for chains.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Names no bone, rig or prop; the identity offset is the verb's contract that the child's origin sits on the bone, and the unapplied parent scale is stated as a limit rather than compensated.
 * @evidence contracts/development/common.md#meaningful-documentation States the per-sample composition formula, the parent frame choices, the unapplied scale, which joint tables must match the renderer, the rest-pose case, the clip's time base, sample count, id and both read semantics, and the throw.
 * @evidence contracts/development/implementation.md#efficient-algorithms S unchanged feasible samples retain motion sampling and ordered J-joint admission. Raw omission resolves B bones per moving sample; an explicit immutable parent prepares one bone-name demand and exact reader, so only its D ancestors compose on changes and only one output is copied. Motionless rest FK remains once, and every world callback still runs. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A supplied genuine poseResolution must match this fixed parent rig/clinical mapping. Its sorted one-bone demand and exact current dependency rows serve all samples in this synchronous bake; changed poses still receive full ordered joint admission and world callbacks remain per sample. No time, clip sample or attachment result is memoized.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The optional demand and O(U+B) exact rows release when this synchronous bake returns or throws. Only numeric position/rotation tracks escape, sharing one time array and holding 1+3+4 numbers per sample; no rig workspace, pose or callback is retained by the result.
 */
export function compileAttach(props: compileAttach.IProps): IAutoMovieClip {
  const fps: number = props.fps ?? 30;
  // `performShot` rejects a zero-span coupling before it reaches here; this
  // precondition, the one `projectileTrajectory` enforces, keeps any other
  // caller from baking duplicate key times.
  if (!Number.isFinite(props.duration) || !(props.duration > 0))
    throw new RangeError(
      `attach follow duration must be finite and > 0 seconds, but was ${props.duration}`,
    );
  // A rate that is not finite and positive would bake no key (NaN), one key
  // pair (zero or negative), or never stop sampling (infinity).
  if (!Number.isFinite(fps) || !(fps > 0))
    throw new RangeError(
      `attach follow fps must be a finite number > 0, but was ${fps}`,
    );
  const count: number = Math.max(1, Math.round(props.duration * fps));
  if (!Number.isSafeInteger(count))
    throw new RangeError(
      "attach follow interval count must be a safe integer so sampling can advance",
    );
  const attachment: IAutoMovieAttachment = {
    parentBone: props.bone,
    offset: IDENTITY_OFFSET,
  };
  const demand: prepareSkeletonPoseResolution.IBoneDemand | undefined =
    props.poseResolution?.prepareBones(new Set([props.bone]));
  const resolution: ReturnType<typeof preparePoseResolution> | undefined =
    demand === undefined ? undefined : preparePoseResolution();
  function boneAt(pose: IAutoMoviePose): IAutoMovieTransform {
    return resolveAttachment(
      pose,
      props.parentSkeleton,
      attachment,
      props.jointAxes,
      props.restFrames,
      demand,
      resolution,
    );
  }
  const parentMotion: IAutoMovieMotion | undefined = props.parentMotion;
  const restBone: IAutoMovieTransform | null =
    parentMotion === undefined
      ? boneAt({ skeleton: props.parentSkeleton.id, root: null, joints: [] })
      : null;

  const times: number[] = [];
  const pos: number[] = [];
  const rot: number[] = [];
  for (let i: number = 0; i <= count; ++i) {
    const t: number = props.start + (i / count) * props.duration;
    const local: IAutoMovieTransform =
      restBone ?? boneAt(sampleMotion.pose(parentMotion!, t));
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

/**
 * Companion types of {@link compileAttach}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents the one engine-owned extension of the interface attachment props and its absence rule.
 * @evidence contracts/development/design.md#principled-representation The canonical attachment props stay in `IAutoMovieCompileAttach.IProps`; this extension adds only the prepared parent rig, an engine object whose methods read `preparePoseResolution` operations, so it cannot live in the dependency-free interface.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `coupleObjects` supplies the prepared rig when its caller passes `prepareRig`; every other caller keeps the interface props unchanged.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Extends the interface contract instead of copying it; the optional rig is the genuine `prepareSkeletonPoseResolution` product, never a structural stand-in.
 */
export namespace compileAttach {
  /** The attachment props with an optional prepared parent rig. */
  export interface IProps extends IAutoMovieCompileAttach.IProps {
    /** Explicit immutable snapshot of this exact parent rig and clinical mappings, kept unchanged throughout the bake. Omission preserves raw full FK. */
    poseResolution?: prepareSkeletonPoseResolution.IRig;
  }
}
