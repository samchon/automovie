import * as THREE from "three";

/**
 * Copy an admitted resolved metre-space vector into a newly owned Three vector, preserving its three components and frame.
 *
 * @evidence contracts/common.md#principled-implementation Constructs Vector3 directly from the numerical owner's x/y/z without unit conversion; finite admitted coordinates and the same coordinate frame are caller premises.
 * @evidence contracts/common.md#clear-and-simple-design One native value conversion is shared by instanced formation and instance-set realization rather than duplicating transform arithmetic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No axis correction, hidden normalization or fixture geometry is applied; the helper performs no independent coordinate validation.
 * @evidence contracts/common.md#meaningful-documentation States component preservation, metre/frame premise and independent returned value ownership.
 * @evidence contracts/performance.md#efficient-algorithms Three scalar copies and one Vector3 allocation are fixed work, independent of geometry size.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call creates an independent mutable vector, so equal values do not alias the source or another caller's transform.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned CPU object transfers to its caller; no native buffer, renderer or background task is acquired.
 */
export function vector(value: {
  x: number;
  y: number;
  z: number;
}): THREE.Vector3 { return new THREE.Vector3(value.x, value.y, value.z); }
