import type * as THREE from "three";

/**
 * The inspection path of an object: the names from the root down to it, joined by `/`.
 *
 * The root's own name is not part of the path, and an object without a name adds no segment, so the path of an unnamed mesh is the path of its nearest named ancestor. An object with no named ancestor below the root, and no name of its own, has the empty path, which only the pattern `**` selects. A name that itself holds `/` reads as that many segments.
 *
 * It throws when the object is not the root or beneath it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what forms the path, what the root and an unnamed object contribute, the empty path and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation The path is read from the scene graph's own parent links and names, the identity the builders already assign, so no registry of parts exists beside the scene.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One walk up the parent links, collecting names, then a reversal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An object outside the root is refused instead of given the path it has in another graph.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the object's depth.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One walk per call, with nothing computed twice inside it.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the returned string outlives the call.
 */
export function autoMovieInspectionPathOf(
  root: THREE.Object3D,
  object: THREE.Object3D,
): string {
  const names: string[] = [];
  let current: THREE.Object3D | null = object;
  while (current !== null && current !== root) {
    if (current.name !== "") names.push(current.name);
    current = current.parent;
  }
  if (current === null)
    throw new Error(
      `Object "${object.name}" is not beneath the inspected root "${root.name}"`,
    );
  return names.reverse().join("/");
}
