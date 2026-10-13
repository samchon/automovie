import type { IAutoMovieSemanticMaskEntry } from "@automovie/interface";
import type * as THREE from "three";

/**
 * The nearest ancestor, including the object itself, that a palette claims.
 * A descendant inherits its closest root's identity; an unclaimed chain
 * returns undefined so the caller can count and paint reserved background.
 */
export const nearest = (
  object: THREE.Object3D,
  roots: ReadonlyMap<THREE.Object3D, IAutoMovieSemanticMaskEntry>,
): IAutoMovieSemanticMaskEntry | undefined => {
  let current: THREE.Object3D | null = object;
  while (current !== null) {
    const entry = roots.get(current);
    if (entry !== undefined) return entry;
    current = current.parent;
  }
  return undefined;
};
