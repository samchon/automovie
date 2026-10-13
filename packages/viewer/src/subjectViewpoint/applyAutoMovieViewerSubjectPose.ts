import type * as THREE from "three";
import type { IAutoMovieViewerSubjectPose } from "./IAutoMovieViewerSubjectPose.js";

/**
 * Write one pose onto a camera.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership `applyAutoMovieViewerSubjectPose` drives the camera from the inspection's own pose rather than from an authored camera track.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan `applyAutoMovieViewerSubjectPose` applies one resolved viewpoint plan entry to the projection carrier it will be rendered through.
 * @author Samchon
 */
export const applyAutoMovieViewerSubjectPose = (
  camera: THREE.PerspectiveCamera,
  pose: IAutoMovieViewerSubjectPose,
): void => {
  camera.position.set(pose.position.x, pose.position.y, pose.position.z);
  camera.fov = pose.lens.fovDeg;
  camera.aspect = pose.lens.aspect;
  camera.near = pose.near;
  camera.far = pose.far;
  camera.up.set(0, 1, 0);
  camera.lookAt(pose.target.x, pose.target.y, pose.target.z);
  camera.updateProjectionMatrix();
  // The populations resolve against a world matrix, and `lookAt` only writes
  // the local quaternion; a frame drawn before this reads last frame's eye.
  camera.updateMatrixWorld(true);
};
