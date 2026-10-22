import * as THREE from "three";

/**
 * Copy a tube geometry with its radius grown by `thickness`.
 *
 * Construction curves are drawn as thin tubes whose vertex normals point away from the
 * curve, so moving each vertex along its normal widens the tube while the
 * curve itself stays put. A normal of zero length leaves its vertex in place.
 * The copy shares no buffers with the source; the caller owns and disposes it.
 *
 * @param geometry Source tube with `position` and `normal` attributes, in its mesh's local frame.
 * @param thickness Radius increase in the same units, metres for AutoMovie models.
 * @returns A new geometry with grown positions, copied normals and a copied index.
 *
 * @evidence contracts/common.md#principled-implementation Offsetting each vertex along its unit normal grows a tube's radius uniformly because tube normals are radial; the index and normals are unchanged.
 * @evidence contracts/common.md#clear-and-simple-design One geometry helper used by ModelPartStyling for any style that thickens a tube.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not mutate or scale the source geometry, so the model's own curve stays exact.
 * @evidence contracts/common.md#meaningful-documentation States the radial-normal premise, units and ownership of the copy.
 * @evidence contracts/performance.md#efficient-algorithms One O(V) pass over positions plus O(V + I) copies of normals and index.
 * @evidence contracts/performance.md#reuse-equivalent-work Callers inflate once per mesh and keep the copy for every later frame.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates one geometry of the source's size; the caller owns and disposes it.
 */
export function inflateTubeGeometry(
  geometry: THREE.BufferGeometry,
  thickness: number,
): THREE.BufferGeometry {
  const position: THREE.BufferAttribute = geometry.getAttribute(
    "position",
  ) as THREE.BufferAttribute;
  const normal: THREE.BufferAttribute = geometry.getAttribute(
    "normal",
  ) as THREE.BufferAttribute;
  const values: Float32Array = new Float32Array(position.count * 3);
  for (let i: number = 0; i < position.count; ++i)
    for (let axis: number = 0; axis < 3; ++axis)
      values[i * 3 + axis] =
        position.getComponent(i, axis) +
        normal.getComponent(i, axis) * thickness;

  const inflated: THREE.BufferGeometry = new THREE.BufferGeometry();
  inflated.setAttribute("position", new THREE.BufferAttribute(values, 3));
  inflated.setAttribute("normal", normal.clone());
  if (geometry.index !== null) inflated.setIndex(geometry.index.clone());
  return inflated;
}
