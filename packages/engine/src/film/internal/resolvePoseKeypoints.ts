import {
  AutoMovieHumanoidBone,
  IAutoMoviePoseKeypoint,
  type IAutoMovieResolvePoseKeypoints,
  type IAutoMovieResolvedBone,
  type IAutoMovieResolvedCamera,
  IAutoMovieVector3,
} from "@automovie/interface";

import { resolvePose } from "../../kinematics/internal/resolvePose";
import { AutoMovieEngineMatrix4 } from "../../math/AutoMovieEngineMatrix4";
import { AutoMovieEngineDefaultKeypointBones } from "../AutoMovieEngineDefaultKeypointBones";
import { projectToNdc } from "./projectToNdc";
import { resolveCameraAt } from "./resolveCameraAt";

/*
 * Project one posed actor's joints to normalized 2D frame keypoints, the
 * OpenPose-style conditioning automovie can emit exactly because it knows every
 * bone's 3D position.
 *
 * Forward kinematics resolves the pose in rig space, the actor's staged node
 * transform lifts each joint into scene world with the renderer's TRS order,
 * and the live camera, sampled at `time`, projects it through an optional
 * delivery crop. `x` grows rightward and `y` downward from the frame's top-left
 * corner, both in `[0, 1]` inside the frame. A joint behind the camera, outside
 * the clip range or outside the frame is still projected, never clamped,
 * because a clamped point reads as a false edge keypoint, and is flagged
 * `inFrame: false`. A requested joint the rig does not have yields no keypoint.
 * The order follows joints. FK uses default engine joint axes and rest frames;
 * coincidence with a renderer requires those same conventions, and these
 * numerical outputs establish no observed rendered pixels.
 * Parameter props: The pose, rig, staged placement, camera, instant and output
 * options.
 * Returns: One keypoint per requested joint the rig has.
 */
export function resolvePoseKeypoints(
  props: IAutoMovieResolvePoseKeypoints.IProps,
): IAutoMoviePoseKeypoint[] {
  const joints: readonly AutoMovieHumanoidBone[] =
    props.joints ?? AutoMovieEngineDefaultKeypointBones;
  const rigByBone: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map(
    resolvePose(
      props.pose,
      props.skeleton,
      undefined,
      undefined,
      undefined,
      undefined,
      new Set(joints),
    ).map(
      (
        bone: IAutoMovieResolvedBone,
      ): [AutoMovieHumanoidBone, IAutoMovieVector3] => [
        bone.bone,
        bone.worldPosition,
      ],
    ),
  );
  const world: number[] = AutoMovieEngineMatrix4.compose(
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
  for (const bone of joints) {
    const rig: IAutoMovieVector3 | undefined = rigByBone.get(bone);
    if (rig === undefined) continue;
    const projected: { ndcX: number; ndcY: number; depth: number } =
      projectToNdc(
        lens,
        AutoMovieEngineMatrix4.transformPoint(world, rig),
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

/*
 * Assumed render aspect (width / height); the scene camera carries none.
 */
const DEFAULT_ASPECT: number = 16 / 9;
