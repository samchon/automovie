import type { AutoMovieEngineFilmTypes } from "../AutoMovieEngineFilmTypes";

import type {
  IAutoMovieAttachment,
  IAutoMovieClip,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineKinematics } from "../../kinematics/AutoMovieEngineKinematics";

import type { prepareSkeletonPoseResolution } from "../../kinematics/internal/prepareSkeletonPoseResolution";
import { resolveAttachment } from "../../kinematics/internal/resolveAttachment";
import { Quaternion } from "../../math/Quaternion";
import { Transform } from "../../math/Transform";
import { Vector3 } from "../../math/Vector3";
import { AutoMovieEngineMotionSampling } from "../../motion/AutoMovieEngineMotionSampling";

/*
 * Bake the `attachTo` verb into the child object's follow clip, the per-frame
 * realisation of a rigid coupling to a parent's bone (a sword in a hand, a prop
 * on a saddle). The child is not a rig, so, like a projectile, it moves by a
 * node clip of translation and rotation tracks, not a pose motion.
 *
 * Each sample resolves the parent's posed skeleton at that instant through
 * resolveAttachment, which runs the parent's FK, to compose the child's
 * bone-local offset into the parent's model space, then composes that onto the
 * parent's world frame: its staged placement, or, when the parent itself rides
 * a coupling this shot, its ridden frame from `parentTransformAt` (#1140):
 *
 * - `translation = parentPos + parentRot · childLocal.translation`
 * - `rotation = parentRot ∘ childLocal.rotation`
 *
 * The parent's scale is not applied, which matches the renderer for the
 * unit-scale actors staging places. Pass the same `jointAxes` the renderer
 * poses the parent with (`HUMANOID_JOINT_AXES`), plus the same `restFrames`
 * when parent clips are authored in clinical space, or the child follows a bone
 * where the renderer does not draw it. A parent with no motion holds its rest
 * pose.
 *
 * The clip is shot-local: N = max(1, round(duration × fps)) equal intervals
 * give N + 1 keys including both ends of [start, start + duration], with
 * duration set to `shotDuration`, the same convention as `cameraMotion`. Read
 * alone through `sampleClip` it clamps to the child's first frame before
 * `start`; playback reads it through `sampleClipSequence`, where it writes
 * nothing before `start` and holds its last frame after the coupling ends. The
 * clip id is `attach:<child>`; a caller baking several couplings of one child
 * suffixes repeats. Throws a `RangeError` for nonfinite/nonpositive duration or
 * fps, or an unsafe rounded interval count that cannot support an advancing
 * indexed loop. This representability gate is not a workload cap; callers still
 * own feasible memory use and representable distinct key times.
 */
export function compileAttach(props: AutoMovieEngineFilmTypes.ICompileAttachProps): IAutoMovieClip {
  const fps: number = props.fps ?? 30;
  // `performShot` rejects a zero-span coupling before it reaches here; this
  // precondition, the one `projectileTrajectory` enforces, keeps any other
  // caller from baking duplicate key times.
  if (!(props.duration > 0))
    throw new RangeError(
      `attach follow duration must be finite and > 0 seconds, but was ${props.duration}`,
    );
  // A rate that is not finite and positive would bake no key (NaN), one key
  // pair (zero or negative), or never stop sampling (infinity).
  if (!(fps > 0))
    throw new RangeError(
      `attach follow fps must be a finite number > 0, but was ${fps}`,
    );
  const count: number = Math.max(1, Math.round(props.duration * fps));
  // Both endpoints are emitted, so the key count itself must be exact.
  if (count >= Number.MAX_SAFE_INTEGER)
    throw new RangeError(
      "attach follow key count exceeds the safe integer range",
    );
  const attachment: IAutoMovieAttachment = {
    parentBone: props.bone,
    offset:
      props.offset === undefined
        ? IDENTITY_OFFSET
        : Transform.of(props.offset.position, props.offset.rotation),
  };
  const demand: prepareSkeletonPoseResolution.IBoneDemand | undefined =
    props.poseResolution?.prepareBones(new Set([props.bone]));
  const resolution: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution> | undefined =
    demand === undefined ? undefined : AutoMovieEngineKinematics.preparePoseResolution();
  function boneAt(pose: IAutoMoviePose): IAutoMovieTransform {
    return resolveAttachment.run(
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
      restBone ?? boneAt(AutoMovieEngineMotionSampling.samplePose(parentMotion!, t));
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

/*
 * Default child frame when the author gives no offset.
 */
const IDENTITY_OFFSET: IAutoMovieTransform = Transform.identity();
