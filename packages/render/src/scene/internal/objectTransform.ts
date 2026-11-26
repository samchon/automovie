import type { IAutoMovieTransform } from "@automovie/interface";
import type * as THREE from "three";

const point: (
  value: IAutoMovieTransform["translation"],
) => IAutoMovieTransform["translation"] = (
  value: IAutoMovieTransform["translation"],
): IAutoMovieTransform["translation"] => ({
  x: value.x,
  y: value.y,
  z: value.z,
});

const quaternion: (
  value: IAutoMovieTransform["rotation"],
) => IAutoMovieTransform["rotation"] = (
  value: IAutoMovieTransform["rotation"],
): IAutoMovieTransform["rotation"] => ({
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
 */
export const objectTransform: (
  object: THREE.Object3D,
) => IAutoMovieTransform = (object: THREE.Object3D): IAutoMovieTransform => ({
  translation: point(object.position),
  rotation: quaternion(object.quaternion),
  scale: point(object.scale),
});
