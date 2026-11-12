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
 * Snapshot local source translation, quaternion and scale before formation updates overwrite the host's scene wrapper. Translation is metres and the quaternion is XYZW. Every component is copied, so later writes cannot turn the next frame's input into the runtime's own previous output.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Copies current local translation, XYZW quaternion and per-axis scale component by component before formation updates can overwrite the source wrapper.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Small local projection helpers serve one transform snapshot without retaining a mutable SDK vector/quaternion alias.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No yaw-only or uniform-scale surrogate replaces source components; admission/normalization of the borrowed Object3D transform remains with its owner.
 * @evidence contracts/development/common.md#meaningful-documentation Documentation names local metres, quaternion ordering and why copying prevents previous runtime output becoming next-frame input.
 * @evidence contracts/development/implementation.md#efficient-algorithms Ten scalar copies allocate one fixed-size transform record and its component objects, independent of subtree or mesh dimensions.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every call reads current source components; an earlier transform cannot be reused after its source wrapper changes.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only copied scalars escape and no SDK object, resource handle or retained source reference is acquired.
 */
export const objectTransform: (
  object: THREE.Object3D,
) => IAutoMovieTransform = (object: THREE.Object3D): IAutoMovieTransform => ({
  translation: point(object.position),
  rotation: quaternion(object.quaternion),
  scale: point(object.scale),
});
