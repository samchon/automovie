import type { IAutoMovieTransform } from "@automovie/interface";
import type * as THREE from "three";

const point = (value: { x: number; y: number; z: number }) => ({
  x: value.x,
  y: value.y,
  z: value.z,
});

const quaternion = (value: { x: number; y: number; z: number; w: number }) => ({
  x: value.x,
  y: value.y,
  z: value.z,
  w: value.w,
});

/**
 * Snapshot local source translation, quaternion and scale before formation
 * updates overwrite the host's scene wrapper. Translation is metres and the
 * quaternion is XYZW. Every component is copied, so later writes cannot turn
 * the next frame's input into the runtime's own previous output.
 *
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Snapshots source object translation, quaternion and scale before formation updates overwrite scene wrappers.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Snapshots source object translation, quaternion and scale before formation updates overwrite scene wrappers.
 */
export const objectTransform = (
  object: THREE.Object3D,
): IAutoMovieTransform => ({
  translation: point(object.position),
  rotation: quaternion(object.quaternion),
  scale: point(object.scale),
});
