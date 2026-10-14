import {
  AutoMovieHumanoidBone,
  IAutoMovieCamera,
  IAutoMovieDeliveryCrop,
  IAutoMoviePose,
  IAutoMoviePoseKeypoint,
  IAutoMovieShot,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { resolvePose } from "../kinematics/resolvePose";
import { Matrix4 } from "../math/Matrix4";
import { DEFAULT_KEYPOINT_BONES } from "./constants/DEFAULT_KEYPOINT_BONES";
import { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";
import { projectToNdc } from "./projectToNdc";
import { resolveCameraAt } from "./resolveCameraAt";

/** Assumed render aspect (width / height); the scene camera carries none. */
const DEFAULT_ASPECT: number = 16 / 9;

/**
 * Project one posed actor's joints to normalized 2D frame keypoints, the OpenPose-style conditioning automovie can emit exactly because it knows every bone's 3D position.
 *
 * Forward kinematics resolves the pose in rig space, the actor's staged node transform lifts each joint into scene world with the renderer's TRS order, and the live camera, sampled at `time`, projects it through an optional delivery crop. `x` grows rightward and `y` downward from the frame's top-left corner, both in `[0, 1]` inside the frame. A joint behind the camera, outside the clip range or outside the frame is still projected, never clamped, because a clamped point reads as a false edge keypoint, and is flagged `inFrame: false`. A requested joint the rig does not have yields no keypoint. The order follows joints. FK uses default engine joint axes and rest frames; coincidence with a renderer requires those same conventions, and these numerical outputs establish no observed rendered pixels.
 *
 * @param props The pose, rig, staged placement, camera, instant and output options.
 * @returns One keypoint per requested joint the rig has.
 *
 * @evidence contracts/common.md#principled-implementation Composes default engine FK, column-major T·R·S placement, sampled camera and shared cropped pinhole projection; renderer coincidence requires matching joint-axis/rest-frame conventions because no remap enters this function. NDC maps to top-left coordinates by x=(ndcX+1)/2 and y=(1-ndcY)/2, without pixel observation.
 * @evidence contracts/common.md#clear-and-simple-design One pure projection per actor and instant; camera sampling, projection and the joint set are reused from their owners, and the render package's keypoint plan drives it per frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No bone or rig is special-cased; out-of-frame joints are reported with a flag instead of being clamped or dropped, and the default aspect is the documented assumption for a camera that states none.
 * @evidence contracts/common.md#meaningful-documentation States the pipeline from pose to frame, the coordinate frame and range, the out-of-frame rule and why nothing is clamped, the missing-joint rule, the order, and each option's default.
 * @evidence contracts/performance.md#efficient-algorithms Delegates forward kinematics to resolvePose and track sampling to resolveCameraAt, then builds one bone-position map and node matrix and projects J requested joints. Total cost includes both delegated traversals rather than only the local O(B + J) indexing/projection work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Projects one actor at one instant per call; the keypoint plan calls it per performing actor per frame, and the inputs carry no identity to key a cache on.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The bone index and node matrix are released on return; the returned keypoints are fresh records owned by the caller.
 */
export function resolvePoseKeypoints (props: {
  /** The actor's pose at this instant. */
  pose: IAutoMoviePose;

  /** The actor's skeleton. */
  skeleton: IAutoMovieSkeleton;

  /** The actor's staged scene-node placement, in world space. */
  node: { transform: IAutoMovieTransform };

  /** The live camera. */
  camera: IAutoMovieCamera;

  /** The camera's move; omit or pass `null` for a static camera. */
  cameraMotion?: IAutoMovieShot["cameraMotion"];

  /** Shot-local seconds to sample the camera at. Defaults to 0. */
  time?: number;

  /** Render aspect (width / height). Defaults to 16 / 9. */
  aspect?: number;

  /** Normalized delivery crop the keypoints are expressed in. */
  crop?: IAutoMovieDeliveryCrop;

  /** Joints to emit. Defaults to the OpenPose body set. */
  joints?: readonly AutoMovieHumanoidBone[];
}): IAutoMoviePoseKeypoint[] {
  const rigByBone: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map(
    resolvePose(props.pose, props.skeleton).map(
      (
        bone: IAutoMovieResolvedBone,
      ): [AutoMovieHumanoidBone, IAutoMovieVector3] => [
        bone.bone,
        bone.worldPosition,
      ],
    ),
  );
  const world: number[] = Matrix4.compose(
    props.node.transform.translation,
    props.node.transform.rotation,
    props.node.transform.scale,
  );
  const lens: IAutoMovieResolvedCamera = resolveCameraAt(
    props.camera.transform,
    props.cameraMotion ?? null,
    props.camera.id,
    props.time ?? 0,
  );
  const halfY: number = Math.tan((props.camera.fovY * Math.PI) / 360);
  const aspect: number = props.aspect ?? DEFAULT_ASPECT;

  const keypoints: IAutoMoviePoseKeypoint[] = [];
  for (const bone of props.joints ?? DEFAULT_KEYPOINT_BONES) {
    const rig: IAutoMovieVector3 | undefined = rigByBone.get(bone);
    if (rig === undefined) continue;
    const projected: { ndcX: number; ndcY: number; depth: number } =
      projectToNdc(
        lens,
        Matrix4.transformPoint(world, rig),
        halfY,
        aspect,
        props.crop,
      );
    keypoints.push({
      bone,
      x: (projected.ndcX + 1) / 2,
      y: (1 - projected.ndcY) / 2,
      inFrame:
        projected.depth >= props.camera.near &&
        projected.depth <= props.camera.far &&
        Math.abs(projected.ndcX) <= 1 &&
        Math.abs(projected.ndcY) <= 1,
    });
  }
  return keypoints;
}
