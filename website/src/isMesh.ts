import * as THREE from "three";

/**
 * Recognize Three's isMesh capability flag for manor counting and merge admission; this is a trusted-object capability check, not structural validation of arbitrary input.
 *
 * @evidence contracts/common.md#principled-implementation Three Object3D subclasses expose isMesh for capability detection without requiring instanceof identity across module copies; callers supply actual scene objects.
 * @evidence contracts/common.md#clear-and-simple-design One predicate serves bakeEntry and bakeManor rather than duplicating mesh admission in both owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The actual capability flag is read uniformly without object-name or fixture checks; arbitrary spoofed objects remain outside its trusted scene premise.
 * @evidence contracts/common.md#meaningful-documentation The comment states the trusted Object3D boundary and distinguishes capability recognition from validation.
 * @evidence contracts/performance.md#efficient-algorithms One property read and strict comparison cost constant time and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing scene object is inspected without cloning or retaining a per-object classification cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No scene reference, geometry or handle is retained beyond the call.
 */
export const isMesh: (object: THREE.Object3D) => object is THREE.Mesh = (object: THREE.Object3D): object is THREE.Mesh =>
  (object as THREE.Mesh).isMesh === true;
