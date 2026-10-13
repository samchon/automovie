import type * as THREE from "three";
import type { IAutoMovieViewerSubjectPose } from "./IAutoMovieViewerSubjectPose.js";

/**
 * Write one pose onto a camera.
 *
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
