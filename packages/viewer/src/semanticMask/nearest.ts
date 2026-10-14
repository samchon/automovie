import type { IAutoMovieSemanticMaskEntry } from "@automovie/interface";
import type * as THREE from "three";

/**
 * The nearest ancestor, including the object itself, that a palette claims. A descendant inherits its closest root's identity; an unclaimed chain returns undefined so the caller can count and paint reserved background.
 *
 * @evidence contracts/common.md#principled-implementation Walks the actual object-parent chain including self and returns the first root claimed by the supplied palette map, otherwise undefined.
 * @evidence contracts/common.md#clear-and-simple-design One closest-ownership law is shared by paint and audit instead of independently guessing inherited semantic ids.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Object3D acyclic parent structure and same-scene root map are premises; no fabricated default root turns an unclaimed mesh into addressed geometry.
 * @evidence contracts/common.md#meaningful-documentation Documents self-inclusive closest root and undefined for an unclaimed chain.
 * @evidence contracts/performance.md#efficient-algorithms At most D ancestor Map lookups cost O(D) with constant coordinator state and no subtree or palette enumeration.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller map is reused while walking this current chain; cached ancestry would be invalid after reparenting and none is retained here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Object/map remain borrowed and only a borrowed entry or undefined escapes, with no resource or persistent reference acquired.
 */
export const nearest: (object: THREE.Object3D, roots: ReadonlyMap<THREE.Object3D, IAutoMovieSemanticMaskEntry>) => IAutoMovieSemanticMaskEntry | undefined = (
  object: THREE.Object3D,
  roots: ReadonlyMap<THREE.Object3D, IAutoMovieSemanticMaskEntry>,
): IAutoMovieSemanticMaskEntry | undefined => {
  let current: THREE.Object3D | null = object;
  while (current !== null) {
    const entry: IAutoMovieSemanticMaskEntry | undefined = roots.get(current);
    if (entry !== undefined) return entry;
    current = current.parent;
  }
  return undefined;
};
