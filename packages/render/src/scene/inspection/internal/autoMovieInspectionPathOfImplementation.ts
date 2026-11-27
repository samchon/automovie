import type * as THREE from "three";

/**
 * The inspection path of an object: the names from the root down to it, joined
 * by `/`.
 *
 * The root's own name is not part of the path, and an object without a name
 * adds no segment, so the path of an unnamed mesh is the path of its nearest
 * named ancestor. An object with no named ancestor below the root, and no name
 * of its own, has the empty path, which only the pattern `**` selects. A name
 * that itself holds `/` reads as that many segments.
 *
 * It throws when the object is not the root or beneath it.
 */
export function autoMovieInspectionPathOfImplementation(
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
